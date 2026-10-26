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
3. **Game summary** — after Finish game: every player's role revealed, plus the night-by-night log. Master gets Play again.

**Room master**

1. **Master lobby** — live player list with a kick button per player; Close room / Re-open room toggle.
2. **Setup** — one empty card slot per player at the top; the role pool below. Tap a pool card to fill the next slot, tap a filled slot to empty it. Tap any card to edit its rule for this room only, or create a custom role. Room settings (timer, sound) live here too. Ready is enabled only when every slot is filled.
3. **Narrator page** — one night at a time:
   - Roles listed in wake order (drag to reorder), each with its holders underneath.
   - Tap a player to mark dead, tap again to undo. Dead players stay visible but grayed out.
   - A comment box per role, plus one for the night.
   - End night moves to the next night; a night switcher lets the narrator go back and correct an earlier one.
   - Timer and sound controls as configured in setup; Finish game is always available.

**Player**

1. **Player lobby** — who's in the room, waiting for the master. Shows a notice if kicked.
2. **Rules review** — after Ready: every role in this game with its count and room-specific rule. No one sees who has what.
3. **My card** — face down; tap to flip, tap again to hide. This is the only screen players see during the game.

## Data model

The role pool is static data shipped with the app; everything else lives inside the room's Durable Object.

| Entity            | Key fields                                                           | Notes                                                            |
| ----------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| PoolRole (static) | id, name {vi, en}, rule {vi, en}, team, defaultWakeOrder, image      | Fixed; never edited at runtime                                   |
| Room              | id, name, status, masterDeviceId, createdAt, lastActiveAt            | status: lobby, setup, reveal, playing, finished                  |
| Player            | deviceId, name, joinedAt, kicked                                     | deviceId comes from the device token                             |
| RoomRole          | id, sourcePoolId?, name, rule, team, wakeOrder                       | A copy of a pool role (edits stay in this room) or a custom role |
| Slot              | index, roomRoleId?                                                   | One per player; filled in setup                                  |
| Assignment        | deviceId, roomRoleId, flipped                                        | Created at Start game by shuffling slots                         |
| Night             | number, deadDeviceIds\[\], roleComments {roleId: text}, nightComment | One per night; editable later                                    |
| Settings          | timerSeconds, soundOn, soundPack                                     | Set in setup, locked at Start game                               |

A player is dead in night N if they were marked in any night before N; marking is undoable in any night.

## Real-time and visibility

The server sends each phone only what it is allowed to see, so no one can find another player's role through developer tools.

| Data                             | Room master | Player        |
| -------------------------------- | ----------- | ------------- |
| Player list                      | Yes         | Yes           |
| Role list + rules (after Ready)  | Yes         | Yes           |
| Who holds which role             | Yes         | Own card only |
| Who has flipped their card       | Yes         | No            |
| Nights, deaths, comments         | Yes         | No            |
| Full reveal + log (after Finish) | Yes         | Yes           |

**Reconnection.** Each device gets a random token in localStorage on first visit. Every WebSocket connects with it, and the room recognizes the same person after a refresh, tab switch or screen lock. The client reconnects automatically with backoff and re-syncs the full state for its view.

**Lost narrator device.** No recovery: the master creates a new room.

**Room expiry.** A room with no activity for 6 hours is deleted and removed from the list.

**Kicked players.** Their seat is removed for that room; they can rejoin when the master re-opens it.

## Visual direction (Phase 0)

A bright, playful look for teens and adults on a light screen, with a forest-village palette; it is designed and approved before any code.

| Area         | Decision                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vibe         | Bright and playful for teens and adults: bold, witty, a little mischievous; not childish                                                                                             |
| Screen       | Light background                                                                                                                                                                     |
| Colors       | Deep forest green (main), vivid lime and sunset orange (highlights), warm off-white background, charcoal text, berry red (danger only)                                               |
| Fonts        | Be Vietnam Pro for everything, extra-bold for headings: modern, clean, and made for Vietnamese accents                                                                               |
| Role cards   | Stylized character per role in a bold graphic style, like modern board-game art, all generated with one shared style prompt; custom roles get a generic card with the role's initial |
| Dead players | Grayed out with a small tombstone mark                                                                                                                                               |
| Sounds       | Playful but not goofy: soft pop on card flip, rooster at night end, wolf howl when the timer ends; on/off in setup                                                                   |
| Animation    | A little: snappy card flip, subtle press on tap, fade to gray on death                                                                                                               |
| Layout       | Phone-first, main button at the bottom for thumbs, touch targets at least 48px                                                                                                       |

**Steps**

1. **Three takes** on this direction (for example bold poster, modern board game, paper cut-out), each shown on the card flip and narrator night screens. Thuan picks one or mixes.
2. **Design system** from the chosen take: color and font tokens, buttons, cards, inputs, player chips.
3. **Mockups** of all nine screens at phone size, checked in both Vietnamese and English.
4. **Card art:** one test card to lock the style, then every role in the pool.
5. **Handoff to Claude Code:** mockups, design tokens and `CLAUDE.md` rules, plus a screenshot-and-compare loop after every UI change.

## Build phases

After Phase 0, six phases, each ending in something playable on real phones.

1. **Foundation** — project scaffold, Cloudflare deploy, i18n wiring, device token, WebSocket connection with auto-reconnect. _Done when:_ two phones connect to a test room and survive a refresh.
2. **Rooms and lobby** — home room list, create/join with name, master lobby, kick, close/re-open, room expiry. _Done when:_ a full group can gather in a room.
3. **Setup** — role pool data (vi + en), card slots, fill/empty, per-room rule edits, custom roles, settings. _Done when:_ the master can build a valid card set for any player count.
4. **Reveal and deal** — rules review screen, Start game shuffle, card flip, flipped indicator for the master. _Done when:_ every player sees only their own card.
5. **Narrator page** — nights, wake order, mark/unmark, gray-out, comments, night switcher, timer and sound. _Done when:_ a full game can be run start to finish.
6. **Finish and polish** — summary screen, Play again, phone UI polish, playtest with a real group. _Done when:_ the group plays two games back to back without help.

## Out of scope for v1

- Third-party and role-changing roles (Vampire, Cupid's lovers, Thief, Wild Child)
- Day-phase tracking (votes, lynch results)
- Any public alive/dead board for players
- Automatic ability resolution or win detection
- Room PINs and narrator device recovery

## Open items

- [ ] Which roles go in the fixed pool, with Vietnamese and English rule text
- [ ] Card artwork: illustrated cards or icon + text
- [ ] Sound pack contents (night start, night end, timer end)
