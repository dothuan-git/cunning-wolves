# 0021 — Finish game and Play again

## Context

The room could run a game but never end one. The summary screen existed on sample data, and the spec says everyone sees every role and the log after Finish. Before that, a player may only ever see their own card.

## Choice

- **`finishGame`** (master, `playing → finished`) keeps the deal and the narrator's marks.
- **The player view gains `reveal`**: every assignment and the whole `GameState`. It is built only in `finished`, and only for a seated player. Before that it is `null`, so the "own card only" rule can't be broken by a view that sends too much.
- **The summary** is the existing screen for everyone. `gameJournal` (`packages/shared/src/roles/summary.ts`) turns the marks into the per-phase log, so the master and the players see the same story. Only the master gets **Play again**. Home only navigates and keeps the seat.
- **`playAgain`** (master, `finished → lobby`) keeps the players, the card set and the closed room. It clears the deal and the marks.

## Why

- A separate field that only exists in `finished` is easy to test and hard to leak by accident. The player view's other fields don't change meaning.
- Keeping seats and the card set makes a second game one tap on Review rules. That is what "two games back to back" needs.
