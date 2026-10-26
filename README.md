# Cunning Wolves

A phone-first webapp that replaces physical role cards and the narrator's notebook for in-person Werewolf games. Vietnamese and English, no accounts.

## Quick start

Requires [pnpm](https://pnpm.io) 10. pnpm downloads and uses Node 24 for every script.

```sh
pnpm install
pnpm dev        # http://localhost:5173, and http://<your PC's LAN IP>:5173 on your phone
```

The first `pnpm test:e2e` needs a browser: `pnpm --filter @werewolf/web exec playwright install chromium`.

## Where things are

- `AGENTS.md`: commands, layout and project rules (for people and AI tools)
- `docs/plan.md`: the project plan · `docs/game-rules.md`: the game spec · `docs/progress.md`: status
- `docs/decisions/`: why things are the way they are

## Deploy

CI deploys `main` to Cloudflare after the checks pass, and deploys each pull request as its own preview Worker. One-time setup: `docs/decisions/0004-pr-preview-workers.md`.
