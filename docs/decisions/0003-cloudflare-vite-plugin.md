# 0003 — One dev server with the Cloudflare Vite plugin

2026-10-26 · Accepted

## Context

The app (`apps/web`) and the worker (`apps/worker`) are separate packages. Development needs one command that phones on the local Wi-Fi can reach, behavior close to production (Durable Objects, WebSockets), and a single deploy.

## Choice

`apps/web/vite.config.ts` uses `@cloudflare/vite-plugin` pointed at `apps/worker/wrangler.jsonc`.

- `pnpm dev` runs Vite with the worker inside the real Workers runtime (workerd), on one port, also exposed on the LAN.
- `pnpm build` writes the static app to `apps/web/dist/client` and the bundled worker plus a generated `wrangler.json` to `apps/web/dist/cunning_wolves`.
- Deploys run `wrangler deploy` from `apps/web`, which picks up that generated config.
- Worker unit tests run separately in `apps/worker` with `@cloudflare/vitest-plugin`, reading the same `wrangler.jsonc`.

## Why

- One server and one port in dev: no proxy between Vite and `wrangler dev`.
- The worker runs in the same runtime as production, including Durable Objects and WebSockets.
- It is Cloudflare's recommended setup for Vite apps.

## Alternative considered

Running Vite and `wrangler dev` side by side with a proxy gives two ports, and `wrangler dev` refuses to start until the assets folder exists. It also matches production less closely.

## Consequences

- `assets` in `wrangler.jsonc` has no `directory`; the plugin fills it in at build time.
- Deploy commands run in `apps/web`, not `apps/worker`.
