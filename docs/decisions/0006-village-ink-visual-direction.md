# 0006 — Village ink visual direction

Date: 2026-10-27. Status: accepted.

## Context

Thuan rejected the provisional playful direction as childish: oversized type/controls, heavy borders, and flat styling. After reviewing three concepts, Thuan chose Village ink, requested a lighter background and more color, then approved manuscript lettering, compact narrator groups, and red/blue faction colors.

## Choice

- Approved direction reference: `docs/design/mockups/approved-village-ink.png`.
- Luminous ivory surfaces, fine borders, subtle depth, hand-colored medieval engraving. Centered character, rotated upper-right role name, bottom-centered description.
- Village blue, wolf red, forest-green primary actions, restrained ochre decoration.
- Cormorant Unicase Medium for short display text; Be Vietnam Pro Regular/Medium for utility text. Generated reference lettering is approximate, not a reusable typeface.
- Self-host WOFF2 files and SIL Open Font License notices. Bundle Latin, Latin Extended, and Vietnamese subsets with swap rendering. No new package dependency or runtime font-service request.

## Why

Character art and distinctive headings provide medieval identity while quiet surfaces and smaller controls support quick use around a table. Separate utility typography protects readability. Local fonts avoid a third-party connection during play. Actual type metrics still need phone verification.

## Font sources

- [Cormorant Unicase metadata and Vietnamese coverage](https://github.com/google/fonts/blob/main/ofl/cormorantunicase/METADATA.pb), [license](https://github.com/google/fonts/blob/main/ofl/cormorantunicase/OFL.txt).
- [Be Vietnam Pro metadata and Vietnamese coverage](https://github.com/google/fonts/blob/main/ofl/bevietnampro/METADATA.pb), [license](https://github.com/google/fonts/blob/main/ofl/bevietnampro/OFL.txt).
- WOFF2 retrieved from Google Fonts CSS on 2026-10-27: `https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500&family=Cormorant+Unicase:wght@500&display=swap`.

## Scope

This replaces the old visual brief. Phase 0 still needs individual bilingual mockups, shared components, and standalone role art. Per-player notes are recorded separately in decision 0007.
