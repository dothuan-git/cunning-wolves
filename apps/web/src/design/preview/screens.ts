export const SCREEN_IDS = [
  'home',
  'name-entry',
  'summary',
  'setup',
  'narrator',
  'player-lobby',
  'rules-review',
  'my-card',
  'rule-book',
  'components',
] as const;
export type ScreenId = (typeof SCREEN_IDS)[number];
export const SCREEN_LABELS = {
  home: 'screens.home',
  'name-entry': 'screens.nameEntry',
  summary: 'screens.summary',
  setup: 'screens.setup',
  narrator: 'screens.narrator',
  'player-lobby': 'screens.playerLobby',
  'rules-review': 'screens.rulesReview',
  'my-card': 'screens.myCard',
  'rule-book': 'screens.ruleBook',
  components: 'preview.components',
} as const;
export const STATES = [
  'default',
  'empty',
  'loading',
  'error',
  'dead',
  'hidden',
  'long',
  'many',
  'removed',
  'notes',
  'morning',
  'master',
  'player',
] as const;
export type PreviewState = (typeof STATES)[number];
export const SCREEN_STATES: Record<ScreenId, readonly PreviewState[]> = {
  home: ['default', 'empty', 'loading', 'error'],
  'name-entry': ['default', 'error'],
  summary: ['default', 'notes', 'empty', 'player'],
  setup: ['default', 'empty'],
  narrator: ['default', 'dead', 'morning', 'long'],
  'player-lobby': ['default', 'loading', 'long', 'many', 'removed'],
  'rules-review': ['default', 'many', 'master'],
  'my-card': ['default', 'hidden', 'long'],
  'rule-book': ['default'],
  components: ['default'],
};
export function isScreen(value: string | null): value is ScreenId {
  return SCREEN_IDS.some((screen) => screen === value);
}
export function isPreviewState(value: string | null): value is PreviewState {
  return STATES.some((state) => state === value);
}
