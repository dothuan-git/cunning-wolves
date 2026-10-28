# Game rules

The spec the code follows, taken from `docs/plan.md`. Any change to game behavior updates this file in the same commit.

## People

- **Room master (narrator):** the person who created the room. Only their actions change room state.
- **Player:** everyone who joins. Players only look at their own screens; they never change room state.
- No accounts. Each device has a random token (see `docs/decisions/0002-no-accounts-device-token.md`); a person is identified by `deviceId` within a room.

## Room states

`lobby → reveal → playing → finished`

| State      | What happens                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Moves on when                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `lobby`    | Players join with a name and wait on **The village**: a looping row of every role card in the pool to look at (it moves on by itself; tap a card to enlarge it, tap the background to close), and the players as lettered squares, with their own highlighted and a tap on any square showing that player's full name. At the same time the master is on **Setup**: sees the live list, can kick, can close or re-open the room, and chooses any number of roles from the pool, edits a role's rule for this room only, or creates a custom role. Room settings (timer, sound) live here. | Master taps **Review rules** (enabled only when roles = joined players; closes the room) |
| `reveal`   | Players see **Rules review**: every role in this game with its count and room rule. Nobody sees who has what.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Master taps **Start game** (shuffles picks into assignments)                             |
| `playing`  | Players see only **My card**: face down, tap to flip it to the role, tap again to hide it. Master runs nights and mornings on the narrator page.                                                                                                                                                                                                                                                                                                                                                                                                                                          | Master taps **Finish game** (always available)                                           |
| `finished` | **Game summary**: every player's role and the night-and-morning log, for everyone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Master taps **Play again**                                                               |

> **TODO:** the plan's state diagram (5 states, 3 loops) did not survive the export into `docs/plan.md`. Add the three backward transitions, including where **Play again** leads, from the original plan doc.

Gathering players and choosing roles happen at the same time, so they are one status, `lobby` (decision 0017).

**Locks:** kick, close/re-open and the card set (roles, rules, settings) work while the room is in `lobby`. **Review rules** closes the room; once the room leaves `lobby` (Phase 4), the roster, card set and settings are locked.

## Rooms

- **Creating:** the master names the room (1–32 characters; the field starts with a random suggestion in the phone's language, and a shuffle button offers another) and gives their own name. The room opens at once, and the master goes straight to **Setup**.
- **The master is the narrator, not a player.** They have no seat and never appear in the player list.
- **Joining:** a phone joins with a name of 1–24 characters while the room is in `lobby` and open. A name already in the room is refused, comparing without case or accents (Đức = duc); the master's name counts too. Names are remembered on the phone for next time.
- **Reconnecting:** a phone that has a seat gets it back after a refresh or screen lock without joining again.
- **Leaving:** a player in `lobby` can leave; their seat is removed.
- **Kicking:** in `lobby`, the master can remove a player. That phone sees "You were removed" and can join again (with any free name) only while the room is open.
- **Closing:** in `lobby`, the master can close the room to new players and re-open it. Players who have a seat keep it.
- **Room list:** home shows every room live: name, master, player count, and Open / Closed / In play. Only an open room in `lobby` can be joined from it.
- **Expiry:** a room with no message or connection for 6 hours is deleted, its phones are told it has closed, and it leaves the list.

## Setup (the card set)

While players gather, the master builds the card set on **Setup**. The room keeps it, so it survives a refresh. See decision 0018.

- **Roles:** any number of copies of any pool or custom role, up to 40 in all. Roles are chosen freely; **Review rules** is enabled only when the roles equal the joined players (more than zero).
- **Rule edits:** tapping a chosen role's rule edits it for this room only. The edited rule is one text, shown to every player whatever their language. An emptied rule keeps the rule it had.
- **Custom roles:** a name (1–32 characters), a rule (1–500), a faction, and whether it wakes at night. A waking custom role goes after the pool roles in the wake order. Up to 20 per room; they can't be deleted.
- **Wake order:** the master can reorder the waking roles in the game; roles not reordered follow their default order.
- **Settings:** the night timer (whole seconds, 0–3600, 0 = off; 120 by default) and sound cues (off by default). Language is per phone, not a room setting.
- All of this is master-only and locked once the room leaves `lobby`.

## Visibility

The worker builds each viewer's state before sending it. A player's client never receives data outside the Player column.

| Data                                                                            | Room master | Player        |
| ------------------------------------------------------------------------------- | ----------- | ------------- |
| Player list                                                                     | Yes         | Yes           |
| Card set while building (picks, rule edits, custom roles, wake order, settings) | Yes         | No            |
| Role list + rules (after Ready)                                                 | Yes         | Yes           |
| Role pool cards (browse only)                                                   | Yes         | Yes, any time |
| Who holds which role                                                            | Yes         | Own card only |
| Who has flipped their card                                                      | Yes         | No            |
| Phases, deaths, notes                                                           | Yes         | No            |
| Full reveal + log (after Finish)                                                | Yes         | Yes           |

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

The `add-role` skill adds each waking role here. Role details: `docs/roles/<id>.md`.

1. Stuttering Judge (`stuttering-judge`, 10): Night 1 only
2. Two Sisters (`two-sisters`, 20)
3. Three Brothers (`three-brothers`, 30)
4. Fox (`fox`, 40)
5. Seer (`seer`, 50)
6. Bodyguard (`bodyguard`, 60)
7. Werewolf (`werewolf`, 70)
8. Big Bad Wolf (`big-bad-wolf`, 80)
9. Witch (`witch`, 90)
10. Raven (`raven`, 100)

Never wake: Bear Tamer, Elder, Hunter, Knight with the Rusty Sword, Little Girl (she may peek during the werewolves' turn), Scapegoat, Village Idiot, Villager.

## Connections and lifetime

- Every WebSocket connects with the device token, sent only in its first message. The room knows the phone by a device id derived from the token and the room id, so the same phone has a different id in each room; other phones never see the token. After a refresh, tab switch or screen lock, the client reconnects with backoff and receives the full state for its view again.
- **One connection per phone:** if the same phone connects again (a refresh, or a second tab), the room closes its older connection. A second tab takes over the seat, and the first stops reconnecting. See decision 0016.
- **Lost narrator device:** no recovery; the master creates a new room.
- **Kicked player:** their seat is removed for that room; they can join again whenever the room is open (at once if it never closed).
- **Room expiry:** a room with no activity for 6 hours is deleted and removed from the room list.
