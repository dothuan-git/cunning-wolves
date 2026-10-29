import type { MarkDef } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { Modal, ModalDone } from '../../components/Modal';
import { useLocale } from '../../i18n/useLocale';

/** Opens a player's marks; shows how many they carry. */
export function MarksButton({
  name,
  count,
  disabled = false,
  onOpen,
}: {
  name: string;
  count: number;
  disabled?: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={t('player.marks', { name, number: count })}
      disabled={disabled}
      onClick={onOpen}
      className={`press flex min-h-12 min-w-12 shrink-0 items-center justify-center gap-1 px-2 disabled:cursor-not-allowed disabled:opacity-45 ${count > 0 ? 'text-ink' : 'text-muted hover:text-ink'}`}
    >
      <Icon name="tag" />
      {count > 0 && (
        <span
          key={count}
          aria-hidden="true"
          className="count-pop text-caption font-medium tabular-nums"
        >
          {count}
        </span>
      )}
    </button>
  );
}

export interface MarkOption {
  mark: MarkDef;
  /** The phase this player got it in; undefined when they don't have it */
  since: string | undefined;
  /** Another player holding a single mark, who loses it if this player gets it */
  heldBy: string | undefined;
}

/** One player's marks as switches; each tap goes straight to the room. */
export function MarksSheet({
  name,
  options,
  disabled,
  onToggle,
  onClose,
}: {
  name: string;
  options: readonly MarkOption[];
  disabled: boolean;
  onToggle: (markId: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <Modal
      sheet
      title={t('narrator.marksTitle', { name })}
      footer={<ModalDone />}
      onClose={onClose}
    >
      <ul className="grid pb-2">
        {options.map(({ mark, since, heldBy }) => (
          <li key={mark.id}>
            <label className="flex min-h-12 items-center gap-3 py-1 text-control">
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-ink"
                checked={since !== undefined}
                disabled={disabled}
                onChange={() => {
                  onToggle(mark.id);
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block break-words">{mark.label[locale]}</span>
                {since !== undefined ? (
                  <span className="block text-caption text-muted">
                    {t('narrator.markSince', { phase: since })}
                  </span>
                ) : (
                  heldBy !== undefined && (
                    <span className="block text-caption text-muted">
                      {t('narrator.markHeldBy', { name: heldBy })}
                    </span>
                  )
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
