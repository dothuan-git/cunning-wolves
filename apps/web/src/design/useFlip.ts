import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

type Point = { x: number; y: number };

const MOVE_MS = 220;
const ENTER_MS = 180;

function motionAllowed() {
  return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
}

/** Each `[data-flip]` element's place, measured from the container so scrolling is not movement. */
function measure(root: HTMLElement): Map<string, { element: HTMLElement; at: Point }> {
  const origin = root.getBoundingClientRect();
  const found = new Map<string, { element: HTMLElement; at: Point }>();
  for (const element of root.querySelectorAll<HTMLElement>('[data-flip]')) {
    const id = element.dataset.flip;
    if (!id) continue;
    const rect = element.getBoundingClientRect();
    found.set(id, { element, at: { x: rect.left - origin.left, y: rect.top - origin.top } });
  }
  return found;
}

/**
 * Slides `[data-flip]` elements inside `container` from where they were to where they are now,
 * whenever `signature` changes (the order of panels, or who sits in which). An element that was
 * not there before rises in. Nested elements move with their parent and only add their own
 * difference, so nothing travels twice.
 */
export function useFlip(container: RefObject<HTMLElement | null>, signature: string) {
  const places = useRef(new Map<string, Point>());
  const shown = useRef(signature);

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const now = measure(root);
    const changed = shown.current !== signature;
    shown.current = signature;
    const before = places.current;
    places.current = new Map([...now].map(([id, { at }]) => [id, at]));
    if (!changed || !motionAllowed() || before.size === 0) return;

    const moved = new Map<string, Point>();
    for (const [id, { at }] of now) {
      const was = before.get(id);
      if (was) moved.set(id, { x: was.x - at.x, y: was.y - at.y });
    }
    for (const [id, { element }] of now) {
      const delta = moved.get(id);
      const parentId = element.parentElement?.closest<HTMLElement>('[data-flip]')?.dataset.flip;
      if (!delta) {
        // Inside a parent that is new too, it rises in with the parent.
        if (parentId !== undefined && !before.has(parentId)) continue;
        element.animate(
          [
            { opacity: 0, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: ENTER_MS, easing: 'ease-out' },
        );
        continue;
      }
      const carried = (parentId !== undefined && moved.get(parentId)) || { x: 0, y: 0 };
      const dx = delta.x - carried.x;
      const dy = delta.y - carried.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      element.animate(
        [{ transform: `translate(${String(dx)}px, ${String(dy)}px)` }, { transform: 'none' }],
        { duration: MOVE_MS, easing: 'ease-out' },
      );
    }
  });

  // Folds and window resizes move things without a render; measure again so the next move starts
  // from where they really are.
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const refresh = () => {
      places.current = new Map([...measure(root)].map(([id, { at }]) => [id, at]));
    };
    root.addEventListener('transitionend', refresh);
    window.addEventListener('resize', refresh);
    return () => {
      root.removeEventListener('transitionend', refresh);
      window.removeEventListener('resize', refresh);
    };
  }, [container]);
}
