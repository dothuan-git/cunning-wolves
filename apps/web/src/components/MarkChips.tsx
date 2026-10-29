import type { MarkDef } from '@werewolf/shared';
import { markChipClass } from '../design/markTone';
import { useLeaving } from '../design/useLeaving';
import { useLocale } from '../i18n/useLocale';

// As long as the `chip-out` animation in index.css.
const LEAVE_MS = 160;

/**
 * A player's marks as small chips, each in its mark's ink. A new chip pops in and a removed one
 * shrinks away. With `fold`, the row eases its height open for the first chip and shut after the
 * last, so the rows below slide instead of jumping.
 */
export function MarkChips({
  marks,
  fold = false,
  className = '',
}: {
  marks: readonly MarkDef[];
  fold?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const shown = useLeaving(marks, (mark) => mark.id, LEAVE_MS);
  const list =
    shown.length === 0 ? null : (
      <ul className={`flex flex-wrap gap-1.5 ${className}`}>
        {shown.map(({ item: mark, key, leaving }) => (
          <li
            key={key}
            aria-hidden={leaving || undefined}
            className={`${leaving ? 'chip-out' : 'chip-in'} rounded-full px-2.5 py-0.5 text-caption font-medium ${markChipClass(mark.id)}`}
          >
            {mark.label[locale]}
          </li>
        ))}
      </ul>
    );
  if (!fold) return list;
  return (
    <div className="fold" data-open={marks.length > 0 || undefined}>
      <div className="min-h-0 overflow-hidden">{list}</div>
    </div>
  );
}
