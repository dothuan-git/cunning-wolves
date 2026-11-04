import {
  canNoteNight,
  cleanName,
  cleanRule,
  CUSTOM_ROLES_MAX,
  currentRole,
  DEFAULT_SETTINGS,
  GYPSY_QUESTIONS,
  GYPSY_ROLE_ID,
  isValidName,
  offersNewRoles,
  NAME_MAX,
  nameKey,
  nextPhase,
  nextQuestionDeck,
  NOTE_MAX,
  PICKS_MAX,
  questionOffer,
  ROLE_NAME_MAX,
  ROLE_POOL,
  roomRoles,
  RULE_MAX,
  TIMER_MAX,
  type ActionNote,
  type GameState,
  type Phase,
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
  /** The join PIN; null for a room saved before rooms had PINs, which joins without one */
  pin: string | null;
  createdAt: number;
  lastActiveAt: number;
  /** In the order they joined */
  players: Player[];
  setup: RoomSetup;
  /** Player id → the role id dealt to them at Start game; empty before */
  assignments: Record<string, string>;
  /** What the narrator marks while playing; null before Start game */
  game: GameState | null;
}

export type ApplyResult =
  | { ok: true; state: RoomState }
  /** The master deleted the room; the caller removes it for good */
  | { ok: true; deleted: true }
  | { ok: false; error: ServerErrorCode };

type SetupResult = { ok: true; setup: RoomSetup } | { ok: false; error: ServerErrorCode };

const refuse = (error: ServerErrorCode) => ({ ok: false, error }) as const;

/** A whole number from 0 up to, not including, `below`. Injected so `apply` stays pure. */
export type Random = (below: number) => number;

export function createRoom(input: {
  id: string;
  name: string;
  masterId: string;
  masterName: string;
  pin: string;
  now: number;
}): RoomState {
  return {
    id: input.id,
    name: input.name,
    status: 'lobby',
    open: true,
    masterId: input.masterId,
    masterName: input.masterName,
    pin: input.pin,
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
    game: null,
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
      if (state.pin !== null && action.pin !== state.pin) return refuse('pin-wrong');
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
    case 'handOver': {
      if (!isMaster) return refuse('not-master');
      const target = state.players.find((player) => player.id === action.playerId);
      if (!target || target.kicked || state.status !== 'lobby') return refuse('not-allowed');
      // One swap: the player takes the narrator's place, and the narrator takes a seat at the end.
      const others = state.players.filter((player) => player.id !== target.id);
      const seat = { id: state.masterId, name: state.masterName, joinedAt: now, kicked: false };
      return {
        ok: true,
        state: {
          ...state,
          masterId: target.id,
          masterName: target.name,
          players: [...others, seat],
        },
      };
    }
    case 'deleteRoom': {
      if (!isMaster) return refuse('not-master');
      return { ok: true, deleted: true };
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
      // The card set is locked once the rules are reviewed. The narrator's tools (wake order,
      // timer, sound) can still change while reviewing and playing.
      const narratorTool = action.type === 'setWakeOrder' || action.type === 'setSettings';
      const allowed =
        state.status === 'lobby' ||
        (narratorTool && (state.status === 'reveal' || state.status === 'playing'));
      if (!allowed) return refuse('not-allowed');
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
      const game: GameState = {
        phase: { kind: 'night', number: 1 },
        deaths: {},
        notes: {},
        newRoles: {},
        actions: [],
        // After the deal, so the questions never change who gets which card. Every game gets a
        // deck, because a player can become the Gypsy later.
        questionDeck: shuffle(
          GYPSY_QUESTIONS.map((question) => question.id),
          random,
        ),
      };
      return { ok: true, state: { ...state, status: 'playing', assignments, game } };
    }
    case 'finishGame': {
      if (!isMaster) return refuse('not-master');
      if (state.status !== 'playing') return refuse('not-allowed');
      // The deal and the game stay for the summary.
      return { ok: true, state: { ...state, status: 'finished' } };
    }
    case 'playAgain': {
      if (!isMaster) return refuse('not-master');
      if (state.status !== 'finished') return refuse('not-allowed');
      // Same seats and card set; the room stays as closed as it was.
      return { ok: true, state: { ...state, status: 'lobby', assignments: {}, game: null } };
    }
    case 'endPhase':
    case 'toggleDeath':
    case 'setRole':
    case 'pickQuestion':
    case 'setNote': {
      if (!isMaster) return refuse('not-master');
      if (state.status !== 'playing' || !state.game) return refuse('not-allowed');
      // A new role is any pool role (the Thief's extra cards are not dealt) or a picked custom one.
      const roleIds = [...ROLE_POOL.map((role) => role.id), ...state.setup.picks];
      const result = applyGame(state.game, state.assignments, roleIds, action);
      return result.ok ? { ok: true, state: { ...state, game: result.game } } : result;
    }
  }
}

type GameAction = Extract<
  RoomAction,
  { type: 'endPhase' | 'toggleDeath' | 'setRole' | 'pickQuestion' | 'setNote' }
>;
type GameResult = { ok: true; game: GameState } | { ok: false; error: ServerErrorCode };

const samePhase = (a: Phase, b: Phase) => a.kind === b.kind && a.number === b.number;

/** The action notes without the one a new choice replaces: this player's, of this type, this phase. */
function withoutPhaseNote(
  game: GameState,
  playerId: string,
  type: ActionNote['type'],
): ActionNote[] {
  return game.actions.filter(
    (note) =>
      note.type !== type || note.playerId !== playerId || !samePhase(note.phase, game.phase),
  );
}

/** The narrator's changes while playing. Who may make them is checked by `apply`. */
function applyGame(
  game: GameState,
  assignments: Record<string, string>,
  roleIds: readonly string[],
  action: GameAction,
): GameResult {
  switch (action.type) {
    case 'endPhase': {
      const { phase } = game;
      // A hold that arrives twice ends one phase, not two.
      if (action.phase.kind !== phase.kind || action.phase.number !== phase.number) {
        return refuse('not-allowed');
      }
      const next = nextPhase(phase);
      const picked = game.actions.flatMap((note) =>
        note.type === 'question' ? [note.question] : [],
      );
      const questionDeck =
        next.kind === 'night' ? nextQuestionDeck(game.questionDeck, picked) : game.questionDeck;
      return { ok: true, game: { ...game, phase: next, questionDeck } };
    }
    case 'toggleDeath': {
      const { playerId } = action;
      if (!Object.hasOwn(assignments, playerId)) return refuse('not-allowed');
      if (Object.hasOwn(game.deaths, playerId)) {
        const deaths = Object.fromEntries(
          Object.entries(game.deaths).filter(([id]) => id !== playerId),
        );
        return { ok: true, game: { ...game, deaths } };
      }
      // fromEntries, so an id like `__proto__` stays an own key.
      const deaths = { ...game.deaths, ...Object.fromEntries([[playerId, game.phase]]) };
      return { ok: true, game: { ...game, deaths } };
    }
    case 'setRole': {
      const { playerId } = action;
      const dealtRole = Object.hasOwn(assignments, playerId) ? assignments[playerId] : undefined;
      if (dealtRole === undefined || !offersNewRoles(Object.values(assignments))) {
        return refuse('not-allowed');
      }
      const others = Object.fromEntries(
        Object.entries(game.newRoles).filter(([id]) => id !== playerId),
      );
      const role = action.roleId ?? dealtRole;
      if (role !== dealtRole && !roleIds.includes(role)) return refuse('not-allowed');
      const newRoles =
        role === dealtRole ? others : { ...others, [playerId]: { role, phase: game.phase } };
      const kept = withoutPhaseNote(game, playerId, 'role');
      // Landing back on the role this phase began with undoes the change, so it leaves no note.
      const roleAtStart =
        kept
          .flatMap((note) =>
            note.type === 'role' && note.playerId === playerId ? [note.role] : [],
          )
          .at(-1) ?? dealtRole;
      const actions: ActionNote[] =
        role === roleAtStart
          ? kept
          : [...kept, { type: 'role', playerId, phase: game.phase, role }];
      return { ok: true, game: { ...game, newRoles, actions } };
    }
    case 'pickQuestion': {
      const { playerId, questionId } = action;
      const dealtRole = Object.hasOwn(assignments, playerId) ? assignments[playerId] : undefined;
      if (dealtRole === undefined || game.phase.kind !== 'night') return refuse('not-allowed');
      const kept = withoutPhaseNote(game, playerId, 'question');
      // Before the Gypsy check: a pick must come off a player made the Gypsy by mistake.
      if (questionId === null) return { ok: true, game: { ...game, actions: kept } };
      if (currentRole(playerId, dealtRole, game.newRoles) !== GYPSY_ROLE_ID) {
        return refuse('not-allowed');
      }
      const death = Object.hasOwn(game.deaths, playerId) ? game.deaths[playerId] : undefined;
      if (!canNoteNight(death, game.phase.number)) return refuse('not-allowed');
      if (!questionOffer(game.questionDeck).includes(questionId)) return refuse('not-allowed');
      const note: ActionNote = {
        type: 'question',
        playerId,
        phase: game.phase,
        question: questionId,
      };
      return { ok: true, game: { ...game, actions: [...kept, note] } };
    }
    case 'setNote': {
      const { night, playerId } = action;
      if (!Object.hasOwn(assignments, playerId)) return refuse('not-allowed');
      if (!Number.isInteger(night) || night < 1 || night > game.phase.number) {
        return refuse('not-allowed');
      }
      const death = Object.hasOwn(game.deaths, playerId) ? game.deaths[playerId] : undefined;
      if (!canNoteNight(death, night)) return refuse('not-allowed');
      const text = cleanRule(action.text);
      if (text.length > NOTE_MAX) return refuse('not-allowed');
      const others = Object.fromEntries(
        Object.entries(game.notes[night] ?? {}).filter(([id]) => id !== playerId),
      );
      const byPlayer: Record<string, string> = text ? { ...others, [playerId]: text } : others;
      const notes = Object.fromEntries(
        Object.entries({ ...game.notes, [night]: byPlayer }).filter(
          ([, entries]) => Object.keys(entries).length > 0,
        ),
      );
      return { ok: true, game: { ...game, notes } };
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
