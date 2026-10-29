export const MARK_TONES = [
  'rose',
  'rust',
  'ochre',
  'moss',
  'teal',
  'sea',
  'slate',
  'umber',
] as const;
export type MarkTone = (typeof MARK_TONES)[number];

/**
 * Each mark's fixed ink. Marks one player often carries together get different inks: the
 * Witch's potions, a lover who is cursed, the Priest's blessing and power, the Wild Child's model
 * and turn.
 */
export const MARK_TONE: Readonly<Record<string, MarkTone>> = {
  lover: 'rose',
  'role-model': 'teal',
  turned: 'rust',
  'chose-wolves': 'rust',
  cursed: 'rust',
  'became-wolf': 'rust',
  charmed: 'ochre',
  'in-cult': 'umber',
  'target-group': 'teal',
  companion: 'moss',
  copied: 'sea',
  'hoodlum-target': 'rose',
  doomed: 'slate',
  blessed: 'sea',
  amulet: 'moss',
  'house-burned': 'ochre',
  captain: 'teal',
  revealed: 'sea',
  'power-used': 'slate',
  'judge-used': 'slate',
  'power-lost': 'umber',
  'heal-used': 'moss',
  'kill-used': 'rose',
  'life-lost': 'ochre',
  'no-vote': 'umber',
  rusted: 'rust',
};

// Whole class names, so Tailwind finds them in the source.
const MARK_CHIP: Readonly<Record<MarkTone, string>> = {
  rose: 'bg-mark-rose-wash text-mark-rose',
  rust: 'bg-mark-rust-wash text-mark-rust',
  ochre: 'bg-mark-ochre-wash text-mark-ochre',
  moss: 'bg-mark-moss-wash text-mark-moss',
  teal: 'bg-mark-teal-wash text-mark-teal',
  sea: 'bg-mark-sea-wash text-mark-sea',
  slate: 'bg-mark-slate-wash text-mark-slate',
  umber: 'bg-mark-umber-wash text-mark-umber',
};

/** A mark chip's wash and ink; a mark this app no longer knows stays plain. */
export function markChipClass(markId: string): string {
  const tone = Object.hasOwn(MARK_TONE, markId) ? MARK_TONE[markId] : undefined;
  return tone ? MARK_CHIP[tone] : 'bg-field text-ink';
}
