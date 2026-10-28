import type { Locale, PoolRole } from '@werewolf/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RoleFace } from '../../components/RoleFace';
import { CardZoom } from './CardZoom';

// The row is the cards repeated five times with the middle set on show, so it can be swiped
// either way without end: when it comes to rest, it jumps by whole sets back to the middle.
const COPIES = 5;
const MIDDLE = 2;
const ADVANCE_MS = 4000;
// After an enlarged card closes, the row moves on again this soon.
const RESUME_MS = 1500;
// After any touch, key press or scroll, the row stays still this long before it moves on again.
const IDLE_MS = 5000;
const WRAP_DELAY_MS = 150;

/**
 * The role cards in a sideways loop, so waiting players can look at them. It advances by itself
 * (never with reduced motion, and not while it is touched, hovered, focused or a card is
 * enlarged), can be swiped either way, and tapping a card enlarges it.
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
  const count = roles.length;
  const looping = count > 1;
  const sets = looping ? COPIES : 1;

  /** The distance from one card to the next, gap included. */
  function stride() {
    const first = deck.current?.children[0];
    const second = deck.current?.children[1];
    if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) return 0;
    return second.offsetLeft - first.offsetLeft;
  }

  /** The scroll position that puts card `index` in the middle of the row. */
  function centerOn(index: number) {
    const el = deck.current;
    const card = el?.children[index];
    if (!el || !(card instanceof HTMLElement)) return 0;
    return card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
  }

  function wrap() {
    const el = deck.current;
    const cycle = count * stride();
    if (!el || !looping || cycle <= 0) return;
    const origin = centerOn(MIDDLE * count);
    const target = origin + ((((el.scrollLeft - origin) % cycle) + cycle) % cycle);
    if (Math.abs(target - el.scrollLeft) > 1) el.scrollLeft = target;
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
        onPointerDown={touched}
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
              <button
                type="button"
                tabIndex={spare ? -1 : 0}
                aria-label={t('lobby.lookCloser', { role: role.name[locale] })}
                onClick={() => {
                  setZoomed(role);
                }}
                className="press press-card relative size-full overflow-hidden rounded-playing border border-field-border bg-ivory shadow-card"
              >
                <RoleFace role={role} compact />
              </button>
            </li>
          );
        })}
      </ul>
      {zoomed && (
        <CardZoom
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
