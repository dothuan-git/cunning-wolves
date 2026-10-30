# 0026 — A role change replaces player marks

Date: 2026-10-30. Status: accepted; supersedes decisions 0023 (marks only) and 0024, and amends 0025.

## Context

Player marks (decision 0023) grew to 26 marks, a tag button and sheet on every row, chips, journal lines, a setting to turn them on, and linked deaths built on two of them (decision 0024). Thuan found it too much for a narrator at the table. What the narrator really needs from the app is to know who now plays which role, because that decides who wakes when.

## Choice

- Player marks are gone: the tag button, marks sheet, chips, the summary's marks, the `toggleMark` action, `GameState.marks`, the **Player marks** setting (`RoomSettings.marksOn`) and the mark inks. Rooms drop their saved `marks` and `marks_on` tables when they load.
- Linked deaths are gone: a death marks only the player tapped.
- The role change (decision 0025) stays and gets its own control: a swap button beside the status pill, shown on every player only while a role in `ROLE_CHANGERS` is dealt. It opens a sheet with the **Plays** picker alone. The button is ink while the player plays another role.
- The roles that turn a player into a wolf (Wild Child, Wolf-hound, Cursed, Cursed Wolf-Father, Alpha Wolf) join `ROLE_CHANGERS`: the narrator gives that player the Werewolf, so they move to the wolves' panel. "Also wakes with the wolves" keeps only the White Werewolf and the Lone Wolf.
- `packages/shared/src/roles/marks.ts` becomes `roles/newRoles.ts`.

## Why

One control that changes what the narrator page shows is worth more than many that only record. A role change already moves a player to the panel the narrator wakes, which is what the pack marks were for. Anything else worth remembering fits in the night's note. The dealt roles decide whether the control appears, so a separate setting is not needed.
