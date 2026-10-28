import { CLOSE_REPLACED, type ServerMessage } from '@werewolf/shared';
import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { deviceIdFromToken } from '../src/room/deviceId';
import { parseClientMessage } from '../src/room/messages';

const TOKEN_A = '11111111-1111-4111-8111-111111111111';
const TOKEN_B = '22222222-2222-4222-8222-222222222222';

let roomCounter = 0;
function newRoomId(): string {
  roomCounter += 1;
  return `test-${String(roomCounter)}-${String(Date.now())}`;
}

interface TestSocket {
  ws: WebSocket;
  /** Raw text of every message received so far */
  received: string[];
  /** Resolves with the next state message whose device count matches */
  nextState: (count: number) => Promise<Extract<ServerMessage, { type: 'state' }>>;
  nextMessage: () => Promise<ServerMessage>;
  closed: Promise<CloseEvent>;
}

async function connect(roomId: string, token?: string): Promise<TestSocket> {
  const response = await exports.default.fetch(`http://localhost/api/rooms/${roomId}/ws`, {
    headers: { Upgrade: 'websocket' },
  });
  expect(response.status).toBe(101);
  const ws = response.webSocket;
  if (!ws) throw new Error('No WebSocket on the upgrade response');
  ws.accept();

  const received: string[] = [];
  const waiters: (() => void)[] = [];
  let read = 0;
  ws.addEventListener('message', (event) => {
    received.push(String(event.data));
    for (const wake of waiters.splice(0)) wake();
  });
  const closed = new Promise<CloseEvent>((resolve) => {
    ws.addEventListener('close', resolve);
  });

  async function nextMessage(): Promise<ServerMessage> {
    while (read >= received.length) {
      await new Promise<void>((resolve) => waiters.push(resolve));
    }
    const text = received[read] ?? '';
    read += 1;
    return JSON.parse(text) as ServerMessage;
  }

  async function nextState(count: number) {
    for (;;) {
      const message = await nextMessage();
      if (message.type === 'state' && message.view.devices.length === count) return message;
    }
  }

  if (token !== undefined) ws.send(JSON.stringify({ type: 'hello', token }));
  return { ws, received, nextState, nextMessage, closed };
}

describe('room socket route', () => {
  it('rejects a request without an upgrade', async () => {
    const response = await exports.default.fetch('http://localhost/api/rooms/mill/ws');
    expect(response.status).toBe(426);
  });

  it('rejects a bad room id', async () => {
    const response = await exports.default.fetch('http://localhost/api/rooms/Bad%20Id/ws', {
      headers: { Upgrade: 'websocket' },
    });
    expect(response.status).toBe(404);
  });
});

describe('Room', () => {
  it('shows every connected phone to every phone', async () => {
    const roomId = newRoomId();
    const a = await connect(roomId, TOKEN_A);
    await a.nextState(1);
    const b = await connect(roomId, TOKEN_B);

    const idA = await deviceIdFromToken(TOKEN_A);
    const idB = await deviceIdFromToken(TOKEN_B);
    const devices = [idA, idB].sort();
    expect((await a.nextState(2)).view).toEqual({ you: idA, devices });
    expect((await b.nextState(2)).view).toEqual({ you: idB, devices });
  });

  it('keeps the same id after a reconnect and drops the older socket', async () => {
    const roomId = newRoomId();
    const a = await connect(roomId, TOKEN_A);
    const b = await connect(roomId, TOKEN_B);
    await b.nextState(2);

    const again = await connect(roomId, TOKEN_A);
    const idA = await deviceIdFromToken(TOKEN_A);
    expect((await again.nextState(2)).view.you).toBe(idA);
    expect((await a.closed).code).toBe(CLOSE_REPLACED);
    expect((await b.nextState(2)).view.devices).toContain(idA);
  });

  it('tells the others when a phone leaves', async () => {
    const roomId = newRoomId();
    const a = await connect(roomId, TOKEN_A);
    const b = await connect(roomId, TOKEN_B);
    await a.nextState(2);

    b.ws.close(1000, 'bye');
    expect((await a.nextState(1)).view.devices).toEqual([await deviceIdFromToken(TOKEN_A)]);
  });

  it('closes a socket that sends a bad message', async () => {
    const roomId = newRoomId();
    const socket = await connect(roomId);
    socket.ws.send('{"type":"hello","token":1}');
    expect(await socket.nextMessage()).toEqual({ type: 'error', code: 'bad-message' });
    expect((await socket.closed).code).toBe(1008);
  });

  it('closes a socket that says hello twice', async () => {
    const roomId = newRoomId();
    const socket = await connect(roomId, TOKEN_A);
    await socket.nextState(1);
    socket.ws.send(JSON.stringify({ type: 'hello', token: TOKEN_B }));
    expect(await socket.nextMessage()).toEqual({ type: 'error', code: 'bad-message' });
    expect((await socket.closed).code).toBe(1008);
  });

  it('closes a socket that sends two hellos back to back', async () => {
    const roomId = newRoomId();
    const socket = await connect(roomId, TOKEN_A);
    socket.ws.send(JSON.stringify({ type: 'hello', token: TOKEN_B }));
    expect((await socket.closed).code).toBe(1008);
  });

  it('never sends a device token to any phone', async () => {
    const roomId = newRoomId();
    const a = await connect(roomId, TOKEN_A);
    const b = await connect(roomId, TOKEN_B);
    await a.nextState(2);
    await b.nextState(2);
    for (const text of [...a.received, ...b.received]) {
      expect(text).not.toContain(TOKEN_A);
      expect(text).not.toContain(TOKEN_B);
    }
  });
});

describe('parseClientMessage', () => {
  it('accepts a hello with a token', () => {
    expect(parseClientMessage(JSON.stringify({ type: 'hello', token: TOKEN_A }))).toEqual({
      type: 'hello',
      token: TOKEN_A,
    });
  });

  it.each([
    ['binary', new ArrayBuffer(4)],
    ['not JSON', '{'],
    ['null', 'null'],
    ['unknown type', JSON.stringify({ type: 'kick', token: TOKEN_A })],
    ['missing token', JSON.stringify({ type: 'hello' })],
    ['too long', JSON.stringify({ type: 'hello', token: TOKEN_A, pad: 'x'.repeat(300) })],
    ['not a uuid', JSON.stringify({ type: 'hello', token: 'aaaaaaaaaaaaaaaaaaaa' })],
    ['short token', JSON.stringify({ type: 'hello', token: 'abc' })],
    ['token with spaces', JSON.stringify({ type: 'hello', token: `${TOKEN_A} x` })],
  ])('rejects %s', (_label, raw) => {
    expect(parseClientMessage(raw)).toBeNull();
  });
});

describe('deviceIdFromToken', () => {
  it('is stable, 16 hex chars, and differs per token', async () => {
    const id = await deviceIdFromToken(TOKEN_A);
    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(await deviceIdFromToken(TOKEN_A)).toBe(id);
    expect(await deviceIdFromToken(TOKEN_B)).not.toBe(id);
  });
});
