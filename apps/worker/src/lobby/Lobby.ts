import { PING, PONG, type LobbyMessage, type RoomStatus, type RoomSummary } from '@werewolf/shared';
import { DurableObject } from 'cloudflare:workers';

/** The single Lobby instance's name. */
export const LOBBY_NAME = 'lobby';
/** The home list shows at most this many rooms, newest first, so a flood can't grow it forever. */
const MAX_LISTED = 100;

const STATUSES: readonly RoomStatus[] = ['lobby', 'reveal', 'playing', 'finished'];

function toSummary(row: Record<string, SqlStorageValue>): RoomSummary | null {
  const { id, name, master, count, status, open } = row;
  const knownStatus = STATUSES.find((known) => known === status);
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof master !== 'string' ||
    typeof count !== 'number' ||
    typeof open !== 'number' ||
    !knownStatus
  ) {
    console.error('Lobby: skipping a malformed row', id);
    return null;
  }
  return { id, name, master, count, status: knownStatus, isOpen: open === 1 };
}

/**
 * Single instance: the list of rooms for the home screen. Rooms report their own row here, and
 * every phone on the home screen gets the whole list again after each change.
 */
export class Lobby extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG));
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      master TEXT NOT NULL,
      count INTEGER NOT NULL,
      status TEXT NOT NULL,
      open INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`);
  }

  upsert(room: RoomSummary): void {
    this.ctx.storage.sql.exec(
      `INSERT INTO rooms VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, master = excluded.master,
         count = excluded.count, status = excluded.status, open = excluded.open`,
      room.id,
      room.name,
      room.master,
      room.count,
      room.status,
      room.isOpen ? 1 : 0,
      Date.now(),
    );
    this.broadcast();
  }

  remove(id: string): void {
    this.ctx.storage.sql.exec('DELETE FROM rooms WHERE id = ?', id);
    this.broadcast();
  }

  /** Newest first, so a room just created is at the top. */
  rooms(): RoomSummary[] {
    return this.ctx.storage.sql
      .exec('SELECT * FROM rooms ORDER BY created_at DESC, id LIMIT ?', MAX_LISTED)
      .toArray()
      .map(toSummary)
      .filter((room) => room !== null);
  }

  override fetch(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.send(this.message());
    return new Response(null, { status: 101, webSocket: client });
  }

  // Phones only listen; anything they send other than the auto-answered ping is ignored.
  override webSocketMessage(): void {
    return;
  }

  private message(): string {
    return JSON.stringify({ type: 'rooms', rooms: this.rooms() } satisfies LobbyMessage);
  }

  private broadcast(): void {
    const message = this.message();
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(message);
      } catch (error) {
        // The socket is closing; it is dropped from getWebSockets() once closed.
        console.warn('Lobby: send failed', error);
      }
    }
  }
}
