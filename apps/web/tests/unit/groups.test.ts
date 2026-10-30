import { ROLE_POOL, type PoolRole } from '@werewolf/shared';
import { describe, expect, it } from 'vitest';
import { groupKey, roleGroups } from '../../src/screens/narrator/groups';

const role = (id: string): PoolRole => {
  const found = ROLE_POOL.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no pool role ${id}`);
  return found;
};
const holder = (id: string, playing: string) => ({
  player: { id, name: id },
  playing: role(playing),
});
const summary = (groups: ReturnType<typeof roleGroups>) =>
  groups.map((group) => [groupKey(group), group.players.map((player) => player.id)]);

describe('roleGroups', () => {
  it('keeps one panel while nobody changed role', () => {
    const villager = role('villager');
    expect(
      summary(roleGroups(villager, [holder('a', 'villager'), holder('b', 'villager')])),
    ).toEqual([['villager', ['a', 'b']]]);
  });

  it("changes a lone holder's panel in place", () => {
    const groups = roleGroups(role('wild-child'), [holder('a', 'werewolf')]);
    expect(summary(groups)).toEqual([['wild-child>werewolf', ['a']]]);
    expect(groups[0]?.newRole?.team).toBe('werewolf');
  });

  it('splits a changed player off a shared panel, right after it', () => {
    const groups = roleGroups(role('villager'), [
      holder('a', 'villager'),
      holder('b', 'werewolf'),
      holder('c', 'villager'),
    ]);
    expect(summary(groups)).toEqual([
      ['villager', ['a', 'c']],
      ['villager>werewolf', ['b']],
    ]);
  });

  it('puts players changed to the same role together, one panel per new role', () => {
    const groups = roleGroups(role('villager'), [
      holder('a', 'seer'),
      holder('b', 'werewolf'),
      holder('c', 'seer'),
    ]);
    expect(summary(groups)).toEqual([
      ['villager>seer', ['a', 'c']],
      ['villager>werewolf', ['b']],
    ]);
  });
});
