@AGENTS.md

# Working with me

- Answer concisely in plain, simple words. Lead with the answer; no filler, no recap of what you did.
- Before planning or coding, weigh the possible approaches and recommend the best one with a one-line reason. If the trade-offs are close, list them briefly and let me choose.
- If a requirement is unclear or could mean more than one thing, ask and agree on it before planning or coding. Don't guess.

# Claude Code

- Plan mode only for new features or changes across several files. Small fixes and tweaks: just do them.
- Use the frontend-design skill for new screens or redesigns, not for small UI tweaks.
- After a visual change, take one 390px screenshot of the changed screen and look at it. No subagent.
- Before a commit, run `pnpm check` (about 35s). Fix failures; never weaken a test. Run `pnpm test:e2e` only when a UI flow or route changed; CI runs it otherwise.
- Before a PR that touches `apps/worker` or `packages/shared`, run the `reviewer` subagent and resolve its blockers.
- Add pool roles only through the `add-role` skill.
- Hooks run Prettier on every file you edit and type-check when you finish a turn. Fix what they report; never work around them.
- Check current docs for a library only when unsure or when something breaks.
- Personal notes (local URLs, test room names) belong in `CLAUDE.local.md`, which is gitignored.
