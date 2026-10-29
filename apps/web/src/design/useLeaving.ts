import { useEffect, useRef, useState } from 'react';

export interface Presence<T> {
  item: T;
  key: string;
  /** Removed a moment ago; drawn only so it can animate out */
  leaving: boolean;
}

interface Gone<T> {
  item: T;
  key: string;
  index: number;
}

function motionAllowed() {
  return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
}

/**
 * The items to draw: the current ones, plus those just removed, kept in their old place for `ms`
 * so they can animate out. With reduced motion a removed item goes at once.
 */
export function useLeaving<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  ms: number,
): Presence<T>[] {
  const keys = items.map(keyOf);
  const signature = keys.join('\u0000');
  const [last, setLast] = useState({ signature, items });
  const [gone, setGone] = useState<readonly Gone<T>[]>([]);

  // Compared during render (React's "previous props" pattern), so the removed item never blinks out.
  if (last.signature !== signature) {
    const now = new Set(keys);
    const removed = motionAllowed()
      ? last.items.flatMap((item, index) => {
          const key = keyOf(item);
          return now.has(key) ? [] : [{ item, key, index }];
        })
      : [];
    setGone((current) => [
      ...current.filter(
        (left) => !now.has(left.key) && !removed.some((next) => next.key === left.key),
      ),
      ...removed,
    ]);
    setLast({ signature, items });
  }

  // One timer per removed item, so a later removal never keeps an earlier one waiting.
  const timers = useRef(new Map<Gone<T>, number>());
  useEffect(() => {
    for (const [left, timer] of timers.current) {
      if (!gone.includes(left)) {
        window.clearTimeout(timer);
        timers.current.delete(left);
      }
    }
    for (const left of gone) {
      if (timers.current.has(left)) continue;
      const timer = window.setTimeout(() => {
        timers.current.delete(left);
        setGone((current) => current.filter((other) => other !== left));
      }, ms);
      timers.current.set(left, timer);
    }
  }, [gone, ms]);
  useEffect(() => {
    const running = timers.current;
    return () => {
      for (const timer of running.values()) window.clearTimeout(timer);
      running.clear();
    };
  }, []);

  const shown: Presence<T>[] = items.map((item) => ({ item, key: keyOf(item), leaving: false }));
  for (const left of [...gone].sort((a, b) => a.index - b.index)) {
    shown.splice(Math.min(left.index, shown.length), 0, {
      item: left.item,
      key: left.key,
      leaving: true,
    });
  }
  return shown;
}
