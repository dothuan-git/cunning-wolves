import { describe, expect, it } from 'vitest';
import { LOCALES, MARKS, marksFor, ROLE_POOL, wakesWithWolves } from '../src';

const ids = (list: readonly { id: string }[]) => list.map((mark) => mark.id);

describe('MARKS', () => {
  it('has unique kebab-case ids and a label in every locale', () => {
    expect(new Set(ids(MARKS)).size).toBe(MARKS.length);
    for (const mark of MARKS) {
      expect(mark.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      for (const locale of LOCALES) expect(mark.label[locale].trim(), mark.id).not.toBe('');
    }
  });

  it('comes only from pool roles, and a holders-only mark names its roles', () => {
    const pool = new Set(ids(ROLE_POOL));
    for (const mark of MARKS) {
      for (const roleId of mark.from) expect(pool.has(roleId), `${mark.id}: ${roleId}`).toBe(true);
      if (mark.holdersOnly) expect(mark.from.length, mark.id).toBeGreaterThan(0);
    }
  });
});

describe('marksFor', () => {
  it('offers marks with no source role in every game', () => {
    expect(ids(marksFor('villager', ['villager', 'werewolf']))).toEqual(['sheriff', 'town-crier']);
  });

  it("offers a holder's marks only to that holder", () => {
    const dealt = ['witch', 'villager', 'werewolf'];
    expect(ids(marksFor('witch', dealt))).toEqual([
      'sheriff',
      'town-crier',
      'heal-used',
      'kill-used',
    ]);
    expect(ids(marksFor('villager', dealt))).toEqual(['sheriff', 'town-crier']);
  });

  it("offers a role's marks for others to anyone, while that role is dealt", () => {
    expect(ids(marksFor('werewolf', ['knight', 'werewolf']))).toEqual([
      'sheriff',
      'town-crier',
      'rusted',
    ]);
    expect(ids(marksFor('werewolf', ['werewolf']))).toEqual(['sheriff', 'town-crier']);
  });

  it('offers the third-faction marks only while their role is dealt', () => {
    const dealt = ['cupid', 'cursed-wolf-father', 'pied-piper', 'wild-child', 'villager'];
    expect(ids(marksFor('villager', dealt))).toEqual([
      'sheriff',
      'town-crier',
      'lover',
      'role-model',
      'cursed',
      'charmed',
    ]);
    expect(ids(marksFor('villager', ['villager']))).not.toContain('lover');
  });

  it('gives the pack marks to the roles that use them, and only to them', () => {
    expect(ids(marksFor('wild-child', ['wild-child']))).toContain('turned');
    expect(ids(marksFor('wolf-hound', ['wolf-hound']))).toContain('chose-wolves');
    expect(ids(marksFor('villager', ['wild-child', 'wolf-hound']))).not.toContain('turned');
    expect(ids(marksFor('villager', ['wild-child', 'wolf-hound']))).not.toContain('chose-wolves');
  });
});

describe('wakesWithWolves', () => {
  it('is true for the White Werewolf, and for anyone marked into the pack', () => {
    expect(wakesWithWolves('white-werewolf', [])).toBe(true);
    expect(wakesWithWolves('villager', ['cursed'])).toBe(true);
    expect(wakesWithWolves('wild-child', ['role-model', 'turned'])).toBe(true);
    expect(wakesWithWolves('wolf-hound', ['chose-wolves'])).toBe(true);
  });

  it('is false for a mark that does not move anyone', () => {
    expect(wakesWithWolves('villager', [])).toBe(false);
    expect(wakesWithWolves('villager', ['sheriff', 'lover', 'charmed'])).toBe(false);
    expect(wakesWithWolves('wild-child', ['role-model'])).toBe(false);
  });
});
