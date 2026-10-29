import { ROLE_POOL, type PoolRole } from '@werewolf/shared';
import { describe, expect, it } from 'vitest';
import { packExtras } from '../../src/screens/narrator/pack';

const role = (id: string): PoolRole => {
  const found = ROLE_POOL.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no pool role ${id}`);
  return found;
};
const NIGHT_1 = { kind: 'night', number: 1 } as const;

const groups = [
  { role: role('werewolf'), players: [{ id: 'w', name: 'Wolf' }] },
  { role: role('white-werewolf'), players: [{ id: 'ww', name: 'White' }] },
  { role: role('wolf-hound'), players: [{ id: 'h', name: 'Hound' }] },
  {
    role: role('villager'),
    players: [
      { id: 'v', name: 'Vi' },
      { id: 'c', name: 'Cursed' },
    ],
  },
];

describe('packExtras', () => {
  it('lists the White Werewolf, who wakes with the wolves, and nobody else without marks', () => {
    expect(packExtras(groups, {}).map(({ player }) => player.id)).toEqual(['ww']);
  });

  it('adds players a mark moved to the pack, with their own role', () => {
    const extras = packExtras(groups, {
      h: { 'chose-wolves': NIGHT_1 },
      c: { cursed: NIGHT_1 },
      v: { sheriff: NIGHT_1 },
    });
    expect(extras.map(({ player, role: own }) => [player.id, own.id])).toEqual([
      ['ww', 'white-werewolf'],
      ['h', 'wolf-hound'],
      ['c', 'villager'],
    ]);
  });

  it('leaves wolves alone: they are in the pack already', () => {
    expect(packExtras(groups, { w: { cursed: NIGHT_1 } }).map(({ player }) => player.id)).toEqual([
      'ww',
    ]);
  });

  it('reads a player id that is also an object key as a plain id', () => {
    const odd = [{ role: role('villager'), players: [{ id: '__proto__', name: 'Odd' }] }];
    expect(packExtras(odd, {})).toEqual([]);
  });
});
