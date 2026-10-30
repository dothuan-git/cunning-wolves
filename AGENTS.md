# Cunning Wolves — guide for AI coding agents

Phone-first webapp for in-person Werewolf games: it deals role cards and keeps the narrator's night notes. No accounts, Vietnamese + English, everyone in the same room. Full plan: `docs/plan.md`. Current status: `docs/progress.md`.

## Commands

| Command                                     | What it does                                                          |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm install`                              | Install every package (scripts run on Node 24.22.1 via pnpm)          |
| `pnpm dev`                                  | App + worker together on http://localhost:5173, also on the LAN       |
| `pnpm test`                                 | Unit tests in every package (worker tests run inside workerd)         |
| `pnpm test:e2e`                             | Playwright on a 390×844 phone against the dev server                  |
| `pnpm lint` / `pnpm lint:fix`               | ESLint, type-aware                                                    |
| `pnpm format` / `pnpm format:check`         | Prettier                                                              |
| `pnpm typecheck`                            | `tsc` in every package                                                |
| `pnpm i18n:check`                           | `vi.json` and `en.json` have the same keys and placeholders           |
| `pnpm check`                                | Everything CI runs except e2e and build                               |
| `pnpm build`                                | Production build of app + worker into `apps/web/dist`                 |
| `pnpm --filter @werewolf/worker cf-typegen` | Regenerate `worker-configuration.d.ts` after editing `wrangler.jsonc` |
| `pnpm deploy:prod`                          | Production deploy. Never run without asking                           |

## Stack

React 19, Vite 8, Tailwind CSS 4, i18next · Cloudflare Workers + Durable Objects (SQLite storage) via `@cloudflare/vite-plugin` · TypeScript 6 strict · Vitest 5 (`@cloudflare/vitest-plugin` for the worker) · Playwright · pnpm workspaces. Version choices: `docs/decisions/0005-toolchain-versions.md`.

## Layout

| Path                         | Purpose                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| `apps/web/src/screens/<x>/`  | One folder per screen, entry `<X>Screen.tsx`                              |
| `apps/web/src/components/`   | Shared UI (Button, Card, PlayerChip…)                                     |
| `apps/web/src/design/`       | Design tokens (`tokens.css`, Tailwind `@theme`): the only colors/fonts    |
| `apps/web/src/i18n/`         | `vi.json`, `en.json`, i18next setup, locale detection                     |
| `apps/web/src/realtime/`     | WebSocket client + reconnect with backoff                                 |
| `apps/web/src/assets/cards/` | Card art, file name = role id                                             |
| `apps/web/tests/`            | `unit/` (Vitest), `e2e/` (Playwright)                                     |
| `apps/worker/src/index.ts`   | Worker entry: `/api/*` routes; everything else is served as static assets |
| `apps/worker/src/room/`      | Room Durable Object: state machine, per-viewer visibility                 |
| `apps/worker/src/lobby/`     | Lobby Durable Object: list of open rooms                                  |
| `packages/shared/src/`       | Types used by both sides: messages, API shapes, role pool data            |
| `docs/`                      | Plan, game rules, decisions, design, roles, progress                      |

## Rules

### Game and security

- Never send another player's role to a player client. The worker builds each viewer's state (master or player) before every send, following the visibility table in `docs/game-rules.md`. Never send full state and filter on the client.
- Only the room master's actions change room state, and every change goes through the Room state machine.
- Message and API types live in `packages/shared` and are imported by both web and worker; never redefine them locally.
- The app records what the narrator marks. It never resolves abilities or decides winners; a death marks only the player tapped (decision 0026).

### i18n

- Every user-visible string goes through `t('key')`, including `aria-label`, `alt` and `title`. No hardcoded UI text.
- Add each new key to both `vi.json` and `en.json` in the same change; `pnpm i18n:check` must pass.
- Role names and rules are data in `packages/shared/src/roles/pool.ts` (`{ vi, en }`), not i18n keys.

### Code

- TypeScript strict mode. No `any`, `@ts-ignore`, `@ts-expect-error` or non-null `!` to silence errors; use `unknown` and narrow.
- ESLint passes with zero errors and Prettier formatting is applied (2 spaces, single quotes, width 100).
- Handle errors explicitly: log with context, or show a translated message. An intentionally ignored error needs a comment saying why.
- Game logic and visibility filtering always have unit tests. A bug fix starts with a failing test.
- Copy patterns from neighboring files before inventing new ones. A new dependency needs a decision file.

### Docs

- When a phase finishes, update `docs/progress.md`.
- A change to game behavior updates `docs/game-rules.md` in the same commit.
- A new dependency or architecture change gets `docs/decisions/NNNN-short-title.md`: context, choice, why. Visual tweaks do not.

### Git

- Never commit to `main` directly. One branch per task: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`), one logical change per commit.
- Never `git push`, deploy, or run `wrangler deploy` / `wrangler versions upload` without asking first.

## Deploy

GitHub Actions (`.github/workflows/ci.yml`) deploys `main` to production after CI passes, and deploys each pull request as its own Worker `cunning-wolves-pr-<N>` with the URL commented on the PR. `preview-cleanup.yml` deletes that Worker when the PR closes. Details: `docs/decisions/0004-pr-preview-workers.md`.
