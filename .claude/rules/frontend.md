---
paths:
  - 'apps/web/**'
---

# Frontend rules (apps/web)

- Colors and fonts come only from design tokens in `src/design/tokens.css`. No hex/rgb/hsl literals and no arbitrary Tailwind values (`bg-[#…]`, `text-[13px]`) outside that file.
- Touch targets are at least 48×48px (`min-h-12 min-w-12`). The main action sits at the bottom of the screen, within thumb reach.
- Check `src/components/` before creating a component. Shared UI goes in `components/`; UI used by one screen stays in that screen's folder.
- One folder per screen: `src/screens/<name>/<Name>Screen.tsx`.
- Every screen works at 390px wide with no horizontal scroll. Design for phones first; desktop is a bonus.
- All text goes through `t()`. Check both languages: Vietnamese strings are often longer and must not overflow.
- Render only what the server sent for this viewer. Never derive or store another player's secret data on the client.
- Animations stay short (≤ 250ms) and use `motion-safe:` so `prefers-reduced-motion` is respected.
- Interactive elements are real `<button>` / `<a>` elements with an accessible name.
- WebSocket code lives in `src/realtime/`. Screens use its hooks; they never call `new WebSocket` directly.
