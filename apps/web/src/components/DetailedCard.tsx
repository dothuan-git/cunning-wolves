import type { Locale, PoolRole } from '@werewolf/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RoleFace } from './RoleFace';

// How long the closing animation runs before the dialog is removed.
const CLOSE_MS = 160;

/**
 * The detailed card: a role card enlarged in the middle of the phone, with its rule. Tapping the dimmed background or pressing
 * Escape closes it. The Close button is only for screen readers and keyboards. `count` shows how
 * many of this role are in the game.
 */
export function DetailedCard({
  role,
  count,
  onClose,
}: {
  role: PoolRole;
  count?: number;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'vi' ? 'vi' : 'en';
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  /** Plays the closing animation, then asks the screen to remove the dialog. */
  function requestClose() {
    if (closing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, CLOSE_MS);
  }

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      window.clearTimeout(closeTimer.current);
      dialog?.close();
      queueMicrotask(() => {
        if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={role.name[locale]}
      data-closing={closing}
      onCancel={(event) => {
        // Keep the dialog open while it animates out.
        event.preventDefault();
        requestClose();
      }}
      // The dialog is exactly as big as the card, so a click on it itself is a click on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
      className="detailed-dialog m-auto max-h-none max-w-none overflow-visible border-0 bg-transparent p-0 backdrop:bg-ink/70"
    >
      <div className="detailed-card relative overflow-hidden rounded-playing border border-field-border bg-ivory shadow-float">
        <RoleFace role={role} count={count} />
      </div>
      <button type="button" onClick={requestClose} className="sr-only">
        {t('common.close')}
      </button>
    </dialog>
  );
}
