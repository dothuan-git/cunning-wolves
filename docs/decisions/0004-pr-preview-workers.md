# 0004 — One preview Worker per pull request, deployed by GitHub Actions

2026-10-26 · Accepted

## Context

Every pull request should get a preview to open on a phone, and production should deploy only from `main`. Cloudflare's built-in preview (version) URLs, and with them Workers Builds previews, are [not generated for Workers that implement a Durable Object](https://developers.cloudflare.com/workers/configuration/previews/). This worker implements two.

## Choice

GitHub Actions in `.github/workflows/ci.yml`:

- **deploy-preview:** after the `checks` job passes on a PR, build and run `wrangler deploy --name cunning-wolves-pr-<N>`, then comment the `workers.dev` URL on the PR (the same comment is updated on every push).
- **deploy-production:** after `checks` and `e2e` pass on a push to `main`, build and run `wrangler deploy` (Worker `cunning-wolves`, GitHub environment `production`).
- `.github/workflows/preview-cleanup.yml` deletes `cunning-wolves-pr-<N>` when the PR closes.

## Why

- Each preview is a complete copy of the app, with its own Durable Objects and data, so testing a PR never touches production rooms.
- Nothing deploys unless CI passes.

## Alternatives considered

- **Workers Builds:** no preview URLs for this worker (see above).
- **One shared staging Worker:** simpler, but open PRs overwrite each other.
- **Splitting the Durable Objects into a second Worker:** previews would then run against production room code and data.

## One-time setup

1. Run `wrangler login` and deploy once from your machine (`pnpm deploy:prod`). This creates the `cunning-wolves` Worker and your `workers.dev` subdomain.
2. In the Cloudflare dashboard, create an API token from the **Edit Cloudflare Workers** template, limited to your account.
3. In GitHub, go to **Settings → Secrets and variables → Actions** and add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. Optional: add protection rules to the `production` environment under **Settings → Environments**.

## Consequences

- Fork PRs get no preview, because GitHub doesn't give their workflows secrets.
- The Free plan allows 100 Workers per account, which is plenty for one open PR at a time.
- Preview Workers start with empty rooms on every new PR.
