# Visual direction: Woodcut

Chosen by Thuan on 2026-10-28 with taste-skill. See [decision 0013](../decisions/0013-woodcut-redesign.md). Tokens live in `apps/web/src/design/tokens.css`; use them by name, never raw colors.

The idea: a 16th-century werewolf broadside printed from wood. Black ink on putty paper, condensed wood-type titles, real art set large, and color only where the game has it.

## Palette

| Token                        | Value                 | Use                                                       |
| ---------------------------- | --------------------- | --------------------------------------------------------- |
| `paper`                      | `#dedad3`             | Page ground                                               |
| `surface`                    | `#e9e7e3`             | Panels: one tone step above the page, no border or shadow |
| `field`                      | `#f5f4f2`             | Inputs, secondary buttons, sheets, text on ink            |
| `ink` / `muted`              | `#0a0a0a` / `#5c5852` | Text; `ink` is also the primary button fill               |
| `line`                       | `#cfcac1`             | Row rules inside a panel, the tab rail, the Dead pill     |
| `field-border`               | `#8f897f`             | Input and secondary button outlines                       |
| `village` / `village-wash`   | `#2a4170` / `#dfe3ec` | Village roles (lapis from the card back), focus ring      |
| `werewolf` / `werewolf-wash` | `#8a1f24` / `#efdcda` | Wolf roles (madder from the wolf seal)                    |
| `danger`                     | `#a3321f`             | Destructive actions only                                  |

Faction color is the only hue. Status, phases and actions are ink and paper. Alive is neutral, and a death is marked with ✝, a struck-through name and the `line` pill. Meaning never relies on color alone.

## Type

Barlow Condensed 600 (`font-display`) and Barlow 400/500 (`font-sans`), self-hosted with Vietnamese subsets (`src/design/fonts.css`). No uppercase and no letter-spaced labels.

| Token          | Size / line height  | Use                                      |
| -------------- | ------------------- | ---------------------------------------- |
| `text-brand`   | 19vw (64–104) / .92 | The name on home only                    |
| `text-title`   | 32 / 1.08           | The wake line, the role name on the card |
| `text-heading` | 26 / 1.1            | Screen titles, room names                |
| `text-role`    | 20 / 1.15           | Role names, section headings, tabs       |
| `text-body`    | 16 / 1.5            | Body, notes, all input text              |
| `text-control` | 16 / 1.3            | Buttons and labels (500)                 |
| `text-caption` | 13 / 1.45           | Metadata                                 |

Editable text stays at 16px so phones do not zoom in on focus.

## Layout

- **Panels on paper.** A block sits on a `.panel`: the `surface` tone, 2px corners, no border and no shadow. Only one level, never panels inside panels. Lists are one panel with `line` rules between rows.
- **Header:** the screen title and the menu, nothing else. Home replaces it with the name, the woodcut and the intro.
- **Footer:** the main action stays at the bottom in an opaque sticky footer.
- **Spacing:** 20px phone gutters, and touch targets of at least 48×48px.

## Components

- **Buttons:** primary is a flat ink fill with a `field` label; secondary is `field` with a `field-border` outline; quiet is text only. All are square (2px).
- **`RoleBanner`:** the role's art as a 40px thumbnail and its name in the faction color.
- **`PlayerStatusControl`:** a one-tap pill. "● Alive" is outlined; "✝ Dead" is filled with `line`. The narrator shows an `UndoBar` after each tap.
- **Wake guide:** the line the narrator reads aloud, at `text-title`, with the waking role's art inside the sentence. Under it is the wake order (the current role underlined, past roles struck through) and Back / Next. The waking role's panel takes its faction wash and a 2px ink outline.
- **`HoldButton`:** fires after an 800 ms press and hold, for End night and End morning.
- **My card:** the back is the card-back art. Holding the card or the button shows the role's art, its name, its faction and its rule until release.

## Art

- **Role art:** `src/assets/cards/<role-id>.webp` (see its README).
- **Card back and the woodcut:** `src/assets/art/` (see its README for credits). Found pictures are credited in the menu sheet.

## Preview

`/design` shows every screen and state. On wide screens it renders inside a 390×844 phone frame.
