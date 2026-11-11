import { FACTION_TEXT } from './faction';

/** A balance value as Ultimate Werewolf prints it: `+7`, `−6` (a true minus sign) or `0`. */
export function signedBalance(value: number): string {
  if (value > 0) return `+${String(value)}`;
  if (value < 0) return `−${String(-value)}`;
  return '0';
}

/** The side a balance helps: the village's lapis, the wolves' madder, or muted when it helps neither. */
export function balanceTone(value: number): string {
  if (value > 0) return FACTION_TEXT.village;
  if (value < 0) return FACTION_TEXT.werewolf;
  return 'text-muted';
}
