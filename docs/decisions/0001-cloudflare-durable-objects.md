# 0001 — Cloudflare Workers + Durable Objects

2026-10-26 · Accepted

## Context

Every phone in a room needs instant updates from the narrator, the room state must have one authoritative copy that survives restarts, and hosting should be free with no cold "sleeping" server.

## Choice

- One Worker serves the static app and the `/api/*` routes.
- One **Room** Durable Object per room holds the game state and every phone's WebSocket.
- One **Lobby** Durable Object tracks open rooms for the home screen.
- Storage is Durable Object SQLite; there is no separate database. Everything runs on the Workers Free plan.

## Why

- A Durable Object handles one request at a time, so phones can't race each other when changing room state.
- WebSockets end inside the room object; with the Hibernation API idle rooms cost nothing.
- The Free plan includes Durable Objects with the SQLite backend ([changelog](https://developers.cloudflare.com/changelog/2025-04-07-durable-objects-free-tier/)).
- One deploy covers the app and the API.

## Consequences

- Durable Object classes must be declared with `new_sqlite_classes` migrations.
- Cloudflare does not create preview URLs for Workers that implement Durable Objects, which shapes how previews work (0004).
- We accept the lock-in to Cloudflare.
