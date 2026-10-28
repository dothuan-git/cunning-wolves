import type { RoomAction } from '@werewolf/shared';
import { describe, expect, it } from 'vitest';
import { apply, createRoom, seatedPlayers, type RoomState } from '../src/room/machine';
import { buildMasterView, buildPlayerView, buildSummary } from '../src/room/view';

const MASTER = 'master-id';
const NOW = 1_000;

function room(): RoomState {
  return createRoom({
    id: 'mill',
    name: 'The mill',
    masterId: MASTER,
    masterName: 'Thuận',
    now: 0,
  });
}

/** Applies actions in turn and fails the test if any is refused. */
function run(state: RoomState, ...steps: [actor: string, action: RoomAction][]): RoomState {
  return steps.reduce((current, [actor, action]) => {
    const result = apply(current, actor, action, NOW);
    if (!result.ok) throw new Error(`${action.type} by ${actor} refused: ${result.error}`);
    return result.state;
  }, state);
}

function refusal(state: RoomState, actor: string, action: RoomAction) {
  const result = apply(state, actor, action, NOW);
  return result.ok ? null : result.error;
}

describe('join', () => {
  it('seats a player with a cleaned name', () => {
    const state = run(room(), ['a', { type: 'join', name: '  Minh   Anh ' }]);
    expect(seatedPlayers(state)).toEqual([
      { id: 'a', name: 'Minh Anh', joinedAt: NOW, kicked: false },
    ]);
  });

  it('refuses an empty or too long name', () => {
    expect(refusal(room(), 'a', { type: 'join', name: '   ' })).toBe('name-invalid');
    expect(refusal(room(), 'a', { type: 'join', name: 'x'.repeat(25) })).toBe('name-invalid');
  });

  it('refuses a name already in the room, ignoring case and accents', () => {
    const state = run(room(), ['a', { type: 'join', name: 'Đức' }]);
    expect(refusal(state, 'b', { type: 'join', name: 'duc' })).toBe('name-taken');
    expect(refusal(state, 'b', { type: 'join', name: 'THUAN' })).toBe('name-taken');
  });

  it('refuses while the room is closed', () => {
    const state = run(room(), [MASTER, { type: 'setOpen', open: false }]);
    expect(refusal(state, 'a', { type: 'join', name: 'Minh' })).toBe('room-closed');
  });

  it('refuses the master and a player who already has a seat', () => {
    expect(refusal(room(), MASTER, { type: 'join', name: 'Minh' })).toBe('not-allowed');
    const state = run(room(), ['a', { type: 'join', name: 'Minh' }]);
    expect(refusal(state, 'a', { type: 'join', name: 'Lan' })).toBe('not-allowed');
  });

  it('refuses once the game has moved past the lobby', () => {
    expect(refusal({ ...room(), status: 'playing' }, 'a', { type: 'join', name: 'Minh' })).toBe(
      'not-allowed',
    );
  });
});

describe('leave', () => {
  it('removes the seat', () => {
    const state = run(room(), ['a', { type: 'join', name: 'Minh' }], ['a', { type: 'leave' }]);
    expect(state.players).toEqual([]);
  });

  it('refuses a phone without a seat', () => {
    expect(refusal(room(), 'a', { type: 'leave' })).toBe('not-allowed');
  });
});

describe('kick', () => {
  it('marks the seat removed and frees the name', () => {
    const state = run(
      room(),
      ['a', { type: 'join', name: 'Minh' }],
      [MASTER, { type: 'kick', playerId: 'a' }],
    );
    expect(seatedPlayers(state)).toEqual([]);
    expect(state.players[0]?.kicked).toBe(true);
    expect(refusal(state, 'b', { type: 'join', name: 'Minh' })).toBeNull();
  });

  it('is for the master only', () => {
    const state = run(
      room(),
      ['a', { type: 'join', name: 'Minh' }],
      ['b', { type: 'join', name: 'Lan' }],
    );
    expect(refusal(state, 'b', { type: 'kick', playerId: 'a' })).toBe('not-master');
  });

  it('refuses an unknown or already removed player', () => {
    expect(refusal(room(), MASTER, { type: 'kick', playerId: 'nobody' })).toBe('not-allowed');
  });

  it('lets a removed player join again while the room is open', () => {
    const state = run(
      room(),
      ['a', { type: 'join', name: 'Minh' }],
      [MASTER, { type: 'kick', playerId: 'a' }],
      [MASTER, { type: 'setOpen', open: false }],
    );
    expect(refusal(state, 'a', { type: 'join', name: 'Minh' })).toBe('room-closed');
    const reopened = run(
      state,
      [MASTER, { type: 'setOpen', open: true }],
      ['a', { type: 'join', name: 'Minh' }],
    );
    expect(seatedPlayers(reopened).map((player) => player.id)).toEqual(['a']);
  });
});

describe('setOpen', () => {
  it('closes and re-opens, keeping seats', () => {
    const closed = run(
      room(),
      ['a', { type: 'join', name: 'Minh' }],
      [MASTER, { type: 'setOpen', open: false }],
    );
    expect(closed.open).toBe(false);
    expect(seatedPlayers(closed)).toHaveLength(1);
    expect(run(closed, [MASTER, { type: 'setOpen', open: true }]).open).toBe(true);
  });

  it('is for the master only', () => {
    expect(refusal(room(), 'a', { type: 'setOpen', open: false })).toBe('not-master');
  });
});

describe('views', () => {
  const state = run(
    room(),
    ['a', { type: 'join', name: 'Minh' }],
    ['b', { type: 'join', name: 'Lan' }],
    [MASTER, { type: 'kick', playerId: 'b' }],
  );
  const connected = new Set(['a']);

  it('shows the master the seated players and who is connected', () => {
    expect(buildMasterView(state, connected)).toEqual({
      kind: 'master',
      you: MASTER,
      room: { id: 'mill', name: 'The mill', status: 'lobby', open: true },
      players: [{ id: 'a', name: 'Minh', connected: true }],
    });
  });

  it('shows a player the same list and their own seat', () => {
    expect(buildPlayerView(state, connected, 'a')).toMatchObject({
      kind: 'player',
      seat: 'joined',
    });
    expect(buildPlayerView(state, connected, 'b').seat).toBe('removed');
    expect(buildPlayerView(state, connected, 'c').seat).toBe('none');
    expect(buildPlayerView(state, connected, 'c').players).toEqual(
      buildMasterView(state, connected).players,
    );
  });

  it('never tells a player who the master is', () => {
    expect(JSON.stringify(buildPlayerView(state, connected, 'a'))).not.toContain(MASTER);
  });

  it('summarizes the room for the home list', () => {
    expect(buildSummary(state)).toEqual({
      id: 'mill',
      name: 'The mill',
      master: 'Thuận',
      count: 1,
      status: 'lobby',
      isOpen: true,
    });
  });
});
