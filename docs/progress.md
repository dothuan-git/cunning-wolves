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

## Next

1. Confirm deployment setup: Cloudflare login and GitHub secrets (`docs/decisions/0004-pr-preview-workers.md`), and a deployed phone smoke check.
2. **Phase 1 (foundation):** i18n wiring is done; still to do are the device token and the WebSocket connection with auto-reconnect. Done when two phones connect to a test room and survive a refresh.

## Known issues

- The plan's state diagram (3 loops) is missing from `docs/plan.md`; see the TODO in `docs/game-rules.md`.
- The system Node on the dev machine is 20 (end of life). pnpm runs scripts on Node 24 regardless; upgrading the system Node to 24 LTS is still recommended.
- Open items from the plan: the fixed role pool with vi/en rule text, standalone assets in the approved engraving style, and the sound pack contents.
- Screen templates and example interactions are implemented; real room/gameplay wiring is not. The development gallery uses synthetic data and is excluded from production JavaScript. Room state/message types, temporal death behavior, and server privacy tests belong to later phases.
- The seer, villager and wolf have card art; other roles show the hooded fallback figure. Add `<role-id>.webp` images; see `apps/web/src/assets/cards/README.md`.
