import type { RoomStatus } from '@werewolf/shared';
import type { Player, RoomState } from './machine';

const STATUSES: readonly RoomStatus[] = ['lobby', 'reveal', 'playing', 'finished'];

function ensureSchema(sql: SqlStorage): void {
  sql.exec(`CREATE TABLE IF NOT EXISTS room (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    open INTEGER NOT NULL,
    master_id TEXT NOT NULL,
    master_name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_active_at INTEGER NOT NULL
  )`);
  sql.exec(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    kicked INTEGER NOT NULL
  )`);
}

function text(row: Record<string, SqlStorageValue>, column: string): string {
  const value = row[column];
  if (typeof value !== 'string') throw new Error(`Room storage: ${column} is not text`);
  return value;
}

function integer(row: Record<string, SqlStorageValue>, column: string): number {
  const value = row[column];
  if (typeof value !== 'number') throw new Error(`Room storage: ${column} is not a number`);
  return value;
}

/** The saved room, or null if this room was never created (or has expired). */
export function loadRoom(sql: SqlStorage): RoomState | null {
  const [table] = sql
    .exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'room'")
    .toArray();
  if (!table) return null;
  const [row] = sql.exec('SELECT * FROM room LIMIT 1').toArray();
  if (!row) return null;
  const status = text(row, 'status');
  const knownStatus = STATUSES.find((known) => known === status);
  if (!knownStatus) throw new Error(`Room storage: unknown status ${status}`);
  const players: Player[] = sql
    .exec('SELECT * FROM players ORDER BY joined_at, id')
    .toArray()
    .map((player) => ({
      id: text(player, 'id'),
      name: text(player, 'name'),
      joinedAt: integer(player, 'joined_at'),
      kicked: integer(player, 'kicked') === 1,
    }));
  return {
    id: text(row, 'id'),
    name: text(row, 'name'),
    status: knownStatus,
    open: integer(row, 'open') === 1,
    masterId: text(row, 'master_id'),
    masterName: text(row, 'master_name'),
    createdAt: integer(row, 'created_at'),
    lastActiveAt: integer(row, 'last_active_at'),
    players,
  };
}

/** Writes the whole room. A room holds a few dozen rows at most, so rewriting them is cheap. */
export function saveRoom(storage: DurableObjectStorage, state: RoomState): void {
  storage.transactionSync(() => {
    const { sql } = storage;
    ensureSchema(sql);
    sql.exec('DELETE FROM room');
    sql.exec(
      'INSERT INTO room VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      state.id,
      state.name,
      state.status,
      state.open ? 1 : 0,
      state.masterId,
      state.masterName,
      state.createdAt,
      state.lastActiveAt,
    );
    sql.exec('DELETE FROM players');
    for (const player of state.players) {
      sql.exec(
        'INSERT INTO players VALUES (?, ?, ?, ?)',
        player.id,
        player.name,
        player.joinedAt,
        player.kicked ? 1 : 0,
      );
    }
  });
}

/** Removes the room and its players for good, along with its alarm. */
export async function deleteRoom(storage: DurableObjectStorage): Promise<void> {
  await storage.deleteAll();
}
