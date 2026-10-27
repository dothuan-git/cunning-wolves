# 0007 — Per-player night comments

Date: 2026-10-27. Status: accepted.

## Context

The original narrator plan attached one comment to each role. Multiple people can share a role, so that field cannot clearly distinguish observations about individual players. Thuan requested a comment field for each player and approved that layout.

## Choice

- Each night has `playerComments {deviceId: text}` and one `nightComment`.
- Replace the proposed `roleComments {roleId: text}` shape; do not keep both.
- Group players by role in wake order, with each player's note directly under their row. Players sharing a role have independent comments.
- Switching nights loads that night's notes. Reordering roles or changing a display name must not move a note to another player. Dead players' notes remain editable.
- Master edits go through the Room state machine. During play, player views receive no narrator comments. Finished-game logs follow the existing visibility rule.
- Comment inputs and status actions are separate targets: editing a note must not mark a player dead.

## Why

Player identity is the stable key for observations. Separate fields remove ambiguity while retaining role-grouped wake order and a general night note.

## Implementation consequences

Room/night implementation does not yet exist, so no persisted data migration is needed. Add shared message/state types in the narrator phase, with tests for players sharing a role, switching nights, and per-viewer privacy. This decision updates the specification, not completed gameplay behavior.
