import type { RoomSummary } from './api';
import type { RoomStatus } from './types';

/** Room ids in `/api/rooms/:id/ws`. */
export const ROOM_ID_PATTERN = /^[a-z0-9-]{1,40}$/;

/** Plain-text keep-alive. Rooms and the lobby answer without waking from hibernation. */
export const PING = 'ping';
export const PONG = 'pong';

/** Close code sent to an older socket when the same device connects again. */
export const CLOSE_REPLACED = 4000;
/** Close code for a room that was never created, or has expired. */
export const CLOSE_ROOM_GONE = 4004;

/**
 * Phone → room. `hello` must be the first message and is the only place the device token is sent.
 * The rest are actions: the room checks each against its rules and who sent it.
 */
export type ClientMessage =
  | { type: 'hello'; token: string }
  | { type: 'join'; name: string }
  | { type: 'leave' }
  | { type: 'kick'; playerId: string }
  | { type: 'setOpen'; open: boolean };

export type RoomAction = Exclude<ClientMessage, { type: 'hello' }>;

export interface RoomInfo {
  id: string;
  name: string;
  status: RoomStatus;
  /** Whether new players can join */
  open: boolean;
}

export interface PlayerInfo {
  /** Device id */
  id: string;
  name: string;
  /** Has an open connection to the room right now */
  connected: boolean;
}

/** What the room master sees. */
export interface MasterView {
  kind: 'master';
  you: string;
  room: RoomInfo;
  players: PlayerInfo[];
}

/** What any other phone sees: the player list and its own seat, never other players' secrets. */
export interface PlayerView {
  kind: 'player';
  you: string;
  room: RoomInfo;
  players: PlayerInfo[];
  /** none: not joined yet; removed: kicked by the master */
  seat: 'none' | 'joined' | 'removed';
}

export type RoomView = MasterView | PlayerView;

export type ServerErrorCode =
  'bad-message' | 'name-invalid' | 'name-taken' | 'room-closed' | 'not-master' | 'not-allowed';

/** Room → phone. */
export type ServerMessage =
  { type: 'state'; view: RoomView } | { type: 'error'; code: ServerErrorCode };

/** Lobby → home screen: the whole list on connect and after every change. */
export interface LobbyMessage {
  type: 'rooms';
  rooms: RoomSummary[];
}
