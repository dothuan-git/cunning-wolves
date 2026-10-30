import { ROLE_POOL, type PoolRole } from '@werewolf/shared';
import { describe, expect, it } from 'vitest';
import { packExtras } from '../../src/screens/narrator/pack';

const role = (id: string): PoolRole => {
  const found = ROLE_POOL.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no pool role ${id}`);
  return found;
};

const groups = [
  { role: role('werewolf'), players: [{ id: 'w', name: 'Wolf' }] },
  { role: role('white-werewolf'), players: [{ id: 'ww', name: 'White' }] },
  { role: role('lone-wolf'), players: [{ id: 'lw', name: 'Lone' }] },
  { role: role('wolf-hound'), players: [{ id: 'h', name: 'Hound' }] },
  { role: role('villager'), players: [{ id: 'v', name: 'Vi' }] },
];

describe('packExtras', () => {
  it('lists the White Werewolf and the Lone Wolf, with their own role, and nobody else', () => {
    expect(packExtras(groups).map(({ player, role: own }) => [player.id, own.id])).toEqual([
      ['ww', 'white-werewolf'],
      ['lw', 'lone-wolf'],
    ]);
  });

  it('is empty when neither is in the game', () => {
    const plain = groups.filter(
      (group) => !['white-werewolf', 'lone-wolf'].includes(group.role.id),
    );
    expect(packExtras(plain)).toEqual([]);
  });
});
