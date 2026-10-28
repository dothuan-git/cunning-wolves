import { useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';

function isHoldKey(event: KeyboardEvent) {
  return event.key === 'Enter' || event.key === ' ';
}

/**
 * Tracks a press-and-hold by pointer, touch, or Enter/Space. Releasing, a cancelled
 * pointer (for example a scroll), or losing focus ends the hold.
 */
export function useHold(onChange?: (holding: boolean) => void) {
  const [holding, setHolding] = useState(false);
  function update(next: boolean) {
    if (next === holding) return;
    setHolding(next);
    onChange?.(next);
  }
  const end = () => {
    update(false);
  };
  return {
    holding,
    handlers: {
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(true);
      },
      onPointerUp: end,
      onPointerCancel: end,
      onLostPointerCapture: end,
      onBlur: end,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (!isHoldKey(event)) return;
        event.preventDefault();
        if (!event.repeat) update(true);
      },
      onKeyUp: (event: KeyboardEvent<HTMLElement>) => {
        if (!isHoldKey(event)) return;
        event.preventDefault();
        end();
      },
      // A long press would otherwise open the phone's context menu.
      onContextMenu: (event: MouseEvent<HTMLElement>) => {
        event.preventDefault();
      },
    },
  };
}
