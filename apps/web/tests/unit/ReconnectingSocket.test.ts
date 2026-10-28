import { CLOSE_REPLACED, CLOSE_ROOM_GONE, PING, PONG } from '@werewolf/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ReconnectingSocket,
  socketUrl,
  type ConnectionStatus,
} from '../../src/realtime/ReconnectingSocket';
import { fakeSockets } from './fakeSocket';

function setup() {
  const fake = fakeSockets();
  const statuses: ConnectionStatus[] = [];
  // random() = 1 makes every backoff wait its full bound: 500ms, 1s, 2s, …
  const socket = new ReconnectingSocket({
    url: 'ws://test/x',
    createSocket: fake.create,
    random: () => 1,
    onOpen: (send) => {
      send('hello');
    },
    onMessage: (data) => data === 'ready',
    onStatus: (status) => statuses.push(status),
  });
  /** Opens the latest socket and has the server answer */
  const accept = () => {
    fake.latest().handlers.open();
    fake.latest().receive('ready');
  };
  const status = () => statuses.at(-1) ?? 'connecting';
  return { socket, ...fake, accept, status };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ReconnectingSocket', () => {
  it('runs onOpen first and becomes connected on a good message', () => {
    const { socket, latest, accept, status } = setup();
    socket.start();
    expect(status()).toBe('connecting');
    accept();
    expect(latest().sent).toEqual(['hello']);
    expect(status()).toBe('connected');
  });

  it('reconnects with growing waits and resets after it gets back in', () => {
    const { socket, sockets, latest, accept, status } = setup();
    socket.start();
    accept();

    latest().handlers.close(1006);
    expect(status()).toBe('reconnecting');
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
    latest().handlers.close(1006);
    vi.advanceTimersByTime(500);
    expect(sockets).toHaveLength(4);
  });

  it.each([
    [CLOSE_REPLACED, 'replaced'],
    [CLOSE_ROOM_GONE, 'gone'],
  ] as const)('stops for good on close code %i', (code, expected) => {
    const { socket, sockets, latest, accept, status } = setup();
    socket.start();
    accept();
    latest().handlers.close(code);
    expect(status()).toBe(expected);
    vi.advanceTimersByTime(60_000);
    socket.wake();
    expect(sockets).toHaveLength(1);
  });

  it('reconnects when a ping gets no pong', () => {
    const { socket, sockets, latest, accept, status } = setup();
    socket.start();
    accept();

    vi.advanceTimersByTime(25_000);
    expect(latest().sent.at(-1)).toBe(PING);
    latest().receive(PONG);
    vi.advanceTimersByTime(10_000);
    expect(sockets).toHaveLength(1);

    vi.advanceTimersByTime(25_000);
    expect(sockets[0]?.closedWith).toBe(4001);
    expect(status()).toBe('reconnecting');
    vi.advanceTimersByTime(500);
    expect(sockets).toHaveLength(2);
  });

  it('reconnects at once on wake instead of waiting out the backoff', () => {
    const { socket, sockets, latest, accept } = setup();
    socket.start();
    accept();
    latest().handlers.close(1006);
    socket.wake();
    expect(sockets).toHaveLength(2);
  });

  it('checks a connected socket on wake', () => {
    const { socket, latest, accept } = setup();
    socket.start();
    accept();
    socket.wake();
    expect(latest().sent.at(-1)).toBe(PING);
  });

  it('ignores events from a socket it already dropped', () => {
    const { socket, sockets, accept } = setup();
    socket.start();
    accept();
    socket.stop();
    sockets[0]?.handlers.close(1006);
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
    expect(sockets[0]?.closedWith).toBe(1000);
  });

  it('only sends while a socket is open', () => {
    const { socket, latest, accept } = setup();
    expect(socket.send('x')).toBe(false);
    socket.start();
    accept();
    expect(socket.send('x')).toBe(true);
    expect(latest().sent.at(-1)).toBe('x');
  });
});

describe('socketUrl', () => {
  it('uses wss on https and ws on http', () => {
    expect(socketUrl('/api/lobby/ws', new URL('https://wolves.example/'))).toBe(
      'wss://wolves.example/api/lobby/ws',
    );
    expect(socketUrl('/api/lobby/ws', new URL('http://192.168.1.5:5173/'))).toBe(
      'ws://192.168.1.5:5173/api/lobby/ws',
    );
  });
});
