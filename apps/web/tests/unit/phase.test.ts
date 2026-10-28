import { describe, expect, it } from 'vitest';
import {
  canNoteNight,
  nextPhase,
  phaseIndex,
  playerTimeline,
} from '../../src/screens/narrator/phase';

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

describe('playerTimeline', () => {
  it('shows earlier notes as text and the current night as an input', () => {
    expect(
      playerTimeline({
        notes: { 1: 'Chose An', 2: 'Draft' },
        death: undefined,
        current: { kind: 'night', number: 2 },
      }),
    ).toEqual([
      { type: 'note', night: 1, text: 'Chose An' },
      { type: 'input', night: 2 },
    ]);
  });

  it('turns every note into text in the morning', () => {
    expect(
      playerTimeline({
        notes: { 1: 'Chose An', 2: 'Chose Hà' },
        death: undefined,
        current: { kind: 'morning', number: 2 },
      }),
    ).toEqual([
      { type: 'note', night: 1, text: 'Chose An' },
      { type: 'note', night: 2, text: 'Chose Hà' },
    ]);
  });

  it('skips empty notes', () => {
    expect(
      playerTimeline({
        notes: { 1: '  ', 2: 'Quiet' },
        death: undefined,
        current: { kind: 'morning', number: 2 },
      }),
    ).toEqual([{ type: 'note', night: 2, text: 'Quiet' }]);
  });

  it('keeps an empty note while it is being edited', () => {
    expect(
      playerTimeline({
        notes: { 1: '' },
        death: undefined,
        current: { kind: 'morning', number: 1 },
        editingNight: 1,
      }),
    ).toEqual([{ type: 'note', night: 1, text: '' }]);
  });

  it('places the death after the night it belongs to and stops new inputs', () => {
    expect(
      playerTimeline({
        notes: { 1: 'Saved An' },
        death: { kind: 'morning', number: 1 },
        current: { kind: 'night', number: 2 },
      }),
    ).toEqual([
      { type: 'note', night: 1, text: 'Saved An' },
      { type: 'death', phase: { kind: 'morning', number: 1 } },
    ]);
  });

  it('keeps only the input for a death marked during the current night', () => {
    expect(
      playerTimeline({
        notes: { 2: 'Bitten' },
        death: { kind: 'night', number: 2 },
        current: { kind: 'night', number: 2 },
      }),
    ).toEqual([{ type: 'input', night: 2 }]);
  });

  it('keeps only the note for a death in a past night that has one', () => {
    expect(
      playerTimeline({
        notes: { 1: 'Bitten' },
        death: { kind: 'night', number: 1 },
        current: { kind: 'morning', number: 2 },
      }),
    ).toEqual([{ type: 'note', night: 1, text: 'Bitten' }]);
  });

  it('shows the death of a past night that has no note', () => {
    expect(
      playerTimeline({
        notes: {},
        death: { kind: 'night', number: 1 },
        current: { kind: 'morning', number: 2 },
      }),
    ).toEqual([{ type: 'death', phase: { kind: 'night', number: 1 } }]);
  });

  it('gives the input back when a death is undone', () => {
    expect(
      playerTimeline({ notes: {}, death: undefined, current: { kind: 'night', number: 3 } }),
    ).toEqual([{ type: 'input', night: 3 }]);
  });
});
