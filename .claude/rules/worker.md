---
paths:
  - 'apps/worker/**'
  - 'packages/shared/**'
---

# Worker rules (apps/worker, packages/shared)

- All room state changes go through the Room state machine in `apps/worker/src/room/`. No handler mutates state directly.
- Validate every incoming message before applying it: its shape, and the sender's permission (master-only actions check `masterDeviceId`).
- Filter state per viewer before sending: one function builds the master view and one builds a player view. Never send full state and rely on the client to hide it.
- Each state transition and each row of the visibility table in `docs/game-rules.md` has a test.
- Durable Objects use SQLite storage (free plan). Adding a DO class means a new migration tag in `wrangler.jsonc`; never edit an applied migration.
- Use the WebSocket Hibernation API (`ctx.acceptWebSocket`) so idle rooms cost nothing.
- After editing `wrangler.jsonc`, run `pnpm --filter @werewolf/worker cf-typegen` and commit the regenerated `worker-configuration.d.ts`.
- Message and API types are defined once in `packages/shared` and imported on both sides.
