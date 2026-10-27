import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Icon } from './Icon';

export function Modal({
  title,
  onClose,
  children,
  sheet = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  sheet?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { t } = useTranslation();
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      queueMicrotask(() => {
        if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      aria-labelledby={titleId}
      className={`${sheet ? 'mt-auto mb-0 max-w-md rounded-t-2xl rounded-b-none pb-8' : 'my-auto max-w-sm rounded-card'} mx-auto max-h-[85dvh] w-full overflow-y-auto border border-line bg-surface p-5 text-ink shadow-card backdrop:bg-ink/30`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={titleId} className="font-display text-heading font-semibold">
          {title}
        </h2>
        <Button variant="quiet" onClick={onClose} aria-label={t('common.close')} size="icon">
          <Icon name="close" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
