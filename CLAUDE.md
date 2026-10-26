@AGENTS.md

# Working with me

- Answer concisely in plain, simple words. Lead with the answer; no filler, no recap of what you did.
- Before planning or coding, weigh the possible approaches and recommend the best one with a one-line reason. If the trade-offs are close, list them briefly and let me choose.
- If a requirement is unclear or could mean more than one thing, ask and agree on it before planning or coding. Don't guess.

# Claude Code

- Start every task in plan mode; write code only after the plan is approved.
- Use the frontend-design skill for all UI work (screens, components, styling).
- After any UI change, run the `ui-checker` subagent: it screenshots each changed screen at 390px and compares it with `docs/design/mockups/`. Fix the differences, or ask if the mockup looks wrong.
- After code changes, run the `test-runner` subagent. It may fix failures but never weakens a test.
- Before every commit, run the `reviewer` subagent and resolve its blockers.
- Add pool roles only through the `add-role` skill.
- Hooks format and lint every file you edit and type-check when you finish a turn. Fix what they report; never work around them.
- For library or API questions (React, Vite, Tailwind, i18next, Workers, Durable Objects), check current docs before relying on memory; these move fast.
- Personal notes (local URLs, test room names) belong in `CLAUDE.local.md`, which is gitignored.
