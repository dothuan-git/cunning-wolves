# 0011 — Compact Tabletop layouts

Status: Accepted, 2026-10-27.

## Context

The user found the Tabletop screens oversized and crowded, and approved the proposed smaller typography and on-demand controls. This supersedes layout density and grouping in the original Tabletop board, while retaining its palette and character.

## Choice

- Page headings 24px, names 16px, utility text 13–14px; editable text remains 16px and touch targets remain at least 48px.
- Setup shows selected-role quantities. The library, custom-role entry, and settings open only when requested. Quantities still fill the existing slots, with the same capacity/readiness requirement.
- Narrator players sit in flat role sections with an explicit status control, their full history, and the eligible current-night input inline (decision 0010). A per-player bottom sheet was tried and replaced: on 2026-10-27 Thuan chose inline notes so every alive player's field is visible without an extra tap. Language, timer, sound, wake order, and Finish game live in the header menu.
- Bottom sheets use native dialogs, Escape, and focus return. The development toolbar starts collapsed.

## Why

This removes duplicated setup content while keeping the primary action visible. Secondary actions cost one extra tap, in exchange for a quieter overview and more space between groups. Written status/faction labels and accessible icon labels preserve meaning. Player/night identity, death timing, and server privacy requirements are unchanged.

The generated bilingual screenshots, including sheet states, are the current layout baseline. No dependency or backend contract changes are needed.
