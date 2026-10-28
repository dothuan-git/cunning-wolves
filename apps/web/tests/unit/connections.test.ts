import type { RoomRole, RoomSetup, RoomSummary, RoomView } from '@werewolf/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LobbyConnection } from '../../src/realtime/LobbyConnection';
import { parseLobbyMessage, parseServerMessage } from '../../src/realtime/parse';
import { RoomConnection, roomSocketUrl } from '../../src/realtime/RoomConnection';
import { fakeSockets } from './fakeSocket';

const TOKEN = '11111111-1111-4111-8111-111111111111';
const ROOM = { id: 'mill', name: 'The mill', status: 'lobby', open: true } as const;
const VIEW: RoomView = {
  kind: 'player',
  you: 'aaaa',
  room: ROOM,
  players: [{ id: 'aaaa', name: 'Minh', connected: true }],
  seat: 'joined',
  roles: [],
  card: null,
};
const BAKER: RoomRole = {
  id: 'custom-0',
  name: { vi: 'Baker', en: 'Baker' },
  rule: { vi: 'Bakes.', en: 'Bakes.' },
  team: 'village',
  defaultWakeOrder: null,
  image: '',
  custom: true,
};
const DEALT: RoomView = { ...VIEW, roles: [{ role: BAKER, count: 2 }], card: BAKER };
const SETUP: RoomSetup = {
  picks: ['werewolf', 'custom-0'],
  ruleEdits: { werewolf: 'House rule' },
  customRoles: [{ id: 'custom-0', name: 'Baker', rule: 'Bakes.', team: 'village', wakes: false }],
  wakeOrder: ['werewolf'],
  settings: { timerSeconds: 60, soundOn: true },
};
const MASTER = {
  kind: 'master',
  you: 'm',
  room: ROOM,
  players: [],
  setup: SETUP,
  assignments: [{ playerId: 'aaaa', roleId: 'custom-0' }],
  game: {
    phase: { kind: 'morning', number: 2 },
    deaths: { aaaa: { kind: 'night', number: 2 } },
    notes: { 1: { aaaa: 'Saw the baker.' } },
  },
} as const;
const SUMMARY: RoomSummary = {
  id: 'mill',
  name: 'The mill',
  master: 'Thuận',
  count: 3,
  status: 'lobby',
  isOpen: true,
};

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RoomConnection', () => {
  function setup() {
    const fake = fakeSockets();
    const connection = new RoomConnection('ws://test', TOKEN, fake.create, () => 1);
    connection.start();
    fake.latest().handlers.open();
    return { connection, ...fake };
  }

  it('says hello with the token, then shows the view', () => {
    const { connection, latest } = setup();
    expect(latest().sent).toEqual([JSON.stringify({ type: 'hello', token: TOKEN })]);
    latest().receive({ type: 'state', view: VIEW });
    expect(connection.getSnapshot()).toEqual({ status: 'connected', view: VIEW, error: null });
  });

  it('sends actions and keeps the refusal until the next one', () => {
    const { connection, latest } = setup();
    latest().receive({ type: 'state', view: VIEW });
    expect(connection.send({ type: 'join', name: 'Minh' })).toBe(true);
    expect(latest().sent.at(-1)).toBe(JSON.stringify({ type: 'join', name: 'Minh' }));

    latest().receive({ type: 'error', code: 'name-taken' });
    expect(connection.getSnapshot().error).toBe('name-taken');
    latest().receive({ type: 'state', view: VIEW });
    expect(connection.getSnapshot().error).toBe('name-taken');
    connection.send({ type: 'join', name: 'Lan' });
    expect(connection.getSnapshot().error).toBeNull();
  });

  it('refuses to send before the room has answered', () => {
    const { connection } = setup();
    expect(connection.send({ type: 'leave' })).toBe(false);
  });

  it('builds the socket url from the room id', () => {
    expect(roomSocketUrl('mill', new URL('https://wolves.example/'))).toBe(
      'wss://wolves.example/api/rooms/mill/ws',
    );
  });
});

describe('LobbyConnection', () => {
  it('shows the room list from the first message on', () => {
    const fake = fakeSockets();
    const lobby = new LobbyConnection('ws://test', fake.create, () => 1);
    lobby.start();
    expect(lobby.getSnapshot()).toEqual({ status: 'connecting', rooms: null });
    fake.latest().handlers.open();
    expect(fake.latest().sent).toEqual([]);
    fake.latest().receive({ type: 'rooms', rooms: [SUMMARY] });
    expect(lobby.getSnapshot()).toEqual({ status: 'connected', rooms: [SUMMARY] });
  });
});

describe('parseServerMessage', () => {
  it('accepts views and errors', () => {
    const state = { type: 'state', view: VIEW };
    expect(parseServerMessage(JSON.stringify(state))).toEqual(state);
    const dealt = { type: 'state', view: DEALT };
    expect(parseServerMessage(JSON.stringify(dealt))).toEqual(dealt);
    const master = { type: 'state', view: MASTER };
    expect(parseServerMessage(JSON.stringify(master))).toEqual(master);
    const error = { type: 'error', code: 'room-closed' };
    expect(parseServerMessage(JSON.stringify(error))).toEqual(error);
  });

  it.each([
    ['binary', new ArrayBuffer(2)],
    ['not JSON', '{'],
    ['an unknown type', { type: 'deal' }],
    ['an unknown error', { type: 'error', code: 'oops' }],
    ['an unknown seat', { type: 'state', view: { ...VIEW, seat: 'boss' } }],
    ['a bad player', { type: 'state', view: { ...VIEW, players: [{ id: 1 }] } }],
    ['an unknown status', { type: 'state', view: { ...VIEW, room: { ...ROOM, status: 'x' } } }],
    ['a master view without setup', { type: 'state', view: { ...MASTER, setup: undefined } }],
    [
      'a master view without assignments',
      { type: 'state', view: { ...MASTER, assignments: undefined } },
    ],
    ['a master view without a game', { type: 'state', view: { ...MASTER, game: undefined } }],
    [
      'a death in an unknown phase',
      {
        type: 'state',
        view: {
          ...MASTER,
          game: { ...MASTER.game, deaths: { aaaa: { kind: 'dusk', number: 1 } } },
        },
      },
    ],
    [
      'a note that is not text',
      { type: 'state', view: { ...MASTER, game: { ...MASTER.game, notes: { 1: { aaaa: 2 } } } } },
    ],
    ['a player view without roles', { type: 'state', view: { ...VIEW, roles: undefined } }],
    [
      'a card without a team',
      { type: 'state', view: { ...DEALT, card: { ...BAKER, team: undefined } } },
    ],
    [
      'a role with a name in one language',
      {
        type: 'state',
        view: { ...DEALT, roles: [{ role: { ...BAKER, name: { vi: 'Baker' } }, count: 1 }] },
      },
    ],
    [
      'a custom role of another team',
      {
        type: 'state',
        view: {
          ...MASTER,
          setup: { ...SETUP, customRoles: [{ ...SETUP.customRoles[0], team: 'vampire' }] },
        },
      },
    ],
    [
      'a rule edit that is not text',
      { type: 'state', view: { ...MASTER, setup: { ...SETUP, ruleEdits: { seer: 1 } } } },
    ],
  ])('rejects %s', (_label, data) => {
    expect(
      parseServerMessage(
        typeof data === 'string' || data instanceof ArrayBuffer ? data : JSON.stringify(data),
      ),
    ).toBeNull();
  });
});

describe('parseLobbyMessage', () => {
  it('accepts a list of rooms', () => {
    const message = { type: 'rooms', rooms: [SUMMARY] };
    expect(parseLobbyMessage(JSON.stringify(message))).toEqual(message);
  });

  it('rejects a list with a bad row', () => {
    const message = { type: 'rooms', rooms: [{ ...SUMMARY, count: '3' }] };
    expect(parseLobbyMessage(JSON.stringify(message))).toBeNull();
  });
});
