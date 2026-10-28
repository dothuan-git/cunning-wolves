import { describe, expect, it } from 'vitest';
import { cleanRule, gameRoles, ROLE_POOL, roomRoles, wakingOrder, type CustomRole } from '../src';

const wolfHelper: CustomRole = {
  id: 'custom-0',
  name: 'Wolf Helper',
  rule: 'Knows the wolves.',
  team: 'werewolf',
  wakes: true,
};
const baker: CustomRole = {
  id: 'custom-1',
  name: 'Baker',
  rule: 'Bakes.',
  team: 'village',
  wakes: false,
};

describe('roomRoles', () => {
  it('is the pool as is when nothing was edited', () => {
    const roles = roomRoles({ ruleEdits: {}, customRoles: [] });
    expect(roles.map((role) => role.id)).toEqual(ROLE_POOL.map((role) => role.id));
    expect(roles.every((role) => !role.custom)).toBe(true);
    expect(roles.find((role) => role.id === 'seer')?.rule).toEqual(
      ROLE_POOL.find((role) => role.id === 'seer')?.rule,
    );
  });

  it('shows an edited rule in both languages', () => {
    const seer = roomRoles({ ruleEdits: { seer: 'Sees one card.' }, customRoles: [] }).find(
      (role) => role.id === 'seer',
    );
    expect(seer?.rule).toEqual({ vi: 'Sees one card.', en: 'Sees one card.' });
  });

  it('adds custom roles after the pool, in both languages', () => {
    const roles = roomRoles({ ruleEdits: { 'custom-1': 'Bakes bread.' }, customRoles: [baker] });
    expect(roles.at(-1)).toMatchObject({
      id: 'custom-1',
      name: { vi: 'Baker', en: 'Baker' },
      rule: { vi: 'Bakes bread.', en: 'Bakes bread.' },
      team: 'village',
      defaultWakeOrder: null,
      custom: true,
    });
  });
});

describe('wakingOrder', () => {
  const roles = roomRoles({ ruleEdits: {}, customRoles: [wolfHelper, baker] });
  const ids = (list: readonly { id: string }[]) => list.map((role) => role.id);

  it('keeps only picked roles that wake, by default order', () => {
    const picks = ['villager', 'witch', 'werewolf', 'werewolf', 'seer', 'custom-1'];
    expect(ids(wakingOrder(roles, picks, []))).toEqual(['seer', 'werewolf', 'witch']);
  });

  it('puts waking custom roles after the pool roles', () => {
    expect(ids(wakingOrder(roles, ['custom-0', 'seer'], []))).toEqual(['seer', 'custom-0']);
  });

  it("follows the room's order first, then the rest by default", () => {
    const picks = ['seer', 'werewolf', 'witch', 'fox'];
    expect(ids(wakingOrder(roles, picks, ['witch', 'seer']))).toEqual([
      'witch',
      'seer',
      'fox',
      'werewolf',
    ]);
  });
});

describe('gameRoles', () => {
  it('counts each picked role once, with the room rule, and leaves out the rest', () => {
    const game = gameRoles({
      picks: ['werewolf', 'custom-1', 'werewolf', 'seer'],
      ruleEdits: { seer: 'Sees one card.' },
      customRoles: [wolfHelper, baker],
    });
    expect(game.map(({ role, count }) => [role.id, count])).toEqual([
      ['seer', 1],
      ['werewolf', 2],
      ['custom-1', 1],
    ]);
    expect(game[0]?.role.rule).toEqual({ vi: 'Sees one card.', en: 'Sees one card.' });
  });

  it('is empty when nothing is picked', () => {
    expect(gameRoles({ picks: [], ruleEdits: {}, customRoles: [] })).toEqual([]);
  });
});

describe('cleanRule', () => {
  it('keeps paragraphs but trims spaces and extra blank lines', () => {
    expect(cleanRule('  One  rule.\r\n\r\n\r\n  Two\tlines. ')).toBe('One rule.\n\nTwo lines.');
  });

  it('drops invisible and control characters', () => {
    expect(cleanRule('Se​es‮.')).toBe('Sees.');
  });
});
