# 0005 — Toolchain versions

2026-10-26 · Accepted

## Context

Some tools have moved past what their plugins support, and the machine's system Node (20) is older than Wrangler and Vitest need.

## Choice

| Tool       | Version | Why not newer / why this                                                                                              |
| ---------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| Node       | 24.22.1 | Wrangler needs ≥ 22, Vitest 5 needs ≥ 22.12. Pinned with `useNodeVersion` in `pnpm-workspace.yaml` and `.nvmrc` (CI). |
| TypeScript | 6.0     | `typescript-eslint` 8 supports `< 6.1`; TypeScript 7 (the native port) isn't supported yet.                           |
| Vitest     | 5       | `@cloudflare/vitest-plugin` supports Vitest 4 and 5.                                                                  |
| Vite       | 8       | Required by `@vitejs/plugin-react` 6; supported by `@cloudflare/vite-plugin`.                                         |
| ESLint     | 10      | Flat config, type-aware rules from `typescript-eslint` `strictTypeChecked`.                                           |

## Why `useNodeVersion` and not `devEngines.runtime`

`devEngines.runtime` installs Node as a `.cmd` shim in `node_modules/.bin`. On Windows, a script that calls `pnpm` again (for example `pnpm typecheck` → `pnpm -r typecheck`) then fails with "The system cannot find the path specified". `useNodeVersion` puts a real `node.exe` first on `PATH` instead.

## Consequences

- Upgrade TypeScript to 7 once `typescript-eslint` supports it.
- The hook scripts in `.claude/hooks/` run on the system Node, so they use only APIs that Node 20 supports.
- `@cloudflare/vitest-pool-workers` was renamed to `@cloudflare/vitest-plugin`; use the new name.
