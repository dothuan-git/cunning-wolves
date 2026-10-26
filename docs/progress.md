# Progress

## Done

- **Project setup** (branch `chore/project-setup`): pnpm workspace with `apps/web`, `apps/worker`, `packages/shared`; strict TypeScript, ESLint, Prettier, Vitest, Playwright; `AGENTS.md`, `CLAUDE.md`, `.claude/` (rules, subagents, `add-role` skill, hooks, permissions, plugins); docs skeleton; CI and PR preview workflows. The app shows a "hello" page backed by `/api/hello`.

## Next

1. Finish setup: merge the setup PR, run `wrangler login`, add the Cloudflare secrets to GitHub (`docs/decisions/0004-pr-preview-workers.md`), deploy the hello page and open it on a phone, and run `/context` to confirm the instruction files load.
2. **Phase 0 (visual direction):** `docs/design/direction.md`.
3. **Phase 1 (foundation):** i18n wiring is done; still to do are the device token and the WebSocket connection with auto-reconnect. Done when two phones connect to a test room and survive a refresh.

## Known issues

- The plan's state diagram (3 loops) is missing from `docs/plan.md`; see the TODO in `docs/game-rules.md`.
- The Be Vietnam Pro font isn't loaded yet (Phase 0).
- Color tokens are provisional until Phase 0.
- The system Node on the dev machine is 20 (end of life). pnpm runs scripts on Node 24 regardless; upgrading the system Node to 24 LTS is still recommended.
- Open items from the plan: the fixed role pool with vi/en rule text, the card art approach, and the sound pack contents.
