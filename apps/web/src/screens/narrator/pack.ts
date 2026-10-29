import { wakesWithWolves, type Phase, type PoolRole } from '@werewolf/shared';
import type { PlayerListItem, RoleGroupItem } from '../types';

export interface PackMember {
  player: PlayerListItem;
  role: PoolRole;
}

/**
 * Players who wake with the wolves without being on the wolf team: the White Werewolf, and anyone
 * a mark (cursed, turned, chose the wolves) has moved to the pack.
 */
export function packExtras(
  groups: readonly RoleGroupItem[],
  marks: Readonly<Record<string, Readonly<Record<string, Phase>>>>,
): PackMember[] {
  return groups
    .filter((group) => group.role.team !== 'werewolf')
    .flatMap((group) =>
      group.players
        .filter((player) =>
          wakesWithWolves(
            group.role.id,
            Object.hasOwn(marks, player.id) ? Object.keys(marks[player.id] ?? {}) : [],
          ),
        )
        .map((player) => ({ player, role: group.role })),
    );
}
