# 0018 — The card set lives in the room

Date: 2026-10-28. Status: accepted. Builds on 0017 (rooms and the state machine).

## Context

Phase 3 makes Setup real. Until now, Setup kept the master's picks, rule edits, custom roles, wake order and settings in React state, so a refresh lost them, and the role pool was empty. The master must be able to build a valid card set for any player count, and players must not see it before Review rules.

Thuan chose:

- every role from _Werewolves of Millers Hollow_ that fits v1 scope, with vi + en text drafted by Claude for review
- an edited rule is one text for everyone in the room
- a custom role can wake at night

## Choice

- **Role pool:** 18 roles in `packages/shared/src/roles/pool.ts`, ten that wake and eight that don't. Role-changing and third-party roles stay out, per the plan. Each has `docs/roles/<id>.md`.
- **Overrides, not copies:** the room stores what differs from the static pool, not a copy of each role.
  - `RoomSetup` holds `picks` (one role id per copy), `ruleEdits` (role id → text), `customRoles`, `wakeOrder` (the narrator's order of waking ids) and `settings` (`timerSeconds`, `soundOn`).
  - `roomRoles(setup)` in `packages/shared` rebuilds the room's role list: the pool with edits applied, then custom roles. `wakingOrder(roles, picks, wakeOrder)` sorts the picked waking roles. Web and worker use the same two functions, so Phase 4 builds the rules review from the same list.
- **One rule text:** an edit replaces both languages for that role in this room. Custom roles have one name and rule, shown to everyone as written.
- **Custom roles that wake** come after every pool role by default (order 1000 + their index) and can be reordered like any other. The room gives custom ids (`custom-<n>`); they can't be deleted, so ids are never reused.
- **Six master-only actions** in the state machine, each allowed only in `lobby`: `addPick`, `removePick`, `editRule`, `addCustomRole`, `setWakeOrder`, `setSettings`. Limits: 40 copies, 20 custom roles, names up to 32 characters, rules up to 500 (cleaned, line breaks kept), a whole-second timer from 0 to 3600. An unknown role or bad text is refused with the new `role-invalid` code.
- **Storage:** separate SQLite tables (`picks`, `rule_edits`, `custom_roles`, `wake_order`, `settings`), so the Phase 2 `room` table needs no `ALTER` and an older room loads with defaults (timer 120 s, sound off).
- **Visibility:** only `buildMasterView` copies the setup, field by field. A player's view has none of it until Ready (Phase 4).
- **The server is the only source of truth.** Setup is controlled by the master view. Each tap sends one action, with no optimistic copy; a rule is a local draft until its card closes, and the timer until the settings sheet closes. While reconnecting, Setup says changes can't be saved yet and Review rules is disabled.
- **Message size:** socket messages may be 4 KB (it was 256 bytes), so a 500-character rule fits even with every character escaped.

## Why

- Overrides keep the room small and let a pool fix (a typo in a rule) reach rooms that never edited that role.
- One rule text means every player reads the rule the master wrote, whatever their language.
- Without optimistic updates the master can never see a card set the room doesn't have; on a phone, the round trip is short enough for taps.

## Not yet

Review rules still only closes the room, gated on the client by roles = players. Phase 4 adds the `reveal` transition, with the same check on the server.
