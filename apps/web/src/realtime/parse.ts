import {
  TEAMS,
  WAKE_NIGHTS,
  type Assignment,
  type CustomRole,
  type GameRole,
  type GameState,
  type LobbyMessage,
  type Phase,
  type PlayerInfo,
  type Reveal,
  type RoomInfo,
  type RoomRole,
  type RoomSetup,
  type RoomStatus,
  type RoomSummary,
  type RoomView,
  type ServerErrorCode,
  type ServerMessage,
} from '@werewolf/shared';

// The server is ours, but a stale tab can meet a newer server: check shapes, never trust them.

type Fields = Record<string, unknown>;

const STATUSES: readonly RoomStatus[] = ['lobby', 'reveal', 'playing', 'finished'];
const ERROR_CODES: readonly ServerErrorCode[] = [
  'bad-message',
  'name-invalid',
  'name-taken',
  'room-closed',
  'not-master',
  'not-allowed',
  'role-invalid',
  'pin-wrong',
  'pin-locked',
  'player-offline',
  'try-again',
];
const SEATS = ['none', 'joined', 'removed'] as const;

function isObject(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(options: readonly T[], value: unknown): T | undefined {
  return options.find((option) => option === value);
}

function json(data: unknown): unknown {
  if (typeof data !== 'string') return undefined;
  try {
    return JSON.parse(data);
  } catch {
    return undefined;
  }
}

function roomInfo(value: unknown): RoomInfo | null {
  if (!isObject(value)) return null;
  const { id, name, status, open } = value;
  const known = oneOf(STATUSES, status);
  if (typeof id !== 'string' || typeof name !== 'string' || !known || typeof open !== 'boolean') {
    return null;
  }
  return { id, name, status: known, open };
}

function playerInfo(value: unknown): PlayerInfo | null {
  if (!isObject(value)) return null;
  const { id, name, connected } = value;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof connected !== 'boolean') {
    return null;
  }
  return { id, name, connected };
}

function list<T>(value: unknown, item: (entry: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.map(item);
  return items.every((entry) => entry !== null) ? items : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function customRole(value: unknown): CustomRole | null {
  if (!isObject(value)) return null;
  const { id, name, rule, team, wakes } = value;
  const known = oneOf(TEAMS, team);
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof rule !== 'string' ||
    !known ||
    typeof wakes !== 'boolean'
  ) {
    return null;
  }
  return { id, name, rule, team: known, wakes };
}

function roomSetup(value: unknown): RoomSetup | null {
  if (!isObject(value) || !isObject(value.ruleEdits) || !isObject(value.settings)) return null;
  const picks = list(value.picks, text);
  const customRoles = list(value.customRoles, customRole);
  const wakeOrder = list(value.wakeOrder, text);
  const ruleEdits: Record<string, string> = {};
  for (const [roleId, rule] of Object.entries(value.ruleEdits)) {
    if (typeof rule !== 'string') return null;
    ruleEdits[roleId] = rule;
  }
  const { timerSeconds, soundOn } = value.settings;
  if (
    !picks ||
    !customRoles ||
    !wakeOrder ||
    typeof timerSeconds !== 'number' ||
    typeof soundOn !== 'boolean'
  ) {
    return null;
  }
  return { picks, ruleEdits, customRoles, wakeOrder, settings: { timerSeconds, soundOn } };
}

function localized(value: unknown): RoomRole['name'] | null {
  if (!isObject(value) || typeof value.vi !== 'string' || typeof value.en !== 'string') return null;
  return { vi: value.vi, en: value.en };
}

function roomRole(value: unknown): RoomRole | null {
  if (!isObject(value)) return null;
  const { id, defaultWakeOrder, image, custom } = value;
  const name = localized(value.name);
  const rule = localized(value.rule);
  const team = oneOf(TEAMS, value.team);
  const wakeNights = oneOf(WAKE_NIGHTS, value.wakeNights);
  if (
    typeof id !== 'string' ||
    !name ||
    !rule ||
    !team ||
    !wakeNights ||
    !(defaultWakeOrder === null || typeof defaultWakeOrder === 'number') ||
    typeof image !== 'string' ||
    typeof custom !== 'boolean'
  ) {
    return null;
  }
  return { id, name, rule, team, defaultWakeOrder, wakeNights, image, custom };
}

function gameRole(value: unknown): GameRole | null {
  if (!isObject(value) || typeof value.count !== 'number') return null;
  const role = roomRole(value.role);
  return role ? { role, count: value.count } : null;
}

function assignment(value: unknown): Assignment | null {
  if (!isObject(value)) return null;
  const { playerId, roleId } = value;
  return typeof playerId === 'string' && typeof roleId === 'string' ? { playerId, roleId } : null;
}

function phase(value: unknown): Phase | null {
  if (!isObject(value) || typeof value.number !== 'number') return null;
  const kind = oneOf(['night', 'morning'] as const, value.kind);
  return kind ? { kind, number: value.number } : null;
}

function gameState(value: unknown): GameState | null {
  if (
    !isObject(value) ||
    !isObject(value.deaths) ||
    !isObject(value.notes) ||
    !isObject(value.marks)
  ) {
    return null;
  }
  const current = phase(value.phase);
  if (!current) return null;
  const deaths: Record<string, Phase> = {};
  for (const [playerId, death] of Object.entries(value.deaths)) {
    const marked = phase(death);
    if (!marked) return null;
    deaths[playerId] = marked;
  }
  const notes: Record<number, Record<string, string>> = {};
  for (const [night, byPlayer] of Object.entries(value.notes)) {
    if (!isObject(byPlayer) || !/^\d+$/.test(night)) return null;
    const entries: Record<string, string> = {};
    for (const [playerId, text] of Object.entries(byPlayer)) {
      if (typeof text !== 'string') return null;
      entries[playerId] = text;
    }
    notes[Number(night)] = entries;
  }
  const marks: Record<string, Record<string, Phase>> = {};
  for (const [playerId, own] of Object.entries(value.marks)) {
    if (!isObject(own)) return null;
    const entries: Record<string, Phase> = {};
    for (const [mark, at] of Object.entries(own)) {
      const marked = phase(at);
      if (!marked) return null;
      entries[mark] = marked;
    }
    marks[playerId] = entries;
  }
  return { phase: current, deaths, notes, marks };
}

function reveal(value: unknown): Reveal | null {
  if (!isObject(value)) return null;
  const assignments = list(value.assignments, assignment);
  const game = gameState(value.game);
  return assignments && game ? { assignments, game } : null;
}

function roomView(value: unknown): RoomView | null {
  if (!isObject(value) || typeof value.you !== 'string') return null;
  const room = roomInfo(value.room);
  const players = list(value.players, playerInfo);
  if (!room || !players) return null;
  if (value.kind === 'master') {
    const setup = roomSetup(value.setup);
    const assignments = list(value.assignments, assignment);
    const game = value.game === null ? null : gameState(value.game);
    const pin = value.pin === null ? null : text(value.pin);
    return setup &&
      assignments &&
      (value.game === null || game) &&
      (value.pin === null || pin !== null)
      ? { kind: 'master', you: value.you, room, players, setup, pin, assignments, game }
      : null;
  }
  const seat = oneOf(SEATS, value.seat);
  const roles = list(value.roles, gameRole);
  const card = value.card === null ? null : roomRole(value.card);
  const revealed = value.reveal === null ? null : reveal(value.reveal);
  if (
    value.kind === 'player' &&
    seat &&
    roles &&
    (value.card === null || card) &&
    (value.reveal === null || revealed)
  ) {
    return { kind: 'player', you: value.you, room, players, seat, roles, card, reveal: revealed };
  }
  return null;
}

export function parseServerMessage(data: unknown): ServerMessage | null {
  const message = json(data);
  if (!isObject(message)) return null;
  if (message.type === 'error') {
    const code = oneOf(ERROR_CODES, message.code);
    return code ? { type: 'error', code } : null;
  }
  if (message.type === 'state') {
    const view = roomView(message.view);
    return view ? { type: 'state', view } : null;
  }
  return null;
}

function roomSummary(value: unknown): RoomSummary | null {
  if (!isObject(value)) return null;
  const { id, name, master, count, status, isOpen } = value;
  const known = oneOf(STATUSES, status);
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof master !== 'string' ||
    typeof count !== 'number' ||
    !known ||
    typeof isOpen !== 'boolean'
  ) {
    return null;
  }
  return { id, name, master, count, status: known, isOpen };
}

export function parseLobbyMessage(data: unknown): LobbyMessage | null {
  const message = json(data);
  if (!isObject(message) || message.type !== 'rooms') return null;
  const rooms = list(message.rooms, roomSummary);
  return rooms ? { type: 'rooms', rooms } : null;
}
