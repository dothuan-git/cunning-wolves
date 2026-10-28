import type { SocketHandlers, SocketLike } from '../../src/realtime/ReconnectingSocket';

export class FakeSocket implements SocketLike {
  sent: string[] = [];
  closedWith: number | null = null;
  constructor(readonly handlers: SocketHandlers) {}
  send(data: string) {
    this.sent.push(data);
  }
  close(code?: number) {
    this.closedWith = code ?? 1005;
  }
  receive(message: unknown) {
    this.handlers.message(typeof message === 'string' ? message : JSON.stringify(message));
  }
}

/** A socket factory that records every socket it opens. */
export function fakeSockets() {
  const sockets: FakeSocket[] = [];
  const create = (_url: string, handlers: SocketHandlers) => {
    const socket = new FakeSocket(handlers);
    sockets.push(socket);
    return socket;
  };
  const latest = () => {
    const socket = sockets.at(-1);
    if (!socket) throw new Error('No socket opened yet');
    return socket;
  };
  return { sockets, create, latest };
}
