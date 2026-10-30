import type { Phase, PoolRole, RoomSummary } from '@werewolf/shared';

export type { Phase };

// Presentation props, not room state or wire messages.
export interface PlayerListItem {
  id: string;
  name: string;
}
/** A seated player on Setup, where the narrator can only hand over to someone online. */
export interface SeatedPlayerItem extends PlayerListItem {
  connected: boolean;
}
export interface RevealedPlayerItem extends PlayerListItem {
  role: PoolRole;
  /** The role a power gave them, when it differs from the dealt one */
  newRole?: PoolRole;
}
export interface JournalPhase {
  phase: Phase;
  notes: readonly (PlayerListItem & { text: string })[];
  deaths: readonly PlayerListItem[];
  /** Roles a power gave players in this phase */
  newRoles: readonly (PlayerListItem & { role: PoolRole })[];
}
/** A narrator panel: players dealt `role`, or those of them who now play `newRole`. */
export interface RoleGroupItem {
  /** The dealt role: it sets the panel's place and wake nights */
  role: PoolRole;
  /** The role a power gave these players; it sets the panel's faction color */
  newRole?: PoolRole;
  players: readonly PlayerListItem[];
}
/** The roles a narrator can give a player, when a role that changes roles is dealt. */
export interface RoleChoices {
  /** This game's roles, in setup order */
  inGame: readonly PoolRole[];
  /** Every other pool role */
  others: readonly PoolRole[];
}
/** A row of the home room list, as the Lobby sends it. */
export type RoomListItem = RoomSummary;
