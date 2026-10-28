import {
  cleanName,
  isValidName,
  NAME_MAX,
  ROOM_ID_PATTERN,
  ROOM_NAME_MAX,
  type CreateRoomRequest,
  type CreateRoomResponse,
} from '@werewolf/shared';
import { LOBBY_NAME } from './lobby/Lobby';
import { deviceIdFromToken } from './room/deviceId';
import { TOKEN_PATTERN } from './room/messages';

export { Lobby } from './lobby/Lobby';
export { Room } from './room/Room';

const ROOM_SOCKET_PATH = /^\/api\/rooms\/([^/]+)\/ws$/;
const ROOM_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ROOM_ID_LENGTH = 8;
const MAX_BODY_LENGTH = 1024;

function newRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ROOM_ID_LENGTH));
  // 256 is not a multiple of 36, so a few letters come up very slightly more often; fine for ids.
  return Array.from(bytes, (byte) => ROOM_ID_ALPHABET[byte % ROOM_ID_ALPHABET.length]).join('');
}

/** Narrows a create-room body, cleaning both names; null if anything is off. */
function parseCreateRoom(data: unknown): CreateRoomRequest | null {
  if (typeof data !== 'object' || data === null) return null;
  if (!('token' in data) || !('name' in data) || !('roomName' in data)) return null;
  const { token, name, roomName } = data;
  if (typeof token !== 'string' || !TOKEN_PATTERN.test(token)) return null;
  if (typeof name !== 'string' || typeof roomName !== 'string') return null;
  const cleanedName = cleanName(name);
  const cleanedRoomName = cleanName(roomName);
  if (!isValidName(cleanedName, NAME_MAX) || !isValidName(cleanedRoomName, ROOM_NAME_MAX)) {
    return null;
  }
  return { token, name: cleanedName, roomName: cleanedRoomName };
}

/** The body as text, or null once it passes `maxBytes`; a large body is never read in full. */
async function readCapped(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get('Content-Length'));
  if (declared > maxBytes || !request.body) return declared > maxBytes ? null : '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const result: ReadableStreamReadResult<unknown> = await reader.read();
    if (result.done) break;
    const value = result.value;
    if (!(value instanceof Uint8Array)) {
      await reader.cancel();
      return null;
    }
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function createRoom(request: Request, env: Env): Promise<Response> {
  const body = await readCapped(request, MAX_BODY_LENGTH);
  if (body === null) return new Response('Create-room request too large', { status: 413 });
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    data = null;
  }
  const input = parseCreateRoom(data);
  if (!input) return new Response('Bad create-room request', { status: 400 });

  // A clash among 36^8 ids is very unlikely; try a few before giving up.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = newRoomId();
    const masterId = await deviceIdFromToken(input.token, id);
    const created = await env.ROOM.getByName(id).create({
      id,
      name: input.roomName,
      masterId,
      masterName: input.name,
    });
    if (created) return Response.json({ id } satisfies CreateRoomResponse, { status: 201 });
  }
  console.error('Create room: no free id after 3 attempts');
  return new Response('Could not create a room', { status: 503 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isUpgrade = request.headers.get('Upgrade') === 'websocket';

    if (url.pathname === '/api/rooms' && request.method === 'POST') {
      return createRoom(request, env);
    }

    if (url.pathname === '/api/lobby/ws') {
      if (!isUpgrade) return new Response('Expected a WebSocket upgrade', { status: 426 });
      return env.LOBBY.getByName(LOBBY_NAME).fetch(request);
    }

    const roomId = ROOM_SOCKET_PATH.exec(url.pathname)?.[1];
    if (roomId !== undefined && ROOM_ID_PATTERN.test(roomId)) {
      if (!isUpgrade) return new Response('Expected a WebSocket upgrade', { status: 426 });
      return env.ROOM.getByName(roomId).fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
