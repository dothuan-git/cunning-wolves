# 0012 — Medieval light redesign and narrator/card UX

Date: 2026-10-27. Status: accepted. Supersedes the visual system of 0009 and the type and layout density of 0011. Night/morning rules (0010) and per-player notes (0007) are unchanged.

## Context

Thuan found the Tabletop screens too big, cramped, and later "floating" when content sat directly on the page background. The Tabletop design docs and mockups were deleted as not worth following. Thuan asked for a light, cleaner look with a medieval feel. The forest green and gold stay, more color is welcome, and there's a new sans-serif. Thuan also asked for four UX changes and a phone-sized frame in the design preview.

## Choice

- **Palette "Illuminated":** deeper parchment page (`#efe8d9`) with near-white cards, forest-green primary actions with a gilt inset, gilt ornaments, gold night labels, lapis blue for the village, madder red for wolves, vermilion for danger, and a night-blue wake-guide card. Token names stay the same; see `apps/web/src/design/tokens.css` and `docs/design/direction.md`.
- **Type:** Source Sans 3 for everything, self-hosted as one variable font (400–700) with Latin, Latin Extended and Vietnamese subsets. Body and editable text are 16px. Source Sans is compact, so this reads smaller than the old 15–16px, and fields no longer need a separate size. Be Vietnam Pro, Alegreya and Cormorant files are removed.
- **Cards ground the content:** every block sits on a card (one level, no cards inside cards). Only the phase line, one-line intros and list captions sit on the page.
- **Heraldic role banners:** a small faction-colored pennant names each role on the narrator, setup and summary screens.
- **One-tap alive/dead:** the status control is a button pill. Each tap shows an Undo bar for 5 seconds.
- **Night script:** at night a wake guide names the role to wake ("Waking 2 of 3 · Wolf wakes up"), with Back and Next. The current role's card is highlighted and scrolled into view. It's local guidance only and changes no room state.
- **Hold to peek:** players press and hold to see their card (pointer, touch, or Enter/Space); it hides on release.
- **Hold to end a phase:** End night / End morning fire only after an 800 ms hold; an early release cancels.
- **Phone frame:** on wide screens `/design` renders the screen in a 390×844 iframe with a device bezel.

## Why

- **Cards and color:** cards with clear edges give each group a place, which fixes the floating feel without the boxes-inside-boxes clutter of the earlier board. More color (lapis, madder, gilt, night blue) carries the medieval tone without a display serif.
- **Night script:** it reduces what the narrator has to remember in a dark room.
- **One tap with Undo:** it's faster than a two-step dropdown and still safe.
- **Holding:** it protects actions that can't be undone (ending a phase) and secrets that shouldn't linger on screen (the player's card).

## Consequences

- **Hold animation exception:** the hold-progress fill lasts as long as the hold (800 ms), longer than the usual 250 ms limit, because it is feedback on the user's own press. With reduced motion there is no fill; the label changes to "Keep holding…".
- **Screen readers:** hold controls need the screen reader's pass-through gesture (for example, double-tap and hold). The hold buttons describe this ("Press and hold").
- **Tests:** e2e tests now use the status buttons, hold helpers, and the wake guide. The old "reselecting a status" test no longer applies and is replaced by an Undo test.
- **Mockups:** they are regenerated with `pnpm design:mockups` as the new baseline.
