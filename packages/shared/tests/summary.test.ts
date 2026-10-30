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
      newRoles: {},
    };
    expect(gameJournal(game, players)).toEqual([
      {
        phase: { kind: 'night', number: 1 },
        notes: [
          { id: 'a', name: 'Minh', text: 'Woke.' },
          { id: 'b', name: 'Lan', text: 'Saw Hoa.' },
        ],
        deaths: [],
        newRoles: [],
      },
      {
        phase: { kind: 'morning', number: 1 },
        notes: [],
        deaths: [{ id: 'c', name: 'Hoa' }],
        newRoles: [],
      },
      {
        phase: { kind: 'night', number: 3 },
        notes: [{ id: 'b', name: 'Lan', text: 'Last night.' }],
        deaths: [{ id: 'a', name: 'Minh' }],
        newRoles: [],
      },
    ]);
  });

  it('stops at the phase the game ended in', () => {
    const game: GameState = {
      phase: { kind: 'morning', number: 1 },
      deaths: { a: { kind: 'morning', number: 1 } },
      notes: {},
      newRoles: {},
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
      newRoles: {},
    };
    expect(gameJournal(empty, players)).toEqual([]);
    const other: GameState = { ...empty, notes: { 1: { z: 'Gone.' } } };
    expect(gameJournal(other, players)).toEqual([]);
  });

  it('lists a new role in the phase it was given', () => {
    const game: GameState = {
      phase: { kind: 'night', number: 2 },
      deaths: {},
      notes: {},
      newRoles: { a: { role: 'seer', phase: { kind: 'morning', number: 1 } } },
    };
    expect(gameJournal(game, players)).toEqual([
      {
        phase: { kind: 'morning', number: 1 },
        notes: [],
        deaths: [],
        newRoles: [{ id: 'a', name: 'Minh', role: 'seer' }],
      },
    ]);
  });
});
