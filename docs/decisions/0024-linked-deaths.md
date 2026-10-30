# 0024 — Linked deaths are marked together

Status: superseded by decision 0026: a death marks only the player tapped.

## Context

Some deaths always bring another: when a lover dies, the other lover dies too, and the Dire Wolf dies when its companion dies. The narrator had to remember to tap both players. Thuan chose to have the app mark the second death itself, although the app otherwise never resolves an ability.

## Choice

- Marking a player dead also marks dead, in the same phase, every living player whose death follows from it: every other `lover`, and every Dire Wolf when the dead player carries `companion` (not the other way round). It repeats, so a chain (a lover who is also the companion) is followed to its end.
- Marking that player alive again brings back the players who died with them by the same links in the same phase, so one tap undoes the whole chain. A linked player who died in another phase is left alone.
- Only deaths are linked. The Hunter's shot, the Wild Child's model and the Doppelgänger's model stay with the narrator.
- The logic is in `toggleDeath` in `apps/worker/src/room/machine.ts`.

## Why

Linked deaths have no choice in them, so marking them can't be wrong, and forgetting one breaks the game. Undo by the same tap keeps a mistaken tap cheap. The rule "the app never resolves abilities" in AGENTS.md now names this one exception.
