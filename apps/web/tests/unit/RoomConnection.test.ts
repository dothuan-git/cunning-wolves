import { CLOSE_REPLACED, PING, PONG, type ServerMessage } from '@werewolf/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  parseServerMessage,
  RoomConnection,
  roomSocketUrl,
  type SocketHandlers,
  type SocketLike,
} from '../../src/realtime/RoomConnection';

const TOKEN = '11111111-1111-4111-8111-111111111111';
const VIEW = { you: 'aaaa', devices: ['aaaa', 'bbbb'] };

class FakeSocket implements SocketLike {
  sent: string[] = [];
  closedWith: number | null = null;
  constructor(readonly handlers: SocketHandlers) {}
  send(data: string) {
    this.sent.push(data);
  }
  close(code?: number) {
    this.closedWith = code ?? 1005;
  }
  receive(message: ServerMessage | string) {
    this.handlers.message(typeof message === 'string' ? message : JSON.stringify(message));
  }
}

function setup() {
  const sockets: FakeSocket[] = [];
  // random() = 1 makes every backoff wait its full bound: 500ms, 1s, 2s, …
  const connection = new RoomConnection(
    'ws://test/api/rooms/mill/ws',
    TOKEN,
    (_url, handlers) => {
      const socket = new FakeSocket(handlers);
      sockets.push(socket);
      return socket;
    },
    () => 1,
  );
  const latest = () => {
    const socket = sockets.at(-1);
    if (!socket) throw new Error('No socket opened yet');
    return socket;
  };
  /** Opens the latest socket and has the room answer the hello */
  const accept = () => {
    latest().handlers.open();
    latest().receive({ type: 'state', view: VIEW });
  };
  return { connection, sockets, latest, accept };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('RoomConnection', () => {
  it('says hello with the token and shows the room view', () => {
    const { connection, latest, accept } = setup();
    connection.start();
    expect(connection.getSnapshot()).toEqual({ status: 'connecting', view: null });

    accept();
    expect(latest().sent).toEqual([JSON.stringify({ type: 'hello', token: TOKEN })]);
    expect(connection.getSnapshot()).toEqual({ status: 'connected', view: VIEW });
  });

  it('reconnects with growing waits and resets after it gets back in', () => {
    const { connection, sockets, latest, accept } = setup();
    connection.start();
    accept();

    latest().handlers.close(1006);
    expect(connection.getSnapshot()).toEqual({ status: 'reconnecting', view: VIEW });
    vi.advanceTimersByTime(499);
    expect(sockets).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);

    latest().handlers.close(1006);
    vi.advanceTimersByTime(999);
    expect(sockets).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(3);

    accept();
    expect(connection.getSnapshot().status).toBe('connected');
    latest().handlers.close(1006);
    vi.advanceTimersByTime(500);
    expect(sockets).toHaveLength(4);
  });

  it('stops when the same device connects somewhere else', () => {
    const { connection, sockets, latest, accept } = setup();
    connection.start();
    accept();

    latest().handlers.close(CLOSE_REPLACED);
    expect(connection.getSnapshot().status).toBe('replaced');
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
  });

  it('reconnects when a ping gets no pong', () => {
    const { connection, sockets, latest, accept } = setup();
    connection.start();
    accept();

    vi.advanceTimersByTime(25_000);
    expect(latest().sent.at(-1)).toBe(PING);
    latest().receive(PONG);
    vi.advanceTimersByTime(10_000);
    expect(sockets).toHaveLength(1);

    vi.advanceTimersByTime(15_000);
    vi.advanceTimersByTime(10_000);
    expect(sockets[0]?.closedWith).toBe(4001);
    expect(connection.getSnapshot().status).toBe('reconnecting');
    vi.advanceTimersByTime(500);
    expect(sockets).toHaveLength(2);
  });

  it('reconnects at once on wake instead of waiting out the backoff', () => {
    const { connection, sockets, latest, accept } = setup();
    connection.start();
    accept();
    latest().handlers.close(1006);

    connection.wake();
    expect(sockets).toHaveLength(2);
  });

  it('checks a connected socket on wake', () => {
    const { connection, latest, accept } = setup();
    connection.start();
    accept();

    connection.wake();
    expect(latest().sent.at(-1)).toBe(PING);
  });

  it('ignores events from a socket it already dropped', () => {
    const { connection, sockets, accept } = setup();
    connection.start();
    accept();
    connection.stop();

    sockets[0]?.handlers.close(1006);
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
    expect(sockets[0]?.closedWith).toBe(1000);
  });

  it('notifies subscribers until they unsubscribe', () => {
    const { connection, accept } = setup();
    const listener = vi.fn();
    const unsubscribe = connection.subscribe(listener);
    connection.start();
    expect(listener).toHaveBeenLastCalledWith({ status: 'connecting', view: null });
    unsubscribe();
    accept();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('parseServerMessage', () => {
  it('accepts state and error messages', () => {
    const state = { type: 'state', view: VIEW };
    expect(parseServerMessage(JSON.stringify(state))).toEqual(state);
    const error = { type: 'error', code: 'bad-message' };
    expect(parseServerMessage(JSON.stringify(error))).toEqual(error);
  });

  it.each([
    ['binary', new ArrayBuffer(2)],
    ['not JSON', '{'],
    ['no type', '{}'],
    ['unknown type', JSON.stringify({ type: 'kick' })],
    ['bad view', JSON.stringify({ type: 'state', view: { you: 1, devices: [] } })],
    ['bad devices', JSON.stringify({ type: 'state', view: { you: 'a', devices: [2] } })],
  ])('rejects %s', (_label, data) => {
    expect(parseServerMessage(data)).toBeNull();
  });
});

describe('roomSocketUrl', () => {
  it('uses wss on https and ws on http', () => {
    expect(roomSocketUrl('mill', new URL('https://wolves.example/test/mill'))).toBe(
      'wss://wolves.example/api/rooms/mill/ws',
    );
    expect(roomSocketUrl('mill', new URL('http://192.168.1.5:5173/'))).toBe(
      'ws://192.168.1.5:5173/api/rooms/mill/ws',
    );
  });
});
