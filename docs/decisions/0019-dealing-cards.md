# 0019 — Dealing the cards

## Context

Phase 4 turns the card set into a deal: each seated player gets one role, and no phone may learn anyone else's. The Room state machine (`apps/worker/src/room/machine.ts`) is pure and unit-tested, but a shuffle needs randomness. The plan also listed a "who has flipped" indicator for the master.

## Choice

- `apply` takes a `random(below)` function. The Room passes `cryptoRandom` (`apps/worker/src/room/random.ts`), which draws from `crypto.getRandomValues` with rejection sampling so no result is favored. Tests pass fixed functions.
- **Start game** runs a Fisher–Yates shuffle of the picks and deals them to the seated players in join order. The room stores the deal as one row per player (`assignments`: player id → role id).
- The master view carries the whole deal. A player view carries the game's role list (from **Review rules** on) and only that player's own card. Kicked phones and phones that never joined get neither.
- **Review rules** (`lobby → reveal`) and **Start game** both check roles = seated players on the server. **Edit roles** (`reveal → lobby`) keeps the room closed.
- Flipping a card stays on the phone. There is no flip message and no flipped indicator, at Thuan's request.

## Why

- Injecting the random source keeps `apply` pure, so the deal is tested like every other rule. `Math.random` is not meant for fairness, and a plain modulo of random bits favors small results.
- One row per player matches the views: each player view reads exactly one row.
- Without flip tracking, players send nothing during the game, and nobody can learn anything from when a card was turned.
