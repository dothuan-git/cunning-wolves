import {
  gameRoles,
  roomRoles,
  type GameRole,
  type GameState,
  type MasterView,
  type PlayerInfo,
  type PlayerView,
  type Reveal,
  type RoomInfo,
  type RoomRole,
  type RoomSetup,
  type RoomSummary,
  type RoomView,
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

/** The card set, for the master only until the rules are reviewed. Copies so no state is shared. */
function setupInfo(setup: RoomSetup): RoomSetup {
  return {
    picks: [...setup.picks],
    ruleEdits: { ...setup.ruleEdits },
    customRoles: setup.customRoles.map((role) => ({
      id: role.id,
      name: role.name,
      rule: role.rule,
      team: role.team,
      wakes: role.wakes,
    })),
    wakeOrder: [...setup.wakeOrder],
    settings: { timerSeconds: setup.settings.timerSeconds, soundOn: setup.settings.soundOn },
  };
}

export function buildMasterView(state: RoomState, connected: ReadonlySet<string>): MasterView {
  return {
    kind: 'master',
    you: state.masterId,
    room: roomInfo(state),
    players: playerList(state, connected),
    setup: setupInfo(state.setup),
    pin: state.pin,
    assignments: Object.entries(state.assignments).map(([playerId, roleId]) => ({
      playerId,
      roleId,
    })),
    game: state.game ? gameStateInfo(state.game) : null,
  };
}

/** Phases, deaths, notes, marks and new roles: for the master, and for seated players after Finish. */
function gameStateInfo(game: GameState): GameState {
  return {
    phase: { kind: game.phase.kind, number: game.phase.number },
    deaths: Object.fromEntries(
      Object.entries(game.deaths).map(([id, death]) => [
        id,
        { kind: death.kind, number: death.number },
      ]),
    ),
    notes: Object.fromEntries(
      Object.entries(game.notes).map(([night, byPlayer]) => [night, { ...byPlayer }]),
    ),
    marks: Object.fromEntries(
      Object.entries(game.marks).map(([id, own]) => [
        id,
        Object.fromEntries(
          Object.entries(own).map(([mark, marked]) => [
            mark,
            { kind: marked.kind, number: marked.number },
          ]),
        ),
      ]),
    ),
    newRoles: Object.fromEntries(
      Object.entries(game.newRoles).map(([id, changed]) => [
        id,
        { role: changed.role, phase: { kind: changed.phase.kind, number: changed.phase.number } },
      ]),
    ),
  };
}

function roleInfo(role: RoomRole): RoomRole {
  return {
    id: role.id,
    name: { vi: role.name.vi, en: role.name.en },
    rule: { vi: role.rule.vi, en: role.rule.en },
    team: role.team,
    defaultWakeOrder: role.defaultWakeOrder,
    wakeNights: role.wakeNights,
    image: role.image,
    custom: role.custom,
  };
}

/** The roles in this game once the rules are shown; nothing about who holds them. */
function gameInfo(state: RoomState): GameRole[] {
  if (state.status === 'lobby') return [];
  return gameRoles(state.setup).map(({ role, count }) => ({ role: roleInfo(role), count }));
}

/** The viewer's own card, and only theirs. */
function cardInfo(state: RoomState, viewer: string): RoomRole | null {
  if (state.status === 'lobby' || !Object.hasOwn(state.assignments, viewer)) return null;
  const roleId = state.assignments[viewer];
  const role = roomRoles(state.setup).find((known) => known.id === roleId);
  if (!role) throw new Error(`Room view: dealt role ${String(roleId)} is not in the room`);
  return roleInfo(role);
}

/** Every player's role and the marks, once the game is finished. */
function revealInfo(state: RoomState): Reveal | null {
  if (state.status !== 'finished' || !state.game) return null;
  return {
    assignments: Object.entries(state.assignments).map(([playerId, roleId]) => ({
      playerId,
      roleId,
    })),
    game: gameStateInfo(state.game),
  };
}

export function buildPlayerView(
  state: RoomState,
  connected: ReadonlySet<string>,
  viewer: string,
): PlayerView {
  const own = state.players.find((player) => player.id === viewer);
  const seated = own !== undefined && !own.kicked;
  return {
    kind: 'player',
    you: viewer,
    room: roomInfo(state),
    players: playerList(state, connected),
    seat: own ? (own.kicked ? 'removed' : 'joined') : 'none',
    roles: seated ? gameInfo(state) : [],
    card: seated ? cardInfo(state, viewer) : null,
    reveal: seated ? revealInfo(state) : null,
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
