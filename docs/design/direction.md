# Visual direction

**Approved by Thuan on 2026-10-27:** Village ink, revised with a lighter background, colored engraving, manuscript-style headings, compact narrator groups, and per-player comments.

The approved reference is [Village ink — manuscript type](mockups/approved-village-ink.png). Earlier options in `concepts/` are exploration history. The reference establishes art, hierarchy, card composition, and narrator structure; production sizes and fonts are specified below and in [tokens.md](tokens.md).

## Character

A quiet medieval village, rendered through fine ink engraving and restrained hand-applied color. Character artwork carries the detail; the surrounding interface stays simple, mature, readable, and lightly tactile.

| Area       | Direction                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Background | Luminous near-white ivory with almost-white cards. No heavy parchment aging or brown wash.                                                                                 |
| Palette    | Charcoal copy, muted secondary text, forest-green actions. Slate blue for the village faction, wine red for wolves. Ochre, burgundy, blue, and sage in artwork.            |
| Typography | Cormorant Unicase Medium for titles and role headings; Be Vietnam Pro Regular/Medium for body copy, controls, names, and notes. Both self-hosted with Vietnamese coverage. |
| Hierarchy  | Screen headings 28px, home title 32px, role headings 18px, body/editable text 16px, control labels 14px, captions 13px. No heavy headings or all-caps UI labels.           |
| Surfaces   | Fine borders, 6px control corners, 12px card corners, subtle elevation and inset fields. No chunky outlines or pill-shaped controls.                                       |
| Layout     | Phone-first, 24px gutters, clear grouping and quiet whitespace. At least 48px touch targets without oversized text/icons.                                                  |
| Motion     | Brief feedback for direct actions, restrained card flip and alive/dead transition. Respect reduced motion; no ambient animation.                                           |
| Sound      | Optional sound controls remain planned; the sound pack is still an open item.                                                                                              |

Generated lettering is an aesthetic reference rather than a font file. Cormorant Unicase is the concrete display-family choice; see [decision 0006](../decisions/0006-village-ink-visual-direction.md). Keep display lettering out of editable fields and long instructions.

## Role cards

- A single medieval character centered in the card, with fine engraved lines and visible muted pigment colors.
- Role name in a reserved rail at the upper right, rotated 90 degrees clockwise. Rotate the whole phrase, not individual letters. Keep real text and normal reading order for assistive technology.
- Description horizontally typeset and centered at the bottom, separate from the character/title. Long names and rules must wrap or allow the card to grow; never crop or shrink below readable sizes.
- No role name or description baked into artwork: Vietnamese and English share the art.
- Village titles blue, wolf titles red. Written identity remains available independently of color.
- Players only receive their own assignment during play. Styling does not change visibility rules.

### Shared card-art prompt

> One adult medieval village character for the specified Werewolf role, centered with natural proportions. Fine hand-engraved ink linework with delicate hatching, colored by restrained washes of slate blue, burgundy, ochre gold, sage, and natural skin tones. Light ivory paper, very faint grain, subtle village or woodland context fading into empty paper. Clear space at the upper right for a vertical role title and at the bottom for a centered description. No lettering, baked-in frame, UI, cartoon proportions, photorealism, or heavy distressed parchment. Match the approved Village ink reference.

Generate one standalone test asset before producing the role pool. The approved board establishes style; its character is not yet a production asset or a finalized role rule.

## Narrator page

- Roles in wake order with small, lightly weighted headings/icons. Fine rules between groups instead of a card around every group.
- Each player has a name/status row and their own comment field directly underneath. Two players sharing a role have separate fields. No role-level comment box.
- Comments belong to the selected night and player. Retain the general night note. See [decision 0007](../decisions/0007-per-player-night-comments.md).
- All village roles, including seer and witch, use blue headings/icons. Wolves use red. Small text legend for both factions; derive color from team data, not role name.
- Neutral charcoal player names and editable text. Text labels for status; dead players remain visible with muted styling and a tombstone mark.
- Status actions and comment inputs are separate targets. Focusing, typing, or selecting a comment must never toggle death marks.
- Keep the night switcher and finish-game action available. Anchor the end-night action near the bottom without covering focused fields or the on-screen keyboard.
- Notes stay private to the master during play and follow the existing full-log reveal at game finish.

## Handoff status

- Approved: direction, card composition, narrator structure, per-player comments, faction colors.
- Applied to current scaffold: palette/type/shape tokens, self-hosted fonts, lighter home hierarchy, restrained language controls, focus styling.
- Still to do in Phase 0: shared button/field/card/player-chip components, individual mockups for all nine screens at 390×844 in both languages, standalone card art, phone comparison of implemented screens.
- The approved board combines two screens. Neither gameplay screen is implemented yet; not every interaction/state is specified.
