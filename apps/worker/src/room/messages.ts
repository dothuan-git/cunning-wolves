import type { ClientMessage, CustomRoleInput, Phase, RoomSettings } from '@werewolf/shared';

// Exactly what crypto.randomUUID() makes on the client.
export const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Room for a 500-character rule, even with every character escaped.
const MAX_MESSAGE_LENGTH = 4096;
// More than any room's waking roles; a longer list is not a real wake order.
const MAX_WAKE_ORDER = 64;

function field(data: object, key: string): unknown {
  return Object.hasOwn(data, key) ? (data as Record<string, unknown>)[key] : undefined;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function parseCustomRole(value: unknown): CustomRoleInput | null {
  if (!isObject(value)) return null;
  const name = field(value, 'name');
  const rule = field(value, 'rule');
  const team = field(value, 'team');
  const wakes = field(value, 'wakes');
  if (typeof name !== 'string' || typeof rule !== 'string' || typeof wakes !== 'boolean') {
    return null;
  }
  return team === 'village' || team === 'werewolf' ? { name, rule, team, wakes } : null;
}

function parseSettings(value: unknown): RoomSettings | null {
  if (!isObject(value)) return null;
  const timerSeconds = field(value, 'timerSeconds');
  const soundOn = field(value, 'soundOn');
  return typeof timerSeconds === 'number' && typeof soundOn === 'boolean'
    ? { timerSeconds, soundOn }
    : null;
}

function parsePhase(value: unknown): Phase | null {
  if (!isObject(value)) return null;
  const kind = field(value, 'kind');
  const number = field(value, 'number');
  return (kind === 'night' || kind === 'morning') && typeof number === 'number'
    ? { kind, number }
    : null;
}

/**
 * Narrows a raw socket message to a ClientMessage, or null if it isn't one. Only the shape is
 * checked here; whether the sender may do it is the state machine's job.
 */
export function parseClientMessage(raw: string | ArrayBuffer): ClientMessage | null {
  if (typeof raw !== 'string' || raw.length > MAX_MESSAGE_LENGTH) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(data)) return null;
  const type = field(data, 'type');
  switch (type) {
    case 'hello': {
      const token = field(data, 'token');
      return typeof token === 'string' && TOKEN_PATTERN.test(token) ? { type, token } : null;
    }
    case 'join': {
      const name = field(data, 'name');
      return typeof name === 'string' ? { type, name } : null;
    }
    case 'leave':
    case 'review':
    case 'backToSetup':
    case 'startGame':
    case 'finishGame':
    case 'playAgain':
      return { type };
    case 'kick':
    case 'toggleDeath': {
      const playerId = field(data, 'playerId');
      return typeof playerId === 'string' ? { type, playerId } : null;
    }
    case 'setOpen': {
      const open = field(data, 'open');
      return typeof open === 'boolean' ? { type, open } : null;
    }
    case 'addPick':
    case 'removePick': {
      const roleId = field(data, 'roleId');
      return typeof roleId === 'string' ? { type, roleId } : null;
    }
    case 'editRule': {
      const roleId = field(data, 'roleId');
      const rule = field(data, 'rule');
      return typeof roleId === 'string' && typeof rule === 'string' ? { type, roleId, rule } : null;
    }
    case 'addCustomRole': {
      const role = parseCustomRole(field(data, 'role'));
      return role ? { type, role } : null;
    }
    case 'setWakeOrder': {
      const order = field(data, 'order');
      if (!Array.isArray(order) || order.length > MAX_WAKE_ORDER) return null;
      const ids = order.filter((id): id is string => typeof id === 'string');
      return ids.length === order.length ? { type, order: ids } : null;
    }
    case 'setSettings': {
      const settings = parseSettings(field(data, 'settings'));
      return settings ? { type, settings } : null;
    }
    case 'endPhase': {
      const phase = parsePhase(field(data, 'phase'));
      return phase ? { type, phase } : null;
    }
    case 'setNote': {
      const night = field(data, 'night');
      const playerId = field(data, 'playerId');
      const text = field(data, 'text');
      return typeof night === 'number' && typeof playerId === 'string' && typeof text === 'string'
        ? { type, night, playerId, text }
        : null;
    }
    default:
      return null;
  }
}
