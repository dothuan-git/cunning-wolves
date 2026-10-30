import { describe, expect, it } from 'vitest';
import { currentRole, offersNewRoles, ROLE_CHANGERS, ROLE_POOL, wakesWithWolves } from '../src';

describe('ROLE_CHANGERS', () => {
  it('names only pool roles', () => {
    const pool = new Set(ROLE_POOL.map((role) => role.id));
    for (const roleId of ROLE_CHANGERS) expect(pool.has(roleId), roleId).toBe(true);
  });

  it('includes the roles that turn a player into a wolf', () => {
    for (const roleId of ['wild-child', 'wolf-hound', 'cursed', 'cursed-wolf-father', 'alpha-wolf'])
      expect(ROLE_CHANGERS, roleId).toContain(roleId);
  });
});

describe('offersNewRoles', () => {
  it('is true while a role that changes roles is dealt', () => {
    expect(offersNewRoles(['villager', 'wild-child'])).toBe(true);
    expect(offersNewRoles(['thief', 'werewolf'])).toBe(true);
  });

  it('is false in a game without one', () => {
    expect(offersNewRoles(['villager', 'werewolf', 'seer'])).toBe(false);
    expect(offersNewRoles([])).toBe(false);
  });
});

describe('currentRole', () => {
  it('is the new role when the narrator gave one, else the dealt role', () => {
    const newRoles = { p1: { role: 'werewolf', phase: { kind: 'night', number: 2 } as const } };
    expect(currentRole('p1', 'wild-child', newRoles)).toBe('werewolf');
    expect(currentRole('p2', 'villager', newRoles)).toBe('villager');
  });

  it('ignores inherited keys', () => {
    expect(currentRole('toString', 'villager', {})).toBe('villager');
  });
});

describe('wakesWithWolves', () => {
  it('is true for the White Werewolf and the Lone Wolf only', () => {
    expect(wakesWithWolves('white-werewolf')).toBe(true);
    expect(wakesWithWolves('lone-wolf')).toBe(true);
    expect(wakesWithWolves('wild-child')).toBe(false);
    expect(wakesWithWolves('villager')).toBe(false);
  });
});
