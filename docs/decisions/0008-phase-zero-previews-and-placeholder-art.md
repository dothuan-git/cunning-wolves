# 0008 — Phase 0 previews and placeholder art

Date: 2026-10-27. Status: accepted.

## Context

Phase 0 needs shared controls and all nine screen mockups before rooms and game state are implemented. Thuan approved the Village ink direction and asked to use placeholder images, with role artwork to be generated later.

## Choice

- Build reusable presentational components and screen templates in the existing web app.
- Add a development-only `/design` gallery with screen/state selectors, language switching, and local interactions. Lazy-load it behind `import.meta.env.DEV`; production builds omit the gallery and its fixtures.
- Use synthetic example data in `apps/web/src/design/preview/fixtures.ts`. Keep the official shared role pool empty until its roles and rule text are agreed.
- Capture 390×844 Vietnamese and English mockups from the templates with the existing Playwright dependency. Save longer scroll content separately as `.full` images and capture empty/loading/error/dead/hidden/long-text states.
- Use one neutral SVG placeholder for every card. Resolve optional artwork from `apps/web/src/assets/cards/` at build time and fall back on missing or failed images. Final art is deferred at Thuan's request.
- Keep preview state local to the page. It does not connect to room APIs, create assignments, persist narrator records, or implement the Room state machine.
- No new library dependency.

## Why

Rendered templates give the mockups the same font metrics, wrapping, focus behavior, and components as future screens. A development-only gallery supports review without presenting sample assignments as live room data. One placeholder keeps the design work independent of artwork production and can be replaced per role later.

## Boundaries

Phase 0 completes the visual handoff with the requested artwork substitution. Device identity, sockets, real room/role/narrator actions, server-side visibility, sound assets, drag-based wake ordering, and temporal death rules remain in their planned phases. Local preview toggles demonstrate visual states only; they are not an alternate game engine. The accessible wake-order buttons establish the intended order editor while touch/drag behavior remains for the narrator phase.
