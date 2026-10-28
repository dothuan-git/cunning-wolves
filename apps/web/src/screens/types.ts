import type { PoolRole, RoomSummary } from '@werewolf/shared';

// Presentation props, not room state or wire messages.
export interface PlayerListItem {
  id: string;
  name: string;
}
export interface RevealedPlayerItem extends PlayerListItem {
  role: PoolRole;
}
export interface Phase {
  kind: 'night' | 'morning';
  number: number;
}
export interface JournalPhase {
  phase: Phase;
  notes: readonly (PlayerListItem & { text: string })[];
  deaths: readonly PlayerListItem[];
}
export interface RoleGroupItem {
  role: PoolRole;
  players: readonly PlayerListItem[];
}
/** A row of the home room list, as the Lobby sends it. */
export type RoomListItem = RoomSummary;
