import type { PoolRole } from '@werewolf/shared';
import { describe, expect, it } from 'vitest';
import { filterRoles } from '../../src/screens/rule-book/filterRoles';

function role(id: string, vi: string, en: string): PoolRole {
  return {
    id,
    name: { vi, en },
    rule: { vi: '', en: '' },
    team: 'village',
    defaultWakeOrder: null,
    wakeNights: 'every',
    image: `${id}.webp`,
  };
}

const roles = [
  role('seer', 'Tiên tri', 'Seer'),
  role('witch', 'Phù thủy', 'Witch'),
  role('doppelganger', 'Kẻ bắt chước', 'Doppelgänger'),
  role('guard', 'Bảo vệ', 'Bodyguard'),
  role('elder', 'Già làng', 'Elder'),
  role('ghost', 'Hồn ma đêm', 'Ghost'),
];

const ids = (search: string) => filterRoles(roles, search).map(({ id }) => id);

describe('filterRoles', () => {
  it('returns every role for an empty or blank search', () => {
    expect(filterRoles(roles, '')).toBe(roles);
    expect(ids('   ')).toHaveLength(roles.length);
  });

  it('ignores accents and case', () => {
    expect(ids('PHU THUY')).toEqual(['witch']);
    expect(ids('doppelganger')).toEqual(['doppelganger']);
  });

  it('reads đ as d', () => {
    expect(ids('dem')).toEqual(['ghost']);
  });

  it('matches the Vietnamese or the English name', () => {
    expect(ids('tien')).toEqual(['seer']);
    expect(ids('seer')).toEqual(['seer']);
    expect(ids('bao ve')).toEqual(['guard']);
    expect(ids('body')).toEqual(['guard']);
  });

  it('returns nothing when no name matches', () => {
    expect(ids('zzz')).toEqual([]);
  });
});
