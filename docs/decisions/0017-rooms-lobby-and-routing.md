# 0017 — Rooms, the live room list, and routing

Date: 2026-10-28. Status: accepted. Builds on 0001 (Durable Objects) and 0016 (room socket).

## Context

Phase 2 makes rooms real: the master creates one, players see it on home and join with a name, and the master can remove players and close or re-open the room. Rooms left idle must go away on their own.

Thuan chose:

- the master types the room name, with a random suggestion
- a live room list
- our own small router
- refusing duplicate names

## Choice

- **Creating:** `POST /api/rooms` with `{ token, name, roomName }`. The token goes in the body, never the URL.
  - The worker cleans and checks both names and makes an 8-character `[a-z0-9]` id with `crypto.getRandomValues`. On a clash it retries up to 3 times.
  - It calls the Room's `create()` RPC, then returns `201 { id }`. A bad body gets 400.
- **One status for gathering:** `lobby` and `setup` merge into `lobby`. `RoomStatus` is now `lobby | reveal | playing | finished`.
- **State machine:** `apps/worker/src/room/machine.ts` is a pure `apply(state, actor, action)`. It returns a new state or the reason for refusing. The Room's only job is parse → apply → save → broadcast. Refusals go back to the sender as `{ type: 'error', code }`, and the socket stays open.
- **Storage:** Room SQLite, with a single-row `room` table and a `players` table (`kicked` stays as a flag, so the kicked phone can be told why). `saveRoom` rewrites both tables in one `transactionSync`; a room has a few dozen rows at most.
- **Views:** `buildMasterView` and `buildPlayerView` copy fields one by one, so a field added to the state is never sent by accident.
  - A player's view has the room, the seated players (name, connected) and their own seat (`none`, `joined` or `removed`).
  - It never has the master's device id.
- **Room list:** the Lobby Durable Object (one instance named `lobby`) keeps a `rooms` table.
  - Each Room calls `lobby.upsert(summary)` after every change and `lobby.remove(id)` when it expires. A failed call is logged, not thrown: the room works without the list.
  - Home connects to `/api/lobby/ws` on the Hibernation API. It gets the whole list on connect and after every change, newest room first. No token, since the list is public.
- **Expiry:** every message or connection saves `lastActiveAt` and moves the room's alarm to 6 hours later.
  - The alarm reloads the state. If the room really has been idle, it closes every socket with 4004, runs `deleteAll()` and removes the room from the list.
  - A hello to a room that doesn't exist also gets 4004, and the client shows "This room has closed" and stops reconnecting.
- **Client sockets:** `ReconnectingSocket` holds the backoff, heartbeat and wake logic from 0016, unchanged. `RoomConnection` (hello, views, actions, the last refusal) and `LobbyConnection` (the list) are thin layers on it.
- **Routing:** `apps/web/src/router.ts`, about 50 lines on the History API. Routes are `/` home, `/new` create, `/room/<id>` the room (master → Setup; player → name entry, then The village), and `/design` in dev. Unknown paths show home. No dependency.
- **Room ids:** `ROOM_ID_PATTERN` is now exactly the 8 characters the create route makes. A socket to an id nobody created gets 4004 and leaves no storage behind, because the tables are made only by `create()`.
- **Device ids per room:** the device id is now SHA-256 of `roomId:token` (it was the token alone in 0016). A phone keeps its id within a room, but its ids in two rooms can't be matched, and a master's id in one room says nothing about them in another.
- **Lobby updates in order:** a Room queues its `upsert` calls and each sends the state as it is when its turn comes. Two quick changes can't reach the list out of order.
- **Limits:** a create body over 1 KB is refused (413) without being read in full. The list sends at most the 100 newest rooms. Names drop control and invisible characters (zero-width spaces, direction overrides) before they are stored or compared.
- **Names:** `cleanName` and `nameKey` live in `packages/shared`. `nameKey` drops case, accents and đ, and is the same key Setup's role search uses. The last name used is remembered in `localStorage`.

## Why

- **The pure machine** puts every rule in one place and lets every transition be unit-tested without a socket.
- **The Lobby as a separate object** keeps the home list cheap: one object fans out to home screens, and rooms never talk to phones that aren't in them.
- **Our own router:** the app has four routes, which doesn't justify a dependency and a decision file of its own.

## Consequences

- The role pool is still empty, so Setup and the village carousel show no roles until Phase 3 adds them. Setup's role picks are still local to the screen, and **Review rules** only closes the room for now.
- At expiry a Room removes itself from the list before it deletes its storage. If the Lobby doesn't answer, it tries again a minute later, so a row never outlives its room.
- `POST /api/rooms` has no rate limit yet. The 100-room cap keeps the list bounded, but a Cloudflare rate-limiting rule on that path is worth adding before a public launch.
- The temporary `/test/<room>` page from 0016 is gone.
