# Game rules

The spec the code follows, taken from `docs/plan.md`. Any change to game behavior updates this file in the same commit.

## People

- **Room master (narrator):** the person who created the room, or who it was handed to. Only their actions change room state.
- **Player:** everyone who joins. Players only look at their own screens; they never change room state.
- No accounts. Each device has a random token (see `docs/decisions/0002-no-accounts-device-token.md`); a person is identified by `deviceId` within a room.

## Room states

`lobby ⇄ reveal → playing → finished → lobby`

| State      | What happens                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Moves on when                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lobby`    | Players join with a name and wait on **The village**: a looping row of every role card in the pool to look at (it moves on by itself; tap a card to enlarge it, tap the background to close), and the players as lettered squares, with their own highlighted and a tap on any square showing that player's full name. At the same time the master is on **Setup**: sees the live list, can kick, can close or re-open the room, and chooses any number of roles from the pool, edits a role's rule for this room only, or creates a custom role. Room settings (timer, sound) live here. | Master taps **Review rules** (enabled only when roles = joined players, which the room checks again; closes the room)                                                          |
| `reveal`   | Players and the master see **Rules review**: every role in this game with its count and room rule. Nobody sees who has what. The master can tap **Edit roles** to go back to `lobby`; the room stays closed.                                                                                                                                                                                                                                                                                                                                                                              | Master taps **Start game** (shuffles the picks and deals one to each player)                                                                                                   |
| `playing`  | Players see only **My card**: face down, tap to flip it to the role, tap again to hide it. Flipping stays on the phone; a refresh shows the back again. Master runs nights and mornings on the narrator page.                                                                                                                                                                                                                                                                                                                                                                             | Master taps **Finish game** (always available)                                                                                                                                 |
| `finished` | **Game summary**, for the master and every seated player: every player's role (Roles tab) and the night-and-morning log with the narrator's notes and deaths (Night journal tab). Home only navigates; the seat is kept.                                                                                                                                                                                                                                                                                                                                                                  | Master taps **Play again**: back to `lobby` with the same players, picks, rules and settings; deaths and notes are cleared; the room stays closed until the master re-opens it |

The way back: **Edit roles** (`reveal → lobby`) and **Play again** (`finished → lobby`). There is no way back from `playing` except finishing the game.

> **TODO:** the plan's original state diagram had 3 loops; only these two are known. Confirm whether a third was meant.

Gathering players and choosing roles happen at the same time, so they are one status, `lobby` (decision 0017).

**Locks:** kick, close/re-open, leaving and the card set (roles, rules, settings) work while the room is in `lobby`. **Review rules** closes the room; while the room is in `reveal` or later, the roster and card set are locked. **Edit roles** unlocks them again until **Start game**. While playing, the narrator can still change the wake order, the timer length and sound.

## Rooms

- **Creating:** the master names the room (1–32 characters; the field starts with a random suggestion in the phone's language, and a shuffle button offers another) gives their own name, and chooses a 4-digit **PIN**. The room opens at once, and the master goes straight to **Setup**, which shows the PIN under the room name.
- **The master is the narrator, not a player.** They have no seat and never appear in the player list.
- **Joining:** a phone joins with a name of 1–24 characters and the room's PIN while the room is in `lobby` and open. A wrong PIN is refused. After 10 wrong PINs within a minute, the room refuses every join for a minute. A name already in the room is refused, comparing without case or accents (Đức = duc); the master's name counts too. Names are remembered on the phone for next time; the PIN is not. A room made before PINs joins without one.
- **Reconnecting:** a phone that has a seat gets it back after a refresh or screen lock without joining again.
- **Leaving:** a player in `lobby` can leave; their seat is removed.
- **Kicking:** in `lobby`, the master can remove a player. That phone sees "You were removed" and can join again (with any free name and the PIN) only while the room is open.
- **Closing:** in `lobby`, the master can close the room to new players and re-open it. Players who have a seat keep it.
- **Handing over:** in `lobby`, the master can make a seated player who is online the narrator, from the players sheet. That player's seat goes, and the old master takes a seat at the end of the list with their name. Everything else stays: PIN, open or closed, and card set.
- **Deleting:** in any state, the master can press and hold **Delete room** (Setup and narrator menus, and the summary). The room leaves the list at once. Every other phone sees "The narrator deleted this room", and the master's phone goes home.
- **Room list:** home shows every room live: name, master, player count, and Open / Closed / In play. An open room in `lobby` can be joined from it. A room this phone created or has a seat in is marked "Your room", and can always be tapped to go back in.
- **Expiry:** a room with no message or connection for 6 hours is deleted, its phones are told it has closed, and it leaves the list.

## Setup (the card set)

While players gather, the master builds the card set on **Setup**. The room keeps it, so it survives a refresh. See decision 0018.

- **Roles:** any number of copies of any pool or custom role, up to 40 in all. Roles are chosen freely; **Review rules** is enabled only when the roles equal the joined players (more than zero).
- **Rule edits:** tapping a chosen role's rule edits it for this room only. The edited rule is one text, shown to every player whatever their language. An emptied rule keeps the rule it had.
- **Factions:** Village, Wolves, and a third faction for roles that win on their own (`solo`). Setup, the rules review and the summary list them in that order, wolves first.
- **Custom roles:** a name (1–32 characters), a rule (1–500), a faction, and whether it wakes at night (every night). A waking custom role goes after the pool roles in the wake order. Up to 20 per room; they can't be deleted.
- **Wake order:** the master can reorder the waking roles in the game; roles not reordered follow their default order.
- **Settings:** the night timer (whole seconds, 0–3600, 0 = off; 120 by default) and sound cues (off by default). Language is per phone, not a room setting.
- All of this is master-only and locked once the room leaves `lobby`, except the wake order, timer and sound, which the narrator can still change while playing.

## Dealing

- **Start game** needs as many roles as seated players, checked by the room. The room shuffles the picks (every order equally likely, from a crypto random source) and deals one to each seated player in the order they joined. See decision 0019.
- The deal is kept by the room, so a refresh or a lost connection gets the same card back.
- The app does not track who has flipped their card.

## Visibility

The worker builds each viewer's state before sending it. A player's client never receives data outside the Player column.

| Data                                                                            | Room master | Player              |
| ------------------------------------------------------------------------------- | ----------- | ------------------- |
| Player list                                                                     | Yes         | Yes                 |
| Card set while building (picks, rule edits, custom roles, wake order, settings) | Yes         | No                  |
| Role list + rules (from Review rules on)                                        | Yes         | Yes                 |
| Role pool cards (browse only)                                                   | Yes         | Yes, any time       |
| Who holds which role                                                            | Yes         | Own card only       |
| Phases, deaths, notes, marks                                                    | Yes         | No                  |
| Full reveal + log, the narrator's notes included (after Finish)                 | Yes         | Seated players only |
| Room PIN                                                                        | Yes         | No                  |

## Nights and mornings

- Play alternates **Night 1 → Morning 1 → Night 2 → Morning 2 → …** until the master presses and holds **Finish game** (the flag button beside End night) for about a second. **End night** moves to the morning; **End morning** starts the next night. There is no going back to an earlier phase.
- The narrator page is one list for the whole game. Roles are listed in wake order, each with its holders underneath; the narrator can reorder waking roles for this room. Roles that never wake are listed last so their players can still be marked.
- The status control marks a player dead or undoes it, at night and in the morning, with one tap; tapping again undoes it. Each death records the phase it was marked in (for example Morning 1) and shows in that player's history. A history shows one row per phase: when a player died in a night that has a note (or the open note box), only the note row is shown; the struck-through name and Dead pill still mark the death. Dead players stay visible, grayed out.
- **End night** and **End morning** need a press and hold, so a stray tap can't skip a phase.
- **A player is dead from the phase they were marked in onward.** Undoing removes the death entirely; a death is always recorded at the current phase.
- **Notes are taken at night only.** Each night, every player who was alive when the night started gets one note field. A player marked dead during that night keeps that night's field. Mornings have no notes, and there is no general night note.
- Earlier notes show under the player as text labelled with their night (`Night 1: …`). Tapping one edits it. Empty notes are not shown.
- Notes are keyed by night and device ID, not role or display name, so players sharing a role have separate notes and reordering never moves a note.
- Note fields are separate from status controls: editing a note never marks or unmarks a player. Only the master can edit notes; player views do not receive them during play. See decisions `0007-per-player-night-comments.md`, `0010-single-list-night-and-morning.md` and `0012-medieval-light-redesign.md`.
- **The room keeps all of it:** the phase, deaths and notes survive a refresh, and only the master's phone receives them. Ending a phase names the phase being ended, so a hold that arrives twice ends one phase, not two. See decision 0020.
- A note is saved about a second after the narrator stops typing, and when its field is left. A note typed while reconnecting is sent once the connection is back. Notes are up to 1000 characters.
- **Marks:** beside the status pill, a tag button with a count opens a sheet of the marks this player may carry in this game (see below); each is switched on or off with one tap, recorded at the current phase, and shown as a chip under the player's name. A mark never changes anything by itself, and never reaches the player's phone during play. Marks are kept like deaths, survive a refresh, and are cleared by Play again. The summary shows each player's marks on the Roles tab, and each mark in the journal phase it was made in. See decision 0023.
- **Timer:** the narrator starts, pauses and resets a countdown from the menu. Its length is the room's timer setting (0 hides it). It runs on the narrator's phone only, so a refresh resets it. With sound on, a short chime plays when it reaches zero.
- The app records what the narrator marks. It never resolves abilities or decides winners.

## Marks

Marks are pool data in `packages/shared/src/roles/marks.ts`. A mark is offered when one of its roles is dealt (or in every game when it names none); a holders-only mark can be carried only by a player dealt one of its roles. Marking a player with a single mark moves it from whoever had it.

| Mark             | Offered by                  | Carried by         |
| ---------------- | --------------------------- | ------------------ |
| Sheriff          | every game                  | one player at once |
| Second vote used | Stuttering Judge            | its holder         |
| Power lost       | Fox, Big Bad Wolf           | its holder         |
| Heal potion used | Witch                       | its holder         |
| Kill potion used | Witch                       | its holder         |
| Extra life used  | Elder                       | its holder         |
| Can't vote       | Village Idiot               | its holder         |
| Rusted           | Knight with the Rusty Sword | any player         |

## Wake order

Each pool role has a `defaultWakeOrder` (`null` = never wakes); the room copy can be reordered by the narrator. Each also has `wakeNights`: every night, Night 1 only, or even nights (2, 4, …). On a night a role doesn't wake, the narrator page lists it with the roles that never wake.

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
- **Lost narrator device:** no recovery; the master creates a new room. To leave on purpose, hand the room over first.
- **Kicked player:** their seat is removed for that room; they can join again whenever the room is open (at once if it never closed).
- **Room expiry:** a room with no activity for 6 hours is deleted and removed from the room list.
