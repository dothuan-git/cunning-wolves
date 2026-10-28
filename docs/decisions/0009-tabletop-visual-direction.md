# 0009 — Tabletop visual direction

Date: 2026-10-27. Status: accepted. Supersedes the visual styling in decision 0006.

## Context

Thuan rejected the first rendered Phase 0 UI and the subsequent fresh-minimal proposal, then explicitly selected **B · Tabletop** from the second redesign round.

## Choice

- Adopt `docs/design/mockups/approved-tabletop.png` as the direction reference.
- Use light limestone/ivory folio surfaces, restrained brass detail, forest-green primary actions, and blue village/red wolf accents.
- Use Alegreya Medium/Semibold display type with Be Vietnam Pro utility type. Serve fonts and OFL notices locally; no new package dependency.
- Include a generated wolf/moon seal and faint village panorama as decorative branding. Keep all role art as the shared placeholder.
- Give narrator roles folio groups with colored icon tabs, underlined per-player notes, and explicit status selectors.
- Split finished-game roles and night records into accessible tabs with keyboard navigation. Add a secondary return-home action.
- Apply the shared treatment to all nine templates and refresh bilingual mockups. Archive the previous generated baseline under `docs/design/concepts/phase0-village-ink/`.

## Why

The selected proposal has a recognizable tabletop character while separating navigation, names, notes, and secondary actions more clearly. Explicit status selection reduces accidental toggling. Separate journal panels make the finished game easier to scan.

## Sources and boundaries

[Alegreya metadata](https://github.com/google/fonts/blob/main/ofl/alegreya/METADATA.pb) identifies the Vietnamese subset and variable weight axis; its [OFL license](https://github.com/google/fonts/blob/main/ofl/alegreya/OFL.txt) is included in `apps/web/public/fonts/`. WOFF2 files were retrieved from `https://fonts.googleapis.com/css2?family=Alegreya:wght@500..600&display=swap`.

Decorative images were generated using the built-in image_gen tool; prompts and paths are in `apps/web/src/assets/tabletop/README.md`. These assets are separate from future role illustrations.

This changes presentation and preview interactions. Master authority, visibility, night/player note identity, ability resolution, and winner decisions are unchanged. The development gallery remains excluded from production JavaScript.
