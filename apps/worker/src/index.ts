import { ROOM_ID_PATTERN, type HelloResponse } from '@werewolf/shared';

export { Lobby } from './lobby/Lobby';
export { Room } from './room/Room';

const ROOM_SOCKET_PATH = /^\/api\/rooms\/([^/]+)\/ws$/;

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/hello') {
      return Response.json({ message: 'hello' } satisfies HelloResponse);
    }

    const roomId = ROOM_SOCKET_PATH.exec(url.pathname)?.[1];
    if (roomId !== undefined && ROOM_ID_PATTERN.test(roomId)) {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected a WebSocket upgrade', { status: 426 });
      }
      return env.ROOM.getByName(roomId).fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
