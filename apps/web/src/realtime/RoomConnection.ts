import {
  CLOSE_REPLACED,
  PING,
  PONG,
  type ClientMessage,
  type RoomView,
  type ServerMessage,
} from '@werewolf/shared';
import { reconnectDelay } from './backoff';

const PING_INTERVAL_MS = 25_000;
const PONG_TIMEOUT_MS = 10_000;

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'replaced';

export interface RoomSnapshot {
  status: ConnectionStatus;
  /** Last view the room sent; kept while reconnecting so the screen doesn't go blank */
  view: RoomView | null;
}

export interface SocketHandlers {
  open: () => void;
  message: (data: unknown) => void;
  close: (code: number) => void;
}

export interface SocketLike {
  send: (data: string) => void;
  close: (code?: number, reason?: string) => void;
}

export type SocketFactory = (url: string, handlers: SocketHandlers) => SocketLike;

export const openBrowserSocket: SocketFactory = (url, handlers) => {
  const ws = new WebSocket(url);
  ws.onopen = () => {
    handlers.open();
  };
  ws.onmessage = (event) => {
    handlers.message(event.data);
  };
  ws.onclose = (event) => {
    handlers.close(event.code);
  };
  // An error is always followed by close, which handles the reconnect.
  ws.onerror = () => {
    console.warn('Room socket error', url);
  };
  return ws;
};

/** `ws(s)://<this host>/api/rooms/<id>/ws` */
export function roomSocketUrl(
  roomId: string,
  location: Pick<Location, 'protocol' | 'host'> = window.location,
): string {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}/api/rooms/${encodeURIComponent(roomId)}/ws`;
}

export function parseServerMessage(data: unknown): ServerMessage | null {
  if (typeof data !== 'string') return null;
  let message: unknown;
  try {
    message = JSON.parse(data);
  } catch {
    return null;
  }
  if (typeof message !== 'object' || message === null || !('type' in message)) return null;
  if (message.type === 'error' && 'code' in message && message.code === 'bad-message') {
    return { type: 'error', code: message.code };
  }
  if (message.type === 'state' && 'view' in message && isRoomView(message.view)) {
    return { type: 'state', view: message.view };
  }
  return null;
}

function isRoomView(value: unknown): value is RoomView {
  return (
    typeof value === 'object' &&
    value !== null &&
    'you' in value &&
    typeof value.you === 'string' &&
    'devices' in value &&
    Array.isArray(value.devices) &&
    value.devices.every((id) => typeof id === 'string')
  );
}

/**
 * One phone's connection to a room. Says hello with the device token, keeps the socket alive with
 * pings, and reconnects with backoff until stopped or replaced by the same device elsewhere.
 */
export class RoomConnection {
  private snapshot: RoomSnapshot = { status: 'connecting', view: null };
  private readonly listeners = new Set<(snapshot: RoomSnapshot) => void>();
  private socket: SocketLike | null = null;
  private attempt = 0;
  private stopped = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly createSocket: SocketFactory = openBrowserSocket,
    private readonly random: () => number = Math.random,
  ) {}

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
    if (!this.stopped) return;
    this.stopped = false;
    this.attempt = 0;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    this.dropSocket(1000);
  }

  /**
   * Call when the network comes back or the page becomes visible again (screen unlock).
   * Reconnects now if waiting, or checks that a connected socket is still alive.
   */
  wake(): void {
    if (this.stopped || this.snapshot.status === 'replaced') return;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      this.attempt = 0;
      this.connect();
    } else if (this.snapshot.status === 'connected') {
      this.ping();
    }
  }

  private connect(): void {
    this.setSnapshot({
      ...this.snapshot,
      status: this.snapshot.view || this.attempt > 0 ? 'reconnecting' : 'connecting',
    });
    const handlers: SocketHandlers = {
      open: () => {
        if (this.socket !== socket) return;
        this.send({ type: 'hello', token: this.token });
        this.pingTimer = setInterval(() => {
          this.ping();
        }, PING_INTERVAL_MS);
      },
      message: (data) => {
        if (this.socket === socket) this.receive(data);
      },
      close: (code) => {
        if (this.socket !== socket) return;
        this.socket = null;
        this.clearTimers();
        if (code === CLOSE_REPLACED) {
          this.setSnapshot({ ...this.snapshot, status: 'replaced' });
        } else {
          this.scheduleReconnect();
        }
      },
    };
    const socket = this.createSocket(this.url, handlers);
    this.socket = socket;
  }

  private receive(data: unknown): void {
    if (data === PONG) {
      if (this.pongTimer !== null) clearTimeout(this.pongTimer);
      this.pongTimer = null;
      return;
    }
    const message = parseServerMessage(data);
    if (!message) {
      console.error('Room sent a message this app does not understand', data);
      return;
    }
    if (message.type === 'error') {
      console.error('Room rejected a message', message.code);
      return;
    }
    this.attempt = 0;
    this.setSnapshot({ status: 'connected', view: message.view });
  }

  private ping(): void {
    if (this.pongTimer !== null) return;
    this.socket?.send(PING);
    // A socket can die silently while the screen is locked; no pong in time means start over.
    this.pongTimer = setTimeout(() => {
      this.pongTimer = null;
      console.warn('Room socket missed a pong; reconnecting');
      this.clearTimers();
      this.dropSocket(4001);
      this.scheduleReconnect();
    }, PONG_TIMEOUT_MS);
  }

  private send(message: ClientMessage): void {
    this.socket?.send(JSON.stringify(message));
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.setSnapshot({ ...this.snapshot, status: 'reconnecting' });
    const delay = reconnectDelay(this.attempt, this.random);
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /** Forgets the current socket so its late events are ignored, then closes it. */
  private dropSocket(code: number): void {
    const socket = this.socket;
    this.socket = null;
    try {
      socket?.close(code);
    } catch (error) {
      console.warn('Closing the room socket failed', error);
    }
  }

  private clearTimers(): void {
    for (const timer of [this.reconnectTimer, this.pongTimer]) {
      if (timer !== null) clearTimeout(timer);
    }
    if (this.pingTimer !== null) clearInterval(this.pingTimer);
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.pongTimer = null;
  }

  private setSnapshot(snapshot: RoomSnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }
}
