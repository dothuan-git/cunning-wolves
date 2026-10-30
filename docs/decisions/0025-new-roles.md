# 0025 — The narrator gives a player a new role

Status: accepted; amended by decision 0026: the picker has its own sheet, more roles unlock it, and marks are gone.

## Context

Several powers give a player another role: the Doppelgänger copies a dead player, the Thief swaps for an extra card, the Devoted Servant takes the voted-out role, the Drunk learns their real role on Night 3, the Apprentice Seer becomes the Seer, the Bailiff passes on a power, the Angel becomes a plain Villager, the Dream Wolf takes a werewolf's place. A mark can't say which role, and the narrator needs that player woken with the new role.

## Choice

- `GameState.newRoles` (player id → role id and the phase it was given), kept in its own `new_roles` table so older rooms load with none. One master-only action, `setRole { playerId, roleId }`; `null` or the dealt role goes back to the dealt one. It is offered only while one of `ROLE_CHANGERS` (in `marks.ts`) is dealt, and `roleId` must be a pool role (the Thief's extra cards are not dealt) or a picked custom role.
- The phone keeps the dealt card: the narrator tells the player in person, as for marks (decision 0023). New roles travel with the other game state, so only the master sees them during play, and seated players after Finish.
- The narrator page groups players by the role they play now, with a "Dealt …" line under the name; a role nobody was dealt gets its own panel. A player may carry the marks of both roles, and a player who now plays the Dire Wolf dies with its companion (decision 0024).
- The marks sheet has a "Plays" picker at the top: a native select with this game's roles first, then the rest of the pool by name.
- The summary keeps each player under the dealt card's faction with a "Now …" line, and the journal lists the change in its phase.

## Why

A role id is the one thing a mark can't carry, so it gets its own small field instead of a mark per role. A native select works well on phones and needs no new component. Grouping by the new role is what the narrator needs at night; the dealt card stays visible so nothing is lost.
