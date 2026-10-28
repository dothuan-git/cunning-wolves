export const SCREEN_IDS = [
  'home',
  'name-entry',
  'summary',
  'master-lobby',
  'setup',
  'narrator',
  'player-lobby',
  'rules-review',
  'my-card',
  'components',
] as const;
export type ScreenId = (typeof SCREEN_IDS)[number];
export const SCREEN_LABELS = {
  home: 'screens.home',
  'name-entry': 'screens.nameEntry',
  summary: 'screens.summary',
  'master-lobby': 'screens.masterLobby',
  setup: 'screens.setup',
  narrator: 'screens.narrator',
  'player-lobby': 'screens.playerLobby',
  'rules-review': 'screens.rulesReview',
  'my-card': 'screens.myCard',
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
] as const;
export type PreviewState = (typeof STATES)[number];
export const SCREEN_STATES: Record<ScreenId, readonly PreviewState[]> = {
  home: ['default', 'empty', 'loading', 'error'],
  'name-entry': ['default'],
  summary: ['default', 'notes', 'empty'],
  'master-lobby': ['default', 'empty'],
  setup: ['default', 'empty'],
  narrator: ['default', 'dead', 'morning', 'long'],
  'player-lobby': ['default', 'loading', 'long', 'many', 'removed'],
  'rules-review': ['default'],
  'my-card': ['default', 'hidden', 'long'],
  components: ['default'],
};
export function isScreen(value: string | null): value is ScreenId {
  return SCREEN_IDS.some((screen) => screen === value);
}
export function isPreviewState(value: string | null): value is PreviewState {
  return STATES.some((state) => state === value);
}
