import { useEffect, useEffectEvent, useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { useHold } from './useHold';

/** A primary action that fires only after a deliberate press and hold. */
export function HoldButton({
  children,
  onComplete,
  duration = 800,
}: {
  children: ReactNode;
  onComplete: () => void;
  duration?: number;
}) {
  const { t } = useTranslation();
  const hintId = useId();
  const { holding, handlers } = useHold();
  const complete = useEffectEvent(onComplete);
  useEffect(() => {
    if (!holding) return;
    const timer = window.setTimeout(() => {
      complete();
    }, duration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [holding, duration]);
  return (
    <>
      <Button
        {...handlers}
        data-holding={holding}
        aria-describedby={hintId}
        className="hold-button relative overflow-hidden"
        style={{ '--hold-duration': `${String(duration)}ms` } as CSSProperties}
      >
        <span aria-hidden="true" className="hold-fill bg-field/25 motion-reduce:hidden" />
        <span
          className={`relative inline-flex items-center gap-2 ${holding ? 'motion-reduce:hidden' : ''}`}
        >
          {children}
        </span>
        {holding && (
          <span className="relative hidden motion-reduce:inline">{t('common.keepHolding')}</span>
        )}
      </Button>
      <span id={hintId} className="sr-only">
        {t('common.holdHint')}
      </span>
    </>
  );
}
