import type { GameState, LocalizedText } from '../types';

/**
 * Something the narrator records about a player besides death: a title, a power used up, an effect
 * on them. The app only records it; it never acts on it.
 */
export interface MarkDef {
  /** kebab-case, stable forever (saved games refer to it) */
  id: string;
  /** Data like role names, not an i18n key */
  label: LocalizedText;
  /** Pool role ids whose presence in the game offers the mark; empty: every game offers it */
  from: readonly string[];
  /** Only a player dealt one of `from` can carry it */
  holdersOnly: boolean;
  /** Only one player carries it at a time: marking another player moves it */
  single: boolean;
  /** The carrier wakes with the wolves from now on, whatever their own role */
  joinsPack?: boolean;
}

/** Roles that wake with the wolves although they are not on the wolf team. */
export const PACK_ROLES: readonly string[] = ['white-werewolf', 'lone-wolf'];

// Shown in this order wherever a player's marks are listed.
export const MARKS: readonly MarkDef[] = [
  {
    id: 'sheriff',
    label: { vi: 'Trưởng làng', en: 'Sheriff' },
    from: [],
    holdersOnly: false,
    single: true,
  },
  {
    id: 'town-crier',
    label: { vi: 'Người rao tin', en: 'Town Crier' },
    from: [],
    holdersOnly: false,
    single: true,
  },
  {
    id: 'lover',
    label: { vi: 'Cặp đôi', en: 'Lover' },
    from: ['cupid'],
    holdersOnly: false,
    single: false,
  },
  {
    id: 'role-model',
    label: { vi: 'Hình mẫu', en: 'Role model' },
    from: ['wild-child'],
    holdersOnly: false,
    single: true,
  },
  {
    id: 'turned',
    label: { vi: 'Đã hóa sói', en: 'Turned wolf' },
    from: ['wild-child'],
    holdersOnly: true,
    single: false,
    joinsPack: true,
  },
  {
    id: 'chose-wolves',
    label: { vi: 'Đã chọn phe sói', en: 'Chose the wolves' },
    from: ['wolf-hound'],
    holdersOnly: true,
    single: false,
    joinsPack: true,
  },
  {
    id: 'cursed',
    label: { vi: 'Bị nguyền', en: 'Cursed' },
    from: ['cursed-wolf-father'],
    holdersOnly: false,
    single: true,
    joinsPack: true,
  },
  {
    id: 'alpha-turned',
    label: { vi: 'Bị Sói đầu đàn biến thành sói', en: 'Turned by the Alpha Wolf' },
    from: ['alpha-wolf'],
    holdersOnly: false,
    single: true,
    joinsPack: true,
  },
  {
    id: 'became-wolf',
    label: { vi: 'Đã thành sói', en: 'Became a werewolf' },
    from: ['cursed'],
    holdersOnly: true,
    single: false,
    joinsPack: true,
  },
  {
    id: 'charmed',
    label: { vi: 'Bị mê hoặc', en: 'Charmed' },
    from: ['pied-piper'],
    holdersOnly: false,
    single: false,
  },
  {
    id: 'in-cult',
    label: { vi: 'Trong giáo phái', en: 'In the cult' },
    from: ['cult-leader'],
    holdersOnly: false,
    single: false,
  },
  {
    id: 'target-group',
    label: { vi: 'Nhóm bị nhắm', en: 'Target group' },
    from: ['prejudiced-manipulator'],
    holdersOnly: false,
    single: false,
  },
  {
    id: 'companion',
    label: { vi: 'Bạn đồng hành của Sói khổng lồ', en: "Dire Wolf's companion" },
    from: ['dire-wolf'],
    holdersOnly: false,
    single: true,
  },
  {
    id: 'copied',
    label: { vi: 'Hình mẫu của Kẻ bắt chước', en: "Doppelgänger's model" },
    from: ['doppelganger'],
    holdersOnly: false,
    single: true,
  },
  {
    id: 'hoodlum-target',
    label: { vi: 'Mục tiêu của Kẻ côn đồ', en: "Hoodlum's target" },
    from: ['hoodlum'],
    holdersOnly: false,
    single: false,
  },
  {
    id: 'doomed',
    label: { vi: 'Sắp chết', en: 'Dies soon' },
    from: ['tough-guy', 'vampire'],
    holdersOnly: false,
    single: false,
  },
  {
    id: 'blessed',
    label: { vi: 'Được ban phước', en: 'Blessed' },
    from: ['priest'],
    holdersOnly: false,
    single: true,
  },
  {
    id: 'amulet',
    label: { vi: 'Giữ bùa hộ mệnh', en: 'Holds the amulet' },
    from: ['amulet-of-protection'],
    holdersOnly: false,
    single: true,
  },
  {
    id: 'house-burned',
    label: { vi: 'Nhà bị đốt', en: 'House burned' },
    from: ['pyromaniac'],
    holdersOnly: false,
    single: false,
  },
  {
    id: 'captain',
    label: { vi: 'Đội trưởng', en: 'Captain' },
    from: ['farmer'],
    holdersOnly: true,
    single: true,
  },
  {
    id: 'revealed',
    label: { vi: 'Đã lộ bài', en: 'Revealed' },
    from: ['prince'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'power-used',
    label: { vi: 'Đã dùng năng lực', en: 'Power used' },
    from: [
      'puppeteer',
      'priest',
      'alpha-wolf',
      'pyromaniac',
      'troublemaker',
      'barber',
      'bonesetter',
      'confessor',
      'lord',
    ],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'judge-used',
    label: { vi: 'Đã gọi bỏ phiếu lại', en: 'Second vote used' },
    from: ['stuttering-judge'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'power-lost',
    label: { vi: 'Mất năng lực', en: 'Power lost' },
    from: ['fox', 'big-bad-wolf', 'bartender'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'heal-used',
    label: { vi: 'Đã dùng lượt cứu', en: 'Heal used' },
    from: ['witch', 'magician'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'kill-used',
    label: { vi: 'Đã dùng lượt giết', en: 'Kill used' },
    from: ['witch', 'magician'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'life-lost',
    label: { vi: 'Đã mất mạng phụ', en: 'Extra life used' },
    from: ['elder', 'colossus'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'no-vote',
    label: { vi: 'Mất quyền bỏ phiếu', en: "Can't vote" },
    from: ['village-idiot', 'vagabond'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'rusted',
    label: { vi: 'Nhiễm gỉ sét', en: 'Rusted' },
    from: ['knight'],
    holdersOnly: false,
    single: false,
  },
];

/** Roles whose power gives a player another role; while one is dealt, the narrator can set it. */
export const ROLE_CHANGERS: readonly string[] = [
  'thief',
  'doppelganger',
  'devoted-servant',
  'drunk',
  'apprentice-seer',
  'bailiff',
  'angel',
  'dream-wolf',
];

/** Whether the narrator can give players another role in a game where `dealt` are dealt. */
export function offersNewRoles(dealt: readonly string[]): boolean {
  return ROLE_CHANGERS.some((id) => dealt.includes(id));
}

/** The role a player plays now: the one a power gave them, else the one they were dealt. */
export function currentRole(
  playerId: string,
  dealtRole: string,
  newRoles: GameState['newRoles'],
): string {
  return Object.hasOwn(newRoles, playerId) ? (newRoles[playerId]?.role ?? dealtRole) : dealtRole;
}

/**
 * The marks a player may carry with their dealt role and the role they play now, in MARKS order,
 * in a game where `dealt` are every player's dealt roles.
 */
export function marksForPlayer(
  dealtRole: string,
  role: string,
  dealt: readonly string[],
): MarkDef[] {
  const offered = new Set([...marksFor(dealtRole, dealt), ...marksFor(role, dealt)]);
  return MARKS.filter((mark) => offered.has(mark));
}

/** The marks a player dealt `roleId` may carry, in a game where `dealt` are every player's roles. */
export function marksFor(roleId: string, dealt: readonly string[]): MarkDef[] {
  return MARKS.filter((mark) =>
    mark.holdersOnly
      ? mark.from.includes(roleId)
      : mark.from.length === 0 || mark.from.some((id) => dealt.includes(id)),
  );
}

/** Whether a player dealt `roleId`, carrying the marks `markIds`, wakes with the wolves. */
export function wakesWithWolves(roleId: string, markIds: readonly string[]): boolean {
  return (
    PACK_ROLES.includes(roleId) ||
    MARKS.some((mark) => mark.joinsPack === true && markIds.includes(mark.id))
  );
}
