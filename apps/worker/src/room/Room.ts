import { CLOSE_REPLACED, PING, PONG, type ServerMessage } from '@werewolf/shared';
import { DurableObject } from 'cloudflare:workers';
import { deviceIdFromToken } from './deviceId';
import { parseClientMessage } from './messages';
import { buildView } from './view';

const CLOSE_POLICY = 1008;

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
 * One per room: holds the authoritative game state and every phone's WebSocket.
 * Phase 1 only tracks which devices are connected; the state machine arrives with rooms in Phase 2.
 */
export class Room extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Keep-alives are answered by the runtime without waking the room.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG));
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
    // hello is the only message so far, and a socket says it once.
    if (!message || readDeviceId(ws) !== null) {
      console.warn('Room: closing socket after a bad message');
      send(ws, { type: 'error', code: 'bad-message' });
      ws.close(CLOSE_POLICY, 'bad message');
      return;
    }

    const deviceId = await deviceIdFromToken(message.token);
    // A refresh can open the new socket before the old one closes; keep only the newest.
    for (const other of this.connectedSockets()) {
      if (other !== ws && readDeviceId(other) === deviceId) {
        other.close(CLOSE_REPLACED, 'replaced');
      }
    }
    ws.serializeAttachment({ deviceId } satisfies Attachment);
    this.broadcast();
  }

  override webSocketClose(ws: WebSocket): void {
    this.broadcast(ws);
  }

  override webSocketError(ws: WebSocket, error: unknown): void {
    console.error('Room: socket error', error);
    this.broadcast(ws);
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
    const sockets = this.connectedSockets(except);
    // getWebSockets() has no stable order; sorting keeps the list from jumping around.
    const devices = [...new Set(sockets.map(readDeviceId).filter((id) => id !== null))].sort();
    for (const ws of sockets) {
      const viewer = readDeviceId(ws);
      if (viewer === null) continue;
      try {
        send(ws, { type: 'state', view: buildView(viewer, devices) });
      } catch (error) {
        // The socket closed between the filter and the send; its close handler broadcasts again.
        console.warn('Room: send failed', error);
      }
    }
  }
}
