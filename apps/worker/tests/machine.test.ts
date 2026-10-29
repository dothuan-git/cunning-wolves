import { CUSTOM_ROLES_MAX, NOTE_MAX, PICKS_MAX, RULE_MAX, type RoomAction } from '@werewolf/shared';
import { describe, expect, it } from 'vitest';
import { apply, createRoom, seatedPlayers, type Random, type RoomState } from '../src/room/machine';
import { cryptoRandom } from '../src/room/random';
import { buildMasterView, buildPlayerView, buildSummary, buildView } from '../src/room/view';

const MASTER = 'master-id';
const PIN = '4321';
const NOW = 1_000;
/** Leaves every card where it is: the deal follows the pick order. */
const KEEP: Random = (below) => below - 1;

function room(): RoomState {
  return createRoom({
    id: 'mill',
    name: 'The mill',
    masterId: MASTER,
    masterName: 'Thuận',
    pin: PIN,
    now: 0,
  });
}

/** Applies actions in turn and fails the test if any is refused. */
function run(state: RoomState, ...steps: [actor: string, action: RoomAction][]): RoomState {
  return steps.reduce((current, [actor, action]) => {
    const result = apply(current, actor, action, NOW, KEEP);
    if (!result.ok) throw new Error(`${action.type} by ${actor} refused: ${result.error}`);
    if (!('state' in result)) throw new Error(`${action.type} by ${actor} deleted the room`);
    return result.state;
  }, state);
}

function refusal(state: RoomState, actor: string, action: RoomAction) {
  const result = apply(state, actor, action, NOW, KEEP);
  return result.ok ? null : result.error;
}

describe('join', () => {
  it('seats a player with a cleaned name', () => {
    const state = run(room(), ['a', { type: 'join', name: '  Minh   Anh ', pin: PIN }]);
    expect(seatedPlayers(state)).toEqual([
      { id: 'a', name: 'Minh Anh', joinedAt: NOW, kicked: false },
    ]);
  });

  it('refuses an empty or too long name', () => {
    expect(refusal(room(), 'a', { type: 'join', name: '   ', pin: PIN })).toBe('name-invalid');
    expect(refusal(room(), 'a', { type: 'join', name: 'x'.repeat(25), pin: PIN })).toBe(
      'name-invalid',
    );
  });

  it('refuses a name already in the room, ignoring case and accents', () => {
    const state = run(room(), ['a', { type: 'join', name: 'Đức', pin: PIN }]);
    expect(refusal(state, 'b', { type: 'join', name: 'duc', pin: PIN })).toBe('name-taken');
    expect(refusal(state, 'b', { type: 'join', name: 'THUAN', pin: PIN })).toBe('name-taken');
  });

  it('refuses while the room is closed', () => {
    const state = run(room(), [MASTER, { type: 'setOpen', open: false }]);
    expect(refusal(state, 'a', { type: 'join', name: 'Minh', pin: PIN })).toBe('room-closed');
  });

  it('refuses the master and a player who already has a seat', () => {
    expect(refusal(room(), MASTER, { type: 'join', name: 'Minh', pin: PIN })).toBe('not-allowed');
    const state = run(room(), ['a', { type: 'join', name: 'Minh', pin: PIN }]);
    expect(refusal(state, 'a', { type: 'join', name: 'Lan', pin: PIN })).toBe('not-allowed');
  });

  it('refuses once the game has moved past the lobby', () => {
    expect(
      refusal({ ...room(), status: 'playing' }, 'a', { type: 'join', name: 'Minh', pin: PIN }),
    ).toBe('not-allowed');
  });
});

describe('join PIN', () => {
  it('refuses a wrong or missing PIN', () => {
    expect(refusal(room(), 'a', { type: 'join', name: 'Minh', pin: '1234' })).toBe('pin-wrong');
    expect(refusal(room(), 'a', { type: 'join', name: 'Minh', pin: '' })).toBe('pin-wrong');
  });

  it('checks the room is open before the PIN', () => {
    const state = run(room(), [MASTER, { type: 'setOpen', open: false }]);
    expect(refusal(state, 'a', { type: 'join', name: 'Minh', pin: '1234' })).toBe('room-closed');
  });

  it('asks a removed player for the PIN again', () => {
    const state = run(
      room(),
      ['a', { type: 'join', name: 'Minh', pin: PIN }],
      [MASTER, { type: 'kick', playerId: 'a' }],
    );
    expect(refusal(state, 'a', { type: 'join', name: 'Minh', pin: '0000' })).toBe('pin-wrong');
  });

  it('lets anyone join a room saved before rooms had PINs', () => {
    const old = { ...room(), pin: null };
    expect(refusal(old, 'a', { type: 'join', name: 'Minh', pin: '' })).toBeNull();
  });
});

describe('hand over', () => {
  const lobby = () =>
    run(
      room(),
      ['a', { type: 'join', name: 'Minh', pin: PIN }],
      ['b', { type: 'join', name: 'Lan', pin: PIN }],
    );

  it('makes the player the narrator and seats the old narrator last', () => {
    const state = run(lobby(), [MASTER, { type: 'handOver', playerId: 'a' }]);
    expect(state.masterId).toBe('a');
    expect(state.masterName).toBe('Minh');
    expect(seatedPlayers(state)).toEqual([
      { id: 'b', name: 'Lan', joinedAt: NOW, kicked: false },
      { id: MASTER, name: 'Thuận', joinedAt: NOW, kicked: false },
    ]);
  });

  it('keeps the card set, PIN and open state', () => {
    const before = run(lobby(), [MASTER, { type: 'addPick', roleId: 'seer' }]);
    const after = run(before, [MASTER, { type: 'handOver', playerId: 'a' }]);
    expect(after.setup).toEqual(before.setup);
    expect(after.pin).toBe(PIN);
    expect(after.open).toBe(true);
  });

  it('gives the new narrator the master view, and the old one a seat without the card set', () => {
    const state = run(
      lobby(),
      [MASTER, { type: 'addPick', roleId: 'seer' }],
      [MASTER, { type: 'handOver', playerId: 'a' }],
    );
    expect(buildView(state, new Set(), 'a').kind).toBe('master');
    const old = buildView(state, new Set(), MASTER);
    expect(old).toMatchObject({ kind: 'player', seat: 'joined' });
    expect(JSON.stringify(old)).not.toContain(PIN);
    expect(old).not.toHaveProperty('setup');
  });

  it('lets only the new narrator act as master', () => {
    const state = run(lobby(), [MASTER, { type: 'handOver', playerId: 'a' }]);
    expect(refusal(state, MASTER, { type: 'setOpen', open: false })).toBe('not-master');
    expect(refusal(state, 'a', { type: 'setOpen', open: false })).toBeNull();
  });

  it('is for the master only', () => {
    expect(refusal(lobby(), 'b', { type: 'handOver', playerId: 'a' })).toBe('not-master');
  });

  it('refuses an unknown, removed or self target', () => {
    const state = run(lobby(), [MASTER, { type: 'kick', playerId: 'b' }]);
    expect(refusal(state, MASTER, { type: 'handOver', playerId: 'nobody' })).toBe('not-allowed');
    expect(refusal(state, MASTER, { type: 'handOver', playerId: 'b' })).toBe('not-allowed');
    expect(refusal(state, MASTER, { type: 'handOver', playerId: MASTER })).toBe('not-allowed');
  });

  it('refuses once the room has left the lobby', () => {
    for (const status of ['reveal', 'playing', 'finished'] as const) {
      expect(refusal({ ...lobby(), status }, MASTER, { type: 'handOver', playerId: 'a' })).toBe(
        'not-allowed',
      );
    }
  });
});

describe('delete room', () => {
  it('is allowed for the master in every state', () => {
    for (const status of ['lobby', 'reveal', 'playing', 'finished'] as const) {
      expect(apply({ ...room(), status }, MASTER, { type: 'deleteRoom' }, NOW, KEEP)).toEqual({
        ok: true,
        deleted: true,
      });
    }
  });

  it('is for the master only', () => {
    const state = run(room(), ['a', { type: 'join', name: 'Minh', pin: PIN }]);
    expect(refusal(state, 'a', { type: 'deleteRoom' })).toBe('not-master');
  });
});

describe('leave', () => {
  it('removes the seat', () => {
    const state = run(
      room(),
      ['a', { type: 'join', name: 'Minh', pin: PIN }],
      ['a', { type: 'leave' }],
    );
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
      ['a', { type: 'join', name: 'Minh', pin: PIN }],
      [MASTER, { type: 'kick', playerId: 'a' }],
    );
    expect(seatedPlayers(state)).toEqual([]);
    expect(state.players[0]?.kicked).toBe(true);
    expect(refusal(state, 'b', { type: 'join', name: 'Minh', pin: PIN })).toBeNull();
  });

  it('is for the master only', () => {
    const state = run(
      room(),
      ['a', { type: 'join', name: 'Minh', pin: PIN }],
      ['b', { type: 'join', name: 'Lan', pin: PIN }],
    );
    expect(refusal(state, 'b', { type: 'kick', playerId: 'a' })).toBe('not-master');
  });

  it('refuses an unknown or already removed player', () => {
    expect(refusal(room(), MASTER, { type: 'kick', playerId: 'nobody' })).toBe('not-allowed');
    const state = run(
      room(),
      ['a', { type: 'join', name: 'Minh', pin: PIN }],
      [MASTER, { type: 'kick', playerId: 'a' }],
    );
    expect(refusal(state, MASTER, { type: 'kick', playerId: 'a' })).toBe('not-allowed');
    expect(refusal(state, 'a', { type: 'leave' })).toBe('not-allowed');
  });

  it('lets a removed player join again while the room is open', () => {
    const state = run(
      room(),
      ['a', { type: 'join', name: 'Minh', pin: PIN }],
      [MASTER, { type: 'kick', playerId: 'a' }],
      [MASTER, { type: 'setOpen', open: false }],
    );
    expect(refusal(state, 'a', { type: 'join', name: 'Minh', pin: PIN })).toBe('room-closed');
    const reopened = run(
      state,
      [MASTER, { type: 'setOpen', open: true }],
      ['a', { type: 'join', name: 'Minh', pin: PIN }],
    );
    expect(seatedPlayers(reopened).map((player) => player.id)).toEqual(['a']);
  });
});

describe('setOpen', () => {
  it('closes and re-opens, keeping seats', () => {
    const closed = run(
      room(),
      ['a', { type: 'join', name: 'Minh', pin: PIN }],
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
    expect(refusal(room(), MASTER, { type: 'addPick', roleId: 'sheriff' })).toBe('role-invalid');
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

  it('refuses a custom role past the limit', () => {
    const steps = Array.from({ length: CUSTOM_ROLES_MAX }, (): [string, RoomAction] => [
      MASTER,
      { type: 'addCustomRole', role: custom },
    ]);
    const full = run(room(), ...steps);
    expect(full.setup.customRoles).toHaveLength(CUSTOM_ROLES_MAX);
    expect(refusal(full, MASTER, { type: 'addCustomRole', role: custom })).toBe('not-allowed');
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
    const seated = run(room(), ['a', { type: 'join', name: 'Minh', pin: PIN }]);
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
      const seated = run(room(), ['a', { type: 'join', name: 'Minh', pin: PIN }]);
      const locked: RoomState = { ...seated, status };
      expect(refusal(locked, 'b', { type: 'join', name: 'Lan', pin: PIN })).toBe('not-allowed');
      expect(refusal(locked, 'a', { type: 'leave' })).toBe('not-allowed');
      expect(refusal(locked, MASTER, { type: 'kick', playerId: 'a' })).toBe('not-allowed');
      expect(refusal(locked, MASTER, { type: 'setOpen', open: false })).toBe('not-allowed');
      expect(refusal(locked, MASTER, { type: 'addPick', roleId: 'seer' })).toBe('not-allowed');
      expect(refusal(locked, MASTER, { type: 'removePick', roleId: 'seer' })).toBe('not-allowed');
      expect(refusal(locked, MASTER, { type: 'editRule', roleId: 'seer', rule: 'x' })).toBe(
        'not-allowed',
      );
      expect(
        refusal(locked, MASTER, {
          type: 'addCustomRole',
          role: { name: 'Baker', rule: 'Bakes.', team: 'village', wakes: false },
        }),
      ).toBe('not-allowed');
      // The narrator's tools stay open while playing; see 'narrator tools in play'.
      const tools = status === 'playing' ? null : 'not-allowed';
      expect(refusal(locked, MASTER, { type: 'setWakeOrder', order: ['seer'] })).toBe(tools);
      expect(
        refusal(locked, MASTER, {
          type: 'setSettings',
          settings: { timerSeconds: 60, soundOn: true },
        }),
      ).toBe(tools);
    },
  );
});

/** Two players and a card set that matches them: seer for Minh, werewolf for Lan. */
function ready(): RoomState {
  return run(
    room(),
    ['a', { type: 'join', name: 'Minh', pin: PIN }],
    ['b', { type: 'join', name: 'Lan', pin: PIN }],
    [MASTER, { type: 'addPick', roleId: 'seer' }],
    [MASTER, { type: 'addPick', roleId: 'werewolf' }],
  );
}

describe('review', () => {
  it('shows the rules and closes the room when roles equal players', () => {
    const state = run(ready(), [MASTER, { type: 'review' }]);
    expect(state.status).toBe('reveal');
    expect(state.open).toBe(false);
  });

  it('refuses when the roles do not match the players', () => {
    const short = run(ready(), [MASTER, { type: 'removePick', roleId: 'seer' }]);
    expect(refusal(short, MASTER, { type: 'review' })).toBe('not-allowed');
    const extra = run(ready(), [MASTER, { type: 'addPick', roleId: 'witch' }]);
    expect(refusal(extra, MASTER, { type: 'review' })).toBe('not-allowed');
    const kicked = run(ready(), [MASTER, { type: 'kick', playerId: 'b' }]);
    expect(refusal(kicked, MASTER, { type: 'review' })).toBe('not-allowed');
  });

  it('refuses an empty room, even with nothing picked', () => {
    expect(refusal(room(), MASTER, { type: 'review' })).toBe('not-allowed');
  });

  it('refuses anyone but the master', () => {
    expect(refusal(ready(), 'a', { type: 'review' })).toBe('not-master');
  });
});

describe('back to setup', () => {
  it('returns to the lobby with the room still closed and the card set kept', () => {
    const reviewed = run(ready(), [MASTER, { type: 'review' }]);
    const state = run(reviewed, [MASTER, { type: 'backToSetup' }]);
    expect(state.status).toBe('lobby');
    expect(state.open).toBe(false);
    expect(state.setup).toEqual(reviewed.setup);
    // Setup works again.
    run(
      state,
      [MASTER, { type: 'addPick', roleId: 'witch' }],
      [MASTER, { type: 'kick', playerId: 'a' }],
    );
  });

  it('refuses outside the rules review, and from anyone but the master', () => {
    expect(refusal(ready(), MASTER, { type: 'backToSetup' })).toBe('not-allowed');
    const reviewed = run(ready(), [MASTER, { type: 'review' }]);
    expect(refusal(reviewed, 'a', { type: 'backToSetup' })).toBe('not-master');
    const playing = run(reviewed, [MASTER, { type: 'startGame' }]);
    expect(refusal(playing, MASTER, { type: 'backToSetup' })).toBe('not-allowed');
  });
});

describe('start game', () => {
  const reviewed = () => run(ready(), [MASTER, { type: 'review' }]);

  it('deals one card to each player in join order from the shuffled picks', () => {
    const state = run(reviewed(), [MASTER, { type: 'startGame' }]);
    expect(state.status).toBe('playing');
    expect(state.assignments).toEqual({ a: 'seer', b: 'werewolf' });
  });

  it('deals what the shuffle says', () => {
    // Swaps the last card with the first: Minh gets the werewolf.
    const result = apply(reviewed(), MASTER, { type: 'startGame' }, NOW, () => 0);
    expect('state' in result && result.state.assignments).toEqual({ a: 'werewolf', b: 'seer' });
  });

  it('deals every pick exactly once, for any shuffle', () => {
    const names = ['Ana', 'Bao', 'Chi', 'Dung', 'Em', 'Giang', 'Hoa'];
    const picks = ['seer', 'werewolf', 'werewolf', 'witch', 'villager', 'villager', 'hunter'];
    let state = room();
    names.forEach((name, index) => {
      state = run(state, [`p${String(index)}`, { type: 'join', name, pin: PIN }]);
    });
    for (const roleId of picks) state = run(state, [MASTER, { type: 'addPick', roleId }]);
    state = run(state, [MASTER, { type: 'review' }]);
    let seed = 7;
    const lcg: Random = (below) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % below;
    };
    const result = apply(state, MASTER, { type: 'startGame' }, NOW, lcg);
    if (!result.ok) throw new Error(result.error);
    if (!('state' in result)) throw new Error('startGame deleted the room');
    expect(Object.keys(result.state.assignments).sort()).toEqual(
      names.map((_, index) => `p${String(index)}`),
    );
    expect(Object.values(result.state.assignments).sort()).toEqual([...picks].sort());
  });

  it('refuses outside the rules review, and from anyone but the master', () => {
    expect(refusal(ready(), MASTER, { type: 'startGame' })).toBe('not-allowed');
    expect(refusal(reviewed(), 'a', { type: 'startGame' })).toBe('not-master');
    const playing = run(reviewed(), [MASTER, { type: 'startGame' }]);
    expect(refusal(playing, MASTER, { type: 'startGame' })).toBe('not-allowed');
    expect(refusal(playing, MASTER, { type: 'review' })).toBe('not-allowed');
  });
});

/** Minh holds the seer and Lan the werewolf, at Night 1. */
function playing(): RoomState {
  return run(ready(), [MASTER, { type: 'review' }], [MASTER, { type: 'startGame' }]);
}

const NIGHT_1 = { kind: 'night', number: 1 } as const;
const MORNING_1 = { kind: 'morning', number: 1 } as const;
const NIGHT_2 = { kind: 'night', number: 2 } as const;

describe('end phase', () => {
  it('starts at Night 1 and moves night, morning, night', () => {
    expect(playing().game).toEqual({ phase: NIGHT_1, deaths: {}, notes: {}, marks: {} });
    const state = run(
      playing(),
      [MASTER, { type: 'endPhase', phase: NIGHT_1 }],
      [MASTER, { type: 'endPhase', phase: MORNING_1 }],
    );
    expect(state.game?.phase).toEqual(NIGHT_2);
  });

  it('ends only the phase it names, so a repeated hold skips nothing', () => {
    const morning = run(playing(), [MASTER, { type: 'endPhase', phase: NIGHT_1 }]);
    expect(refusal(morning, MASTER, { type: 'endPhase', phase: NIGHT_1 })).toBe('not-allowed');
    expect(refusal(morning, MASTER, { type: 'endPhase', phase: NIGHT_2 })).toBe('not-allowed');
  });

  it('refuses before the game and from anyone but the master', () => {
    const reviewed = run(ready(), [MASTER, { type: 'review' }]);
    expect(refusal(reviewed, MASTER, { type: 'endPhase', phase: NIGHT_1 })).toBe('not-allowed');
    expect(refusal(playing(), 'a', { type: 'endPhase', phase: NIGHT_1 })).toBe('not-master');
  });
});

describe('toggle death', () => {
  it('marks a player dead in the current phase, and a second tap undoes it', () => {
    const morning = run(playing(), [MASTER, { type: 'endPhase', phase: NIGHT_1 }]);
    const dead = run(morning, [MASTER, { type: 'toggleDeath', playerId: 'a' }]);
    expect(dead.game?.deaths).toEqual({ a: MORNING_1 });
    const undone = run(dead, [MASTER, { type: 'toggleDeath', playerId: 'a' }]);
    expect(undone.game?.deaths).toEqual({});
  });

  it('refuses a player without a card, before the game, and from a player', () => {
    expect(refusal(playing(), MASTER, { type: 'toggleDeath', playerId: 'z' })).toBe('not-allowed');
    expect(refusal(playing(), MASTER, { type: 'toggleDeath', playerId: '__proto__' })).toBe(
      'not-allowed',
    );
    expect(refusal(ready(), MASTER, { type: 'toggleDeath', playerId: 'a' })).toBe('not-allowed');
    expect(refusal(playing(), 'a', { type: 'toggleDeath', playerId: 'b' })).toBe('not-master');
  });
});

describe('toggle mark', () => {
  /** Minh holds the witch, Lan the werewolf and Hoa the knight, at Night 1. */
  function marking(): RoomState {
    let state = room();
    for (const [id, name] of [
      ['a', 'Minh'],
      ['b', 'Lan'],
      ['c', 'Hoa'],
    ] as const) {
      state = run(state, [id, { type: 'join', name, pin: PIN }]);
    }
    for (const roleId of ['witch', 'werewolf', 'knight']) {
      state = run(state, [MASTER, { type: 'addPick', roleId }]);
    }
    return run(state, [MASTER, { type: 'review' }], [MASTER, { type: 'startGame' }]);
  }
  const mark = (playerId: string, id: string) =>
    ({ type: 'toggleMark', playerId, mark: id }) as const;

  it('marks a player in the current phase, and a second tap takes it off', () => {
    const morning = run(marking(), [MASTER, { type: 'endPhase', phase: NIGHT_1 }]);
    const used = run(morning, [MASTER, mark('a', 'heal-used')], [MASTER, mark('a', 'kill-used')]);
    expect(used.game?.marks).toEqual({ a: { 'heal-used': MORNING_1, 'kill-used': MORNING_1 } });
    const undone = run(used, [MASTER, mark('a', 'heal-used')], [MASTER, mark('a', 'kill-used')]);
    expect(undone.game?.marks).toEqual({});
  });

  it("gives a holder's mark only to that role's holder", () => {
    expect(refusal(marking(), MASTER, mark('b', 'heal-used'))).toBe('not-allowed');
  });

  it("offers a role's mark for others only while that role is dealt", () => {
    expect(run(marking(), [MASTER, mark('b', 'rusted')]).game?.marks).toEqual({
      b: { rusted: NIGHT_1 },
    });
    expect(refusal(playing(), MASTER, mark('b', 'rusted'))).toBe('not-allowed');
  });

  it('moves a single mark to the newly marked player', () => {
    const lan = run(marking(), [MASTER, mark('a', 'heal-used')], [MASTER, mark('b', 'sheriff')]);
    const moved = run(lan, [MASTER, mark('a', 'sheriff')]);
    expect(moved.game?.marks).toEqual({ a: { 'heal-used': NIGHT_1, sheriff: NIGHT_1 } });
  });

  it('refuses an unknown mark, a player without a card, before the game, and from a player', () => {
    expect(refusal(marking(), MASTER, mark('a', 'cursed'))).toBe('not-allowed');
    expect(refusal(marking(), MASTER, mark('a', '__proto__'))).toBe('not-allowed');
    expect(refusal(marking(), MASTER, mark('z', 'sheriff'))).toBe('not-allowed');
    expect(refusal(marking(), MASTER, mark('__proto__', 'sheriff'))).toBe('not-allowed');
    expect(refusal(ready(), MASTER, mark('a', 'sheriff'))).toBe('not-allowed');
    expect(refusal(marking(), 'a', mark('b', 'sheriff'))).toBe('not-master');
    const finished = run(marking(), [MASTER, { type: 'finishGame' }]);
    expect(refusal(finished, MASTER, mark('a', 'sheriff'))).toBe('not-allowed');
  });
});

describe('set note', () => {
  const note = (night: number, playerId: string, text: string) =>
    ({ type: 'setNote', night, playerId, text }) as const;

  it('keeps a cleaned note per night and player, and empty text removes it', () => {
    const noted = run(playing(), [MASTER, note(1, 'a', '  Saw   Lan. ')]);
    expect(noted.game?.notes).toEqual({ 1: { a: 'Saw Lan.' } });
    const both = run(noted, [MASTER, note(1, 'b', 'Woke.')]);
    expect(both.game?.notes).toEqual({ 1: { a: 'Saw Lan.', b: 'Woke.' } });
    const cleared = run(both, [MASTER, note(1, 'a', '  ')], [MASTER, note(1, 'b', '')]);
    expect(cleared.game?.notes).toEqual({});
  });

  it('edits an earlier night, but not one that has not started', () => {
    const night2 = run(
      playing(),
      [MASTER, { type: 'endPhase', phase: NIGHT_1 }],
      [MASTER, { type: 'endPhase', phase: MORNING_1 }],
    );
    expect(run(night2, [MASTER, note(1, 'a', 'Later.')]).game?.notes).toEqual({
      1: { a: 'Later.' },
    });
    expect(refusal(night2, MASTER, note(3, 'a', 'Soon.'))).toBe('not-allowed');
    expect(refusal(night2, MASTER, note(0, 'a', 'Never.'))).toBe('not-allowed');
    expect(refusal(night2, MASTER, note(1.5, 'a', 'Half.'))).toBe('not-allowed');
  });

  it('keeps the night of a death, but no later night', () => {
    const died = run(playing(), [MASTER, { type: 'toggleDeath', playerId: 'a' }]);
    run(died, [MASTER, note(1, 'a', 'Bitten.')]);
    const night2 = run(
      died,
      [MASTER, { type: 'endPhase', phase: NIGHT_1 }],
      [MASTER, { type: 'endPhase', phase: MORNING_1 }],
    );
    expect(refusal(night2, MASTER, note(2, 'a', 'Ghost.'))).toBe('not-allowed');
  });

  it('refuses a long note, a player without a card, and anyone but the master', () => {
    run(playing(), [MASTER, note(1, 'a', 'x'.repeat(NOTE_MAX))]);
    expect(refusal(playing(), MASTER, note(1, 'a', 'x'.repeat(NOTE_MAX + 1)))).toBe('not-allowed');
    expect(refusal(playing(), MASTER, note(1, 'z', 'Who?'))).toBe('not-allowed');
    expect(refusal(playing(), 'a', note(1, 'a', 'Me.'))).toBe('not-master');
    expect(refusal(ready(), MASTER, note(1, 'a', 'Early.'))).toBe('not-allowed');
  });
});

describe('narrator tools in play', () => {
  it('keeps wake order, timer and sound open, and the card set locked', () => {
    const state = run(
      playing(),
      [MASTER, { type: 'setWakeOrder', order: ['werewolf', 'seer'] }],
      [MASTER, { type: 'setSettings', settings: { timerSeconds: 30, soundOn: true } }],
    );
    expect(state.setup.wakeOrder).toEqual(['werewolf', 'seer']);
    expect(state.setup.settings).toEqual({ timerSeconds: 30, soundOn: true });
    expect(refusal(state, MASTER, { type: 'addPick', roleId: 'seer' })).toBe('not-allowed');
    expect(refusal(state, MASTER, { type: 'editRule', roleId: 'seer', rule: 'x' })).toBe(
      'not-allowed',
    );
    expect(refusal(state, 'a', { type: 'setWakeOrder', order: [] })).toBe('not-master');
  });
});

describe('finish and play again', () => {
  it('finishes the game and keeps the deal and marks for the summary', () => {
    const marked = run(playing(), [MASTER, { type: 'toggleDeath', playerId: 'a' }]);
    const finished = run(marked, [MASTER, { type: 'finishGame' }]);
    expect(finished.status).toBe('finished');
    expect(finished.assignments).toEqual(marked.assignments);
    expect(finished.game).toEqual(marked.game);
  });

  it('locks the game once finished', () => {
    const finished = run(playing(), [MASTER, { type: 'finishGame' }]);
    expect(refusal(finished, MASTER, { type: 'endPhase', phase: NIGHT_1 })).toBe('not-allowed');
    expect(refusal(finished, MASTER, { type: 'toggleDeath', playerId: 'a' })).toBe('not-allowed');
    expect(refusal(finished, MASTER, { type: 'finishGame' })).toBe('not-allowed');
    expect(refusal(finished, MASTER, { type: 'startGame' })).toBe('not-allowed');
  });

  it('goes back to Setup with the same players and card set, closed, and deals again', () => {
    const finished = run(
      playing(),
      [MASTER, { type: 'setNote', night: 1, playerId: 'a', text: 'Saw.' }],
      [MASTER, { type: 'toggleMark', playerId: 'a', mark: 'sheriff' }],
      [MASTER, { type: 'finishGame' }],
    );
    const again = run(finished, [MASTER, { type: 'playAgain' }]);
    expect(again.status).toBe('lobby');
    expect(again.open).toBe(false);
    expect(again.players).toEqual(finished.players);
    expect(again.setup).toEqual(finished.setup);
    expect(again.assignments).toEqual({});
    expect(again.game).toBeNull();
    // Nothing from the old game reaches a phone in the next lobby.
    const view = buildPlayerView(again, new Set(['a']), 'a');
    expect(view.card).toBeNull();
    expect(view.reveal).toBeNull();
    expect(view.roles).toEqual([]);
    const second = run(again, [MASTER, { type: 'review' }], [MASTER, { type: 'startGame' }]);
    expect(second.game).toEqual({ phase: NIGHT_1, deaths: {}, notes: {}, marks: {} });
    expect(Object.keys(second.assignments).sort()).toEqual(['a', 'b']);
  });

  it('refuses outside their state, and from anyone but the master', () => {
    expect(refusal(ready(), MASTER, { type: 'finishGame' })).toBe('not-allowed');
    expect(refusal(playing(), 'a', { type: 'finishGame' })).toBe('not-master');
    expect(refusal(playing(), MASTER, { type: 'playAgain' })).toBe('not-allowed');
    const finished = run(playing(), [MASTER, { type: 'finishGame' }]);
    expect(refusal(finished, 'a', { type: 'playAgain' })).toBe('not-master');
  });
});

describe('views', () => {
  const state = run(
    room(),
    ['a', { type: 'join', name: 'Minh', pin: PIN }],
    ['b', { type: 'join', name: 'Lan', pin: PIN }],
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
      pin: PIN,
      assignments: [],
      game: null,
    });
  });

  it('never sends the PIN to a player', () => {
    for (const viewer of ['a', 'b', 'c']) {
      expect(JSON.stringify(buildPlayerView(state, connected, viewer))).not.toContain(PIN);
    }
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

  it('shows seated players the rules from the review on, but nobody else', () => {
    const reviewed = run(
      ready(),
      [MASTER, { type: 'editRule', roleId: 'seer', rule: 'House rule' }],
      [MASTER, { type: 'review' }],
    );
    const view = buildPlayerView(reviewed, connected, 'a');
    expect(view.roles.map(({ role, count }) => [role.id, count])).toEqual([
      ['seer', 1],
      ['werewolf', 1],
    ]);
    expect(view.roles[0]?.role.rule).toEqual({ vi: 'House rule', en: 'House rule' });
    expect(view.card).toBeNull();
    expect(view.reveal).toBeNull();
    expect(buildPlayerView(reviewed, connected, 'c').roles).toEqual([]);
    expect(buildPlayerView(ready(), connected, 'a').roles).toEqual([]);
  });

  it('gives each player only their own card', () => {
    const playing = run(ready(), [MASTER, { type: 'review' }], [MASTER, { type: 'startGame' }]);
    const minh = buildPlayerView(playing, connected, 'a');
    const lan = buildPlayerView(playing, connected, 'b');
    expect(minh.card?.id).toBe('seer');
    expect(lan.card?.id).toBe('werewolf');
    for (const view of [minh, lan]) {
      expect(view).not.toHaveProperty('assignments');
      expect(view).not.toHaveProperty('setup');
      // Nothing ties another player's id to a role.
      expect(Object.keys(view)).toEqual([
        'kind',
        'you',
        'room',
        'players',
        'seat',
        'roles',
        'card',
        'reveal',
      ]);
      // Nobody else's role until the game is finished.
      expect(view.reveal).toBeNull();
    }
    expect(buildPlayerView(playing, connected, 'c').card).toBeNull();
    expect(buildMasterView(playing, connected).assignments).toEqual([
      { playerId: 'a', roleId: 'seer' },
      { playerId: 'b', roleId: 'werewolf' },
    ]);
  });

  it('shows the narrator the marks, and no player any of them', () => {
    const marked = run(
      playing(),
      [MASTER, { type: 'toggleDeath', playerId: 'b' }],
      [MASTER, { type: 'setNote', night: 1, playerId: 'a', text: 'Secret note' }],
      [MASTER, { type: 'toggleMark', playerId: 'a', mark: 'sheriff' }],
    );
    expect(buildMasterView(marked, connected).game).toEqual({
      phase: NIGHT_1,
      deaths: { b: NIGHT_1 },
      notes: { 1: { a: 'Secret note' } },
      marks: { a: { sheriff: NIGHT_1 } },
    });
    for (const viewer of ['a', 'b', 'c']) {
      const view = buildPlayerView(marked, connected, viewer);
      expect(view).not.toHaveProperty('game');
      expect(JSON.stringify(view)).not.toContain('Secret note');
      expect(JSON.stringify(view)).not.toContain('sheriff');
    }
  });

  it('shows seated players every role and the marks once finished, and nobody else', () => {
    const finished = run(
      playing(),
      [MASTER, { type: 'toggleDeath', playerId: 'b' }],
      [MASTER, { type: 'setNote', night: 1, playerId: 'a', text: 'Saw.' }],
      [MASTER, { type: 'toggleMark', playerId: 'a', mark: 'sheriff' }],
      [MASTER, { type: 'finishGame' }],
    );
    const reveal = {
      assignments: [
        { playerId: 'a', roleId: 'seer' },
        { playerId: 'b', roleId: 'werewolf' },
      ],
      game: {
        phase: NIGHT_1,
        deaths: { b: NIGHT_1 },
        notes: { 1: { a: 'Saw.' } },
        marks: { a: { sheriff: NIGHT_1 } },
      },
    };
    expect(buildPlayerView(finished, connected, 'a').reveal).toEqual(reveal);
    expect(buildPlayerView(finished, connected, 'b').reveal).toEqual(reveal);
    expect(buildPlayerView(finished, connected, 'c').reveal).toBeNull();
    const kicked = run(
      ready(),
      [MASTER, { type: 'kick', playerId: 'b' }],
      [MASTER, { type: 'removePick', roleId: 'werewolf' }],
      [MASTER, { type: 'review' }],
      [MASTER, { type: 'startGame' }],
      [MASTER, { type: 'finishGame' }],
    );
    expect(buildPlayerView(kicked, connected, 'b').reveal).toBeNull();
  });

  it('gives a kicked phone no rules and no card', () => {
    const playing = run(
      ready(),
      [MASTER, { type: 'kick', playerId: 'b' }],
      [MASTER, { type: 'removePick', roleId: 'werewolf' }],
      [MASTER, { type: 'review' }],
      [MASTER, { type: 'startGame' }],
    );
    const kicked = buildPlayerView(playing, connected, 'b');
    expect(kicked.roles).toEqual([]);
    expect(kicked.card).toBeNull();
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

describe('cryptoRandom', () => {
  it('stays in range and reaches every value', () => {
    const seen = new Set<number>();
    for (let draw = 0; draw < 300; draw += 1) {
      const value = cryptoRandom(3);
      expect(Number.isInteger(value) && value >= 0 && value < 3).toBe(true);
      seen.add(value);
    }
    expect(seen.size).toBe(3);
    expect(cryptoRandom(1)).toBe(0);
  });

  it('refuses a range it cannot draw from', () => {
    expect(() => cryptoRandom(0)).toThrow();
    expect(() => cryptoRandom(1.5)).toThrow();
  });
});
