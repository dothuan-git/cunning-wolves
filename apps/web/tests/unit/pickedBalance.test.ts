import { ROLE_POOL, type PoolRole } from '@werewolf/shared';
import { describe, expect, it } from 'vitest';
import { signedBalance } from '../../src/design/balance';
import { pickedBalance } from '../../src/screens/setup/pickedBalance';

const custom: PoolRole = {
  id: 'custom-0',
  name: { vi: 'Baker', en: 'Baker' },
  rule: { vi: 'Bakes.', en: 'Bakes.' },
  team: 'village',
  defaultWakeOrder: null,
  wakeNights: 'every',
  image: '',
  balance: null,
};
const roles = [...ROLE_POOL, custom];
// Werewolf −6, Seer +7, Villager +1, Vampire −8 (solo).
const picks = ['werewolf', 'werewolf', 'seer', 'villager', 'villager', 'vampire', 'custom-0'];

describe('pickedBalance', () => {
  it('adds up every copy of every picked role', () => {
    expect(pickedBalance(roles, picks)).toBe(-6 - 6 + 7 + 1 + 1 - 8);
  });

  it("adds up one faction's roles only", () => {
    expect(pickedBalance(roles, picks, 'werewolf')).toBe(-12);
    expect(pickedBalance(roles, picks, 'village')).toBe(9);
    expect(pickedBalance(roles, picks, 'solo')).toBe(-8);
  });

  it('counts a custom role, and nothing at all, as 0', () => {
    expect(pickedBalance(roles, ['custom-0'])).toBe(0);
    expect(pickedBalance(roles, [])).toBe(0);
  });
});

describe('signedBalance', () => {
  it('writes the sign the way the cards print it', () => {
    expect(signedBalance(7)).toBe('+7');
    expect(signedBalance(-6)).toBe('−6');
    expect(signedBalance(0)).toBe('0');
  });
});
