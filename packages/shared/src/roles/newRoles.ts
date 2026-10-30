import type { GameState } from '../types';

/** Roles that wake with the wolves although they are not on the wolf team. */
export const PACK_ROLES: readonly string[] = ['white-werewolf', 'lone-wolf'];

/**
 * Roles whose power gives a player another role; while one is dealt, the narrator can set it. The
 * roles that turn someone into a wolf are here too: the narrator gives that player the Werewolf.
 */
export const ROLE_CHANGERS: readonly string[] = [
  'thief',
  'doppelganger',
  'devoted-servant',
  'drunk',
  'apprentice-seer',
  'bailiff',
  'angel',
  'dream-wolf',
  'wild-child',
  'wolf-hound',
  'cursed',
  'cursed-wolf-father',
  'alpha-wolf',
];

/** Whether the narrator can give players another role in a game where `dealt` are dealt. */
export function offersNewRoles(dealt: readonly string[]): boolean {
  return ROLE_CHANGERS.some((id) => dealt.includes(id));
}

/** The role a player plays now: the one a power gave them, else the one they were dealt. */
export function currentRole(
  playerId: string,
  dealtRole: string,
  newRoles: GameState['newRoles'],
): string {
  return Object.hasOwn(newRoles, playerId) ? (newRoles[playerId]?.role ?? dealtRole) : dealtRole;
}

/** Whether a player playing `roleId` wakes with the wolves without being on the wolf team. */
export function wakesWithWolves(roleId: string): boolean {
  return PACK_ROLES.includes(roleId);
}
