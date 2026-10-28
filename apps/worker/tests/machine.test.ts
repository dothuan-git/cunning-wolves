import { PICKS_MAX, RULE_MAX, type RoomAction } from '@werewolf/shared';
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
    const state = run(
      room(),
      ['a', { type: 'join', name: 'Minh' }],
      [MASTER, { type: 'kick', playerId: 'a' }],
    );
    expect(refusal(state, MASTER, { type: 'kick', playerId: 'a' })).toBe('not-allowed');
    expect(refusal(state, 'a', { type: 'leave' })).toBe('not-allowed');
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

describe('setup', () => {
  const custom = {
    name: '  Baker ',
    rule: 'Bakes.\n\n\n\nBread.',
    team: 'village',
    wakes: true,
  } as const;

  it('starts empty, with a two-minute timer and no sound', () => {
    expect(room().setup).toEqual({
      picks: [],
      ruleEdits: {},
      customRoles: [],
      wakeOrder: [],
      settings: { timerSeconds: 120, soundOn: false },
    });
  });

  it('adds and removes copies of a role', () => {
    const state = run(
      room(),
      [MASTER, { type: 'addPick', roleId: 'werewolf' }],
      [MASTER, { type: 'addPick', roleId: 'seer' }],
      [MASTER, { type: 'addPick', roleId: 'werewolf' }],
      [MASTER, { type: 'removePick', roleId: 'werewolf' }],
    );
    expect(state.setup.picks).toEqual(['werewolf', 'seer']);
  });

  it('refuses an unknown role, a role not picked, and more than the limit', () => {
    expect(refusal(room(), MASTER, { type: 'addPick', roleId: 'vampire' })).toBe('role-invalid');
    expect(refusal(room(), MASTER, { type: 'addPick', roleId: 'constructor' })).toBe(
      'role-invalid',
    );
    expect(refusal(room(), MASTER, { type: 'removePick', roleId: 'seer' })).toBe('not-allowed');
    const full: RoomState = {
      ...room(),
      setup: { ...room().setup, picks: Array.from({ length: PICKS_MAX }, () => 'villager') },
    };
    expect(refusal(full, MASTER, { type: 'addPick', roleId: 'villager' })).toBe('not-allowed');
  });

  it('keeps one cleaned rule text per edited role', () => {
    const state = run(room(), [MASTER, { type: 'editRule', roleId: 'seer', rule: ' Sees. ' }]);
    expect(state.setup.ruleEdits).toEqual({ seer: 'Sees.' });
  });

  it('refuses an empty or too long rule, or one for an unknown role', () => {
    expect(refusal(room(), MASTER, { type: 'editRule', roleId: 'seer', rule: ' \n ' })).toBe(
      'role-invalid',
    );
    expect(
      refusal(room(), MASTER, { type: 'editRule', roleId: 'seer', rule: 'x'.repeat(RULE_MAX + 1) }),
    ).toBe('role-invalid');
    expect(refusal(room(), MASTER, { type: 'editRule', roleId: 'nobody', rule: 'x' })).toBe(
      'role-invalid',
    );
  });

  it('makes custom roles with ids from the room, which can then be picked and edited', () => {
    const state = run(
      room(),
      [MASTER, { type: 'addCustomRole', role: custom }],
      [MASTER, { type: 'addCustomRole', role: { ...custom, name: 'Miller', wakes: false } }],
      [MASTER, { type: 'addPick', roleId: 'custom-1' }],
      [MASTER, { type: 'editRule', roleId: 'custom-0', rule: 'Bakes bread.' }],
    );
    expect(state.setup.customRoles).toEqual([
      { id: 'custom-0', name: 'Baker', rule: 'Bakes.\n\nBread.', team: 'village', wakes: true },
      { id: 'custom-1', name: 'Miller', rule: 'Bakes.\n\nBread.', team: 'village', wakes: false },
    ]);
    expect(state.setup.picks).toEqual(['custom-1']);
    expect(state.setup.ruleEdits).toEqual({ 'custom-0': 'Bakes bread.' });
  });

  it('refuses a custom role without a name or rule', () => {
    expect(refusal(room(), MASTER, { type: 'addCustomRole', role: { ...custom, name: ' ' } })).toBe(
      'role-invalid',
    );
    expect(refusal(room(), MASTER, { type: 'addCustomRole', role: { ...custom, rule: '' } })).toBe(
      'role-invalid',
    );
  });

  it('keeps a wake order of waking roles, without repeats', () => {
    const state = run(
      room(),
      [MASTER, { type: 'addCustomRole', role: custom }],
      [MASTER, { type: 'setWakeOrder', order: ['witch', 'custom-0', 'witch', 'seer'] }],
    );
    expect(state.setup.wakeOrder).toEqual(['witch', 'custom-0', 'seer']);
    expect(refusal(state, MASTER, { type: 'setWakeOrder', order: ['villager'] })).toBe(
      'role-invalid',
    );
  });

  it('keeps settings with a whole-second timer up to an hour', () => {
    const settings = { timerSeconds: 90, soundOn: true };
    expect(run(room(), [MASTER, { type: 'setSettings', settings }]).setup.settings).toEqual(
      settings,
    );
    for (const timerSeconds of [-1, 1.5, 3601]) {
      expect(
        refusal(room(), MASTER, { type: 'setSettings', settings: { timerSeconds, soundOn: true } }),
      ).toBe('not-allowed');
    }
  });

  it('is for the master only', () => {
    const seated = run(room(), ['a', { type: 'join', name: 'Minh' }]);
    const actions: RoomAction[] = [
      { type: 'addPick', roleId: 'seer' },
      { type: 'removePick', roleId: 'seer' },
      { type: 'editRule', roleId: 'seer', rule: 'x' },
      { type: 'addCustomRole', role: custom },
      { type: 'setWakeOrder', order: [] },
      { type: 'setSettings', settings: { timerSeconds: 0, soundOn: false } },
    ];
    for (const action of actions) {
      expect(refusal(seated, 'a', action)).toBe('not-master');
      expect(refusal(seated, 'z', action)).toBe('not-master');
    }
  });
});

describe('locks after the lobby', () => {
  it.each(['reveal', 'playing', 'finished'] as const)(
    'refuses every lobby action in %s',
    (status) => {
      const seated = run(room(), ['a', { type: 'join', name: 'Minh' }]);
      const locked: RoomState = { ...seated, status };
      expect(refusal(locked, 'b', { type: 'join', name: 'Lan' })).toBe('not-allowed');
      expect(refusal(locked, 'a', { type: 'leave' })).toBe('not-allowed');
      expect(refusal(locked, MASTER, { type: 'kick', playerId: 'a' })).toBe('not-allowed');
      expect(refusal(locked, MASTER, { type: 'setOpen', open: false })).toBe('not-allowed');
      expect(refusal(locked, MASTER, { type: 'addPick', roleId: 'seer' })).toBe('not-allowed');
      expect(refusal(locked, MASTER, { type: 'editRule', roleId: 'seer', rule: 'x' })).toBe(
        'not-allowed',
      );
      expect(
        refusal(locked, MASTER, {
          type: 'setSettings',
          settings: { timerSeconds: 60, soundOn: true },
        }),
      ).toBe('not-allowed');
    },
  );
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
      setup: state.setup,
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

  it('never sends the card set to a player', () => {
    const built = run(
      state,
      [MASTER, { type: 'addPick', roleId: 'seer' }],
      [MASTER, { type: 'editRule', roleId: 'seer', rule: 'Secret house rule' }],
      [
        MASTER,
        {
          type: 'addCustomRole',
          role: { name: 'Baker', rule: 'Bakes.', team: 'village', wakes: false },
        },
      ],
    );
    const view = buildPlayerView(built, connected, 'a');
    expect(view).not.toHaveProperty('setup');
    const text = JSON.stringify(view);
    for (const secret of ['seer', 'Secret house rule', 'Baker']) expect(text).not.toContain(secret);
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
