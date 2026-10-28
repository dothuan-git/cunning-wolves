# Progress

## Done

- **Project setup** (branch `chore/project-setup`): pnpm workspace with `apps/web`, `apps/worker`, `packages/shared`; strict TypeScript, ESLint, Prettier, Vitest, Playwright; `AGENTS.md`, `CLAUDE.md`, `.claude/` (rules, subagents, `add-role` skill, hooks, permissions, plugins); docs skeleton; CI and PR preview workflows. The app shows a "hello" page backed by `/api/hello`.

- **Initial visual direction approved** (2026-10-27): Village ink with light ivory surfaces, colored medieval engraving, manuscript-style headings, red wolves / blue villagers, and per-player night comments. Approved board saved in `docs/design/mockups/approved-village-ink.png`; tokens, self-hosted fonts, and the starter home screen use the new direction.

- **Phase 0 complete** (branch `feat/phase-0-design-system`, 2026-10-27): shared controls, all nine screen templates plus a component specimen, Vietnamese/English phone mockups and edge states, local interaction previews at `/design`, repeatable mockup capture, and a shared replaceable card-art placeholder. Final role artwork is deferred at Thuan's request. See `docs/design/components.md` and decision 0008.

- **Tabletop refresh** (2026-10-27): Thuan selected option B after reviewing the first rendered UI and later proposals. All screen templates now use the selected folio/forest/brass treatment, local Alegreya type, a decorative seal/panorama, explicit player-status selectors, and Roles / Night journal tabs. The former screenshot baseline is archived; current mockups use Tabletop. See decision 0009.

- **Narrator single list** (2026-10-27): the narrator page is one list for the whole game, alternating Night → Morning. Earlier notes become tap-to-edit text, mornings only mark deaths, non-waking roles are listed, and the general night note and night switcher are gone. The summary journal lists notes and deaths per phase. Spec, screen template, preview, mockups and tests are updated; real room state follows in Phase 5. See decision 0010.

- **Compact Tabletop layouts** (2026-10-27): smaller shared typography and headers; selected-role quantities with an on-demand library; compact narrator list with inline history and note fields (Thuan chose inline notes over per-player sheets); secondary controls in menus; collapsed development toolbar. Existing night/death semantics and placeholder role art are preserved. See decision 0011.

- **Medieval light redesign** (2026-10-27):
  - Thuan discarded the Tabletop docs and chose a light medieval look: a parchment page with content on cards, forest and gilt, lapis/madder role banners, and Source Sans 3 everywhere.
  - UX additions: one-tap status with Undo, a night wake guide, press-and-hold to end a phase, and hold-to-peek cards.
  - `/design` shows screens in a 390×844 phone frame.
  - See decision 0012.

- **Woodcut redesign** (2026-10-28):
  - Redesigned with taste-skill: putty paper and black ink, Barlow Condensed and Barlow, panels set apart by a tone step (no borders, shadows or ornaments), and faction color as the only hue.
  - Home sets the name at poster size around a CC0 Cranach woodcut. At night the narrator's wake line is the largest text, with the role's art inside the sentence.
  - The seer, villager and card-back art are in.
  - Every flow from 0012 is kept.
  - See decision 0013 and `docs/design/direction.md`.

- **The village page** (2026-10-28): players are lettered squares at the bottom, five to a row, with the player's own highlighted. A looping row of the role cards sits above them; it moves on by itself, and tapping a card enlarges it (tap the background to close). The page is one screen high and only the players section scrolls. Tapping a tile shows the full name. See decision 0015.

- **Role card page** (2026-10-28): the page is one screen high with no scroll, and the card is round. The back shows by default; tapping flips it to the role (name vertical top right, rule centered; a bordered card with a soft shadow, no faction logo) and tapping again hides it. The reveal button is gone. See decision 0014.

- **Setup is the master's lobby** (2026-10-28): the "Gather the village" screen is gone. Setup opens with a room panel (players sheet with kick, close/re-open). Roles are chosen freely, and Review rules opens only when roles equal joined players; it closes the room.

- **Phase 1 foundation** (branch `feat/phase-1-foundation`, 2026-10-28):
  - Device token in localStorage.
  - Room WebSocket at `/api/rooms/:id/ws` on the Hibernation API. The token goes only in the first message, and the device id is a hash of it.
  - A second connection from the same phone replaces the first.
  - The client reconnects with backoff and a ping/pong heartbeat, and checks right away when the screen wakes or the network returns.
  - The temporary `/test/<room>` page shows the connected phones. Two browsers keep their ids across a refresh (e2e).
  - See decision 0016. The production deploy is still open (Next, item 1).

- **Phase 2 rooms and lobby** (branch `feat/phase-2-rooms-lobby`, 2026-10-28):
  - Create a room at `/new`. The room name starts as a random suggestion with a shuffle button.
  - The home list is live over the Lobby socket.
  - Players join at `/room/<id>` with a unique name (case and accents ignored), and keep their seat after a refresh.
  - The master can kick, close and re-open from Setup. Players can leave.
  - Rooms expire after 6 hours idle.
  - The Room state machine (pure, unit-tested) works with SQLite storage and builds per-viewer master and player views.
  - `lobby` and `setup` are one status now.
  - The temporary test page is removed.
  - See decision 0017.

- **Phase 3 setup** (branch `feat/phase-3-setup`, 2026-10-28):
  - The role pool has 18 roles from _Werewolves of Millers Hollow_: ten that wake and eight that don't. Role-changing and third-party roles stay out. Each has a `docs/roles/` file.
  - The room keeps the card set: picks, rule edits, custom roles, wake order and settings survive a refresh.
  - An edited rule is one text for every player.
  - Custom roles can wake at night.
  - Only the master's view carries the card set.
  - Setup is driven by the room; while reconnecting it says changes can't be saved yet.
  - Review rules is gated on roles = players.
  - See decision 0018.

- **Phase 4 reveal and deal** (branch `feat/phase-4-reveal-deal`, 2026-10-28):
  - **Review rules** moves the room to `reveal` after the room checks roles = players. Everyone sees the rules review with this room's rules.
  - **Edit roles** takes the master back to Setup until the game starts.
  - **Start game** shuffles the picks with a crypto source and deals one to each player. Each phone receives only its own card.
  - The card flip stays on the phone. At Thuan's request there is no flipped indicator.
  - The narrator page lists the real holders of each role.
  - See decision 0019.

## Next

1. Confirm deployment setup: Cloudflare login and GitHub secrets (`docs/decisions/0004-pr-preview-workers.md`), and a deployed phone smoke check: create a room on one phone, join from two others, refresh one.
2. **Phase 5 (narrator page):**
   - Night and morning phases, deaths, per-night notes, the timer, sound and the in-game wake order, all kept by the room.

## Known issues

- The plan's state diagram (3 loops) is missing from `docs/plan.md`; see the TODO in `docs/game-rules.md`.
- The system Node on the dev machine is 20 (end of life). pnpm runs scripts on Node 24 regardless; upgrading the system Node to 24 LTS is still recommended.
- Open items from the plan: standalone assets in the approved engraving style, and the sound pack contents.
- Home, create, join, the village, Setup, the rules review and My card run on real rooms. The narrator page shows the real deal, but its phases, deaths and notes are kept on the master's phone only until Phase 5, so a refresh starts again at Night 1. The narrator page has no Finish game control until Phase 6. The summary still runs on sample data. The development gallery uses synthetic data and is excluded from production JavaScript.
- The seer, villager and wolf have card art; other roles show the hooded fallback figure. Add `<role-id>.webp` images; see `apps/web/src/assets/cards/README.md`.
- Missing card art: stuttering-judge, two-sisters, three-brothers, fox, bodyguard, big-bad-wolf, witch, raven, bear-tamer, elder, hunter, knight, little-girl, scapegoat, village-idiot.
- The pool's vi + en role text was drafted by Claude and awaits Thuan's review (`docs/roles/`).
