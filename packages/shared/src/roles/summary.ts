import type { GameState, Phase } from '../types';

export interface JournalPlayer {
  id: string;
  name: string;
}

/** One phase of the game log: its notes (nights only) and the players who died in it. */
export interface JournalEntry {
  phase: Phase;
  notes: (JournalPlayer & { text: string })[];
  deaths: JournalPlayer[];
}

/**
 * The game log from Night 1 to the phase the game ended in. Players are listed in the order given;
 * phases with nothing in them are left out.
 */
export function gameJournal(game: GameState, players: readonly JournalPlayer[]): JournalEntry[] {
  const entries: JournalEntry[] = [];
  for (let number = 1; number <= game.phase.number; number++) {
    for (const kind of ['night', 'morning'] as const) {
      if (kind === 'morning' && number === game.phase.number && game.phase.kind === 'night') break;
      const notes =
        kind === 'night'
          ? players.flatMap((player) => {
              const byPlayer = game.notes[number];
              const text =
                byPlayer && Object.hasOwn(byPlayer, player.id) ? byPlayer[player.id] : '';
              return text ? [{ id: player.id, name: player.name, text }] : [];
            })
          : [];
      const deaths = players
        .filter((player) => {
          if (!Object.hasOwn(game.deaths, player.id)) return false;
          const death = game.deaths[player.id];
          return death?.kind === kind && death.number === number;
        })
        .map(({ id, name }) => ({ id, name }));
      if (notes.length > 0 || deaths.length > 0)
        entries.push({ phase: { kind, number }, notes, deaths });
    }
  }
  return entries;
}
