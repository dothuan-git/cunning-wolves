import type {
  CustomRole,
  LobbyMessage,
  PlayerInfo,
  RoomInfo,
  RoomSetup,
  RoomStatus,
  RoomSummary,
  RoomView,
  ServerErrorCode,
  ServerMessage,
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
];
const TEAMS = ['village', 'werewolf'] as const;
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

function roomView(value: unknown): RoomView | null {
  if (!isObject(value) || typeof value.you !== 'string') return null;
  const room = roomInfo(value.room);
  const players = list(value.players, playerInfo);
  if (!room || !players) return null;
  if (value.kind === 'master') {
    const setup = roomSetup(value.setup);
    return setup ? { kind: 'master', you: value.you, room, players, setup } : null;
  }
  const seat = oneOf(SEATS, value.seat);
  if (value.kind === 'player' && seat) {
    return { kind: 'player', you: value.you, room, players, seat };
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
