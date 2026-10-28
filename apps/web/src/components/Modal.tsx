import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Icon } from './Icon';
import { ScrollArea } from './ScrollArea';

// How long the closing animation runs before the dialog is removed.
const CLOSE_MS = 160;

/** Closes the modal it sits in, with its closing animation. */
const CloseContext = createContext<() => void>(() => undefined);

/** A full-width Done button for the foot of a modal; it closes with the animation. */
export function ModalDone() {
  const { t } = useTranslation();
  const close = useContext(CloseContext);
  return (
    <Button className="press w-full" onClick={close}>
      {t('common.done')}
    </Button>
  );
}

/**
 * A sheet or dialog over the screen. It slides in and out. Tapping the dimmed background, pressing
 * Escape or the Close button dismisses it. Only its body scrolls (a `ScrollArea`); the title and
 * `footer` stay put. Put `ModalDone` in the footer for a Done button that also plays the closing
 * animation. `steady` sizes it to its content, at most 75% of the screen, and keeps that
 * height while the content shrinks (a search), so it never jumps.
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
  sheet = false,
  steady = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  sheet?: boolean;
  steady?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { t } = useTranslation();
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
    // Hold the opening height: a search that hides cards must not make the sheet jump down.
    if (dialog && steady) dialog.style.minHeight = `${String(dialog.offsetHeight)}px`;
    return () => {
      window.clearTimeout(closeTimer.current);
      dialog?.close();
      queueMicrotask(() => {
        if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      });
    };
  }, [steady]);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        // Keep the dialog open while it animates out.
        event.preventDefault();
        requestClose();
      }}
      // A tap on the dimmed background lands on the dialog itself, outside its box.
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        const inside =
          event.clientX >= box.left &&
          event.clientX <= box.right &&
          event.clientY >= box.top &&
          event.clientY <= box.bottom;
        if (!inside) requestClose();
      }}
      aria-labelledby={titleId}
      data-closing={closing}
      className={`modal ${sheet ? 'mt-auto mb-0 max-w-md pb-8' : 'my-auto max-w-sm'} ${steady ? 'modal-steady' : 'max-h-[85dvh]'} mx-auto w-full flex-col overflow-hidden rounded-card bg-field p-5 text-ink shadow-float backdrop:bg-ink/40 open:flex`}
    >
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <h2 id={titleId} className="font-display text-heading font-semibold">
          {title}
        </h2>
        <Button variant="quiet" onClick={requestClose} aria-label={t('common.close')} size="icon">
          <Icon name="close" />
        </Button>
      </div>
      <CloseContext value={requestClose}>
        {/* Side padding inside the scroll keeps focus rings and corner buttons from being clipped. */}
        <ScrollArea className="-mx-5 min-h-0 flex-1 px-5">{children}</ScrollArea>
        {footer && <div className="shrink-0 pt-4">{footer}</div>}
      </CloseContext>
    </dialog>
  );
}
