import type { PoolRole } from '@werewolf/shared';
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
  image: 'werewolf.webp',
};
export const witch: PoolRole = {
  id: 'witch',
  name: { vi: 'Phù thủy', en: 'Witch' },
  rule: exampleRule,
  team: 'village',
  defaultWakeOrder: 30,
  image: 'witch.webp',
};
export const villager: PoolRole = {
  id: 'villager',
  name: { vi: 'Dân làng', en: 'Villager' },
  rule: exampleRule,
  team: 'village',
  defaultWakeOrder: null,
  image: 'villager.webp',
};

// Synthetic design fixtures only. The production ROLE_POOL remains untouched.
export const exampleRoles = [seer, wolf, witch, villager];
export const examplePlayers: readonly RevealedPlayerItem[] = [
  { id: 'linh', name: 'Linh', role: seer },
  { id: 'minh', name: 'Minh', role: wolf },
  { id: 'an', name: 'An', role: wolf },
  { id: 'ha', name: 'Hà', role: witch },
  { id: 'huy', name: 'Huy', role: villager },
  { id: 'mai', name: 'Mai', role: villager },
];
// Every role, so players whose role never wakes can still be marked dead.
export const exampleGroups: readonly RoleGroupItem[] = exampleRoles.map((role) => ({
  role,
  players: examplePlayers.filter((player) => player.role.id === role.id),
}));
