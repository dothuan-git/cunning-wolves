import type { RoomSummary } from './api';
import type {
  CustomRoleInput,
  GameState,
  Phase,
  RoomRole,
  RoomSettings,
  RoomSetup,
  RoomStatus,
} from './types';

/** Room ids, as the create route makes them: in `/room/:id` and `/api/rooms/:id/ws`. */
export const ROOM_ID_PATTERN = /^[a-z0-9]{8}$/;

/** Plain-text keep-alive. Rooms and the lobby answer without waking from hibernation. */
export const PING = 'ping';
export const PONG = 'pong';

/** Close code sent to an older socket when the same device connects again. */
export const CLOSE_REPLACED = 4000;
/** Close code for a room that was never created, or has expired. */
export const CLOSE_ROOM_GONE = 4004;
/** Close code for a room the master deleted. */
export const CLOSE_ROOM_DELETED = 4005;

/**
 * Phone → room. `hello` must be the first message and is the only place the device token is sent.
 * The rest are actions: the room checks each against its rules and who sent it.
 */
export type ClientMessage =
  | { type: 'hello'; token: string }
  | { type: 'join'; name: string; pin: string }
  | { type: 'leave' }
  | { type: 'kick'; playerId: string }
  /** Makes a seated, online player the narrator; the master takes a seat */
  | { type: 'handOver'; playerId: string }
  | { type: 'setOpen'; open: boolean }
  | { type: 'addPick'; roleId: string }
  /** Takes one copy of the role out of the game */
  | { type: 'removePick'; roleId: string }
  /** The new rule replaces both languages for this room */
  | { type: 'editRule'; roleId: string; rule: string }
  | { type: 'addCustomRole'; role: CustomRoleInput }
  | { type: 'setWakeOrder'; order: string[] }
  | { type: 'setSettings'; settings: RoomSettings }
  /** Shows the rules to everyone; needs as many roles as players. Closes the room. */
  | { type: 'review' }
  | { type: 'backToSetup' }
  /** Shuffles the picks and deals one to each player */
  | { type: 'startGame' }
  /** Names the phase being ended, so a repeated hold can't skip a second one */
  | { type: 'endPhase'; phase: Phase }
  /** Marks a player dead in the current phase, or undoes it */
  | { type: 'toggleDeath'; playerId: string }
  /** Puts a mark (see MARKS) on a player in the current phase, or takes it off */
  | { type: 'toggleMark'; playerId: string; mark: string }
  /** The role a player plays now; null (or the dealt role) goes back to the dealt one */
  | { type: 'setRole'; playerId: string; roleId: string | null }
  /** Empty text removes the note */
  | { type: 'setNote'; night: number; playerId: string; text: string }
  /** Ends the game and shows everyone the summary */
  | { type: 'finishGame' }
  /** Back to Setup with the same players and card set */
  | { type: 'playAgain' }
  /** Deletes the room for everyone, in any state */
  | { type: 'deleteRoom' };

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
  setup: RoomSetup;
  /** The join PIN, for the master to read out; null for a room made before PINs */
  pin: string | null;
  /** Who holds which role; empty until the game starts */
  assignments: Assignment[];
  /** Phases, deaths, notes and marks; null until the game starts */
  game: GameState | null;
}

export interface Assignment {
  playerId: string;
  roleId: string;
}

/** One role in this game, with how many copies were picked. */
export interface GameRole {
  role: RoomRole;
  count: number;
}

/** What any other phone sees: the player list and its own seat, never other players' secrets. */
export interface PlayerView {
  kind: 'player';
  you: string;
  room: RoomInfo;
  players: PlayerInfo[];
  /** none: not joined yet; removed: kicked by the master */
  seat: 'none' | 'joined' | 'removed';
  /** The roles in this game with the room's rules: for a seated player once the rules are shown */
  roles: GameRole[];
  /** This player's own role, once the game starts; never anyone else's */
  card: RoomRole | null;
  /** Every player's role and the narrator's marks: only once the game is finished */
  reveal: Reveal | null;
}

/** What everyone sees after Finish game. */
export interface Reveal {
  assignments: Assignment[];
  game: GameState;
}

export type RoomView = MasterView | PlayerView;

export type ServerErrorCode =
  | 'bad-message'
  | 'name-invalid'
  | 'name-taken'
  | 'room-closed'
  | 'not-master'
  | 'not-allowed'
  | 'role-invalid'
  | 'pin-wrong'
  /** Too many wrong PINs for this room just now; try again in a minute */
  | 'pin-locked'
  | 'player-offline'
  /** The room couldn't finish the action; nothing changed */
  | 'try-again';

/** Room → phone. */
export type ServerMessage =
  { type: 'state'; view: RoomView } | { type: 'error'; code: ServerErrorCode };

/** Lobby → home screen: the whole list on connect and after every change. */
export interface LobbyMessage {
  type: 'rooms';
  rooms: RoomSummary[];
}
