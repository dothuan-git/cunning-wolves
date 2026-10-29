import type { Team } from '@werewolf/shared';

// Whole class names, so Tailwind finds them in the source.

/** Each faction's hue, for its role names and headings. */
export const FACTION_TEXT: Record<Team, string> = {
  village: 'text-village',
  werewolf: 'text-werewolf',
  solo: 'text-solo',
};

/** Each faction's pale wash, behind its bands and blocks. */
export const FACTION_WASH: Record<Team, string> = {
  village: 'bg-village-wash',
  werewolf: 'bg-werewolf-wash',
  solo: 'bg-solo-wash',
};

/** Wolves first, since every reveal starts with "who were the wolves?". */
export const FACTION_ORDER: readonly Team[] = ['werewolf', 'village', 'solo'];
