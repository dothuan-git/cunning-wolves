import type { HelloResponse } from '@werewolf/shared';

export { Lobby } from './lobby/Lobby';
export { Room } from './room/Room';

export default {
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/api/hello') {
      return Response.json({ message: 'hello' } satisfies HelloResponse);
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
