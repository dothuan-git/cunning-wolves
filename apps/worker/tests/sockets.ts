import { exports } from 'cloudflare:workers';
import { expect } from 'vitest';

export const TOKENS = {
  master: '11111111-1111-4111-8111-111111111111',
  minh: '22222222-2222-4222-8222-222222222222',
  lan: '33333333-3333-4333-8333-333333333333',
} as const;

export interface TestSocket {
  ws: WebSocket;
  /** Raw text of every message received so far */
  received: string[];
  /** Resolves with the next parsed message that matches */
  next: <T>(match: (message: unknown) => message is T) => Promise<T>;
  send: (message: unknown) => void;
  closed: Promise<CloseEvent>;
}

/** Opens a WebSocket through the worker's own fetch handler, like a phone would. */
export async function openSocket(path: string): Promise<TestSocket> {
  const response = await exports.default.fetch(`http://localhost${path}`, {
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

  async function next<T>(match: (message: unknown) => message is T): Promise<T> {
    for (;;) {
      while (read >= received.length) {
        await new Promise<void>((resolve) => waiters.push(resolve));
      }
      const message: unknown = JSON.parse(received[read] ?? 'null');
      read += 1;
      if (match(message)) return message;
    }
  }

  return {
    ws,
    received,
    next,
    send: (message) => {
      ws.send(JSON.stringify(message));
    },
    closed,
  };
}

export const PIN = '4321';

export async function createRoom(
  body: unknown = { token: TOKENS.master, name: 'Thuận', roomName: 'The mill', pin: PIN },
): Promise<Response> {
  return exports.default.fetch('http://localhost/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
