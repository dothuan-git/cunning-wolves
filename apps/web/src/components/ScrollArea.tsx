import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * The app's one way of scrolling part of a screen: a thin scrollbar in the border color, and the
 * content fading out at an edge only while there is more to see past it. Give it a bounded height
 * (for example `min-h-0` inside a flex column); it scrolls vertically, never sideways.
 */
export function ScrollArea({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ above: false, below: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // One pixel of slack: fractional sizes can leave the end a hair short of the bottom.
    const above = el.scrollTop > 1;
    const below = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    setMore((prev) => (prev.above === above && prev.below === below ? prev : { above, below }));
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    // The area or its content can change size (players join, the screen turns), not only scroll.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => {
      observer.disconnect();
    };
  }, [measure]);

  return (
    <div
      ref={ref}
      onScroll={measure}
      data-more-above={more.above}
      data-more-below={more.below}
      className={`scroll-area overflow-x-hidden overflow-y-auto ${className}`}
    >
      {children}
    </div>
  );
}
