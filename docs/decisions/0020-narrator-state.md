# 0020 — The room keeps the narrator's marks

## Context

Until Phase 5 the narrator page kept its phases, deaths and notes on the master's phone, so a refresh or a dropped connection started the game again at Night 1. The narrator also changes the wake order, timer and sound during play, which Setup locked once the room left `lobby`.

## Choice

- The room keeps a `GameState`: the current phase, a death per player (the phase it was marked in), and notes by night and player. `startGame` begins it at Night 1. It is stored in the `game`, `deaths` and `notes` tables, and only the master view carries it.
- Three master-only actions work while playing:
  - `endPhase { phase }`: refused unless `phase` is the current one.
  - `toggleDeath { playerId }`
  - `setNote { night, playerId, text }`: only for a dealt player, a night that has started, and a player who was alive when it started. The text is cleaned and at most 1000 characters; empty text removes the note.
- `setWakeOrder` and `setSettings` are also allowed in `playing`. Picks, rules and custom roles stay locked.
- The phone types notes into local drafts. `NoteSaver` sends each one a second after typing pauses and when the field is left, and keeps unsent notes until the connection is back.
- The countdown and its chime stay on the narrator's phone. The chime is two Web Audio tones, unlocked by the tap that starts the timer or turns sound on.

## Why

- Naming the phase in `endPhase` makes a repeated hold harmless: the second one is refused instead of skipping a morning.
- Debounced notes keep the room the source of truth without a message per keystroke. A dropped phone loses at most a second of typing.
- Only the narrator sees the timer, so keeping it in the room would add messages and state for no one else. A generated chime needs no sound files, licences or dependency.
