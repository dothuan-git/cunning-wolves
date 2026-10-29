import { describe, expect, it } from 'vitest';
import { LOCALES, MARKS, marksFor, ROLE_POOL } from '../src';

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
    expect(ids(marksFor('villager', ['villager', 'werewolf']))).toEqual(['sheriff']);
  });

  it("offers a holder's marks only to that holder", () => {
    const dealt = ['witch', 'villager', 'werewolf'];
    expect(ids(marksFor('witch', dealt))).toEqual(['sheriff', 'heal-used', 'kill-used']);
    expect(ids(marksFor('villager', dealt))).toEqual(['sheriff']);
  });

  it("offers a role's marks for others to anyone, while that role is dealt", () => {
    expect(ids(marksFor('werewolf', ['knight', 'werewolf']))).toEqual(['sheriff', 'rusted']);
    expect(ids(marksFor('werewolf', ['werewolf']))).toEqual(['sheriff']);
  });
});
