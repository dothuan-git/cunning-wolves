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

- **Phase 5 narrator page** (branch `feat/phase-5-narrator`, 2026-10-28):
  - The room keeps the phase, deaths and per-night notes, so a refresh no longer starts again at Night 1. Only the master's phone receives them.
  - Notes save a second after typing stops and when the field is left, and are retried after a reconnect.
  - End night carries the phase being ended, so a repeated hold skips nothing.
  - The wake order, timer length and sound stay editable while playing.
  - The timer counts down on the narrator's phone, and a Web Audio chime plays at zero when sound is on.
  - While reconnecting, the narrator's controls are disabled and the footer says so.
  - See decision 0020.

- **Phase 6 finish and Play again** (branch `feat/phase-6-finish`, 2026-10-28):
  - The narrator holds **Finish game**. Everyone seated then sees the existing summary: every role, and the night journal with notes and deaths.
  - Only the narrator gets **Play again**. It returns to Setup with the same players and card set. Deaths, notes and the deal are cleared, and the room stays closed.
  - A player's phone receives the whole deal only after Finish.
  - See decision 0021.

- **Room PIN, getting back in, handover and delete** (branch `feat/room-pin-and-delete`, 2026-10-29):
  - Creating a room needs a 4-digit PIN, and players type it to join. Only the master's phone receives it. Ten wrong tries lock joining for a minute.
  - Home keeps rooms this phone created or sits in tappable ("Your room"), even when they are closed or in play.
  - The narrator can hand the room to an online player in `lobby`. The old narrator takes a seat.
  - The narrator can delete the room at any time with a press and hold.
  - See decision 0022.

- **Player marks, third faction, wake nights** (branch `feat/player-marks`, 2026-10-29):
  - The narrator can mark players with things to remember: Sheriff in every game, and the used powers of the Judge, Fox, Big Bad Wolf, Witch, Elder and Village Idiot, and the Knight's rust. A tag button beside the status pill opens the marks; they show as chips, survive a refresh, and appear in the summary.
  - A third faction (`solo`) for roles that win alone, in purple with its own emblem; custom roles can join it.
  - Roles can wake on Night 1 only or on even nights; the Stuttering Judge now rests after Night 1.
  - Third-faction and team-changing roles are back in scope; card-swapping roles stay out.
  - The pool now holds 84 roles. 42 are from The Werewolves of Millers Hollow (base game, New Moon, Characters, The Village), 33 from Ultimate Werewolf and 11 more that had been skipped for lack of a sourced rule. The first 27 have marks where the narrator needs to remember something; the other 59 are a card and a rule only, and the app does not run their power.
  - The Ultimate Werewolf roles (Apprentice Seer, Aura Seer, Beholder, Insomniac, Paranormal Investigator, Mayor, Priest, Prince, Tough Guy, Martyr, Pacifist, Old Hag, Old Man, Spellcaster, Troublemaker, Drunk, Ghost, Magician, Lycan, Cursed, Diseased, Doppelgänger, Wolf Man, Wolf Cub, Dire Wolf, Dream Wolf, Minion, Sorceress, Bogeyman, Vampire, Cult Leader, Tanner) were written from partial sources that differ between editions, so each doc says to check it against your copy.
  - Added from the most common version of their rule: Fruit Brute, Lone Wolf, Chupacabra, The Count, Hoodlum and the Amulet of Protection. Added with placeholder rules, because the printed text is not online: the 2026 anniversary roles Puppeteer, Wise Monkey, Colossus and Mighty Wolf-Mother (replace them with the box text). Not added: Teenage Werewolf (no source at all), and the Sheriff and Town Crier, which are marks.
  - Nine roles added: Cupid, Wild Child, Wolf-hound, Cursed Wolf-Father, White Werewolf, Pied Piper, Angel, and Prejudiced Manipulator (branch `feat/roles-third-faction`), with their marks. A player marked Cursed, Turned wolf or Chose the wolves also shows in the wolves' panel, so the narrator wakes them with the pack. Wake orders now run 10 to 500.
  - See decision 0023.
- **Role effects on the narrator page** (branch `feat/role-effects`, 2026-10-29):
  - Marks for the lasting effects of the remaining roles: joining the wolves (Alpha Wolf, Cursed) or the cult, the Dire Wolf's companion, the Doppelgänger's model, the Hoodlum's targets, a delayed death, the Priest's blessing, the amulet, a burned house, the Captain, the Prince revealed, and "Power used" for once-per-game roles. One-night effects (Bodyguard, Raven, Old Hag…) stay in notes. The Lone Wolf shows in the wolves' pack.
  - Linked deaths: marking a lover dead marks the other lovers too, and a Dire Wolf dies with its companion; one tap undoes the chain (decision 0024).
  - New role: the narrator can give a player another role (Doppelgänger, Thief, Drunk…); the player moves to that role's panel, the phone keeps the dealt card (decision 0025).
  - The Sheriff and Town Crier marks are gone: no pool role makes those titles, so the marks sheet only offers marks that a dealt role makes.

- **Rule book** (branch `feat/rule-book`, 2026-10-29):
  - A Rule book page at `/rules` lists every pool role by faction as thumbnail cards, with a search box (Vietnamese or English name, accents ignored); tapping a card opens its rule. Home opens it from a book icon beside the menu.

- **Role change replaces player marks** (branch `feat/role-change`, 2026-10-30):
  - Player marks are gone: the tag button and sheet, chips, marks in the summary, and the Player marks setting. Linked deaths are gone too: a death marks only the player tapped.
  - While a role that changes roles is dealt, every player has a swap button beside the status pill. It opens a sheet with only the **Plays** picker.
  - Wild Child, Wolf-hound, Cursed, Cursed Wolf-Father and Alpha Wolf now unlock it: the narrator gives the turned player the Werewolf, and they move to the wolves' panel.
  - See decision 0026.

## Next

1. **Roles the app can't run yet** (decision 0023): the Thief and the Actor need extra cards in the deck and a different deal (the narrator can already give the Thief its new role), the Gypsy needs New Moon's Spiritualism cards, and the Village expansion roles need houses.
2. Confirm deployment setup: Cloudflare login and GitHub secrets (`docs/decisions/0004-pr-preview-workers.md`), and a deployed phone smoke check: create a room on one phone, join from two others, refresh one.
3. **Playtest and polish:** play two games back to back with a real group on phones, and fix what comes up.

## Known issues

- The plan's state diagram (3 loops) is missing from `docs/plan.md`; see the TODO in `docs/game-rules.md`.
- The system Node on the dev machine is 20 (end of life). pnpm runs scripts on Node 24 regardless; upgrading the system Node to 24 LTS is still recommended.
- Open item from the plan: standalone assets in the approved engraving style. The sound pack is answered for now by one generated chime at the end of the timer.
- Every screen runs on real rooms. The development gallery uses synthetic data and is excluded from production JavaScript. The development gallery uses synthetic data and is excluded from production JavaScript.
- The seer, villager and wolf have card art; other roles show the hooded fallback figure. Add `<role-id>.webp` images; see `apps/web/src/assets/cards/README.md`.
- Missing card art: thief, cupid, stuttering-judge, doppelganger, hoodlum, the-count, two-sisters, three-brothers, wild-child, wolf-hound, actor, old-hag, spellcaster, puppeteer, fox, paranormal-investigator, wise-monkey, beholder, aura-seer, bodyguard, priest, wolf-man, wolf-cub, fruit-brute, dire-wolf, lone-wolf, minion, dream-wolf, big-bad-wolf, cursed-wolf-father, alpha-wolf, mighty-wolf-mother, white-werewolf, sorceress, bogeyman, chupacabra, baker, pyromaniac, vampire, cult-leader, magician, gypsy, pied-piper, raven, troublemaker, insomniac, amulet-of-protection, angel, apprentice-seer, bailiff, barber, bartender, bear-tamer, bonesetter, colossus, confessor, cursed, devoted-servant, diseased, drunk, elder, farmer, ghost, hunter, knight, little-girl, lord, lycan, martyr, mayor, old-man, pacifist, prejudiced-manipulator, prince, scapegoat, schoolmistress, tanner, tough-guy, vagabond, village-idiot, villager-villager.
- The pool's vi + en role text was drafted by Claude and awaits Thuan's review (`docs/roles/`).
