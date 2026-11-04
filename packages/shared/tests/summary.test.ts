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
      actions: [],
      questionDeck: [],
    };
    expect(gameJournal(game, players)).toEqual([
      {
        phase: { kind: 'night', number: 1 },
        notes: [
          { id: 'a', name: 'Minh', text: 'Woke.' },
          { id: 'b', name: 'Lan', text: 'Saw Hoa.' },
        ],
        deaths: [],
        actions: [],
      },
      {
        phase: { kind: 'morning', number: 1 },
        notes: [],
        deaths: [{ id: 'c', name: 'Hoa' }],
        actions: [],
      },
      {
        phase: { kind: 'night', number: 3 },
        notes: [{ id: 'b', name: 'Lan', text: 'Last night.' }],
        deaths: [{ id: 'a', name: 'Minh' }],
        actions: [],
      },
    ]);
  });

  it('stops at the phase the game ended in', () => {
    const game: GameState = {
      phase: { kind: 'morning', number: 1 },
      deaths: { a: { kind: 'morning', number: 1 } },
      notes: {},
      newRoles: {},
      actions: [],
      questionDeck: [],
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
      actions: [],
      questionDeck: [],
    };
    expect(gameJournal(empty, players)).toEqual([]);
    const other: GameState = { ...empty, notes: { 1: { z: 'Gone.' } } };
    expect(gameJournal(other, players)).toEqual([]);
  });

  it('lists what the narrator did in the phase they did it, in the order they did it', () => {
    const night = { kind: 'night', number: 1 } as const;
    const morning = { kind: 'morning', number: 1 } as const;
    const game: GameState = {
      phase: { kind: 'night', number: 2 },
      deaths: {},
      notes: {},
      newRoles: { a: { role: 'seer', phase: morning } },
      actions: [
        { type: 'question', question: 'q07', playerId: 'b', phase: night },
        { type: 'role', role: 'witch', playerId: 'a', phase: night },
        { type: 'role', role: 'seer', playerId: 'a', phase: morning },
      ],
      questionDeck: [],
    };
    expect(gameJournal(game, players)).toEqual([
      {
        phase: night,
        notes: [],
        deaths: [],
        actions: [
          { id: 'b', name: 'Lan', type: 'question', question: 'q07' },
          { id: 'a', name: 'Minh', type: 'role', role: 'witch' },
        ],
      },
      {
        phase: morning,
        notes: [],
        deaths: [],
        actions: [{ id: 'a', name: 'Minh', type: 'role', role: 'seer' }],
      },
    ]);
  });

  it('skips an action on a player it was not given', () => {
    const game: GameState = {
      phase: { kind: 'night', number: 1 },
      deaths: {},
      notes: {},
      newRoles: {},
      actions: [{ type: 'role', role: 'seer', playerId: 'z', phase: { kind: 'night', number: 1 } }],
      questionDeck: [],
    };
    expect(gameJournal(game, players)).toEqual([]);
  });
});
