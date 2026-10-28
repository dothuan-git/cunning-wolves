import { describe, expect, it } from 'vitest';
import { canNoteNight, nextPhase, phaseIndex } from '../src';

describe('phase order', () => {
  it('runs night, then morning, then the next night', () => {
    expect(nextPhase({ kind: 'night', number: 1 })).toEqual({ kind: 'morning', number: 1 });
    expect(nextPhase({ kind: 'morning', number: 1 })).toEqual({ kind: 'night', number: 2 });
    expect(phaseIndex({ kind: 'night', number: 1 })).toBeLessThan(
      phaseIndex({ kind: 'morning', number: 1 }),
    );
    expect(phaseIndex({ kind: 'morning', number: 1 })).toBeLessThan(
      phaseIndex({ kind: 'night', number: 2 }),
    );
  });
});

describe('canNoteNight', () => {
  it('lets living players take a note', () => {
    expect(canNoteNight(undefined, 3)).toBe(true);
  });

  it('keeps the note for a player who dies during that night', () => {
    expect(canNoteNight({ kind: 'night', number: 2 }, 2)).toBe(true);
  });

  it('gives no note to a player who died before the night started', () => {
    expect(canNoteNight({ kind: 'morning', number: 1 }, 2)).toBe(false);
    expect(canNoteNight({ kind: 'night', number: 1 }, 2)).toBe(false);
  });
});
