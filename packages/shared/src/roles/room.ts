import type { RoomRole, RoomSettings, RoomSetup } from '../types';
import { ROLE_POOL } from './pool';

export const ROLE_NAME_MAX = 32;
export const RULE_MAX = 500;
/** Role copies in one game */
export const PICKS_MAX = 40;
export const CUSTOM_ROLES_MAX = 20;
export const TIMER_MAX = 3600;
export const DEFAULT_SETTINGS: RoomSettings = { timerSeconds: 120, soundOn: false };

// Waking custom roles come after every pool role by default, in the order they were made.
const CUSTOM_WAKE_START = 1000;

/**
 * Like cleanName, but keeps line breaks (at most one blank line in a row), since a rule can have
 * paragraphs.
 */
export function cleanRule(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/(?!\n)\p{C}/gu, '')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** The roles this room can pick from: the pool with the room's rule edits, then custom roles. */
export function roomRoles(setup: Pick<RoomSetup, 'ruleEdits' | 'customRoles'>): RoomRole[] {
  // hasOwn, so a role id can never pick up something like `constructor` from the prototype.
  const ruleFor = (id: string, fallback: RoomRole['rule']): RoomRole['rule'] => {
    const edit = Object.hasOwn(setup.ruleEdits, id) ? setup.ruleEdits[id] : undefined;
    return edit === undefined ? fallback : { vi: edit, en: edit };
  };
  const pool = ROLE_POOL.map((role) => ({
    ...role,
    rule: ruleFor(role.id, role.rule),
    custom: false,
  }));
  const custom = setup.customRoles.map((role, index) => ({
    id: role.id,
    name: { vi: role.name, en: role.name },
    rule: ruleFor(role.id, { vi: role.rule, en: role.rule }),
    team: role.team,
    defaultWakeOrder: role.wakes ? CUSTOM_WAKE_START + index : null,
    image: '',
    custom: true,
  }));
  return [...pool, ...custom];
}

/**
 * The picked roles that wake, in the order the narrator will wake them: the room's chosen order
 * first, then any others by their default order.
 */
export function wakingOrder<Role extends Pick<RoomRole, 'id' | 'defaultWakeOrder'>>(
  roles: readonly Role[],
  picks: readonly string[],
  wakeOrder: readonly string[],
): Role[] {
  const place = (role: Role) => {
    const index = wakeOrder.indexOf(role.id);
    return index < 0 ? wakeOrder.length + (role.defaultWakeOrder ?? 0) : index;
  };
  return roles
    .filter((role) => role.defaultWakeOrder !== null && picks.includes(role.id))
    .sort((a, b) => place(a) - place(b));
}
