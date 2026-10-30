import type { PoolRole } from '@werewolf/shared';
import type { PlayerListItem, RoleGroupItem } from '../types';

export interface Holder {
  player: PlayerListItem;
  /** The role they play now; the dealt one unless a power changed it */
  playing: PoolRole;
}

/**
 * The panels for the players dealt `role`: one for those still playing it, then one per new role
 * in the order first given. A panel whose every player changed role keeps its place under the new
 * title, so a lone holder's panel changes in place.
 */
export function roleGroups(role: PoolRole, holders: readonly Holder[]): RoleGroupItem[] {
  const unchanged = holders.filter(({ playing }) => playing.id === role.id);
  const changed = [
    ...new Map(
      holders
        .filter(({ playing }) => playing.id !== role.id)
        .map(({ playing }) => [playing.id, playing]),
    ).values(),
  ];
  const plain: RoleGroupItem[] =
    unchanged.length > 0 || changed.length === 0
      ? [{ role, players: unchanged.map(({ player }) => player) }]
      : [];
  return [
    ...plain,
    ...changed.map((newRole) => ({
      role,
      newRole,
      players: holders
        .filter(({ playing }) => playing.id === newRole.id)
        .map(({ player }) => player),
    })),
  ];
}

/** A key that tells a split-off panel from its dealt role's own. */
export function groupKey(group: RoleGroupItem): string {
  return group.newRole ? `${group.role.id}>${group.newRole.id}` : group.role.id;
}
