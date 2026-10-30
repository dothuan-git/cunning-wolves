export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export type LocalizedText = Record<Locale, string>;

/** `solo`: a role that wins on its own, against both the village and the wolves. */
export const TEAMS = ['village', 'werewolf', 'solo'] as const;
export type Team = (typeof TEAMS)[number];

/** Which nights a waking role wakes: every night, Night 1 only, or Nights 2, 4, 6… */
export const WAKE_NIGHTS = ['every', 'first', 'even'] as const;
export type WakeNights = (typeof WAKE_NIGHTS)[number];

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
  /** Ignored for roles that never wake */
  wakeNights: WakeNights;
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

/** Night 1 → Morning 1 → Night 2 → … */
export interface Phase {
  kind: 'night' | 'morning';
  number: number;
}

/** What the narrator has marked during the game. */
export interface GameState {
  /** The phase being played now */
  phase: Phase;
  /** Player id → the phase they were marked dead in */
  deaths: Record<string, Phase>;
  /** Night number → player id → note */
  notes: Record<number, Record<string, string>>;
  /** Player id → the role they play now instead of their dealt one, and since when */
  newRoles: Record<string, NewRole>;
}

/** A role a power gave a player (Doppelgänger, Thief…): the narrator sets it, the phone keeps the dealt card. */
export interface NewRole {
  role: string;
  phase: Phase;
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
