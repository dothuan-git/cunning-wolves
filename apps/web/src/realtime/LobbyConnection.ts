import type { RoomSummary } from '@werewolf/shared';
import { parseLobbyMessage } from './parse';
import {
  ReconnectingSocket,
  socketUrl,
  type ConnectionStatus,
  type SocketFactory,
} from './ReconnectingSocket';

export interface LobbySnapshot {
  status: ConnectionStatus;
  /** null until the first list arrives */
  rooms: RoomSummary[] | null;
}

/** The home screen's live room list. Public, so no token. */
export class LobbyConnection {
  private snapshot: LobbySnapshot = { status: 'connecting', rooms: null };
  private readonly listeners = new Set<(snapshot: LobbySnapshot) => void>();
  private readonly socket: ReconnectingSocket;

  constructor(
    url: string = socketUrl('/api/lobby/ws'),
    createSocket?: SocketFactory,
    random?: () => number,
  ) {
    this.socket = new ReconnectingSocket({
      url,
      createSocket,
      random,
      onMessage: (data) => {
        const message = parseLobbyMessage(data);
        if (!message) {
          console.error('Lobby sent a message this app does not understand', data);
          return false;
        }
        this.setSnapshot({ ...this.snapshot, rooms: message.rooms });
        return true;
      },
      onStatus: (status) => {
        this.setSnapshot({ ...this.snapshot, status });
      },
    });
  }

  getSnapshot(): LobbySnapshot {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: LobbySnapshot) => void): () => void {
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

  private setSnapshot(snapshot: LobbySnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }
}
