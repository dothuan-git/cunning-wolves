import {
  DEFAULT_SETTINGS,
  TEAMS,
  type CustomRole,
  type GameState,
  type Phase,
  type RoomSetup,
  type RoomStatus,
} from '@werewolf/shared';
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
  // Setup tables came in Phase 3. They are separate tables, so rooms saved before then still load.
  sql.exec('CREATE TABLE IF NOT EXISTS picks (idx INTEGER PRIMARY KEY, role_id TEXT NOT NULL)');
  sql.exec('CREATE TABLE IF NOT EXISTS rule_edits (role_id TEXT PRIMARY KEY, rule TEXT NOT NULL)');
  sql.exec(`CREATE TABLE IF NOT EXISTS custom_roles (
    idx INTEGER PRIMARY KEY,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    rule TEXT NOT NULL,
    team TEXT NOT NULL,
    wakes INTEGER NOT NULL
  )`);
  sql.exec(
    'CREATE TABLE IF NOT EXISTS wake_order (idx INTEGER PRIMARY KEY, role_id TEXT NOT NULL)',
  );
  sql.exec(`CREATE TABLE IF NOT EXISTS settings (
    timer_seconds INTEGER NOT NULL,
    sound_on INTEGER NOT NULL
  )`);
  // Phase 4: the deal.
  sql.exec(
    'CREATE TABLE IF NOT EXISTS assignments (player_id TEXT PRIMARY KEY, role_id TEXT NOT NULL)',
  );
  // Phase 5: the narrator's game. One `game` row while playing, none before.
  sql.exec(
    'CREATE TABLE IF NOT EXISTS game (phase_kind TEXT NOT NULL, phase_number INTEGER NOT NULL)',
  );
  sql.exec(`CREATE TABLE IF NOT EXISTS deaths (
    player_id TEXT PRIMARY KEY,
    phase_kind TEXT NOT NULL,
    phase_number INTEGER NOT NULL
  )`);
  sql.exec(`CREATE TABLE IF NOT EXISTS notes (
    night INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    text TEXT NOT NULL,
    PRIMARY KEY (night, player_id)
  )`);
  // The join PIN. A room saved before PINs has no row, and joins without one.
  sql.exec('CREATE TABLE IF NOT EXISTS room_pin (pin TEXT NOT NULL)');
  // Player marks and their switch were removed (decision 0026); drop what older rooms saved.
  sql.exec('DROP TABLE IF EXISTS marks');
  sql.exec('DROP TABLE IF EXISTS marks_on');
  // Roles a power gave players. A game saved before them has no rows, so it loads with none.
  sql.exec(`CREATE TABLE IF NOT EXISTS new_roles (
    player_id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    phase_kind TEXT NOT NULL,
    phase_number INTEGER NOT NULL
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

function phase(row: Record<string, SqlStorageValue>): Phase {
  const kind = text(row, 'phase_kind');
  if (kind !== 'night' && kind !== 'morning')
    throw new Error(`Room storage: unknown phase ${kind}`);
  return { kind, number: integer(row, 'phase_number') };
}

function loadGame(sql: SqlStorage): GameState | null {
  const [row] = sql.exec('SELECT * FROM game LIMIT 1').toArray();
  if (!row) return null;
  // fromEntries, as for rule edits.
  const deaths: Record<string, Phase> = Object.fromEntries(
    sql
      .exec('SELECT * FROM deaths')
      .toArray()
      .map((death) => [text(death, 'player_id'), phase(death)]),
  );
  const notes: Record<number, Record<string, string>> = {};
  for (const note of sql.exec('SELECT * FROM notes ORDER BY night').toArray()) {
    const night = integer(note, 'night');
    notes[night] = { ...notes[night], [text(note, 'player_id')]: text(note, 'text') };
  }
  // fromEntries, as for rule edits.
  const newRoles: GameState['newRoles'] = Object.fromEntries(
    sql
      .exec('SELECT * FROM new_roles')
      .toArray()
      .map((changed) => [
        text(changed, 'player_id'),
        { role: text(changed, 'role_id'), phase: phase(changed) },
      ]),
  );
  return { phase: phase(row), deaths, notes, newRoles };
}

function loadSetup(sql: SqlStorage): RoomSetup {
  const picks = sql
    .exec('SELECT role_id FROM picks ORDER BY idx')
    .toArray()
    .map((row) => text(row, 'role_id'));
  // fromEntries, so even a stored `__proto__` key stays a plain key.
  const ruleEdits: Record<string, string> = Object.fromEntries(
    sql
      .exec('SELECT * FROM rule_edits')
      .toArray()
      .map((row) => [text(row, 'role_id'), text(row, 'rule')]),
  );
  const customRoles: CustomRole[] = sql
    .exec('SELECT * FROM custom_roles ORDER BY idx')
    .toArray()
    .map((row) => {
      const team = text(row, 'team');
      const knownTeam = TEAMS.find((known) => known === team);
      if (!knownTeam) throw new Error(`Room storage: unknown team ${team}`);
      return {
        id: text(row, 'id'),
        name: text(row, 'name'),
        rule: text(row, 'rule'),
        team: knownTeam,
        wakes: integer(row, 'wakes') === 1,
      };
    });
  const wakeOrder = sql
    .exec('SELECT role_id FROM wake_order ORDER BY idx')
    .toArray()
    .map((row) => text(row, 'role_id'));
  const [settingsRow] = sql.exec('SELECT * FROM settings LIMIT 1').toArray();
  const settings = settingsRow
    ? {
        timerSeconds: integer(settingsRow, 'timer_seconds'),
        soundOn: integer(settingsRow, 'sound_on') === 1,
      }
    : { ...DEFAULT_SETTINGS };
  return { picks, ruleEdits, customRoles, wakeOrder, settings };
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
  ensureSchema(sql);
  const players: Player[] = sql
    .exec('SELECT * FROM players ORDER BY joined_at, id')
    .toArray()
    .map((player) => ({
      id: text(player, 'id'),
      name: text(player, 'name'),
      joinedAt: integer(player, 'joined_at'),
      kicked: integer(player, 'kicked') === 1,
    }));
  const [pinRow] = sql.exec('SELECT pin FROM room_pin LIMIT 1').toArray();
  return {
    id: text(row, 'id'),
    name: text(row, 'name'),
    status: knownStatus,
    open: integer(row, 'open') === 1,
    masterId: text(row, 'master_id'),
    masterName: text(row, 'master_name'),
    pin: pinRow ? text(pinRow, 'pin') : null,
    createdAt: integer(row, 'created_at'),
    lastActiveAt: integer(row, 'last_active_at'),
    players,
    setup: loadSetup(sql),
    // fromEntries, as for rule edits.
    assignments: Object.fromEntries(
      sql
        .exec('SELECT * FROM assignments')
        .toArray()
        .map((assignment) => [text(assignment, 'player_id'), text(assignment, 'role_id')]),
    ),
    // A game dealt before the room kept the narrator's game starts at Night 1.
    game:
      loadGame(sql) ??
      (knownStatus === 'playing'
        ? { phase: { kind: 'night', number: 1 }, deaths: {}, notes: {}, newRoles: {} }
        : null),
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
    sql.exec('DELETE FROM room_pin');
    if (state.pin !== null) sql.exec('INSERT INTO room_pin VALUES (?)', state.pin);
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
    const { setup } = state;
    sql.exec('DELETE FROM picks');
    setup.picks.forEach((roleId, index) => {
      sql.exec('INSERT INTO picks VALUES (?, ?)', index, roleId);
    });
    sql.exec('DELETE FROM rule_edits');
    for (const [roleId, rule] of Object.entries(setup.ruleEdits)) {
      sql.exec('INSERT INTO rule_edits VALUES (?, ?)', roleId, rule);
    }
    sql.exec('DELETE FROM custom_roles');
    setup.customRoles.forEach((role, index) => {
      sql.exec(
        'INSERT INTO custom_roles VALUES (?, ?, ?, ?, ?, ?)',
        index,
        role.id,
        role.name,
        role.rule,
        role.team,
        role.wakes ? 1 : 0,
      );
    });
    sql.exec('DELETE FROM wake_order');
    setup.wakeOrder.forEach((roleId, index) => {
      sql.exec('INSERT INTO wake_order VALUES (?, ?)', index, roleId);
    });
    sql.exec('DELETE FROM settings');
    sql.exec(
      'INSERT INTO settings VALUES (?, ?)',
      setup.settings.timerSeconds,
      setup.settings.soundOn ? 1 : 0,
    );
    sql.exec('DELETE FROM assignments');
    for (const [playerId, roleId] of Object.entries(state.assignments)) {
      sql.exec('INSERT INTO assignments VALUES (?, ?)', playerId, roleId);
    }
    sql.exec('DELETE FROM game');
    sql.exec('DELETE FROM deaths');
    sql.exec('DELETE FROM notes');
    sql.exec('DELETE FROM new_roles');
    const { game } = state;
    if (game) {
      sql.exec('INSERT INTO game VALUES (?, ?)', game.phase.kind, game.phase.number);
      for (const [playerId, death] of Object.entries(game.deaths)) {
        sql.exec('INSERT INTO deaths VALUES (?, ?, ?)', playerId, death.kind, death.number);
      }
      for (const [night, byPlayer] of Object.entries(game.notes)) {
        for (const [playerId, note] of Object.entries(byPlayer)) {
          sql.exec('INSERT INTO notes VALUES (?, ?, ?)', Number(night), playerId, note);
        }
      }
      for (const [playerId, changed] of Object.entries(game.newRoles)) {
        sql.exec(
          'INSERT INTO new_roles VALUES (?, ?, ?, ?)',
          playerId,
          changed.role,
          changed.phase.kind,
          changed.phase.number,
        );
      }
    }
  });
}

/** Removes the room and its players for good, along with its alarm. */
export async function deleteRoom(storage: DurableObjectStorage): Promise<void> {
  await storage.deleteAll();
}
