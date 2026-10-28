# 0016 — Room socket: handshake, device ids and reconnect

Date: 2026-10-28. Status: accepted. Builds on 0002 (device token).

## Context

Phase 1 needs every phone to connect to a room over a WebSocket, be recognized as the same phone after a refresh or screen lock, and get back in without anyone doing anything.

## Choice

- **Route:** `GET /api/rooms/:id/ws` with `Upgrade: websocket`. The id matches `ROOM_ID_PATTERN` (`[a-z0-9-]`, 1–40 characters) or the request gets 404; without the upgrade header, 426. The worker forwards it to the Room Durable Object named by the id.
- **Handshake:** the first message is `{ type: 'hello', token }`. The token is never in the URL, so it stays out of request logs. Any other first message, a second hello, or a message that fails validation gets `{ type: 'error', code: 'bad-message' }` and close code 1008.
- **Device id:** the first 16 hex characters of SHA-256(token), worked out by the worker. The same token always gives the same id, and other phones only ever see the id. Nothing is stored.
- **Hibernation:** the Room uses `ctx.acceptWebSocket`; the device id is kept on each socket with `serializeAttachment`. `ping` / `pong` is answered by `setWebSocketAutoResponse`, so keep-alives don't wake the room.
- **One socket per device:** when a device says hello, its older sockets in the room are closed with code 4000 (`CLOSE_REPLACED`). A refresh never shows the phone twice, and a second tab takes over from the first.
- **State:** after every hello and every close, each socket gets `{ type: 'state', view }`, built for that viewer. In Phase 1 the view is `{ you, devices }`: the viewer's id and the sorted ids of the connected devices.
- **Client (`apps/web/src/realtime/`):** `RoomConnection` reconnects after any close except 4000. It waits a random time up to 0.5 s × 2^attempt, capped at 10 s (full jitter), and the count resets once the room sends a state. It sends `ping` every 25 s and reconnects if no `pong` comes within 10 s, which catches sockets that died while the screen was locked. When the page becomes visible again or the network comes back, it reconnects at once instead of waiting out the backoff, or pings a connected socket to check it. `useRoomConnection(roomId)` is the hook screens use.
- **Test page:** `/test/<room>` shows the connection status and the connected phones. It is temporary and goes away when the Phase 2 lobby arrives.

## Why

- **The token in the first message** keeps a seat's password out of URLs and logs, as 0002 asks.
- **A hashed id** needs no table, and the id can be shown to other phones safely.
- **Replacing older sockets** is the simplest way to keep one seat per phone when the old socket hasn't closed yet.
- **The heartbeat** is needed because mobile browsers often leave a dead socket open after the screen locks, with no close event.

## Consequences

- The same phone can't be in a room from two tabs. The older tab shows "Open in another tab" and stops reconnecting until it is refreshed.
- Phase 2 will store players (name, joinedAt, kicked) by this device id. The view will then split into a master view and a player view.
