import type { Locale, PoolRole } from '@werewolf/shared';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DetailedCard } from '../../components/DetailedCard';
import { ThumbnailCard } from '../../components/ThumbnailCard';

// The row is the cards repeated five times with the middle set on show, so it can be swiped
// either way without end: when it comes to rest, it jumps by whole sets back to the middle.
const COPIES = 5;
const MIDDLE = 2;
const ADVANCE_MS = 4000;
// After an enlarged card closes, the row moves on again this soon.
const RESUME_MS = 1500;
// After any touch, key press or scroll, the row stays still this long before it moves on again.
const IDLE_MS = 5000;
// A mouse drag shorter than this is still a click.
const DRAG_PX = 6;
const WRAP_DELAY_MS = 150;

/**
 * The role cards in a sideways loop, so waiting players can look at them. It advances by itself
 * (never with reduced motion, and not while it is touched, hovered, focused or a card is
 * enlarged), can be swiped either way (dragged with a mouse too), and tapping a card enlarges it.
 */
export function RoleCarousel({ roles }: { roles: readonly PoolRole[] }) {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'vi' ? 'vi' : 'en';
  const [zoomed, setZoomed] = useState<PoolRole | null>(null);
  const deck = useRef<HTMLUListElement>(null);
  const lastTouch = useRef(0);
  const hovering = useRef(false);
  const focused = useRef(false);
  const wrapTimer = useRef<number | undefined>(undefined);
  const firstDelay = useRef(ADVANCE_MS);
  // A mouse press on the row: where the pointer was last, and whether it has become a drag.
  const drag = useRef<{ lastX: number; startX: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const count = roles.length;
  const looping = count > 1;
  const sets = looping ? COPIES : 1;

  /** The distance from one card to the next, gap included. */
  function stride() {
    const first = deck.current?.children[0];
    const second = deck.current?.children[1];
    if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) return 0;
    // Measured to the fraction of a pixel: cards are rarely a whole number of pixels wide.
    return second.getBoundingClientRect().left - first.getBoundingClientRect().left;
  }

  /** The scroll position that puts card `index` in the middle of the row. */
  function centerOn(index: number) {
    const el = deck.current;
    const card = el?.children[index];
    if (!el || !(card instanceof HTMLElement)) return 0;
    const box = card.getBoundingClientRect();
    const fromStart = box.left - el.getBoundingClientRect().left - el.clientLeft + el.scrollLeft;
    return fromStart - (el.clientWidth - box.width) / 2;
  }

  /**
   * Jumps by whole sets back to the middle set. It counts in whole cards, so a row resting a
   * fraction of a pixel off a card never jumps: measuring the raw distance put the edge of the
   * middle set exactly on the first card, and rounding made the row bounce between two sets there.
   */
  function wrap() {
    const el = deck.current;
    const step = stride();
    if (!el || !looping || step <= 0) return;
    const card = Math.round((el.scrollLeft - centerOn(MIDDLE * count)) / step);
    const away = Math.floor(card / count);
    if (away !== 0) el.scrollLeft -= away * count * step;
  }

  useLayoutEffect(() => {
    const el = deck.current;
    if (el && looping) el.scrollLeft = centerOn(MIDDLE * count);
  }, [looping, count]);

  useEffect(() => {
    return () => {
      window.clearTimeout(wrapTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!looping || zoomed) return;
    let timer: number;
    const tick = () => {
      const busy =
        document.hidden ||
        hovering.current ||
        focused.current ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        Date.now() - lastTouch.current < IDLE_MS;
      if (!busy) deck.current?.scrollBy({ left: stride(), behavior: 'smooth' });
      timer = window.setTimeout(tick, ADVANCE_MS);
    };
    timer = window.setTimeout(tick, firstDelay.current);
    firstDelay.current = ADVANCE_MS;
    return () => {
      window.clearTimeout(timer);
    };
  }, [looping, zoomed]);

  function touched() {
    lastTouch.current = Date.now();
  }

  function endDrag(event: PointerEvent<HTMLUListElement>) {
    const press = drag.current;
    drag.current = null;
    if (!press?.moved) return;
    delete event.currentTarget.dataset.dragging;
    // The click that follows a release comes at once; if none does, forget the drag.
    justDragged.current = true;
    window.setTimeout(() => {
      justDragged.current = false;
    }, 0);
  }

  return (
    <section className="flex min-h-60 flex-1 flex-col gap-1">
      <h2 className="font-display text-role font-semibold">{t('lobby.cardsHeading')}</h2>
      <p className="text-caption text-muted">{t('lobby.cardsHint')}</p>
      {/* The row runs to the screen edges so the next card peeks in from the side. */}
      <ul
        ref={deck}
        className="deck relative -mx-5 flex min-h-0 flex-1 items-center gap-3 overflow-x-auto py-4"
        onScroll={() => {
          window.clearTimeout(wrapTimer.current);
          wrapTimer.current = window.setTimeout(wrap, WRAP_DELAY_MS);
        }}
        onPointerDown={(event) => {
          touched();
          // Touch and pen scroll the row natively. A mouse has to do it by hand.
          if (event.pointerType !== 'mouse' || event.button !== 0) return;
          drag.current = { lastX: event.clientX, startX: event.clientX, moved: false };
        }}
        onPointerMove={(event) => {
          const press = drag.current;
          if (!press) return;
          if (!press.moved && Math.abs(event.clientX - press.startX) < DRAG_PX) return;
          if (!press.moved) {
            press.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            // Snapping would fight the drag; it comes back on release and settles on a card.
            event.currentTarget.dataset.dragging = 'true';
          }
          event.currentTarget.scrollLeft -= event.clientX - press.lastX;
          press.lastX = event.clientX;
        }}
        // Without this the browser starts dragging the card art as a picture and the drag stops.
        onDragStart={(event) => {
          event.preventDefault();
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          // The release of a drag must not count as a tap on the card under the pointer.
          if (!justDragged.current) return;
          justDragged.current = false;
          event.stopPropagation();
        }}
        onWheel={touched}
        onTouchStart={touched}
        onKeyDown={touched}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') hovering.current = true;
        }}
        onPointerLeave={() => {
          hovering.current = false;
        }}
        onFocus={(event) => {
          // Only keyboard focus holds it still. Focus that returns to a card after a tap does not.
          focused.current = event.target.matches(':focus-visible');
        }}
        onBlur={() => {
          focused.current = false;
          touched();
        }}
      >
        {Array.from({ length: sets * count }, (_, index) => {
          const role = roles[index % count];
          if (!role) return null;
          // Only the middle set is for screen readers and the keyboard; the rest are for scrolling.
          const spare = looping && Math.floor(index / count) !== MIDDLE;
          return (
            <li key={`${String(index)}-${role.id}`} className="deck-card" aria-hidden={spare}>
              <ThumbnailCard
                role={role}
                tabIndex={spare ? -1 : 0}
                label={t('lobby.lookCloser', { role: role.name[locale] })}
                onClick={() => {
                  setZoomed(role);
                }}
              />
            </li>
          );
        })}
      </ul>
      {zoomed && (
        <DetailedCard
          role={zoomed}
          onClose={() => {
            // Back to moving soon, not after the usual wait.
            lastTouch.current = 0;
            firstDelay.current = RESUME_MS;
            setZoomed(null);
          }}
        />
      )}
    </section>
  );
}
