# Werewolf Webapp — Project Plan

Oct 26, 2026 · @Thuan

## Overview

A phone-first webapp that replaces physical role cards and the narrator's notebook for in-person Werewolf games. Everyone sits in the same room; the app only deals cards and tracks nights.

- **No accounts.** People type a name when they create or join a room.
- **Two roles in the app.** The room creator is the room master (narrator); everyone who joins is a player.
- **Phone-first.** Every screen is designed for one-hand use on a phone; desktop is a bonus.
- **Bilingual.** Vietnamese and English, switchable on every screen.
- **Survives interruptions.** Refresh, tab switch or screen lock reconnects the same person automatically.
- **Narrator-driven.** The app records what the narrator marks; it does not resolve abilities or decide winners.

## Tech stack

React on the front, Cloudflare Workers + Durable Objects on the back, all deployed to Cloudflare on the free plan.

| Layer       | Choice                                   | Why                                                             |
| ----------- | ---------------------------------------- | --------------------------------------------------------------- |
| UI          | React + TypeScript + Vite                | Fast to build, huge ecosystem                                   |
| Styling     | Tailwind CSS                             | Mobile-first utilities, quick iteration                         |
| Language    | i18next (vi, en)                         | Standard i18n, per-device language choice                       |
| Card flip   | CSS 3D transform                         | No extra library needed                                         |
| Real-time   | WebSockets                               | Instant sync between narrator and players                       |
| Room server | One Durable Object per room              | Holds the authoritative game state and every phone's connection |
| Room list   | One Lobby Durable Object                 | Tracks open rooms for the home screen                           |
| Storage     | Durable Object SQLite                    | State survives restarts; no separate database                   |
| Hosting     | Cloudflare Workers (static assets + API) | One deploy, free plan, no sleeping                              |

Durable Objects are available on the Workers Free plan (SQLite backend only), which is all this app needs. [source](https://developers.cloudflare.com/changelog/2025-04-07-durable-objects-free-tier/)

## Game states

Every room moves through five states, and only the master's buttons change state.

&#91;embedded content: room states · 5 states, 3 loops\]

Kick and re-open work until Start game; after that the roster and settings are locked.

## Screens

Nine screens: three shared, three for the room master, three for players.

**Shared**

1. **Home / room list** — open rooms with name, master, player count and status (open / closed / in game). Buttons: Create room, language switch.
2. **Name entry** — a single field shown when creating or joining. Remembered on the device for next time.
3. **Game summary** — after Finish game: every player's role revealed, plus the night-and-morning log. Master gets Play again.

**Room master**

1. **Master lobby** — live player list with a kick button per player; Close room / Re-open room toggle.
2. **Setup** — one selected-role list with quantity controls. Add roles opens the role library and custom-role entry in a bottom sheet. Tap a role name to edit its rule for this room. Settings (timer, sound, language) live in the header menu. Counts fill the underlying slots; Ready is enabled only when every slot is filled.
3. **Narrator page** — one list for the whole game, alternating Night 1 → Morning 1 → Night 2 → …:
   - Roles listed in wake order (drag to reorder), each with its holders underneath. Roles that never wake come last.
   - Mark a player dead, or undo it, at night or in the morning. Dead players stay visible but grayed out.
   - Each player shows a status control and, underneath, their history: earlier notes as text (`Night 1: …`, tap to edit) and deaths. At night, each player who was alive when the night started gets a note field right in the list. Mornings only record deaths.
   - End night moves to the morning; End morning starts the next night. There is no going back to an earlier phase.
   - Timer, sound, wake order, language, and Finish game live in the header menu.

**Player**

1. **Player lobby** — who's in the room, waiting for the master. Shows a notice if kicked.
2. **Rules review** — after Ready: every role in this game with its count and room-specific rule. No one sees who has what.
3. **My card** — face down; tap to flip, tap again to hide. This is the only screen players see during the game.

## Data model

The role pool is static data shipped with the app; everything else lives inside the room's Durable Object.

| Entity            | Key fields                                                       | Notes                                                            |
| ----------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| PoolRole (static) | id, name {vi, en}, rule {vi, en}, team, defaultWakeOrder, image  | Fixed; never edited at runtime                                   |
| Room              | id, name, status, phase, masterDeviceId, createdAt, lastActiveAt | status: lobby, setup, reveal, playing, finished                  |
| Player            | deviceId, name, joinedAt, kicked                                 | deviceId comes from the device token                             |
| RoomRole          | id, sourcePoolId?, name, rule, team, wakeOrder                   | A copy of a pool role (edits stay in this room) or a custom role |
| Slot              | index, roomRoleId?                                               | One per player; filled in setup                                  |
| Assignment        | deviceId, roomRoleId, flipped                                    | Created at Start game by shuffling slots                         |
| Phase             | kind (night, morning), number                                    | Current phase while playing: Night 1, Morning 1, Night 2, …      |
| Night             | number, playerComments {deviceId: text}                          | One per night; notes editable later                              |
| Death             | deviceId, phase                                                  | At most one per player; removed when undone                      |
| Settings          | timerSeconds, soundOn, soundPack                                 | Set in setup, locked at Start game                               |

A player is dead from the phase they were marked in onward; marking can be undone at any time.

## Real-time and visibility

The server sends each phone only what it is allowed to see, so no one can find another player's role through developer tools.

| Data                             | Room master | Player        |
| -------------------------------- | ----------- | ------------- |
| Player list                      | Yes         | Yes           |
| Role list + rules (after Ready)  | Yes         | Yes           |
| Who holds which role             | Yes         | Own card only |
| Who has flipped their card       | Yes         | No            |
| Phases, deaths, notes            | Yes         | No            |
| Full reveal + log (after Finish) | Yes         | Yes           |

**Reconnection.** Each device gets a random token in localStorage on first visit. Every WebSocket connects with it, and the room recognizes the same person after a refresh, tab switch or screen lock. The client reconnects automatically with backoff and re-syncs the full state for its view.

**Lost narrator device.** No recovery: the master creates a new room.

**Room expiry.** A room with no activity for 6 hours is deleted and removed from the list.

**Kicked players.** Their seat is removed for that room; they can rejoin when the master re-opens it.

## Visual direction (Phase 0)

**Current choice: Woodcut**, selected 2026-10-28 (decision 0013). It's black ink on putty paper with Barlow Condensed wood-type titles, panels set apart by a tone step, lapis village and madder wolf names, real card art, and a Cranach woodcut on home. At night the wake line is the narrator's biggest text.

The source of truth is [the design direction](design/direction.md), the tokens in `apps/web/src/design/tokens.css`. The `/design` route shows every screen and state.

Phase 0 includes shared components, nine screen templates, a development-only gallery (phone-framed on wide screens), and bilingual phone baselines. The seer, villager and wolf, the card back and both factions have their own art; other roles show a hooded fallback figure until their artwork is supplied. On the narrator screen:

- Players have one-tap status pills with Undo, their note history, and the current night's field inline.
- At night a wake guide steps through the roles.
- Ending a phase needs a press and hold.

Players tap their card to flip it. Setup uses role quantities and an on-demand library. Finished-game roles and night records have separate tabs.

Device identity, sockets, real rooms, state-machine actions, and privacy enforcement remain in their planned phases. See decisions [0007](decisions/0007-per-player-night-comments.md), [0008](decisions/0008-phase-zero-previews-and-placeholder-art.md), [0009](decisions/0009-tabletop-visual-direction.md), [0010](decisions/0010-single-list-night-and-morning.md), [0011](decisions/0011-compact-tabletop-layouts.md), [0012](decisions/0012-medieval-light-redesign.md), and [0013](decisions/0013-woodcut-redesign.md).

## Build phases

After Phase 0, six phases, each ending in something playable on real phones.

1. **Foundation** — project scaffold, Cloudflare deploy, i18n wiring, device token, WebSocket connection with auto-reconnect. _Done when:_ two phones connect to a test room and survive a refresh.
2. **Rooms and lobby** — home room list, create/join with name, master lobby, kick, close/re-open, room expiry. _Done when:_ a full group can gather in a room.
3. **Setup** — role pool data (vi + en), card slots, fill/empty, per-room rule edits, custom roles, settings. _Done when:_ the master can build a valid card set for any player count.
4. **Reveal and deal** — rules review screen, Start game shuffle, card flip, flipped indicator for the master. _Done when:_ every player sees only their own card.
5. **Narrator page** — night and morning phases, wake order, mark/unmark, gray-out, per-night notes with tap-to-edit, timer and sound. _Done when:_ a full game can be run start to finish.
6. **Finish and polish** — summary screen, Play again, phone UI polish, playtest with a real group. _Done when:_ the group plays two games back to back without help.

## Out of scope for v1

- Third-party and role-changing roles (Vampire, Cupid's lovers, Thief, Wild Child)
- Day-phase votes and lynch tracking (mornings only record who died)
- Any public alive/dead board for players
- Automatic ability resolution or win detection
- Room PINs and narrator device recovery

## Open items

- [ ] Which roles go in the fixed pool, with Vietnamese and English rule text
- [x] Card artwork approach: centered hand-colored engraved characters; standalone production assets still to be made
- [ ] Sound pack contents (night start, night end, timer end)
