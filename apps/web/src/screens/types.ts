import type { MarkDef, Phase, PoolRole, RoomSummary } from '@werewolf/shared';

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
  /** The marks they carried when the game ended */
  marks: readonly MarkDef[];
}
export interface JournalPhase {
  phase: Phase;
  notes: readonly (PlayerListItem & { text: string })[];
  deaths: readonly PlayerListItem[];
  /** Mark ids (see MARKS) made in this phase */
  marks: readonly (PlayerListItem & { mark: string })[];
  /** Roles a power gave players in this phase */
  newRoles: readonly (PlayerListItem & { role: PoolRole })[];
}
export interface GroupPlayerItem extends PlayerListItem {
  /** The role they were dealt, when a power gave them the group's role instead */
  dealt?: PoolRole;
}
export interface RoleGroupItem {
  role: PoolRole;
  players: readonly GroupPlayerItem[];
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
