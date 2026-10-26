---
name: add-role
description: Adds a role to the fixed role pool the same way every time — pool data with Vietnamese and English name and rule, a docs/roles file, a card art slot, wake order and tests. Use whenever the user asks to add, create or define a pool role.
---

# Add a pool role

## 1. Confirm the inputs

Ask the user for anything missing. Never invent rule text or translations.

- `id`: kebab-case, permanent (saved games refer to it)
- team: `village` or `werewolf`
- name and rule in Vietnamese **and** English
- does it wake at night, and if so between which existing roles
- card art: a file, or none yet

Stop and ask if the role is out of scope for v1 (third-party or role-changing roles such as Vampire, Cupid's lovers, Thief, Wild Child), per `docs/plan.md`.

## 2. Role doc

Create `docs/roles/<id>.md` from the template in `docs/roles/README.md`.

## 3. Pool data

Add the entry to `packages/shared/src/roles/pool.ts`:

- `name` and `rule` as `{ vi, en }`. Role text is data, not an i18n key.
- `defaultWakeOrder`: `null` if the role never wakes; otherwise a multiple of 10 that places it between its neighbors (renumber in steps of 10 only if there is no gap).
- `image: '<id>.webp'`.
- Keep the array sorted by `defaultWakeOrder` (waking roles first), then non-waking roles by `id`.

## 4. Card art slot

- Art ready: save it as `apps/web/src/assets/cards/<id>.webp`, in the card style from `docs/design/direction.md`.
- No art yet: add `Missing card art: <id>` under Known issues in `docs/progress.md`. The UI falls back to the generic initial card.

## 5. Wake order in the rules

If the role wakes, add it to the wake order list in `docs/game-rules.md`.

## 6. Tests

- `packages/shared/tests/pool.test.ts` already checks ids, both languages, unique wake orders and the art file name for every role.
- Add a dedicated test only if the role brings new behavior.
- Run `pnpm --filter @werewolf/shared test`, `pnpm typecheck` and `pnpm i18n:check`.

## 7. Commit

On a feature branch: `feat(roles): add <id>`, containing the pool entry, role doc, art (if any), and the game-rules and progress updates.
