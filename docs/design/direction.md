# Visual direction

**Status:** Phase 0 has not started. Everything below is the brief from `docs/plan.md`, not yet an approved design. Once Thuan picks a take, record the decision here and update `tokens.md`.

A bright, playful look for teens and adults on a light screen, with a forest-village palette.

| Area         | Decision                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vibe         | Bright and playful for teens and adults: bold, witty, a little mischievous; not childish                                                                                             |
| Screen       | Light background                                                                                                                                                                     |
| Colors       | Deep forest green (main), vivid lime and sunset orange (highlights), warm off-white background, charcoal text, berry red (danger only)                                               |
| Fonts        | Be Vietnam Pro for everything, extra-bold for headings: modern, clean, and made for Vietnamese accents                                                                               |
| Role cards   | Stylized character per role in a bold graphic style, like modern board-game art, all generated with one shared style prompt; custom roles get a generic card with the role's initial |
| Dead players | Grayed out with a small tombstone mark                                                                                                                                               |
| Sounds       | Playful but not goofy: soft pop on card flip, rooster at night end, wolf howl when the timer ends; on/off in setup                                                                   |
| Animation    | A little: snappy card flip, subtle press on tap, fade to gray on death                                                                                                               |
| Layout       | Phone-first, main button at the bottom for thumbs, touch targets at least 48px                                                                                                       |

## Phase 0 steps

1. **Three takes** on this direction (for example bold poster, modern board game, paper cut-out), each shown on the card flip and narrator night screens. Thuan picks one or mixes.
2. **Design system** from the chosen take: color and font tokens, buttons, cards, inputs, player chips.
3. **Mockups** of all nine screens at phone size, in both Vietnamese and English, saved to `mockups/`.
4. **Card art:** one test card to lock the style, then every role in the pool. Record the shared style prompt here.
5. **Handoff:** tokens into `apps/web/src/design/tokens.css`, mockups into `mockups/`, then build with the screenshot-and-compare loop (`ui-checker` subagent).

## Chosen take

_Not chosen yet._

## Card art style prompt

_Not written yet._
