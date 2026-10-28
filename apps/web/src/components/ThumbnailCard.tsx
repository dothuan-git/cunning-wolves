import type { PoolRole } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { RoleFace } from './RoleFace';

/**
 * A role card without its rule, as a button: art and the vertical name, and optionally how many of
 * the role are in the game. It fills the box it is given (keep that box 2:3) and scales its name,
 * padding and corners to the width, so it works in a row of three as well as a wide carousel. Tapping
 * it is meant to open the `DetailedCard`.
 *
 * With `onDecrease`, once `count` is above 0 a "−" button sits over the card's top right corner,
 * half outside it, to take one copy off. The name always keeps clear of it, so nothing moves when
 * it appears. Leave room around the card for it (the faction block's padding does).
 */
export function ThumbnailCard({
  role,
  count,
  label,
  onClick,
  tabIndex,
  disabled = false,
  onDecrease,
  decreaseLabel,
}: {
  role: PoolRole;
  count?: number;
  /** The button's accessible name; the card itself is only a picture. */
  label: string;
  onClick: () => void;
  tabIndex?: 0 | -1;
  disabled?: boolean;
  onDecrease?: () => void;
  decreaseLabel?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="thumbnail-card relative size-full"
      data-removable={onDecrease ? 'true' : undefined}
    >
      <button
        type="button"
        tabIndex={tabIndex}
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className="press press-card relative size-full overflow-hidden border border-field-border bg-ivory shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-village disabled:cursor-not-allowed disabled:opacity-45"
      >
        <RoleFace role={role} variant="thumbnail" count={count} />
      </button>
      {onDecrease && count !== undefined && count > 0 && (
        // The touch area is 48px and reaches only 16px past the card, so it stays inside the 20px
        // side padding of a sheet; the 24px ink circle in its corner is centered on the card's corner.
        <button
          type="button"
          aria-label={decreaseLabel ?? t('common.remove')}
          onClick={onDecrease}
          className="remove-pop press absolute -top-4 -right-4 z-20 flex size-12 items-start justify-end p-1"
        >
          <span className="decrease-dot grid size-6 place-items-center rounded-full bg-ink text-field shadow-card">
            <Icon name="minus" className="size-3.5" />
          </span>
        </button>
      )}
    </div>
  );
}
