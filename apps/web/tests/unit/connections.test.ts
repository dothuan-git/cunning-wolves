import type { RoomSummary, RoomView } from '@werewolf/shared';
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
};
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
    const master = { type: 'state', view: { kind: 'master', you: 'm', room: ROOM, players: [] } };
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
