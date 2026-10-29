# 0022 — Room PIN, getting back in, handing over and deleting

2026-10-29 · Accepted · Replaces the "no room PINs" line in 0002

## Context

Anyone who saw a room on the home list could join it. A master who closed the room and went home couldn't get back in, because the list only let you tap rooms that were open and in `lobby` (seated players had the same problem once a game started). A room only went away when it expired after six hours. And the narrator couldn't pass the role to someone else.

## Choice

- **Join PIN.** Creating a room needs a 4-digit PIN. `join` carries it, and the machine refuses a wrong one with `pin-wrong`. The PIN is only on the master view, never in `RoomInfo` or a player view. It is stored in its own `room_pin` table, so rooms saved before this load with `pin: null` and join without one.
- **PIN lockout.** After 10 wrong PINs within a minute, the room answers every `join` with `pin-locked` for a minute. The count is kept in the room's storage, not in memory, so a room that hibernates still remembers it.
- **Getting back in.** The phone keeps the ids of rooms it created or has a seat in (`apps/web/src/realtime/myRooms.ts`, at most 20). Home keeps those rows tappable and marks them "Your room". The room still decides what each phone sees.
- **Delete.** `deleteRoom` is master-only and works in any state. The machine answers `{ ok: true, deleted: true }`. `Room.ts` then removes the room from the lobby, closes every socket with `CLOSE_ROOM_DELETED` (4005) and deletes its storage. This is the same teardown that expiry uses. If the lobby doesn't answer, nothing is deleted and the master gets `try-again`.
- **Hand over.** `handOver` is master-only, works in `lobby`, and needs a seated player. In one swap, the player becomes the master and the old master takes a seat at the end. `Room.ts` refuses with `player-offline` unless the player has an open socket.

## Why

- A PIN is the smallest gate that works for a table in one room: the narrator reads it out.
- 10,000 PINs could be tried in seconds with new device tokens, so a per-device limit isn't enough. A per-room lockout is. Anyone who knows a room id can hold real players up for a minute at a time; that is a known trade-off, and acceptable for a game at one table.
- Remembering rooms on the phone sends nothing new to the server, and strangers still can't open a closed room from the list.
- Lobby only for handover means no card has been dealt, so the new narrator learns no secret they couldn't see as master anyway. Online only means the room never has a narrator whose phone is off.

## Consequences

- Phones forget a room when it is gone or deleted, after Leave, and when removed. Clearing site data forgets them all; the seat itself is still tied to the device token.
- A lost narrator device still can't be recovered. The fix is to hand over before leaving, or to create a new room.
