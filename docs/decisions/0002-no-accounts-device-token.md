# 0002 — No accounts; a device token identifies each person

2026-10-26 · Accepted

## Context

Games happen in person, often with people who will play once. A sign-up step would stop the game before it starts, but the app still has to recognize the same phone after a refresh, tab switch or screen lock.

## Choice

- No accounts. People type a name when they create or join a room; the name is remembered on the device.
- On first visit the app creates a random device token and keeps it in `localStorage`.
- Every WebSocket connects with that token, and the room maps it to a `deviceId`, so a reconnecting phone gets its seat (and its card) back.

## Why

- Zero friction to start playing.
- Reconnection works without any login.
- Nothing personal is stored beyond a display name.

## Consequences

- The token works like a password for that seat: send it only in the connection handshake and never show it to other players.
- Clearing site data or switching browsers creates a new identity.
- A lost narrator device can't be recovered; the master creates a new room.
- v1 had no room PINs: anyone who saw a room in the list could join. Rooms now have a join PIN; see decision 0022.
