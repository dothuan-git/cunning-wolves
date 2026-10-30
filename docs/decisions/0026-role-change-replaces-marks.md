# 0026 — A role change replaces player marks

Date: 2026-10-30. Status: accepted; supersedes decisions 0023 (marks only) and 0024, and amends 0025.

## Context

Player marks (decision 0023) grew to 26 marks, a tag button and sheet on every row, chips, journal lines, a setting to turn them on, and linked deaths built on two of them (decision 0024). Thuan found it too much for a narrator at the table. What the narrator really needs from the app is to know who now plays which role, because that decides who wakes when.

## Choice

- Player marks are gone: the tag button, marks sheet, chips, the summary's marks, the `toggleMark` action, `GameState.marks`, the **Player marks** setting (`RoomSettings.marksOn`) and the mark inks. Rooms drop their saved `marks` and `marks_on` tables when they load.
- Linked deaths are gone: a death marks only the player tapped.
- The role change (decision 0025) stays and gets its own control: a swap button beside the status pill, shown on every player only while a role in `ROLE_CHANGERS` is dealt. It opens a sheet with the **Plays** picker alone. The button is ink while the player plays another role.
- A changed player stays with their dealt role instead of moving to the new role's panel: the panel is retitled "Dealt role → New role" in the new role's faction color and keeps the dealt role's place and wake nights. A changed player in a panel shared with others splits off into their own panel right below it. The summary lists them under the faction they ended in.
- The roles that turn a player into a wolf (Wild Child, Wolf-hound, Cursed, Cursed Wolf-Father, Alpha Wolf) join `ROLE_CHANGERS`: the narrator gives that player the Werewolf, and their panel turns wolf red. "Also wakes with the wolves" keeps only the White Werewolf and the Lone Wolf; the narrator wakes a turned player with the pack themselves.
- `packages/shared/src/roles/marks.ts` becomes `roles/newRoles.ts`.

## Why

One control that changes what the narrator page shows is worth more than many that only record. A retitled panel in the new faction's color tells the narrator who changed sides at a glance, which is what the pack marks were for; keeping the dealt panel keeps the night's order stable. Anything else worth remembering fits in the night's note. The dealt roles decide whether the control appears, so a separate setting is not needed.
