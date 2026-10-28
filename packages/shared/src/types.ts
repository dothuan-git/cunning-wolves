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

/** A role as one room uses it: a pool role with this room's rule, or a custom role. */
export interface RoomRole extends PoolRole {
  custom: boolean;
}

/** A role the master makes up for one room. Written in one language, shown to everyone as is. */
export interface CustomRoleInput {
  name: string;
  rule: string;
  team: Team;
  wakes: boolean;
}

export interface CustomRole extends CustomRoleInput {
  /** `custom-<n>`, given by the room */
  id: string;
}

export interface RoomSettings {
  /** Narrator's timer length; 0 = no timer */
  timerSeconds: number;
  soundOn: boolean;
}

/** The card set the master builds while players gather. Only the master sees it before Ready. */
export interface RoomSetup {
  /** Role ids, one per copy in the game */
  picks: string[];
  /** Rule text that replaces a role's rule in both languages, by role id */
  ruleEdits: Record<string, string>;
  customRoles: CustomRole[];
  /** Waking role ids in the order the narrator chose; roles not in it follow by default order */
  wakeOrder: string[];
  settings: RoomSettings;
}
