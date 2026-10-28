import type { ClientMessage } from '@werewolf/shared';

// Exactly what crypto.randomUUID() makes on the client.
export const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_MESSAGE_LENGTH = 256;

function field(data: object, key: string): unknown {
  return key in data ? (data as Record<string, unknown>)[key] : undefined;
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
  if (typeof data !== 'object' || data === null) return null;
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
      return { type };
    case 'kick': {
      const playerId = field(data, 'playerId');
      return typeof playerId === 'string' ? { type, playerId } : null;
    }
    case 'setOpen': {
      const open = field(data, 'open');
      return typeof open === 'boolean' ? { type, open } : null;
    }
    default:
      return null;
  }
}
