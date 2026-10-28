# 0015 — The village page: player squares and a role card carousel

Date: 2026-10-28. Status: accepted. Changes the visibility table in `docs/game-rules.md`.

## Context

Thuan asked for the waiting page ("The village") to show the players at the bottom as squares with the first letter of their name, five to a row, with the player's own square highlighted; a card carousel above them so players can look at the cards while they wait; and a tap on a card to enlarge it in the middle of the phone.

## Choice

- **Layout:** the page is one screen high and never scrolls. The room panel and carousel are fixed; the players section takes its content height up to 40% of the screen and scrolls inside itself when there are more rows than fit, with its heading and the name line staying put.
- **Players:** a 5-column grid of square tiles at the bottom of the page, above the Leave button. A tile is a button: tapping it shows that player's full name beside the count (tap it again to clear), and `aria-pressed` marks the picked tile. Each tile shows the first whole letter of the name (Vietnamese marks kept), and carries the full name for screen readers and as a tooltip. The tiles are rounded (`--radius-tile`, 10px). The player's own tile glows green (`--shadow-glow`) and has `aria-current`.
- **Carousel:** a sideways scroll-snap row of compact card faces (the role's art and its name running down the right), edge to edge on the screen so the next card peeks in, as tall as the space allows (at most 24rem). Each card is a button. It loops without end: the cards are repeated five times, the middle set is on show, and when the row comes to rest it jumps by whole sets back to the middle. Only the middle set is exposed to the keyboard and screen readers.
- **Auto-advance:** every 4 seconds it moves on one card. It does not move with reduced motion, while a touch, key press or scroll happened in the last 5 seconds, while the pointer is over it or it has focus, while a card is enlarged, or while the tab is hidden. Keyboard focus holds it still, but focus that returns to a card after a tap does not. When an enlarged card closes it moves on again after 1.5 seconds, without the usual quiet wait.
- **Zoom:** a tap opens a `<dialog>` with the full face (name, art, rule) as large as fits, centered, on a dimmed page. Tapping the dimmed background or pressing Escape closes it, and focus returns to the card. Tapping the card itself does nothing, so the rule can be read. There is no visible Close button; a screen-reader-only one remains for keyboards and screen readers.
- **Which cards:** every role in the pool. In the lobby the narrator has not chosen this game's roles yet, so the carousel shows the pool, not this room's selection.
- **Room block:** the room name at `text-title` with a status chip beside it: a green dot that blinks slowly (still with reduced motion) and "You're in the room", then the waiting line, all on one panel so the block does not float on the page. While reconnecting the dot is grey and still.
- **Shared face:** `RoleFace` is the card face used by the role card, the carousel and the zoom.

## Why

- **The pool, not the room's roles:** it is fixed, public data and says nothing about who holds what or which roles this game will use. Showing this room's roles earlier would break the rule that players see the role list only after Ready.
- **Squares:** five to a row fits any group on one or two rows at 390px, and a filled tile makes "which one am I" a glance.

## Consequences

- **Visibility table:** a new row, "Role pool cards (browse only)", is visible to everyone at any time. The worker must not tie it to the room's role list.
- **Green:** `--color-live` is the only non-faction hue in the app. It means "you are here and connected", on the dot and on your own tile.
- **Motion:** every action on the page is animated, all of it off with reduced motion. A tile or card sinks when pressed (150 ms); the picked tile's ring fades in and the picked name slides up (180 ms); an enlarged card scales and fades in with the background (220 ms) and out again before it is removed (160 ms); the carousel moves with a smooth scroll; the Leave button sinks when pressed.
- **Name row:** the hint ("Tap a tile for the full name.") and a picked name share one text size, so the row's height never changes when a tile is picked. A name too long for the row wraps, and the players list above shrinks to make room.
- **Edge text:** cards peek in from both screen edges by design, so the inspector's `edge-text` rule can flag a role name on a peeking card. It is allowed for this screen.
- **Blink:** the dot's 1.6 s loop is longer than the usual 250 ms animation limit because it is a status signal, not a transition.
- **Same first letters:** two players whose names start with the same letter look alike (for example Hà and Huy). The full name is in the tooltip and for screen readers. If it confuses people at the table, a short name under each tile can be added.
- **Border contrast:** the card outline reads at 3.2:1 against the ivory face, above the skill's 1.45:1 limit for panel borders. It is the card's outline (decision 0014), so the inspector's `heavy-borders` warning stays.
- **Preview data:** the preview passes the four example roles; the real pool is still empty.
