/** Room ids in `/api/rooms/:id/ws`. */
export const ROOM_ID_PATTERN = /^[a-z0-9-]{1,40}$/;

/** Plain-text keep-alive. The room answers without waking from hibernation. */
export const PING = 'ping';
export const PONG = 'pong';

/** Close code sent to an older socket when the same device connects again. */
export const CLOSE_REPLACED = 4000;

/** Phone → room. `hello` must be the first message and is the only place the device token is sent. */
export type ClientMessage = { type: 'hello'; token: string };

/** What one viewer may see of the room. Built per viewer by the worker. */
export interface RoomView {
  /** The viewer's own device id */
  you: string;
  /** Device ids connected right now, sorted */
  devices: string[];
}

export type ServerErrorCode = 'bad-message';

/** Room → phone. */
export type ServerMessage =
  { type: 'state'; view: RoomView } | { type: 'error'; code: ServerErrorCode };
