import type { PoolRole, Team } from '@werewolf/shared';

/**
 * The picked roles' balance values added up, one per copy, or only `team`'s roles when given.
 * A custom role has no value and counts as 0.
 */
export function pickedBalance(
  roles: readonly PoolRole[],
  picks: readonly string[],
  team?: Team,
): number {
  let total = 0;
  for (const id of picks) {
    const role = roles.find((known) => known.id === id);
    if (role && (team === undefined || role.team === team)) total += role.balance ?? 0;
  }
  return total;
}
