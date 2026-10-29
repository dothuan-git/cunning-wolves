---
name: add-role
description: Adds a role to the fixed role pool the same way every time — pool data with Vietnamese and English name and rule, a docs/roles file, a card art slot, wake order and tests. Use whenever the user asks to add, create or define a pool role.
---

# Add a pool role

## 1. Confirm the inputs

Ask the user for anything missing. Never invent rule text or translations.

- `id`: kebab-case, permanent (saved games refer to it)
- team: `village`, `werewolf` or `solo` (wins on its own)
- name and rule in Vietnamese **and** English
- does it wake at night, and if so between which existing roles, and on which nights (every night, Night 1 only, or even nights)
- what the narrator must remember about players because of it (a power used up, a title, an effect on someone): these become marks
- card art: a file, or none yet

A role that swaps cards or needs extra cards in the deck (Thief, Actor, Devoted Servant) can be added as a card and a rule only: the app does not run its power yet, per `docs/plan.md`. A role that wakes with the wolves without being a wolf goes in `PACK_ROLES`, and a mark that moves a player to the wolves has `joinsPack: true` (both in `marks.ts`). A role whose marks need a pointer from one player to another needs that mechanism first; see decision 0023.

## 2. Role doc

Create `docs/roles/<id>.md` from the template in `docs/roles/README.md`.

## 3. Pool data

Add the entry to `packages/shared/src/roles/pool.ts`:

- `name` and `rule` as `{ vi, en }`. Role text is data, not an i18n key.
- `defaultWakeOrder`: `null` if the role never wakes; otherwise a multiple of 10 that places it between its neighbors (renumber in steps of 10 only if there is no gap).
- `wakeNights`: `'every'`, `'first'` or `'even'` (`'every'` for a role that never wakes).
- `image: '<id>.webp'`.
- Keep the array sorted by `defaultWakeOrder` (waking roles first), then non-waking roles by `id`.

## 4. Marks

For each thing the narrator must remember, add a mark to `packages/shared/src/roles/marks.ts` with a `{ vi, en }` label, `from: ['<id>']`, `holdersOnly` (only the role's holder carries it) and `single` (one player at a time). Add the row to the Marks table in `docs/game-rules.md`.

## 5. Card art slot

- Art ready: save it as `apps/web/src/assets/cards/<id>.webp`, in the card style from `docs/design/direction.md`.
- No art yet: add `Missing card art: <id>` under Known issues in `docs/progress.md`. The UI uses the shared `apps/web/src/assets/cards/placeholder.svg` through `RoleArtwork` until the role's image exists.

## 6. Wake order in the rules

If the role wakes, add it to the wake order list in `docs/game-rules.md`, noting "Night 1 only" or "even nights" when it does not wake every night.

## 7. Tests

- `packages/shared/tests/pool.test.ts` already checks ids, both languages, unique wake orders, wake nights and the art file name for every role; `marks.test.ts` checks that every mark names pool roles.
- A new mark gets a case in `marks.test.ts` (who is offered it).
- Add a dedicated test only if the role brings new behavior.
- Run `pnpm --filter @werewolf/shared test`, `pnpm typecheck` and `pnpm i18n:check`.

## 8. Commit

On a feature branch: `feat(roles): add <id>`, containing the pool entry, its marks, role doc, art (if any), and the game-rules and progress updates.
