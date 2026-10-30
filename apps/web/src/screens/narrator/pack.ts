import { wakesWithWolves, type PoolRole } from '@werewolf/shared';
import type { PlayerListItem, RoleGroupItem } from '../types';

export interface PackMember {
  player: PlayerListItem;
  role: PoolRole;
}

/** Players who wake with the wolves without being on the wolf team: the White and Lone Wolf. */
export function packExtras(groups: readonly RoleGroupItem[]): PackMember[] {
  return groups
    .filter((group) => group.role.team !== 'werewolf' && wakesWithWolves(group.role.id))
    .flatMap((group) => group.players.map((player) => ({ player, role: group.role })));
}
