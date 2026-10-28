import { canNoteNight, type Phase } from '@werewolf/shared';

export type TimelineEntry =
  | { type: 'note'; night: number; text: string }
  | { type: 'input'; night: number }
  | { type: 'death'; phase: Phase };

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
    let noted = true;
    if (current.kind === 'night' && night === current.number && canNoteNight(death, night)) {
      entries.push({ type: 'input', night });
    } else if (text.trim() !== '' || night === editingNight) {
      entries.push({ type: 'note', night, text });
    } else {
      noted = false;
    }
    // One row per night: a night's note stands in for a death marked that same night.
    const diedThisNight = death?.kind === 'night' && death.number === night;
    if (death?.number === night && !(diedThisNight && noted)) {
      entries.push({ type: 'death', phase: death });
    }
  }
  return entries;
}
