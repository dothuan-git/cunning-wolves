import type { ClientMessage } from '@werewolf/shared';

// Exactly what crypto.randomUUID() makes on the client.
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_MESSAGE_LENGTH = 256;

/** Narrows a raw socket message to a ClientMessage, or null if it isn't one. */
export function parseClientMessage(raw: string | ArrayBuffer): ClientMessage | null {
  if (typeof raw !== 'string' || raw.length > MAX_MESSAGE_LENGTH) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  if (!('type' in data) || data.type !== 'hello') return null;
  if (!('token' in data) || typeof data.token !== 'string' || !TOKEN_PATTERN.test(data.token)) {
    return null;
  }
  return { type: 'hello', token: data.token };
}
