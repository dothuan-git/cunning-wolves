import {
  CLOSE_REPLACED,
  CLOSE_ROOM_GONE,
  type CreateRoomResponse,
  type LobbyMessage,
  type MasterView,
  type PlayerView,
  type ServerErrorCode,
  type ServerMessage,
} from '@werewolf/shared';
import { runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { LOBBY_NAME } from '../src/lobby/Lobby';
import { deviceIdFromToken } from '../src/room/deviceId';
import { parseClientMessage } from '../src/room/messages';
import { ROOM_EXPIRY_MS } from '../src/room/Room';
import { loadRoom } from '../src/room/storage';
import { createRoom, openSocket, TOKENS, type TestSocket } from './sockets';

function isServerMessage(message: unknown): message is ServerMessage {
  return typeof message === 'object' && message !== null && 'type' in message;
}

function masterView(where: (view: MasterView) => boolean = () => true) {
  return (message: unknown): message is { type: 'state'; view: MasterView } =>
    isServerMessage(message) &&
    message.type === 'state' &&
    message.view.kind === 'master' &&
    where(message.view);
}

function playerView(where: (view: PlayerView) => boolean = () => true) {
  return (message: unknown): message is { type: 'state'; view: PlayerView } =>
    isServerMessage(message) &&
    message.type === 'state' &&
    message.view.kind === 'player' &&
    where(message.view);
}

function error(code: ServerErrorCode) {
  return (message: unknown): message is ServerMessage =>
    isServerMessage(message) && message.type === 'error' && message.code === code;
}

function lobbyWhere(where: (message: LobbyMessage) => boolean) {
  return (message: unknown): message is LobbyMessage =>
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === 'rooms' &&
    where(message as LobbyMessage);
}

async function newRoom(): Promise<string> {
  const response = await createRoom();
  expect(response.status).toBe(201);
  const { id } = await response.json<CreateRoomResponse>();
  return id;
}

async function enter(roomId: string, token: string): Promise<TestSocket> {
  const socket = await openSocket(`/api/rooms/${roomId}/ws`);
  socket.send({ type: 'hello', token });
  return socket;
}

async function join(roomId: string, token: string, name: string): Promise<TestSocket> {
  const socket = await enter(roomId, token);
  await socket.next(playerView((view) => view.seat === 'none'));
  socket.send({ type: 'join', name });
  await socket.next(playerView((view) => view.seat === 'joined'));
  return socket;
}

describe('routes', () => {
  it('rejects a socket request without an upgrade', async () => {
    expect((await exports.default.fetch('http://localhost/api/rooms/mill0000/ws')).status).toBe(
      426,
    );
    expect((await exports.default.fetch('http://localhost/api/lobby/ws')).status).toBe(426);
  });

  it('rejects a bad room id', async () => {
    const response = await exports.default.fetch('http://localhost/api/rooms/Bad%20Id/ws', {
      headers: { Upgrade: 'websocket' },
    });
    expect(response.status).toBe(404);
  });

  it('returns 404 for unknown API routes', async () => {
    expect((await exports.default.fetch('http://localhost/api/nope')).status).toBe(404);
  });

  it.each([
    ['not JSON', 'nope'],
    ['a bad token', { token: 'abc', name: 'Thuận', roomName: 'The mill' }],
    ['an empty name', { token: TOKENS.master, name: '  ', roomName: 'The mill' }],
    ['a long room name', { token: TOKENS.master, name: 'Thuận', roomName: 'x'.repeat(33) }],
    ['an invisible name', { token: TOKENS.master, name: '​', roomName: 'The mill' }],
  ])('refuses to create a room with %s', async (_label, body) => {
    expect((await createRoom(body)).status).toBe(400);
  });

  it('refuses a body over 1 KB without reading it all', async () => {
    const body = {
      token: TOKENS.master,
      name: 'Thuận',
      roomName: 'The mill',
      pad: 'x'.repeat(2000),
    };
    expect((await createRoom(body)).status).toBe(413);
  });
});

describe('Room', () => {
  it('greets the creator as master', async () => {
    const roomId = await newRoom();
    expect(roomId).toMatch(/^[a-z0-9]{8}$/);
    const master = await enter(roomId, TOKENS.master);
    const { view } = await master.next(masterView());
    expect(view).toEqual({
      kind: 'master',
      you: await deviceIdFromToken(TOKENS.master, roomId),
      room: { id: roomId, name: 'The mill', status: 'lobby', open: true },
      players: [],
      setup: {
        picks: [],
        ruleEdits: {},
        customRoles: [],
        wakeOrder: [],
        settings: { timerSeconds: 120, soundOn: false },
      },
    });
  });

  it('closes a socket to a room that was never created', async () => {
    const socket = await enter('nowhere0', TOKENS.minh);
    expect((await socket.closed).code).toBe(CLOSE_ROOM_GONE);
    // Knocking on an unused id leaves nothing stored behind.
    await runInDurableObject(env.ROOM.getByName('nowhere0'), (_instance, state) => {
      expect(
        state.storage.sql.exec("SELECT name FROM sqlite_master WHERE type = 'table'").toArray(),
      ).toEqual([]);
    });
  });

  it('shows the master when a player drops off', async () => {
    const roomId = await newRoom();
    const master = await enter(roomId, TOKENS.master);
    const minh = await join(roomId, TOKENS.minh, 'Minh');
    await master.next(masterView((view) => view.players[0]?.connected === true));
    minh.ws.close(1000, 'bye');
    const { view } = await master.next(masterView((v) => v.players[0]?.connected === false));
    expect(view.players.map((player) => player.name)).toEqual(['Minh']);
  });

  it('seats players and shows them to everyone', async () => {
    const roomId = await newRoom();
    const master = await enter(roomId, TOKENS.master);
    const minh = await join(roomId, TOKENS.minh, 'Minh');
    await join(roomId, TOKENS.lan, 'Lan');

    const names = (view: { players: { name: string }[] }) => view.players.map((p) => p.name);
    const { view } = await master.next(masterView((v) => v.players.length === 2));
    expect(names(view)).toEqual(['Minh', 'Lan']);
    expect(view.players.every((player) => player.connected)).toBe(true);
    expect(names((await minh.next(playerView((v) => v.players.length === 2))).view)).toEqual([
      'Minh',
      'Lan',
    ]);
  });

  it('refuses a name already taken in the room', async () => {
    const roomId = await newRoom();
    await join(roomId, TOKENS.minh, 'Đức');
    const lan = await enter(roomId, TOKENS.lan);
    await lan.next(playerView());
    lan.send({ type: 'join', name: 'duc' });
    await lan.next(error('name-taken'));
  });

  it('keeps a seat across a reconnect', async () => {
    const roomId = await newRoom();
    const first = await join(roomId, TOKENS.minh, 'Minh');
    const again = await enter(roomId, TOKENS.minh);
    const { view } = await again.next(playerView());
    expect(view.seat).toBe('joined');
    expect(view.players).toHaveLength(1);
    expect((await first.closed).code).toBe(CLOSE_REPLACED);
  });

  it('lets the master remove a player, who can come back once the room re-opens', async () => {
    const roomId = await newRoom();
    const master = await enter(roomId, TOKENS.master);
    const minh = await join(roomId, TOKENS.minh, 'Minh');
    const minhId = await deviceIdFromToken(TOKENS.minh, roomId);

    master.send({ type: 'kick', playerId: minhId });
    await minh.next(playerView((view) => view.seat === 'removed' && view.players.length === 0));
    master.send({ type: 'setOpen', open: false });
    await minh.next(playerView((view) => !view.room.open));

    minh.send({ type: 'join', name: 'Minh' });
    await minh.next(error('room-closed'));

    master.send({ type: 'setOpen', open: true });
    await minh.next(playerView((view) => view.room.open));
    minh.send({ type: 'join', name: 'Minh' });
    await minh.next(playerView((view) => view.seat === 'joined'));
    await master.next(masterView((view) => view.players.length === 1));
  });

  it('refuses master actions from a player', async () => {
    const roomId = await newRoom();
    const minh = await join(roomId, TOKENS.minh, 'Minh');
    minh.send({ type: 'setOpen', open: false });
    await minh.next(error('not-master'));
  });

  it('lets a player leave', async () => {
    const roomId = await newRoom();
    const master = await enter(roomId, TOKENS.master);
    const minh = await join(roomId, TOKENS.minh, 'Minh');
    await master.next(masterView((view) => view.players.length === 1));
    minh.send({ type: 'leave' });
    await minh.next(playerView((view) => view.seat === 'none'));
    await master.next(masterView((view) => view.players.length === 0));
  });

  it('keeps the card set across a reconnect, and shows it to the master only', async () => {
    const roomId = await newRoom();
    const master = await enter(roomId, TOKENS.master);
    const minh = await join(roomId, TOKENS.minh, 'Minh');
    master.send({ type: 'addPick', roleId: 'werewolf' });
    master.send({ type: 'editRule', roleId: 'werewolf', rule: 'House rule' });
    master.send({
      type: 'addCustomRole',
      role: { name: 'Baker', rule: 'Bakes.', team: 'village', wakes: true },
    });
    master.send({ type: 'setWakeOrder', order: ['custom-0', 'werewolf'] });
    master.send({ type: 'setSettings', settings: { timerSeconds: 45, soundOn: true } });
    await master.next(masterView((view) => view.setup.settings.timerSeconds === 45));

    const again = await enter(roomId, TOKENS.master);
    const { view } = await again.next(masterView());
    expect(view.setup).toEqual({
      picks: ['werewolf'],
      ruleEdits: { werewolf: 'House rule' },
      customRoles: [
        { id: 'custom-0', name: 'Baker', rule: 'Bakes.', team: 'village', wakes: true },
      ],
      wakeOrder: ['custom-0', 'werewolf'],
      settings: { timerSeconds: 45, soundOn: true },
    });
    for (const text of minh.received) {
      expect(text).not.toContain('House rule');
      expect(text).not.toContain('Baker');
    }
  });

  it('keeps the card set when the room is loaded again from storage', async () => {
    const roomId = await newRoom();
    const master = await enter(roomId, TOKENS.master);
    master.send({ type: 'addPick', roleId: 'seer' });
    await master.next(masterView((view) => view.setup.picks.length === 1));
    await runInDurableObject(env.ROOM.getByName(roomId), (_instance, state) => {
      expect(loadRoom(state.storage.sql)?.setup.picks).toEqual(['seer']);
    });
  });

  it('loads a room saved before the card set existed, with an empty set', async () => {
    await runInDurableObject(env.ROOM.getByName('phase2rm'), (_instance, state) => {
      const { sql } = state.storage;
      // The Phase 2 schema, without the setup tables.
      sql.exec(`CREATE TABLE room (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL, open INTEGER NOT NULL,
        master_id TEXT NOT NULL, master_name TEXT NOT NULL, created_at INTEGER NOT NULL,
        last_active_at INTEGER NOT NULL
      )`);
      sql.exec(`CREATE TABLE players (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, joined_at INTEGER NOT NULL, kicked INTEGER NOT NULL
      )`);
      sql.exec("INSERT INTO room VALUES ('phase2rm', 'Old mill', 'lobby', 1, 'm', 'Thuận', 0, 0)");
      sql.exec("INSERT INTO players VALUES ('a', 'Minh', 0, 0)");
      const loaded = loadRoom(sql);
      expect(loaded?.players).toHaveLength(1);
      expect(loaded?.setup).toEqual({
        picks: [],
        ruleEdits: {},
        customRoles: [],
        wakeOrder: [],
        settings: { timerSeconds: 120, soundOn: false },
      });
    });
  });

  it('closes a socket that acts before saying hello', async () => {
    const roomId = await newRoom();
    const socket = await openSocket(`/api/rooms/${roomId}/ws`);
    socket.send({ type: 'join', name: 'Minh' });
    await socket.next(error('bad-message'));
    expect((await socket.closed).code).toBe(1008);
  });

  it('closes a socket that says hello twice', async () => {
    const roomId = await newRoom();
    const socket = await enter(roomId, TOKENS.minh);
    socket.send({ type: 'hello', token: TOKENS.lan });
    expect((await socket.closed).code).toBe(1008);
  });

  it('never sends a device token or the master id to a player', async () => {
    const roomId = await newRoom();
    const master = await enter(roomId, TOKENS.master);
    const minh = await join(roomId, TOKENS.minh, 'Minh');
    await master.next(masterView((view) => view.players.length === 1));
    const masterId = await deviceIdFromToken(TOKENS.master, roomId);
    for (const text of [...master.received, ...minh.received]) {
      for (const token of Object.values(TOKENS)) expect(text).not.toContain(token);
    }
    for (const text of minh.received) expect(text).not.toContain(masterId);
  });
});

describe('Lobby', () => {
  it('lists rooms live as they are created, filled and closed', async () => {
    const lobby = await openSocket('/api/lobby/ws');
    const roomId = await newRoom();
    const row = (message: LobbyMessage) => message.rooms.find((room) => room.id === roomId);

    expect(row(await lobby.next(lobbyWhere((m) => row(m) !== undefined)))).toEqual({
      id: roomId,
      name: 'The mill',
      master: 'Thuận',
      count: 0,
      status: 'lobby',
      isOpen: true,
    });

    const master = await enter(roomId, TOKENS.master);
    await join(roomId, TOKENS.minh, 'Minh');
    await lobby.next(lobbyWhere((m) => row(m)?.count === 1));
    master.send({ type: 'setOpen', open: false });
    await lobby.next(lobbyWhere((m) => row(m)?.isOpen === false));
  });
});

describe('expiry', () => {
  it('deletes an idle room, closes its sockets and drops it from the list', async () => {
    const roomId = await newRoom();
    const master = await enter(roomId, TOKENS.master);
    await master.next(masterView());
    const stub = env.ROOM.getByName(roomId);

    // An alarm before the room has been idle long enough only moves itself out.
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    expect(master.ws.readyState).toBe(WebSocket.OPEN);

    await runInDurableObject(stub, async (_instance, state) => {
      state.storage.sql.exec('UPDATE room SET last_active_at = ?', Date.now() - ROOM_EXPIRY_MS);
      // Not "now": an alarm due now can fire on its own before the test runs it.
      await state.storage.setAlarm(Date.now() + 60_000);
    });
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    expect((await master.closed).code).toBe(CLOSE_ROOM_GONE);

    const rooms = await env.LOBBY.getByName(LOBBY_NAME).rooms();
    expect(rooms.some((room) => room.id === roomId)).toBe(false);
    const late = await enter(roomId, TOKENS.minh);
    expect((await late.closed).code).toBe(CLOSE_ROOM_GONE);
  });
});

describe('parseClientMessage', () => {
  it.each([
    [{ type: 'hello', token: TOKENS.minh }],
    [{ type: 'join', name: 'Minh' }],
    [{ type: 'leave' }],
    [{ type: 'kick', playerId: 'abc' }],
    [{ type: 'setOpen', open: false }],
    [{ type: 'addPick', roleId: 'seer' }],
    [{ type: 'removePick', roleId: 'seer' }],
    [{ type: 'editRule', roleId: 'seer', rule: 'Sees.' }],
    [
      {
        type: 'addCustomRole',
        role: { name: 'Baker', rule: 'Bakes.', team: 'village', wakes: false },
      },
    ],
    [{ type: 'setWakeOrder', order: ['witch', 'seer'] }],
    [{ type: 'setSettings', settings: { timerSeconds: 60, soundOn: true } }],
  ])('accepts %o', (message) => {
    expect(parseClientMessage(JSON.stringify(message))).toEqual(message);
  });

  it.each([
    ['binary', new ArrayBuffer(4)],
    ['not JSON', '{'],
    ['null', 'null'],
    ['unknown type', JSON.stringify({ type: 'deal' })],
    ['too long', JSON.stringify({ type: 'join', name: 'x'.repeat(5000) })],
    ['a token that is not a UUID', JSON.stringify({ type: 'hello', token: 'a'.repeat(36) })],
    ['a short token', JSON.stringify({ type: 'hello', token: 'abc' })],
    ['a token with spaces', JSON.stringify({ type: 'hello', token: `${TOKENS.minh} x` })],
    ['a join without a name', JSON.stringify({ type: 'join' })],
    ['setOpen with a string', JSON.stringify({ type: 'setOpen', open: 'no' })],
    ['a pick without a role', JSON.stringify({ type: 'addPick' })],
    ['a rule that is not text', JSON.stringify({ type: 'editRule', roleId: 'seer', rule: 1 })],
    [
      'a custom role of another team',
      JSON.stringify({
        type: 'addCustomRole',
        role: { name: 'Vampire', rule: 'Bites.', team: 'vampire', wakes: true },
      }),
    ],
    ['a wake order with a number', JSON.stringify({ type: 'setWakeOrder', order: ['seer', 1] })],
    [
      'settings without sound',
      JSON.stringify({ type: 'setSettings', settings: { timerSeconds: 60 } }),
    ],
  ])('rejects %s', (_label, raw) => {
    expect(parseClientMessage(raw)).toBeNull();
  });
});

describe('deviceIdFromToken', () => {
  it('is stable, 16 hex chars, and differs per token and per room', async () => {
    const id = await deviceIdFromToken(TOKENS.minh, 'room0001');
    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(await deviceIdFromToken(TOKENS.minh, 'room0001')).toBe(id);
    expect(await deviceIdFromToken(TOKENS.lan, 'room0001')).not.toBe(id);
    expect(await deviceIdFromToken(TOKENS.minh, 'room0002')).not.toBe(id);
  });
});
