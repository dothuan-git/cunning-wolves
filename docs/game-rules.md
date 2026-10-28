# Game rules

The spec the code follows, taken from `docs/plan.md`. Any change to game behavior updates this file in the same commit.

## People

- **Room master (narrator):** the person who created the room. Only their actions change room state.
- **Player:** everyone who joins. Players only look at their own screens; they never change room state.
- No accounts. Each device has a random token (see `docs/decisions/0002-no-accounts-device-token.md`); a person is identified by `deviceId` within a room.

## Room states

`lobby → setup → reveal → playing → finished`

| State      | What happens                                                                                                                                                                                                                                                                                                                                                                                   | Moves on when                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `lobby`    | Players join with a name and wait on **The village**: a looping row of every role card in the pool to look at (it moves on by itself; tap a card to enlarge it, tap the background to close), and the players as lettered squares, with their own highlighted and a tap on any square showing that player's full name. Master sees the live list, can kick, and can close or re-open the room. | Master goes to setup                                           |
| `setup`    | One empty card slot per player; master fills slots from the pool, edits a role's rule for this room only, or creates a custom role. Room settings (timer, sound) live here.                                                                                                                                                                                                                    | Master taps **Ready** (enabled only when every slot is filled) |
| `reveal`   | Players see **Rules review**: every role in this game with its count and room rule. Nobody sees who has what.                                                                                                                                                                                                                                                                                  | Master taps **Start game** (shuffles slots into assignments)   |
| `playing`  | Players see only **My card**: face down, tap to flip it to the role, tap again to hide it. Master runs nights and mornings on the narrator page.                                                                                                                                                                                                                                               | Master taps **Finish game** (always available)                 |
| `finished` | **Game summary**: every player's role and the night-and-morning log, for everyone.                                                                                                                                                                                                                                                                                                             | Master taps **Play again**                                     |

> **TODO:** the plan's state diagram (5 states, 3 loops) did not survive the export into `docs/plan.md`. Add the three backward transitions, including where **Play again** leads, from the original plan doc.

**Locks:** kick and close/re-open work until **Start game**. After that, the roster and the settings are locked.

## Visibility

The worker builds each viewer's state before sending it. A player's client never receives data outside the Player column.

| Data                             | Room master | Player        |
| -------------------------------- | ----------- | ------------- |
| Player list                      | Yes         | Yes           |
| Role list + rules (after Ready)  | Yes         | Yes           |
| Role pool cards (browse only)    | Yes         | Yes, any time |
| Who holds which role             | Yes         | Own card only |
| Who has flipped their card       | Yes         | No            |
| Phases, deaths, notes            | Yes         | No            |
| Full reveal + log (after Finish) | Yes         | Yes           |

## Nights and mornings

- Play alternates **Night 1 → Morning 1 → Night 2 → Morning 2 → …** until the master presses and holds **Finish game** (the flag button beside End night) for about a second. **End night** moves to the morning; **End morning** starts the next night. There is no going back to an earlier phase.
- The narrator page is one list for the whole game. Roles are listed in wake order, each with its holders underneath; the narrator can reorder waking roles for this room. Roles that never wake are listed last so their players can still be marked.
- The status control marks a player dead or undoes it, at night and in the morning, with one tap; tapping again undoes it. Each death records the phase it was marked in (for example Morning 1) and shows in that player's history. A history shows one row per phase: when a player died in a night that has a note (or the open note box), only the note row is shown; the struck-through name and Dead pill still mark the death. Dead players stay visible, grayed out.
- At night a **wake guide** names the role to wake, in this room's wake order, with Back and Next, and highlights that role's players. It only guides the narrator; it changes no room state and starts again at the first role each night.
- **End night** and **End morning** need a press and hold, so a stray tap can't skip a phase.
- **A player is dead from the phase they were marked in onward.** Undoing removes the death entirely; a death is always recorded at the current phase.
- **Notes are taken at night only.** Each night, every player who was alive when the night started gets one note field. A player marked dead during that night keeps that night's field. Mornings have no notes, and there is no general night note.
- Earlier notes show under the player as text labelled with their night (`Night 1: …`). Tapping one edits it. Empty notes are not shown.
- Notes are keyed by night and device ID, not role or display name, so players sharing a role have separate notes and reordering never moves a note.
- Note fields are separate from status controls: editing a note never marks or unmarks a player. Only the master can edit notes; player views do not receive them during play. See decisions `0007-per-player-night-comments.md`, `0010-single-list-night-and-morning.md` and `0012-medieval-light-redesign.md`.
- The app records what the narrator marks. It never resolves abilities or decides winners.

## Wake order

Each pool role has a `defaultWakeOrder` (`null` = never wakes); the room copy can be reordered by the narrator.

_No pool roles yet. The `add-role` skill adds each role here._

## Connections and lifetime

- Every WebSocket connects with the device token. After a refresh, tab switch or screen lock, the client reconnects with backoff and receives the full state for its view again.
- **Lost narrator device:** no recovery; the master creates a new room.
- **Kicked player:** their seat is removed for that room; they can rejoin once the master re-opens it.
- **Room expiry:** a room with no activity for 6 hours is deleted and removed from the room list.
