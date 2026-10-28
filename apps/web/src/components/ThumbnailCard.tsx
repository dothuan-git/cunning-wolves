import type { PoolRole } from '@werewolf/shared';
import { RoleFace } from './RoleFace';

/**
 * A role card without its rule, as a button: art and the vertical name, and optionally how many of
 * the role are in the game. It fills the box it is given (keep that box 2:3) and scales its name,
 * padding and corners to the width, so it works in a row of three as well as a wide carousel. Tapping
 * it is meant to open the `DetailedCard`.
 */
export function ThumbnailCard({
  role,
  count,
  label,
  onClick,
  tabIndex,
}: {
  role: PoolRole;
  count?: number;
  /** The button's accessible name; the card itself is only a picture. */
  label: string;
  onClick: () => void;
  tabIndex?: 0 | -1;
}) {
  return (
    <div className="thumbnail-card size-full">
      <button
        type="button"
        tabIndex={tabIndex}
        aria-label={label}
        onClick={onClick}
        className="press press-card relative size-full overflow-hidden border border-field-border bg-ivory shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-village"
      >
        <RoleFace role={role} variant="thumbnail" count={count} />
      </button>
    </div>
  );
}
