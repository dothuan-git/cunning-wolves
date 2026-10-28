import type { ClientMessage } from '@werewolf/shared';

// crypto.randomUUID() on the client; the bounds only keep junk and huge strings out.
const TOKEN_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

/** Narrows a raw socket message to a ClientMessage, or null if it isn't one. */
export function parseClientMessage(raw: string | ArrayBuffer): ClientMessage | null {
  if (typeof raw !== 'string') return null;
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
