import type { Phase } from '../types';

/** A night note's longest text */
export const NOTE_MAX = 1000;

// Night 1 < Morning 1 < Night 2 < Morning 2 …
export function phaseIndex(phase: Phase): number {
  return (phase.number - 1) * 2 + (phase.kind === 'night' ? 0 : 1);
}

export function nextPhase(phase: Phase): Phase {
  return phase.kind === 'night'
    ? { kind: 'morning', number: phase.number }
    : { kind: 'night', number: phase.number + 1 };
}

/** Players who died before a night started get no note for that night. */
export function canNoteNight(death: Phase | undefined, night: number): boolean {
  return death === undefined || phaseIndex(death) >= phaseIndex({ kind: 'night', number: night });
}
