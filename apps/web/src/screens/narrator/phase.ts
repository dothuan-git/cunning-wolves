import type { Phase } from '../types';

export type TimelineEntry =
  | { type: 'note'; night: number; text: string }
  | { type: 'input'; night: number }
  | { type: 'death'; phase: Phase };

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

/**
 * One player's history up to the current phase. Empty notes are skipped unless
 * that night is being edited, so the field does not vanish while it is cleared.
 */
export function playerTimeline({
  notes,
  death,
  current,
  editingNight,
}: {
  notes: Readonly<Record<number, string>>;
  death: Phase | undefined;
  current: Phase;
  editingNight?: number;
}): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (let night = 1; night <= current.number; night++) {
    const text = notes[night] ?? '';
    if (current.kind === 'night' && night === current.number && canNoteNight(death, night)) {
      entries.push({ type: 'input', night });
    } else if (text.trim() !== '' || night === editingNight) {
      entries.push({ type: 'note', night, text });
    }
    if (death?.number === night) entries.push({ type: 'death', phase: death });
  }
  return entries;
}

/**
 * Moves the night's wake guide by `delta`. Steps 0…total-1 are the waking roles in
 * order; step `total` means every role has had its turn.
 */
export function wakeStep(step: number, delta: number, total: number): number {
  return Math.min(Math.max(step + delta, 0), Math.max(total, 0));
}
