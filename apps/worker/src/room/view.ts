import type {
  MasterView,
  PlayerInfo,
  PlayerView,
  RoomInfo,
  RoomSummary,
  RoomView,
} from '@werewolf/shared';
import { seatedPlayers, type RoomState } from './machine';

// Each view is built from scratch, field by field, so nothing new in RoomState leaks by accident.

function roomInfo(state: RoomState): RoomInfo {
  return { id: state.id, name: state.name, status: state.status, open: state.open };
}

function playerList(state: RoomState, connected: ReadonlySet<string>): PlayerInfo[] {
  return seatedPlayers(state).map((player) => ({
    id: player.id,
    name: player.name,
    connected: connected.has(player.id),
  }));
}

export function buildMasterView(state: RoomState, connected: ReadonlySet<string>): MasterView {
  return {
    kind: 'master',
    you: state.masterId,
    room: roomInfo(state),
    players: playerList(state, connected),
  };
}

export function buildPlayerView(
  state: RoomState,
  connected: ReadonlySet<string>,
  viewer: string,
): PlayerView {
  const own = state.players.find((player) => player.id === viewer);
  return {
    kind: 'player',
    you: viewer,
    room: roomInfo(state),
    players: playerList(state, connected),
    seat: own ? (own.kicked ? 'removed' : 'joined') : 'none',
  };
}

export function buildView(
  state: RoomState,
  connected: ReadonlySet<string>,
  viewer: string,
): RoomView {
  return viewer === state.masterId
    ? buildMasterView(state, connected)
    : buildPlayerView(state, connected, viewer);
}

/** The room's public row on the home list. */
export function buildSummary(state: RoomState): RoomSummary {
  return {
    id: state.id,
    name: state.name,
    master: state.masterName,
    count: seatedPlayers(state).length,
    status: state.status,
    isOpen: state.open,
  };
}
