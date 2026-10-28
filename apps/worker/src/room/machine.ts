import {
  cleanName,
  cleanRule,
  CUSTOM_ROLES_MAX,
  DEFAULT_SETTINGS,
  isValidName,
  NAME_MAX,
  nameKey,
  PICKS_MAX,
  ROLE_NAME_MAX,
  roomRoles,
  RULE_MAX,
  TIMER_MAX,
  type RoomAction,
  type RoomSetup,
  type RoomStatus,
  type ServerErrorCode,
} from '@werewolf/shared';

export interface Player {
  /** Device id */
  id: string;
  name: string;
  joinedAt: number;
  /** Removed by the master; the row stays so that phone is told why */
  kicked: boolean;
}

/** Everything the room knows. Never sent as is; see view.ts. */
export interface RoomState {
  id: string;
  name: string;
  status: RoomStatus;
  open: boolean;
  masterId: string;
  masterName: string;
  createdAt: number;
  lastActiveAt: number;
  /** In the order they joined */
  players: Player[];
  setup: RoomSetup;
  /** Player id → the role id dealt to them at Start game; empty before */
  assignments: Record<string, string>;
}

export type ApplyResult = { ok: true; state: RoomState } | { ok: false; error: ServerErrorCode };

type SetupResult = { ok: true; setup: RoomSetup } | { ok: false; error: ServerErrorCode };

const refuse = (error: ServerErrorCode) => ({ ok: false, error }) as const;

/** A whole number from 0 up to, not including, `below`. Injected so `apply` stays pure. */
export type Random = (below: number) => number;

export function createRoom(input: {
  id: string;
  name: string;
  masterId: string;
  masterName: string;
  now: number;
}): RoomState {
  return {
    id: input.id,
    name: input.name,
    status: 'lobby',
    open: true,
    masterId: input.masterId,
    masterName: input.masterName,
    createdAt: input.now,
    lastActiveAt: input.now,
    players: [],
    setup: {
      picks: [],
      ruleEdits: {},
      customRoles: [],
      wakeOrder: [],
      settings: { ...DEFAULT_SETTINGS },
    },
    assignments: {},
  };
}

export function seatedPlayers(state: RoomState): Player[] {
  return state.players.filter((player) => !player.kicked);
}

/** One role for each seated player, and at least one player. */
function cardsMatchPlayers(state: RoomState): boolean {
  const count = seatedPlayers(state).length;
  return count > 0 && state.setup.picks.length === count;
}

/** Fisher–Yates: every order of the picks is equally likely. */
function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = random(index + 1);
    const item = result[index];
    const swap = result[other];
    if (item === undefined || swap === undefined)
      throw new Error(`shuffle: bad index ${String(other)}`);
    result[index] = swap;
    result[other] = item;
  }
  return result;
}

/**
 * The room's rules: every change to a room goes through here. Returns the new state, or why the
 * action is refused. Pure, so each rule is tested without a socket.
 */
export function apply(
  state: RoomState,
  actorId: string,
  action: RoomAction,
  now: number,
  random: Random,
): ApplyResult {
  const isMaster = actorId === state.masterId;
  const own = state.players.find((player) => player.id === actorId);

  switch (action.type) {
    case 'join': {
      if (isMaster || (own && !own.kicked) || state.status !== 'lobby')
        return refuse('not-allowed');
      if (!state.open) return refuse('room-closed');
      const name = cleanName(action.name);
      if (!isValidName(name, NAME_MAX)) return refuse('name-invalid');
      const key = nameKey(name);
      const taken = [state.masterName, ...seatedPlayers(state).map((player) => player.name)].some(
        (other) => nameKey(other) === key,
      );
      if (taken) return refuse('name-taken');
      // A kicked phone joining again gets a fresh seat at the end of the list.
      const others = state.players.filter((player) => player.id !== actorId);
      return {
        ok: true,
        state: {
          ...state,
          players: [...others, { id: actorId, name, joinedAt: now, kicked: false }],
        },
      };
    }
    case 'leave': {
      if (!own || own.kicked || state.status !== 'lobby') return refuse('not-allowed');
      return {
        ok: true,
        state: { ...state, players: state.players.filter((player) => player.id !== actorId) },
      };
    }
    case 'kick': {
      if (!isMaster) return refuse('not-master');
      const target = state.players.find((player) => player.id === action.playerId);
      if (!target || target.kicked || state.status !== 'lobby') return refuse('not-allowed');
      return {
        ok: true,
        state: {
          ...state,
          players: state.players.map((player) =>
            player.id === target.id ? { ...player, kicked: true } : player,
          ),
        },
      };
    }
    case 'setOpen': {
      if (!isMaster) return refuse('not-master');
      if (state.status !== 'lobby') return refuse('not-allowed');
      return { ok: true, state: { ...state, open: action.open } };
    }
    case 'addPick':
    case 'removePick':
    case 'editRule':
    case 'addCustomRole':
    case 'setWakeOrder':
    case 'setSettings': {
      if (!isMaster) return refuse('not-master');
      // The card set and settings are locked once the rules are reviewed.
      if (state.status !== 'lobby') return refuse('not-allowed');
      const result = applySetup(state.setup, action);
      return result.ok ? { ok: true, state: { ...state, setup: result.setup } } : result;
    }
    case 'review': {
      if (!isMaster) return refuse('not-master');
      if (state.status !== 'lobby' || !cardsMatchPlayers(state)) return refuse('not-allowed');
      return { ok: true, state: { ...state, status: 'reveal', open: false } };
    }
    case 'backToSetup': {
      if (!isMaster) return refuse('not-master');
      if (state.status !== 'reveal') return refuse('not-allowed');
      // The room stays closed; the master can re-open it from Setup.
      return { ok: true, state: { ...state, status: 'lobby' } };
    }
    case 'startGame': {
      if (!isMaster) return refuse('not-master');
      if (state.status !== 'reveal' || !cardsMatchPlayers(state)) return refuse('not-allowed');
      const cards = shuffle(state.setup.picks, random);
      const assignments: Record<string, string> = {};
      seatedPlayers(state).forEach((player, index) => {
        const card = cards[index];
        if (card === undefined) throw new Error('startGame: fewer cards than players');
        assignments[player.id] = card;
      });
      return { ok: true, state: { ...state, status: 'playing', assignments } };
    }
  }
}

type SetupAction = Extract<
  RoomAction,
  { type: 'addPick' | 'removePick' | 'editRule' | 'addCustomRole' | 'setWakeOrder' | 'setSettings' }
>;

/** The master's changes to the card set. Who may make them is checked by `apply`. */
function applySetup(setup: RoomSetup, action: SetupAction): SetupResult {
  const roles = roomRoles(setup);
  const known = (id: string) => roles.some((role) => role.id === id);

  switch (action.type) {
    case 'addPick': {
      if (!known(action.roleId)) return refuse('role-invalid');
      if (setup.picks.length >= PICKS_MAX) return refuse('not-allowed');
      return { ok: true, setup: { ...setup, picks: [...setup.picks, action.roleId] } };
    }
    case 'removePick': {
      const index = setup.picks.lastIndexOf(action.roleId);
      if (index < 0) return refuse('not-allowed');
      return {
        ok: true,
        setup: { ...setup, picks: setup.picks.filter((_, pick) => pick !== index) },
      };
    }
    case 'editRule': {
      if (!known(action.roleId)) return refuse('role-invalid');
      const rule = cleanRule(action.rule);
      if (!isValidName(rule, RULE_MAX)) return refuse('role-invalid');
      return {
        ok: true,
        setup: { ...setup, ruleEdits: { ...setup.ruleEdits, [action.roleId]: rule } },
      };
    }
    case 'addCustomRole': {
      if (setup.customRoles.length >= CUSTOM_ROLES_MAX) return refuse('not-allowed');
      const name = cleanName(action.role.name);
      const rule = cleanRule(action.role.rule);
      if (!isValidName(name, ROLE_NAME_MAX) || !isValidName(rule, RULE_MAX)) {
        return refuse('role-invalid');
      }
      // Ids are never reused: custom roles can't be deleted, so the count only grows.
      const id = `custom-${String(setup.customRoles.length)}`;
      const role = { id, name, rule, team: action.role.team, wakes: action.role.wakes };
      return { ok: true, setup: { ...setup, customRoles: [...setup.customRoles, role] } };
    }
    case 'setWakeOrder': {
      const waking = new Set(
        roles.filter((role) => role.defaultWakeOrder !== null).map((role) => role.id),
      );
      const order = [...new Set(action.order)];
      if (!order.every((id) => waking.has(id))) return refuse('role-invalid');
      return { ok: true, setup: { ...setup, wakeOrder: order } };
    }
    case 'setSettings': {
      const { timerSeconds, soundOn } = action.settings;
      if (!Number.isInteger(timerSeconds) || timerSeconds < 0 || timerSeconds > TIMER_MAX) {
        return refuse('not-allowed');
      }
      return { ok: true, setup: { ...setup, settings: { timerSeconds, soundOn } } };
    }
  }
}
