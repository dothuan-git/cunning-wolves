import type { RoomAction, RoomView, ServerErrorCode } from '@werewolf/shared';
import { parseServerMessage } from './parse';
import {
  ReconnectingSocket,
  socketUrl,
  type ConnectionStatus,
  type SocketFactory,
} from './ReconnectingSocket';

export interface RoomSnapshot {
  status: ConnectionStatus;
  /** Last view the room sent; kept while reconnecting so the screen doesn't go blank */
  view: RoomView | null;
  /** Why the room refused this phone's last action, until the next one is sent */
  error: ServerErrorCode | null;
}

export function roomSocketUrl(
  roomId: string,
  location?: Pick<Location, 'protocol' | 'host'>,
): string {
  return socketUrl(`/api/rooms/${encodeURIComponent(roomId)}/ws`, location);
}

/** One phone's connection to a room: says hello with the device token, then sends actions. */
export class RoomConnection {
  private snapshot: RoomSnapshot = { status: 'connecting', view: null, error: null };
  private readonly listeners = new Set<(snapshot: RoomSnapshot) => void>();
  private readonly socket: ReconnectingSocket;

  constructor(url: string, token: string, createSocket?: SocketFactory, random?: () => number) {
    this.socket = new ReconnectingSocket({
      url,
      createSocket,
      random,
      onOpen: (send) => {
        send(JSON.stringify({ type: 'hello', token }));
      },
      onMessage: (data) => this.receive(data),
      onStatus: (status) => {
        this.setSnapshot({ ...this.snapshot, status });
      },
    });
  }

  getSnapshot(): RoomSnapshot {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: RoomSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(): void {
    this.socket.start();
  }

  stop(): void {
    this.socket.stop();
  }

  wake(): void {
    this.socket.wake();
  }

  /** Sends an action; false while reconnecting, so the screen can say so instead of losing it. */
  send(action: RoomAction): boolean {
    if (this.snapshot.status !== 'connected') return false;
    if (this.snapshot.error) this.setSnapshot({ ...this.snapshot, error: null });
    return this.socket.send(JSON.stringify(action));
  }

  private receive(data: unknown): boolean {
    const message = parseServerMessage(data);
    if (!message) {
      console.error('Room sent a message this app does not understand', data);
      return false;
    }
    if (message.type === 'error') {
      console.warn('Room refused an action', message.code);
      this.setSnapshot({ ...this.snapshot, error: message.code });
      return false;
    }
    this.setSnapshot({ ...this.snapshot, view: message.view });
    return true;
  }

  private setSnapshot(snapshot: RoomSnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }
}
