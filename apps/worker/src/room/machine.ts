import {
  cleanName,
  isValidName,
  NAME_MAX,
  nameKey,
  type RoomAction,
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
}

export type ApplyResult = { ok: true; state: RoomState } | { ok: false; error: ServerErrorCode };

const refuse = (error: ServerErrorCode): ApplyResult => ({ ok: false, error });

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
  };
}

export function seatedPlayers(state: RoomState): Player[] {
  return state.players.filter((player) => !player.kicked);
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
  }
}
