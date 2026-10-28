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

Faction color is the only hue, apart from `live` green for a live status dot. Status, phases and actions are ink and paper. Alive is an outlined pill with a green blinking dot, and a death is marked with ✝, a struck-through name and the `line` pill. Meaning never relies on color alone.

## Type

Barlow Condensed 600 (`font-display`) and Barlow 400/500 (`font-sans`), self-hosted with Vietnamese subsets (`src/design/fonts.css`). No uppercase and no letter-spaced labels.

| Token          | Size / line height  | Use                                                             |
| -------------- | ------------------- | --------------------------------------------------------------- |
| `text-brand`   | 19vw (64–104) / .92 | The name on home only                                           |
| `text-title`   | 32 / 1.08           | The room name, the role name on the card                        |
| `text-heading` | 26 / 1.1            | Screen titles, room names                                       |
| `text-role`    | 20 / 1.15           | Role names, section headings, tabs, the narrator's player names |
| `text-body`    | 16 / 1.5            | Body, notes, all input text                                     |
| `text-control` | 16 / 1.3            | Buttons and labels (500)                                        |
| `text-caption` | 13 / 1.45           | Metadata                                                        |

Editable text stays at 16px so phones do not zoom in on focus.

## Layout

- **Panels on paper.** A block sits on a `.panel`: the `surface` tone, 2px corners, no border and no shadow. Only one level, never panels inside panels. Lists are one panel with `line` rules between rows.
- **Header:** the screen title and the menu, nothing else. Home replaces it with the name, the woodcut and the intro.
- **Footer:** the main action stays at the bottom in an opaque sticky footer.
- **Spacing:** 20px phone gutters, and touch targets of at least 48×48px.

## Components

- **Buttons:** primary is a flat ink fill with a `field` label; secondary is `field` with a `field-border` outline; quiet is text only. All are square (2px).
- **`RoleBanner`:** the role's art as a 40px head-and-shoulders thumbnail (`.art-bust`) and its name in the faction color.
- **`FactionLabel` / `FactionEmblem`:** the faction's own emblem (the cottage for the village, the wolf's head for the wolves) beside its name in the rules review. The summary's Roles tab lists each faction under its emblem, wolves first.
- **`PlayerStatusControl`:** a one-tap pill. "● Alive" is outlined with a green blinking dot (`live-dot`, still with reduced motion); "✝ Dead" is filled with `line`. Tapping again undoes it; there is no Undo bar.
- **Narrator:** the phase and the alive count, then one panel per role in wake order (the order is changed in the menu: "Wake order" shows each waking role as a tile in its faction wash with its name, cut short with "…" when it does not fit, four to a row and read left to right, top to bottom; a tile is dragged to a new place while the others slide out of its way, or moved with the arrow keys, with the new position announced). No wake guide. Each panel opens with a band in its faction wash holding the `RoleBanner`; when every player of the role is dead, the band turns `line` grey (a step darker than the page, so it never matches the background) and the name and art go grey (`RoleBanner dead`); under it, one row per player with `line` rules between them. The player's name leads the row at `text-role` in `font-display`, with the status pill on the right; under it the night labels sit small and `muted` close beside the notes in compact rows, so the names stand out. The note being written is a boxed field (`NoteField appearance="box"`) that grows with its text. Motion (all ≤ 250 ms, off with reduced motion): buttons and saved notes sink on press; the status pill pops when a player changes status (not when the list first appears); the phase title and alive count slide in when they change; new note rows, the open note box and the death row slide in.
- **`HoldButton`:** fires after an 800 ms press and hold, for End night and End morning. On the narrator it shares the footer with a square `danger` icon button (a flag, `iconOnly`) that finishes the game after a 1.2 s hold, filling red as it goes; there is no confirmation dialog and no Finish entry in the menu.
- **Scrollbars:** one thin scrollbar in the border color for everything that scrolls (the page, sheets, lists, text boxes), set once in the base styles; only the role carousel hides it. A page that scrolls keeps its scrollbar while a sheet or card is open over it, and the screen's right padding gives up the scrollbar's width when it appears (`.page`, with the width measured into `--scrollbar` by `design/scrollbar.ts`), so the content never narrows; header tools that reach into that padding use `.page-edge` so they never cross the right edge; and nothing scrolls sideways (a `ScrollArea` clips sideways; corner buttons stay inside its padding). **Scrolling part of a screen:** always through `ScrollArea`, which adds the content fading out over 2rem at an edge only while more lies past it (the fade eases in and out, and switches with reduced motion). A whole page that scrolls is the browser's own; this is for a section inside a one-screen page, such as the village players.
- **Role cards, two kinds, shared everywhere:** the **thumbnail card** (`ThumbnailCard`) is a role card without its rule: the art, a small vertical name in the faction color, and optionally a `×N` count. It is a button that fills any 2:3 box and scales its name, padding and corners to the box's width (container query units), so one layout serves a row of three and a wide carousel card. The **detailed card** (`DetailedCard`) is the popup it opens: the full card with the rule, 4:7, at most 84% of the screen high, closed by a tap on the background or Escape. Both are drawn by `RoleFace` (`variant`); use these components on any page that shows role cards instead of making new card markup.
- **The village (waiting page):** one screen high. The room panel (the room name at `text-title`, a status chip with a green blinking dot and "You're in the room", and the waiting line) comes first. Then a looping row of thumbnail cards, one for every pool role (swiped by touch, dragged by mouse), as tall as the space allows. Then the players at the bottom as 5-per-row rounded tiles with their first letter; your own tile glows green (`shadow-glow`). The players section is always the same height: two rows of tiles and a little of the third, so the cards never change size as players join; with more players only the tiles scroll (`ScrollArea`). Tapping a tile shows the full name beside the count, in the same size as the hint so the row never changes height. Pressing a tile, card or the Leave button sinks it a little; the picked name slides in; an enlarged card scales and fades in and out. Tapping a card opens the detailed card in the middle of the phone; tapping the dimmed background or pressing Escape closes it, with no visible Close button. See decision 0015.
- **Game record (summary):** the room name at `text-title` with players, nights and deaths as caption facts under it, on one `panel`. Then two tabs. Roles: one panel per faction, wolves first, opening with a band in its faction wash (emblem, name, and "alive/total players"); each row leads with the player's name at `text-role` (struck through with ✝ and "Died · <phase>" under it when they died) and the `RoleBanner` on the right, greyed out (`dead`) for the dead. Night journal: one panel per phase, all open at first; the title bar is a button that folds the notes away and back (`PhasePanel`, the body eases its height in 220 ms with the chevron turning). A night's bar is ink with `field` text and a morning's is `field`, so the two read apart without color. Each note shows the player's name at `text-role` with their role small in its faction color, then the note in full ink; deaths are a `line` pill. The footer holds Home and Play again side by side. Motion (≤ 250 ms, off with reduced motion): each tab's panels rise in one after another (`.stagger`) every time the tab opens, title bars sink on press.
- **Tonight's roles (rules review):** one block per faction, wolves first like the summary, each on its own faction wash with the emblem, the faction name and its player count. Inside, thumbnail cards with a small black `×N` chip for how many are in the game, three to a row. The page scrolls; the footer holds the Done button. Tapping a card enlarges just that card (a `DetailedCard`, with its count); tapping the background or pressing Escape closes it.
- **Prepare the roles (setup):** It is also the master's lobby: Create room comes straight here. A room panel opens the page (`RoomPanel`): the room name at `text-title`, an Open/Closed chip (green blinking dot while open), and two secondary buttons side by side, "Players (N)" opening a sheet with the live list and a remove button per player (with a confirm dialog), and Close room / Reopen room. Any number of roles can be chosen; the footer line says how many more roles are needed, how many are too many, or that every player has a role, and Review rules is enabled only then (pressing it closes the room). The menu sheet has the same "Wake order" setting as the narrator's (`WakeOrderSetting`, with a 16px gap between its title and the tiles); it lists the waking roles chosen so far and is passed on with Review rules. the same faction blocks as Tonight's roles (`FactionSection`), but holding the roles chosen so far as thumbnail cards with their `×N` count, and ending in a grey `AddCard` with a "+" for that faction. The "+" opens a sheet with a search box (accents ignored), a "Custom" button for a new role, and that faction's roles as thumbnail cards in a `ScrollArea`: tapping adds one copy, and a card that is in the game gets a "−" (a 48px touch area with a 24px ink circle, centered on the card's top right corner) that takes one copy off, and at none the role is out; the sheet repeats the footer line. The cards on the page itself have no "−": tapping one opens its detailed card with the rule as text and a small "Tap to edit rule." under it; tapping turns it into a text box that saves as typed until it loses focus (emptied, it goes back to what it was) and a − / + stepper under the card, and taking the last copy off closes the card and takes the role out of the game. Motion: a card dealt onto the table scales in, a card taken out shrinks away before it leaves the grid, the "−" pops, changed counts and the status lines pop, and every sheet (`Modal`) slides up and fades, and slides out again when closed by its Close button, Done (`ModalDone`), Escape or a tap on the dimmed background; buttons fade between enabled and disabled. Nothing jumps: the name on a card in the list always keeps room for the "−", the add sheet fits its cards up to 75% of the screen and keeps its opening height (`steady`) so a search never moves it, the footer line always holds one line, and the rule text box is exactly as tall as the rule it replaces. A sheet scrolls only in its body (a `ScrollArea`), with the title and footer fixed.
- **My card:** one screen high, never scrolls. A round card with a 1px `field-border` outline and a small soft shadow (`shadow-card`) fills the space between the header and the hint and shows the card-back art; tapping it flips it (250 ms) to the role, and tapping again hides it. The face is plain ivory-white (`ivory`, `#f8f5ec`). It has the role name vertical top right in its faction color, the role's art, and the rule centered. It has no faction emblem. See decision 0014.

## Art

- **Role art:** `src/assets/cards/<role-id>.webp` (see its README).
- **Card back and the woodcut:** `src/assets/art/` (see its README for credits). Found pictures are credited in the menu sheet.

## Preview

`/design` shows every screen and state. On wide screens it renders inside a 390×844 phone frame.
