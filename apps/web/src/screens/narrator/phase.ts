import { canNoteNight, type Phase } from '@werewolf/shared';

export type TimelineEntry<Action> =
  | { type: 'action'; action: Action }
  | { type: 'note'; night: number; text: string }
  | { type: 'input'; night: number }
  | { type: 'death'; phase: Phase };

/**
 * One player's history up to the current phase. Each phase lists what the narrator did, then the
 * night's note, then the death. Empty notes are skipped unless that night is being edited, so the
 * field does not vanish while it is cleared.
 */
export function playerTimeline<Action extends { phase: Phase }>({
  notes,
  actions,
  death,
  current,
  editingNight,
}: {
  notes: Readonly<Record<number, string>>;
  /** This player's, oldest first */
  actions: readonly Action[];
  death: Phase | undefined;
  current: Phase;
  editingNight?: number;
}): TimelineEntry<Action>[] {
  const entries: TimelineEntry<Action>[] = [];
  const addActions = (kind: Phase['kind'], number: number) => {
    for (const action of actions) {
      if (action.phase.kind === kind && action.phase.number === number) {
        entries.push({ type: 'action', action });
      }
    }
  };
  const addDeath = (kind: Phase['kind'], number: number) => {
    if (death?.kind === kind && death.number === number)
      entries.push({ type: 'death', phase: death });
  };
  for (let night = 1; night <= current.number; night++) {
    addActions('night', night);
    const text = notes[night] ?? '';
    if (current.kind === 'night' && night === current.number && canNoteNight(death, night)) {
      entries.push({ type: 'input', night });
    } else if (text.trim() !== '' || night === editingNight) {
      entries.push({ type: 'note', night, text });
    }
    addDeath('night', night);
    addActions('morning', night);
    addDeath('morning', night);
  }
  return entries;
}
