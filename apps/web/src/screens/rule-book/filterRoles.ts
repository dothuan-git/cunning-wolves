import { nameKey, type PoolRole } from '@werewolf/shared';

/** Roles whose Vietnamese or English name contains the query, ignoring accents and case. */
export function filterRoles(roles: readonly PoolRole[], search: string): readonly PoolRole[] {
  const query = nameKey(search);
  if (!query) return roles;
  return roles.filter(
    (role) => nameKey(role.name.vi).includes(query) || nameKey(role.name.en).includes(query),
  );
}
