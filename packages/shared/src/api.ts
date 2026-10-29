import type { RoomStatus } from './types';

/** POST /api/rooms. The token goes in the body, never the URL. */
export interface CreateRoomRequest {
  token: string;
  /** The master's own name */
  name: string;
  roomName: string;
  /** Four digits players type to join */
  pin: string;
}

export interface CreateRoomResponse {
  id: string;
}

/** One row of the home room list. Public: anyone can see it. */
export interface RoomSummary {
  id: string;
  name: string;
  /** The master's name */
  master: string;
  /** Players with a seat */
  count: number;
  status: RoomStatus;
  isOpen: boolean;
}
