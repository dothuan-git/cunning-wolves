import { useEffect, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';

/** A short-lived message with an Undo action. Closes itself after `timeout` ms. */
export function UndoBar({
  message,
  onUndo,
  onClose,
  timeout = 5000,
}: {
  message: string;
  onUndo: () => void;
  onClose: () => void;
  timeout?: number;
}) {
  const { t } = useTranslation();
  // An effect event reads the latest onClose without restarting the timer on every render.
  const close = useEffectEvent(onClose);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      close();
    }, timeout);
    return () => {
      window.clearTimeout(timer);
    };
  }, [message, timeout]);
  return (
    <div
      aria-live="polite"
      className="undo-bar flex items-center justify-between gap-3 rounded-control bg-ink pl-4 text-control text-surface shadow-card"
    >
      <span className="min-w-0 py-2">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="min-h-12 min-w-12 shrink-0 rounded-control px-4 font-semibold text-brass hover:bg-surface/10"
      >
        {t('common.undo')}
      </button>
    </div>
  );
}
