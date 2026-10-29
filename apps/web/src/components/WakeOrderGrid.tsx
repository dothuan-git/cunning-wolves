import type { Team } from '@werewolf/shared';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FACTION_TEXT, FACTION_WASH } from '../design/faction';

const COLUMNS = 4;
// A press only becomes a drag after the finger moves this far, so a tap stays a tap.
const DRAG_THRESHOLD = 6;

type WakeRole = { id: string; name: string; team: Team };

type Drag = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  /** Where the finger holds the tile, from its top left corner. */
  offsetX: number;
  offsetY: number;
  active: boolean;
};

function motionAllowed() {
  return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
}

/**
 * The wake order as tiles, four to a row, read left to right and top to bottom. A tile is dragged
 * to a new place (the others make way as it passes), or moved with the arrow keys.
 */
export function WakeOrderGrid({
  roles,
  onMove,
}: {
  roles: readonly WakeRole[];
  onMove: (from: number, to: number) => void;
}) {
  const { t } = useTranslation();
  const hintId = useId();
  const tiles = useRef(new Map<string, HTMLButtonElement>());
  const drag = useRef<Drag | null>(null);
  // Tile positions before a move, so the tiles that make way can slide from where they were.
  const before = useRef(new Map<string, DOMRect>());
  const refocus = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Keeps the dragged tile under the finger wherever the grid has put its slot.
  function place(current: Drag) {
    const element = tiles.current.get(current.id);
    if (!element) return;
    element.style.transform = '';
    const slot = element.getBoundingClientRect();
    const dx = current.x - current.offsetX - slot.left;
    const dy = current.y - current.offsetY - slot.top;
    element.style.transform = `translate(${String(dx)}px, ${String(dy)}px)`;
  }

  function move(id: string, to: number) {
    const from = roles.findIndex((role) => role.id === id);
    const target = Math.min(Math.max(to, 0), roles.length - 1);
    if (from < 0 || from === target) return false;
    before.current = new Map();
    for (const [otherId, element] of tiles.current) {
      if (otherId !== drag.current?.id)
        before.current.set(otherId, element.getBoundingClientRect());
    }
    onMove(from, target);
    return true;
  }

  useLayoutEffect(() => {
    if (drag.current?.active) place(drag.current);
    if (refocus.current !== null) {
      tiles.current.get(refocus.current)?.focus();
      refocus.current = null;
    }
    if (motionAllowed()) {
      for (const [id, previous] of before.current) {
        const element = tiles.current.get(id);
        if (!element) continue;
        const now = element.getBoundingClientRect();
        const dx = previous.left - now.left;
        const dy = previous.top - now.top;
        if (dx === 0 && dy === 0) continue;
        element.animate(
          [{ transform: `translate(${String(dx)}px, ${String(dy)}px)` }, { transform: 'none' }],
          { duration: 160, easing: 'ease-out' },
        );
      }
    }
    before.current = new Map();
  }, [roles]);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const box = event.currentTarget.getBoundingClientRect();
    drag.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - box.left,
      offsetY: event.clientY - box.top,
      active: false,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (current?.pointerId !== event.pointerId) return;
    current.x = event.clientX;
    current.y = event.clientY;
    if (!current.active) {
      const distance = Math.hypot(current.x - current.startX, current.y - current.startY);
      if (distance < DRAG_THRESHOLD) return;
      current.active = true;
      setDragging(current.id);
    }
    for (const [id, element] of tiles.current) {
      if (id === current.id) continue;
      // Hit-test the grid cell, not the tile: a tile sliding out of the way still looks like it is
      // where it was, which would send the dragged tile straight back.
      const box = (element.parentElement ?? element).getBoundingClientRect();
      const over =
        current.x >= box.left &&
        current.x <= box.right &&
        current.y >= box.top &&
        current.y <= box.bottom;
      if (
        over &&
        move(
          current.id,
          roles.findIndex((role) => role.id === id),
        )
      )
        return;
    }
    place(current);
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(null);
    const element = tiles.current.get(current.id);
    if (!element) return;
    const lifted = element.style.transform;
    element.style.transform = '';
    // The tile settles into its slot instead of jumping there.
    if (current.active && lifted !== '' && motionAllowed()) {
      element.animate([{ transform: lifted }, { transform: 'none' }], {
        duration: 160,
        easing: 'ease-out',
      });
    }
  }

  // Moving the dragged tile in the list drops its pointer capture; take it back so the drag goes on.
  function onLostPointerCapture(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer is already up (for example released outside the window), so end the drag.
      endDrag(event);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: string, index: number) {
    const step = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -COLUMNS,
      ArrowDown: COLUMNS,
    }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const to = Math.min(Math.max(index + step, 0), roles.length - 1);
    if (!move(id, to)) return;
    refocus.current = id;
    const role = roles[index];
    if (role) {
      setAnnouncement(
        t('narrator.wakeMoved', { role: role.name, position: to + 1, total: roles.length }),
      );
    }
  }

  return (
    <>
      <ol className="grid grid-cols-4 gap-2">
        {roles.map((role, index) => {
          const lifted = dragging === role.id;
          const look = `${FACTION_WASH[role.team]} ${FACTION_TEXT[role.team]}`;
          return (
            <li key={role.id} className="min-w-0">
              <button
                type="button"
                ref={(element) => {
                  if (element) tiles.current.set(role.id, element);
                  else tiles.current.delete(role.id);
                }}
                aria-label={t('narrator.wakeTile', {
                  role: role.name,
                  position: index + 1,
                  total: roles.length,
                })}
                aria-describedby={hintId}
                onPointerDown={(event) => {
                  onPointerDown(event, role.id);
                }}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onLostPointerCapture={onLostPointerCapture}
                onKeyDown={(event) => {
                  onKeyDown(event, role.id, index);
                }}
                className={`relative block min-h-12 w-full cursor-grab touch-none truncate rounded-control px-2 py-3 text-center font-display text-role font-semibold select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-village ${look} ${lifted ? 'z-10 scale-105 cursor-grabbing shadow-float' : ''} motion-safe:transition-[scale,box-shadow]`}
              >
                {role.name}
              </button>
            </li>
          );
        })}
      </ol>
      <p id={hintId} className="sr-only">
        {t('narrator.wakeHint')}
      </p>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
