# Werewolf Webapp — Project Setup

Oct 26, 2026 · @Thuan

## Overview

Before any feature code, the repo gets its structure, rules for Claude, docs, and quality checks, so every later session starts from the same ground rules.

- **Why first:** Claude Code reads the project's instruction files at the start of every session. Good rules up front mean consistent code and UI without repeating yourself.
- **What you do:** run the setup checklist at the end with Claude Code, one step per session or all at once.
- **What Claude does:** writes the files, installs tools, and follows these rules for every later task.

## Repository structure

One repo, three packages: the phone app, the Cloudflare worker, and shared types that both use so messages between them can't drift apart.

```
werewolf/
├── apps/
│   ├── web/                  # React + Vite phone app
│   │   ├── src/
│   │   │   ├── screens/      # one folder per screen (lobby, setup, narrator…)
│   │   │   ├── components/   # shared UI: Button, Card, PlayerChip…
│   │   │   ├── design/       # design tokens (colors, fonts, spacing)
│   │   │   ├── i18n/         # vi.json, en.json
│   │   │   ├── realtime/     # WebSocket client + reconnect
│   │   │   └── assets/       # card art, sounds
│   │   └── tests/
│   └── worker/               # Cloudflare Worker + Durable Objects
│       ├── src/
│       │   ├── room/         # Room Durable Object: state machine, visibility
│       │   └── lobby/        # Lobby Durable Object: room list
│       ├── tests/
│       └── wrangler.jsonc
├── packages/
│   └── shared/               # message types, game rules, role pool data
├── docs/                     # see Docs folder below
├── .claude/                  # Claude Code project config
├── .github/workflows/        # CI
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

## CLAUDE.md and AGENTS.md

AGENTS.md holds the shared rules any AI coding tool can read; CLAUDE.md imports it and adds Claude-only instructions, so there is one source of truth.

Claude Code reads AGENTS.md on its own only when no CLAUDE.md exists, so the import line is what makes both load together. [source](https://code.claude.com/docs/en/memory)

| File                        | Holds                                           | Example lines                                                                                                                                                     |
| --------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                 | Project facts and rules for any AI tool         | Commands (`pnpm dev`, `pnpm test`), stack, folder purposes, "never send another player's role to a player client", "every UI string goes through i18n, vi and en" |
| `CLAUDE.md`                 | `@AGENTS.md` on line 1, then Claude-only rules  | "Use the frontend-design skill for new screens", "screenshot a changed screen at 390px", "run the reviewer subagent before a PR that touches the worker"          |
| `.claude/rules/frontend.md` | Rules loaded only when editing `apps/web/**`    | Use design tokens only, touch targets at least 48px, components from `components/` before new ones                                                                |
| `.claude/rules/worker.md`   | Rules loaded only when editing `apps/worker/**` | All state changes go through the room state machine, filter state per viewer before sending                                                                       |
| `CLAUDE.local.md`           | Your personal notes, not committed              | Local URLs, test room names                                                                                                                                       |

Keep each file under 200 lines and write rules you can check ("use 2-space indentation", not "format nicely"); longer files reduce how well Claude follows them. [source](https://code.claude.com/docs/en/memory)

Run `/init` first to generate a starting file, then edit it toward the table above.

## Claude Code setup

One official plugin, one browser server, one subagent, one project skill and two hooks give Claude taste, eyes, a reviewer and automatic checks.

**Plugin: frontend-design** (Anthropic's official design skill; Claude uses it automatically for UI work)

```
/plugin install frontend-design@claude-plugins-official
/reload-plugins
```

If the marketplace isn't listed yet, first run `/plugin marketplace add anthropics/claude-plugins-official`. [source](https://dev.to/nishilbhave/how-to-use-claude-codes-frontend-design-plugin-511i)

**Browser: Playwright MCP** (lets Claude open the app, screenshot it at phone width and check its own work). Project scope writes `.mcp.json`, so it's saved in the repo:

```
claude mcp add --scope project playwright -- npx -y @playwright/mcp@latest
```

[source](https://playwright.dev/mcp/clients/claude-code)

**Subagents** in `.claude/agents/`, each with its own context, so long checks don't clutter the main session. [source](https://code.claude.com/docs/en/sub-agents)

| Subagent   | Job                                                                                                | Tools                  |
| ---------- | -------------------------------------------------------------------------------------------------- | ---------------------- |
| `reviewer` | Before a PR touching worker or shared code: checks role leaks to player clients and game-rule bugs | Read, Grep, Glob, Bash |

**Project skill** in `.claude/skills/add-role/`: the step-by-step for adding a role (pool data, vi and en text, card art slot, wake order, tests), so every role is added the same way.

**Hooks** in `.claude/settings.json` (these always run, unlike instructions Claude may forget):

- After every file edit: run Prettier on that file. ESLint runs in `pnpm check` and CI.
- When Claude finishes a turn: run the TypeScript type check.

**Permissions** in `.claude/settings.json`: allow `pnpm` test, lint and dev commands without asking; always ask before `wrangler deploy` and `git push`.

## Docs folder

The plan and design live in the repo as Markdown, so Claude reads the current version instead of relying on chat history.

```
docs/
├── plan.md               # the project plan (exported from the plan doc)
├── game-rules.md         # states, visibility rules, night logic
├── decisions/            # one short file per big decision
│   ├── 0001-cloudflare-durable-objects.md
│   └── 0002-no-accounts-device-token.md
├── design/
│   ├── direction.md      # vibe, colors, fonts, sounds, animation
│   └── tokens.md         # design tokens and how to use them
├── roles/                # one file per pool role: vi + en name and rule
└── progress.md           # what's done, what's next, known issues
```

**Keeping docs current** (rules for `AGENTS.md`):

- When a phase finishes, update `progress.md`.
- A change to game behavior updates `game-rules.md` in the same commit.
- A new big choice (library, data shape, rule change) gets a decision file: context, choice, why.

## Tooling and quality

Automatic checks catch mistakes before you do, which matters most when an AI writes most of the code.

| Area             | Tool                    | Rule                                                                        |
| ---------------- | ----------------------- | --------------------------------------------------------------------------- |
| Packages         | pnpm workspaces         | One install for all three packages                                          |
| Language         | TypeScript, strict mode | No `any`; shared types in `packages/shared`                                 |
| Lint             | ESLint                  | Runs in `pnpm check` and CI                                                 |
| Format           | Prettier                | Runs on every edit (hook)                                                   |
| Unit tests       | Vitest                  | Game logic and visibility filtering always tested                           |
| End-to-end tests | Playwright              | One full game on phone-size screens: create, join, deal, two nights, finish |
| i18n check       | Script in CI            | Fails if a key exists in `en.json` but not `vi.json`, or the reverse        |
| CI               | GitHub Actions          | Lint, type check, tests on every pull request                               |
| Deploy           | Wrangler                | Preview deploy per pull request; production only from `main`                |
| Local dev        | `pnpm dev`              | Runs app and worker together; open on your phone over local Wi-Fi           |

## Git workflow

One branch per task and small commits, so any bad change is easy to undo.

- **Branches:** `main` always works and deploys to production. Each task gets a branch like `feat/setup-screen` or `fix/reconnect`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`), one logical change each.
- **Pull requests:** CI must pass, and the `reviewer` subagent runs before you merge. You check the preview deploy on your phone.
- **Claude's rules** (in `AGENTS.md`): never commit to `main` directly, never push or deploy without asking, and start each task with plan mode so you approve the approach first.

## Setup checklist

Twelve steps, in order; give this doc to Claude Code and ask it to do them one at a time, pausing after each.

- [ ] Create the GitHub repo, clone it, and set up the pnpm workspace
- [ ] Scaffold `apps/web` (Vite + React + TypeScript), `apps/worker` (Worker + Durable Objects) and `packages/shared`
- [ ] Add TypeScript strict mode, ESLint, Prettier, Vitest and Playwright
- [ ] Run `/init`, then rewrite `AGENTS.md` and `CLAUDE.md` as in the section above, plus the two `.claude/rules/` files
- [ ] Install the frontend-design plugin
- [ ] Add Playwright MCP at project scope
- [ ] Create the `reviewer` subagent with `/agents`
- [ ] Create the `add-role` skill
- [ ] Add hooks and permissions to `.claude/settings.json`
- [ ] Create the `docs/` skeleton and copy in the project plan and visual direction
- [ ] Set up GitHub Actions CI, log in to Cloudflare with Wrangler, turn on preview deploys
- [ ] Deploy a "hello" page, open it on your phone, and run `/context` in Claude Code to confirm the instruction files load

After this: Phase 0 (visual direction), then Phase 1 of the project plan.
