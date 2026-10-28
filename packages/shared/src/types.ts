export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export type LocalizedText = Record<Locale, string>;

export type Team = 'village' | 'werewolf';

/** `lobby` covers gathering players and choosing roles; they happen at the same time. */
export type RoomStatus = 'lobby' | 'reveal' | 'playing' | 'finished';

/** Static role data shipped with the app; never edited at runtime. */
export interface PoolRole {
  /** kebab-case, stable forever (saved games refer to it) */
  id: string;
  name: LocalizedText;
  rule: LocalizedText;
  team: Team;
  /** null for roles that never wake at night */
  defaultWakeOrder: number | null;
  /** file name in apps/web/src/assets/cards/ */
  image: string;
}
