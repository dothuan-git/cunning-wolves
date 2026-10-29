import { CLOSE_REPLACED, CLOSE_ROOM_DELETED, CLOSE_ROOM_GONE, PING, PONG } from '@werewolf/shared';
import { reconnectDelay } from './backoff';

const PING_INTERVAL_MS = 25_000;
const PONG_TIMEOUT_MS = 10_000;

/**
 * `replaced`: the same phone connected elsewhere; `gone`: the room doesn't exist (any more);
 * `deleted`: the narrator deleted it.
 */
export type ConnectionStatus =
  'connecting' | 'connected' | 'reconnecting' | 'replaced' | 'gone' | 'deleted';

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
    console.warn('Socket error', url);
  };
  return ws;
};

/** `ws(s)://<this host><path>` */
export function socketUrl(
  path: string,
  location: Pick<Location, 'protocol' | 'host'> = window.location,
): string {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}${path}`;
}

export interface ReconnectingSocketOptions {
  url: string;
  /** Runs on every new socket before anything else, e.g. to say hello */
  onOpen?: (send: (data: string) => void) => void;
  /** Handles one message; returns true when it shows the connection is fully up */
  onMessage: (data: unknown) => boolean;
  onStatus: (status: ConnectionStatus) => void;
  createSocket?: SocketFactory;
  random?: () => number;
}

/**
 * A WebSocket that stays up: it keeps the socket alive with pings and reconnects with backoff
 * until stopped, or until the server closes it for good (replaced, or the room is gone).
 */
export class ReconnectingSocket {
  private status: ConnectionStatus = 'connecting';
  private socket: SocketLike | null = null;
  private attempt = 0;
  private everConnected = false;
  private stopped = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly createSocket: SocketFactory;
  private readonly random: () => number;

  constructor(private readonly options: ReconnectingSocketOptions) {
    this.createSocket = options.createSocket ?? openBrowserSocket;
    this.random = options.random ?? Math.random;
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

  /** Sends on the open socket; false when there is none right now. */
  send(data: string): boolean {
    if (!this.socket) return false;
    this.socket.send(data);
    return true;
  }

  /**
   * Call when the network comes back or the page becomes visible again (screen unlock).
   * Reconnects now if waiting, or checks that a connected socket is still alive.
   */
  wake(): void {
    if (this.stopped || this.isFinal()) return;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      this.attempt = 0;
      this.connect();
    } else if (this.status === 'connected') {
      this.ping();
    }
  }

  /** The server closed this socket for good; nothing reconnects it. */
  private isFinal(): boolean {
    return this.status === 'replaced' || this.status === 'gone' || this.status === 'deleted';
  }

  private connect(): void {
    this.setStatus(this.everConnected || this.attempt > 0 ? 'reconnecting' : 'connecting');
    const handlers: SocketHandlers = {
      open: () => {
        if (this.socket !== socket) return;
        this.options.onOpen?.((data) => {
          socket.send(data);
        });
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
        if (code === CLOSE_REPLACED) this.setStatus('replaced');
        else if (code === CLOSE_ROOM_GONE) this.setStatus('gone');
        else if (code === CLOSE_ROOM_DELETED) this.setStatus('deleted');
        else this.scheduleReconnect();
      },
    };
    const socket = this.createSocket(this.options.url, handlers);
    this.socket = socket;
  }

  private receive(data: unknown): void {
    if (data === PONG) {
      if (this.pongTimer !== null) clearTimeout(this.pongTimer);
      this.pongTimer = null;
      return;
    }
    if (this.options.onMessage(data)) {
      this.attempt = 0;
      this.everConnected = true;
      this.setStatus('connected');
    }
  }

  private ping(): void {
    if (this.pongTimer !== null) return;
    this.socket?.send(PING);
    // A socket can die silently while the screen is locked; no pong in time means start over.
    this.pongTimer = setTimeout(() => {
      this.pongTimer = null;
      console.warn('Socket missed a pong; reconnecting', this.options.url);
      this.clearTimers();
      this.dropSocket(4001);
      this.scheduleReconnect();
    }, PONG_TIMEOUT_MS);
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.setStatus('reconnecting');
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
      console.warn('Closing the socket failed', error);
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

  private setStatus(status: ConnectionStatus): void {
    if (status === this.status) return;
    this.status = status;
    this.options.onStatus(status);
  }
}
