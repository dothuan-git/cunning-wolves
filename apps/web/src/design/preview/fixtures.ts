import { MARKS, type PoolRole } from '@werewolf/shared';
import type { RevealedPlayerItem, RoleGroupItem } from '../../screens/types';

const exampleRule = {
  vi: 'Mô tả minh họa. Quản trò xác nhận luật trước khi chơi.',
  en: 'Example description. The narrator confirms the rules before play.',
};

export const seer: PoolRole = {
  id: 'seer',
  name: { vi: 'Tiên tri', en: 'Seer' },
  team: 'village',
  defaultWakeOrder: 10,
  wakeNights: 'every',
  rule: {
    vi: 'Mỗi đêm, chọn một người để biết họ có phải là Sói hay không.',
    en: 'Each night, choose one player to learn whether they are a Wolf.',
  },
  image: 'seer.webp',
};
export const wolf: PoolRole = {
  id: 'werewolf',
  name: { vi: 'Sói', en: 'Wolf' },
  rule: exampleRule,
  team: 'werewolf',
  defaultWakeOrder: 20,
  wakeNights: 'every',
  image: 'werewolf.webp',
};
export const witch: PoolRole = {
  id: 'witch',
  name: { vi: 'Phù thủy', en: 'Witch' },
  rule: exampleRule,
  team: 'village',
  defaultWakeOrder: 30,
  wakeNights: 'every',
  image: 'witch.webp',
};
export const villager: PoolRole = {
  id: 'villager',
  name: { vi: 'Dân làng', en: 'Villager' },
  rule: exampleRule,
  team: 'village',
  defaultWakeOrder: null,
  wakeNights: 'every',
  image: 'villager.webp',
};
export const priest: PoolRole = {
  id: 'priest',
  name: { vi: 'Linh mục', en: 'Priest' },
  rule: exampleRule,
  team: 'village',
  defaultWakeOrder: 35,
  wakeNights: 'every',
  image: 'priest.webp',
};

// More roles than a small game, to see the rules review fill several rows. No art exists for
// these yet, so they also show the fallback figure.
export const manyRoles: readonly PoolRole[] = [
  ...[seer, wolf, witch, villager],
  {
    id: 'hunter',
    name: { vi: 'Thợ săn', en: 'Hunter' },
    rule: exampleRule,
    team: 'village',
    defaultWakeOrder: 40,
    wakeNights: 'every',
    image: 'hunter.webp',
  },
  {
    id: 'cupid',
    name: { vi: 'Thần tình yêu', en: 'Cupid' },
    rule: exampleRule,
    team: 'village',
    defaultWakeOrder: 5,
    wakeNights: 'every',
    image: 'cupid.webp',
  },
  {
    id: 'guard',
    name: { vi: 'Bảo vệ', en: 'Guard' },
    rule: exampleRule,
    team: 'village',
    defaultWakeOrder: 8,
    wakeNights: 'every',
    image: 'guard.webp',
  },
  {
    id: 'alpha',
    name: { vi: 'Sói đầu đàn', en: 'Alpha wolf' },
    rule: exampleRule,
    team: 'werewolf',
    defaultWakeOrder: 22,
    wakeNights: 'every',
    image: 'alpha.webp',
  },
  {
    id: 'fool',
    name: { vi: 'Kẻ ngốc', en: 'Fool' },
    rule: exampleRule,
    team: 'village',
    defaultWakeOrder: null,
    wakeNights: 'every',
    image: 'fool.webp',
  },
];

// Synthetic design fixtures only. The production ROLE_POOL remains untouched.
export const exampleRoles = [seer, wolf, witch, priest, villager];
const marks = (...ids: string[]) => MARKS.filter((mark) => ids.includes(mark.id));
export const examplePlayers: readonly RevealedPlayerItem[] = [
  { id: 'linh', name: 'Linh', role: seer, marks: marks('blessed') },
  { id: 'minh', name: 'Minh', role: wolf, marks: [] },
  { id: 'an', name: 'An', role: wolf, marks: [] },
  { id: 'ha', name: 'Hà', role: witch, marks: marks('heal-used') },
  { id: 'huy', name: 'Huy', role: villager, marks: [] },
  { id: 'mai', name: 'Mai', role: priest, marks: [] },
];
/** Example marks while playing: the Priest blessed Linh, and Hà has used her heal. */
export const exampleMarks: Record<
  string,
  Record<string, { kind: 'night' | 'morning'; number: number }>
> = {
  linh: { blessed: { kind: 'morning', number: 1 } },
  ha: { 'heal-used': { kind: 'night', number: 1 } },
};
// Every role, so players whose role never wakes can still be marked dead.
export const exampleGroups: readonly RoleGroupItem[] = exampleRoles.map((role) => ({
  role,
  players: examplePlayers.filter((player) => player.role.id === role.id),
}));
