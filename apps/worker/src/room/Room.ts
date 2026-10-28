import {
  CLOSE_REPLACED,
  CLOSE_ROOM_GONE,
  PING,
  PONG,
  type ServerErrorCode,
  type ServerMessage,
} from '@werewolf/shared';
import { DurableObject } from 'cloudflare:workers';
import { LOBBY_NAME } from '../lobby/Lobby';
import { deviceIdFromToken } from './deviceId';
import { apply, createRoom, type RoomState } from './machine';
import { cryptoRandom } from './random';
import { parseClientMessage } from './messages';
import { deleteRoom, loadRoom, saveRoom } from './storage';
import { buildSummary, buildView } from './view';

const CLOSE_POLICY = 1008;
/** How soon an expired room tries again to leave the home list, if the lobby didn't answer. */
const LOBBY_RETRY_MS = 60 * 1000;
/** A room with no message or connection for this long is deleted. */
export const ROOM_EXPIRY_MS = 6 * 60 * 60 * 1000;

/** Saved on each socket so it survives hibernation. */
interface Attachment {
  deviceId: string;
}

function readDeviceId(ws: WebSocket): string | null {
  const attachment: unknown = ws.deserializeAttachment();
  if (typeof attachment !== 'object' || attachment === null || !('deviceId' in attachment)) {
    return null;
  }
  return typeof attachment.deviceId === 'string' ? attachment.deviceId : null;
}

function send(ws: WebSocket, message: ServerMessage): void {
  ws.send(JSON.stringify(message));
}

/**
 * One per room: holds the authoritative room state and every phone's WebSocket.
 * Every change goes through the state machine in machine.ts, and each phone gets its own view.
 */
export class Room extends DurableObject<Env> {
  private state: RoomState | null;
  /** Lobby updates go out one at a time, so an older one can never land after a newer one. */
  private publishing: Promise<void> = Promise.resolve();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Keep-alives are answered by the runtime without waking the room.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG));
    // A socket to an id nobody created must not leave storage behind, so tables come with create().
    this.state = loadRoom(ctx.storage.sql);
  }

  /** Called once by the create route. False if this id is already taken. */
  async create(input: { id: string; name: string; masterId: string; masterName: string }) {
    if (this.state) return false;
    this.state = createRoom({ ...input, now: Date.now() });
    saveRoom(this.ctx.storage, this.state);
    await this.ctx.storage.setAlarm(this.state.lastActiveAt + ROOM_EXPIRY_MS);
    await this.publish();
    return true;
  }

  override fetch(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const message = parseClientMessage(raw);
    const deviceId = readDeviceId(ws);
    if (!message) {
      this.rejectSocket(ws);
      return;
    }

    if (message.type === 'hello') {
      // A socket says hello once, first.
      if (deviceId !== null) {
        this.rejectSocket(ws);
        return;
      }
      if (!this.state) {
        ws.close(CLOSE_ROOM_GONE, 'room gone');
        return;
      }
      const newId = await deviceIdFromToken(message.token, this.state.id);
      // Two hellos sent back to back both pass the check above; the second must not win.
      if (readDeviceId(ws) !== null) {
        this.rejectSocket(ws);
        return;
      }
      // A refresh can open the new socket before the old one closes; keep only the newest.
      for (const other of this.connectedSockets()) {
        if (other !== ws && readDeviceId(other) === newId) {
          other.close(CLOSE_REPLACED, 'replaced');
        }
      }
      ws.serializeAttachment({ deviceId: newId } satisfies Attachment);
      await this.touch();
      this.broadcast();
      return;
    }

    if (deviceId === null || !this.state) {
      this.rejectSocket(ws);
      return;
    }
    const result = apply(this.state, deviceId, message, Date.now(), cryptoRandom);
    if (!result.ok) {
      this.sendError(ws, result.error);
      return;
    }
    this.state = result.state;
    await this.touch();
    this.broadcast();
    await this.publish();
  }

  override webSocketClose(ws: WebSocket): void {
    this.broadcast(ws);
  }

  override webSocketError(ws: WebSocket, error: unknown): void {
    console.error('Room: socket error', error);
    this.broadcast(ws);
  }

  override async alarm(): Promise<void> {
    // Storage is the source of truth; the copy in memory can't be newer.
    this.state = loadRoom(this.ctx.storage.sql);
    if (!this.state) return;
    const expiresAt = this.state.lastActiveAt + ROOM_EXPIRY_MS;
    if (Date.now() < expiresAt) {
      await this.ctx.storage.setAlarm(expiresAt);
      return;
    }
    const { id } = this.state;
    // Leave the home list first: once storage is gone, nothing would remember to try again.
    try {
      await this.env.LOBBY.getByName(LOBBY_NAME).remove(id);
    } catch (error) {
      console.error('Room: could not remove the expired room from the lobby; retrying', id, error);
      await this.ctx.storage.setAlarm(Date.now() + LOBBY_RETRY_MS);
      return;
    }
    this.state = null;
    for (const ws of this.ctx.getWebSockets()) ws.close(CLOSE_ROOM_GONE, 'room expired');
    await deleteRoom(this.ctx.storage);
  }

  /** Saves the state with the time of this activity, and moves the expiry alarm out. */
  private async touch(): Promise<void> {
    if (!this.state) return;
    this.state = { ...this.state, lastActiveAt: Date.now() };
    saveRoom(this.ctx.storage, this.state);
    await this.ctx.storage.setAlarm(this.state.lastActiveAt + ROOM_EXPIRY_MS);
  }

  /**
   * Updates this room's row on the home list. Queued, and each update sends the state as it is when
   * its turn comes, so the list ends on the latest. The room works without it, so errors are logged.
   */
  private publish(): Promise<void> {
    this.publishing = this.publishing.then(async () => {
      const state = this.state;
      if (!state) return;
      try {
        await this.env.LOBBY.getByName(LOBBY_NAME).upsert(buildSummary(state));
      } catch (error) {
        console.error('Room: could not update the lobby', state.id, error);
      }
    });
    return this.publishing;
  }

  private sendError(ws: WebSocket, code: ServerErrorCode): void {
    try {
      send(ws, { type: 'error', code });
    } catch (error) {
      // The socket is already closing; nothing to tell it.
      console.warn('Room: could not send the error', code, error);
    }
  }

  private rejectSocket(ws: WebSocket): void {
    console.warn('Room: closing socket after a bad message');
    this.sendError(ws, 'bad-message');
    ws.close(CLOSE_POLICY, 'bad message');
  }

  /** Open sockets that have said hello, optionally leaving one out (it is closing). */
  private connectedSockets(except?: WebSocket): WebSocket[] {
    return this.ctx
      .getWebSockets()
      .filter(
        (ws) => ws !== except && ws.readyState === WebSocket.OPEN && readDeviceId(ws) !== null,
      );
  }

  /** Sends every connected socket its own view of the room. */
  private broadcast(except?: WebSocket): void {
    const state = this.state;
    if (!state) return;
    const sockets = this.connectedSockets(except);
    const connected = new Set(sockets.map(readDeviceId).filter((id) => id !== null));
    for (const ws of sockets) {
      const viewer = readDeviceId(ws);
      if (viewer === null) continue;
      try {
        send(ws, { type: 'state', view: buildView(state, connected, viewer) });
      } catch (error) {
        // The socket closed between the filter and the send; its close handler broadcasts again.
        console.warn('Room: send failed', error);
      }
    }
  }
}
