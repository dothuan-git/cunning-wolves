import type { LocalizedText } from '../types';

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
export const PACK_ROLES: readonly string[] = ['white-werewolf'];

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
    id: 'charmed',
    label: { vi: 'Bị mê hoặc', en: 'Charmed' },
    from: ['pied-piper'],
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
    id: 'judge-used',
    label: { vi: 'Đã gọi bỏ phiếu lại', en: 'Second vote used' },
    from: ['stuttering-judge'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'power-lost',
    label: { vi: 'Mất năng lực', en: 'Power lost' },
    from: ['fox', 'big-bad-wolf'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'heal-used',
    label: { vi: 'Đã dùng bình cứu', en: 'Heal potion used' },
    from: ['witch'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'kill-used',
    label: { vi: 'Đã dùng bình độc', en: 'Kill potion used' },
    from: ['witch'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'life-lost',
    label: { vi: 'Đã mất mạng phụ', en: 'Extra life used' },
    from: ['elder'],
    holdersOnly: true,
    single: false,
  },
  {
    id: 'no-vote',
    label: { vi: 'Mất quyền bỏ phiếu', en: "Can't vote" },
    from: ['village-idiot'],
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
