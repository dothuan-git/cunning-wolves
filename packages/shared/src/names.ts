export const NAME_MAX = 24;
export const ROOM_NAME_MAX = 32;

/** Trims, joins runs of spaces and composes accents, so the same name is always stored the same way. */
export function cleanName(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Whether a cleaned name has 1 to `max` characters (a Vietnamese letter with marks counts as one). */
export function isValidName(name: string, max: number): boolean {
  const length = Array.from(name).length;
  return length > 0 && length <= max;
}

/** Lowercase without accents, so "Sói" matches "soi" and "Đức" matches "duc". */
export function nameKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
