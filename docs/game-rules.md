# Game rules

The spec the code follows, taken from `docs/plan.md`. Any change to game behavior updates this file in the same commit.

## People

- **Room master (narrator):** the person who created the room. Only their actions change room state.
- **Player:** everyone who joins. Players only look at their own screens; they never change room state.
- No accounts. Each device has a random token (see `docs/decisions/0002-no-accounts-device-token.md`); a person is identified by `deviceId` within a room.

## Room states

`lobby → setup → reveal → playing → finished`

| State      | What happens                                                                                                                                                                | Moves on when                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `lobby`    | Players join with a name. Master sees the live list, can kick, and can close or re-open the room.                                                                           | Master goes to setup                                           |
| `setup`    | One empty card slot per player; master fills slots from the pool, edits a role's rule for this room only, or creates a custom role. Room settings (timer, sound) live here. | Master taps **Ready** (enabled only when every slot is filled) |
| `reveal`   | Players see **Rules review**: every role in this game with its count and room rule. Nobody sees who has what.                                                               | Master taps **Start game** (shuffles slots into assignments)   |
| `playing`  | Players see only **My card**. Master runs nights on the narrator page.                                                                                                      | Master taps **Finish game** (always available)                 |
| `finished` | **Game summary**: every player's role and the night-by-night log, for everyone.                                                                                             | Master taps **Play again**                                     |

> **TODO:** the plan's state diagram (5 states, 3 loops) did not survive the export into `docs/plan.md`. Add the three backward transitions, including where **Play again** leads, from the original plan doc.

**Locks:** kick and close/re-open work until **Start game**. After that, the roster and the settings are locked.

## Visibility

The worker builds each viewer's state before sending it. A player's client never receives data outside the Player column.

| Data                             | Room master | Player        |
| -------------------------------- | ----------- | ------------- |
| Player list                      | Yes         | Yes           |
| Role list + rules (after Ready)  | Yes         | Yes           |
| Who holds which role             | Yes         | Own card only |
| Who has flipped their card       | Yes         | No            |
| Nights, deaths, comments         | Yes         | No            |
| Full reveal + log (after Finish) | Yes         | Yes           |

## Nights

- The narrator works on one night at a time. **End night** moves to the next one; the night switcher goes back to correct an earlier night.
- Roles are listed in wake order, each with its holders underneath. The narrator can drag to reorder for this room.
- Tapping a player marks them dead; tapping again undoes it. Dead players stay visible, grayed out.
- **A player is dead in night N if they were marked in any night before N.** Marking can be undone in any night.
- One comment field per player per night, plus one general night note. Players sharing a role have separate comments, keyed by device ID rather than role or display name. Switching nights restores the selected night's notes; dead players' notes stay editable.
- Comment fields are separate from status controls: editing a comment never marks or unmarks a player. Only the master can edit notes; player views do not receive them during play. See `docs/decisions/0007-per-player-night-comments.md`.
- The app records what the narrator marks. It never resolves abilities or decides winners.

## Wake order

Each pool role has a `defaultWakeOrder` (`null` = never wakes); the room copy can be reordered by the narrator.

_No pool roles yet. The `add-role` skill adds each role here._

## Connections and lifetime

- Every WebSocket connects with the device token. After a refresh, tab switch or screen lock, the client reconnects with backoff and receives the full state for its view again.
- **Lost narrator device:** no recovery; the master creates a new room.
- **Kicked player:** their seat is removed for that room; they can rejoin once the master re-opens it.
- **Room expiry:** a room with no activity for 6 hours is deleted and removed from the room list.
