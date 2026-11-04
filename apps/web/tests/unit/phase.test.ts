import { describe, expect, it } from 'vitest';
import { playerTimeline } from '../../src/screens/narrator/phase';

describe('playerTimeline', () => {
  it('shows earlier notes as text and the current night as an input', () => {
    expect(
      playerTimeline({
        actions: [],
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
        actions: [],
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
        actions: [],
        notes: { 1: '  ', 2: 'Quiet' },
        death: undefined,
        current: { kind: 'morning', number: 2 },
      }),
    ).toEqual([{ type: 'note', night: 2, text: 'Quiet' }]);
  });

  it('keeps an empty note while it is being edited', () => {
    expect(
      playerTimeline({
        actions: [],
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
        actions: [],
        notes: { 1: 'Saved An' },
        death: { kind: 'morning', number: 1 },
        current: { kind: 'night', number: 2 },
      }),
    ).toEqual([
      { type: 'note', night: 1, text: 'Saved An' },
      { type: 'death', phase: { kind: 'morning', number: 1 } },
    ]);
  });

  it('shows the input and the death for a death marked during the current night', () => {
    expect(
      playerTimeline({
        actions: [],
        notes: { 2: 'Bitten' },
        death: { kind: 'night', number: 2 },
        current: { kind: 'night', number: 2 },
      }),
    ).toEqual([
      { type: 'input', night: 2 },
      { type: 'death', phase: { kind: 'night', number: 2 } },
    ]);
  });

  it('shows the note and the death for a death in a past night that has a note', () => {
    expect(
      playerTimeline({
        actions: [],
        notes: { 1: 'Bitten' },
        death: { kind: 'night', number: 1 },
        current: { kind: 'morning', number: 2 },
      }),
    ).toEqual([
      { type: 'note', night: 1, text: 'Bitten' },
      { type: 'death', phase: { kind: 'night', number: 1 } },
    ]);
  });

  it('shows the death of a past night that has no note', () => {
    expect(
      playerTimeline({
        actions: [],
        notes: {},
        death: { kind: 'night', number: 1 },
        current: { kind: 'morning', number: 2 },
      }),
    ).toEqual([{ type: 'death', phase: { kind: 'night', number: 1 } }]);
  });

  it('lists a phase as its actions, then its note, then its death', () => {
    const night = { kind: 'night', number: 1 } as const;
    const morning = { kind: 'morning', number: 1 } as const;
    const first = { phase: night, label: 'changed role' };
    const second = { phase: night, label: 'picked question' };
    const later = { phase: morning, label: 'changed back' };
    expect(
      playerTimeline({
        actions: [first, second, later],
        notes: { 1: 'Saw An' },
        death: morning,
        current: { kind: 'night', number: 2 },
      }),
    ).toEqual([
      { type: 'action', action: first },
      { type: 'action', action: second },
      { type: 'note', night: 1, text: 'Saw An' },
      { type: 'action', action: later },
      { type: 'death', phase: morning },
    ]);
  });

  it('puts tonight’s actions above the open note field', () => {
    const tonight = { kind: 'night', number: 2 } as const;
    const action = { phase: tonight };
    expect(
      playerTimeline({
        actions: [action],
        notes: {},
        death: undefined,
        current: tonight,
      }),
    ).toEqual([
      { type: 'action', action },
      { type: 'input', night: 2 },
    ]);
  });

  it('keeps a phase’s actions when it has no note', () => {
    const action = { phase: { kind: 'night', number: 1 } as const };
    expect(
      playerTimeline({
        actions: [action],
        notes: {},
        death: undefined,
        current: { kind: 'morning', number: 1 },
      }),
    ).toEqual([{ type: 'action', action }]);
  });

  it('gives the input back when a death is undone', () => {
    expect(
      playerTimeline({
        actions: [],
        notes: {},
        death: undefined,
        current: { kind: 'night', number: 3 },
      }),
    ).toEqual([{ type: 'input', night: 3 }]);
  });
});
