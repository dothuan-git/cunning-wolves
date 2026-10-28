# 0014 — Tap-to-flip role card

Date: 2026-10-28. Status: accepted. Supersedes "hold to peek" from 0012.

## Context

Thuan reviewed "Your role card" and asked for a fixed page with no scroll, a round card, the role name running down the top right, the faction logo at the top left, the rule centered, no reveal button, and a card that shows its back by default and flips when tapped.

## Choice

- The page is one screen high and never scrolls. The card stretches to fill all the space between the header and a one-line hint, edge to edge in the 20px gutters (less 8px each side).
- The card is round (`--radius-playing`, 1.5rem), the only round surface in the app.
- The back is the card-back art. Tapping the card flips it (a 250 ms turn) to the role, and tapping again turns it back. The face is a button with `aria-pressed`; Enter and Space work.
- The card has a 1px outline (`field-border`) and a small soft shadow (`--shadow-card`, under the skill's 8%-black limit for resting surfaces), so it reads as an object on the table. It is the only resting surface with both a border and a shadow.
- The face is plain ivory-white (`--color-ivory`, `#f8f5ec`), not pure white. Rustic paper, washi, and linen card stock textures were tried and rejected.
- The face has the role name vertical top right in its faction color, the role's art in the middle and the rule centered below. It shows no faction emblem or faction name; the name's color carries the faction.
- The role's name, art and rule are in the page only while the card shows or turns away, so a hidden card can't be read by a screen reader or from the page.
- With reduced motion the card turns instantly.

## Why

- **Tap, not hold:** a hold needs a thumb pressed on the card the whole time, which hides part of it. A flip reads at a glance and matches a real card.
- **No button:** the card is the control; a second control for the same thing only adds a place to look.

## Consequences

- A revealed card stays revealed until it is tapped again, so a player can leave it showing by accident. Hold-to-peek no longer protects against that. If it matters in play, a short auto-hide can be added later.
- The hold gesture (`useHold`) is still used by End night and End morning.
- The back art is 2:3, so on a tall phone it is cropped at the sides (about a fifth of its width on a 390×844 phone). The wolves' circle stays whole; the side borders are cut.
- Tests: the card tests tap and press Enter instead of holding, and a new test checks that the page never scrolls at 390×844, 360×640 and 320×568 in both languages.
