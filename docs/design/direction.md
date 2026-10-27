# Visual direction: Medieval light

Chosen by Thuan on 2026-10-27. See [decision 0012](../decisions/0012-medieval-light-redesign.md). Tokens live in `apps/web/src/design/tokens.css`; use them by name, never raw colors.

## Palette

| Token                        | Value                 | Use                                                   |
| ---------------------------- | --------------------- | ----------------------------------------------------- |
| `paper`                      | `#efe8d9`             | Page background (deeper parchment so cards stand out) |
| `surface`                    | `#fffcf5`             | Cards, sheets, text on dark fills                     |
| `folio`                      | `#efe9dc`             | Quiet fills (tab track, portraits, hover)             |
| `edge`                       | `#d9cdb4`             | Card borders                                          |
| `line`                       | `#e5dbc7`             | Dividers inside cards                                 |
| `ink` / `muted`              | `#2b251d` / `#695f50` | Text                                                  |
| `field-border`               | `#918571`             | Editable field outlines and note baselines (3:1)      |
| `forest`                     | `#24503b`             | Primary actions                                       |
| `brass` (gilt)               | `#b38b45`             | Ornaments, primary inset, active wake-guide outline   |
| `ochre` (gold)               | `#85631f`             | Phase labels and night headings (readable gold)       |
| `village` / `village-wash`   | `#2c4f8f` / `#e8ecf5` | Village roles (lapis), focus ring, highlighted group  |
| `werewolf` / `werewolf-wash` | `#8f2c3a` / `#f5e7e7` | Wolf roles (madder), highlighted group                |
| `night`                      | `#1f2d4f`             | Wake-guide card                                       |
| `alive` / `alive-surface`    | `#2f6b4b` / `#e7efe5` | Alive status pill                                     |
| `danger`                     | `#b23a24`             | Destructive actions (vermilion, distinct from wolves) |

Faction, status and role meaning never relies on color alone: banners and pills always carry text.

## Type

Source Sans 3 only, self-hosted (`src/design/fonts.css`). `font-display` is the same family.

| Token          | Size / line height | Weight | Use                         |
| -------------- | ------------------ | ------ | --------------------------- |
| `text-title`   | 28 / 1.15          | 700    | Brand on the card back      |
| `text-heading` | 22 / 1.25          | 600    | Page titles, room names     |
| `text-role`    | 17 / 1.35          | 600    | Role names, phase heading   |
| `text-name`    | 16 / 1.35          | 600    | Player names                |
| `text-body`    | 16 / 1.55          | 400    | Body, notes, all input text |
| `text-control` | 15 / 1.4           | 600    | Buttons (form labels: 400)  |
| `text-caption` | 13 / 1.45          | 400    | Metadata, list captions     |

Editable text stays at 16px so phones do not zoom in on focus.

## Layout

- **Cards ground the content.** Every block sits on a `.folio` card: surface fill, 1px `edge` border, 10px corners, soft warm shadow, 14px padding, 12px between cards. One level only, never cards inside cards. Lists are one card with `line` dividers.
- **What sits on the page:** only page-level items (the phase line, a short intro, small list captions such as "6 players").
- **Header:** wolf seal, page title, menu, and a hairline with a gilt diamond.
- **Footer:** the main action stays at the bottom in a sticky footer.
- **Spacing:** 20px phone gutters. Touch targets are at least 48×48px.

## Components

- **Buttons:** primary is forest with a gilt inset; secondary is surface with an edge border; quiet is text only. 6px corners.
- **`RoleBanner`:** a faction-colored pennant naming a role (narrator groups, setup, summary).
- **`PlayerStatusControl`:** a one-tap pill, "● Alive" / "✝ Dead". The narrator shows an `UndoBar` after each tap.
- **`HoldButton`:** fires after an 800 ms press and hold, used for End night / End morning. The fill shows progress; with reduced motion it shows "Keep holding…" instead.
- **Wake guide:** a night-blue card on the narrator screen at night. It names the role to wake, with Back and Next, and the current role's card gets a wash and gilt outline.
- **My card:** the card back shows the wolf seal. Holding the card or the "Hold to see your card" button reveals it until release.

## Preview

`/design` shows every screen and state. On wide screens it renders inside a 390×844 phone frame.
