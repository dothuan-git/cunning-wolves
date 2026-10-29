import { describe, expect, it } from 'vitest';
import { gameJournal, type GameState } from '../src';

const players = [
  { id: 'a', name: 'Minh' },
  { id: 'b', name: 'Lan' },
  { id: 'c', name: 'Hoa' },
];

describe('gameJournal', () => {
  it('lists notes and deaths phase by phase, in player order, leaving out empty phases', () => {
    const game: GameState = {
      phase: { kind: 'night', number: 3 },
      deaths: { c: { kind: 'morning', number: 1 }, a: { kind: 'night', number: 3 } },
      notes: { 1: { b: 'Saw Hoa.', a: 'Woke.' }, 3: { b: 'Last night.' } },
      marks: {},
    };
    expect(gameJournal(game, players)).toEqual([
      {
        phase: { kind: 'night', number: 1 },
        notes: [
          { id: 'a', name: 'Minh', text: 'Woke.' },
          { id: 'b', name: 'Lan', text: 'Saw Hoa.' },
        ],
        deaths: [],
        marks: [],
      },
      {
        phase: { kind: 'morning', number: 1 },
        notes: [],
        deaths: [{ id: 'c', name: 'Hoa' }],
        marks: [],
      },
      {
        phase: { kind: 'night', number: 3 },
        notes: [{ id: 'b', name: 'Lan', text: 'Last night.' }],
        deaths: [{ id: 'a', name: 'Minh' }],
        marks: [],
      },
    ]);
  });

  it('stops at the phase the game ended in', () => {
    const game: GameState = {
      phase: { kind: 'morning', number: 1 },
      deaths: { a: { kind: 'morning', number: 1 } },
      notes: {},
      marks: {},
    };
    expect(gameJournal(game, players).map(({ phase }) => phase)).toEqual([
      { kind: 'morning', number: 1 },
    ]);
  });

  it('is empty for a game with nothing marked, and skips players it was not given', () => {
    const empty: GameState = {
      phase: { kind: 'night', number: 1 },
      deaths: {},
      notes: {},
      marks: {},
    };
    expect(gameJournal(empty, players)).toEqual([]);
    const other: GameState = { ...empty, notes: { 1: { z: 'Gone.' } } };
    expect(gameJournal(other, players)).toEqual([]);
  });

  it('lists marks in the phase they were made, in mark order', () => {
    const game: GameState = {
      phase: { kind: 'morning', number: 2 },
      deaths: {},
      notes: {},
      marks: {
        b: { 'heal-used': { kind: 'night', number: 2 }, sheriff: { kind: 'morning', number: 1 } },
        a: { 'kill-used': { kind: 'night', number: 2 } },
      },
    };
    expect(gameJournal(game, players)).toEqual([
      {
        phase: { kind: 'morning', number: 1 },
        notes: [],
        deaths: [],
        marks: [{ id: 'b', name: 'Lan', mark: 'sheriff' }],
      },
      {
        phase: { kind: 'night', number: 2 },
        notes: [],
        deaths: [],
        marks: [
          { id: 'a', name: 'Minh', mark: 'kill-used' },
          { id: 'b', name: 'Lan', mark: 'heal-used' },
        ],
      },
    ]);
  });
});
