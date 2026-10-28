import { useEffect, useEffectEvent, useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { useHold } from './useHold';

/**
 * An action that fires only after a deliberate press and hold. `iconOnly` makes it a square
 * button whose accessible name is `label`.
 */
export function HoldButton({
  children,
  onComplete,
  duration = 800,
  variant = 'primary',
  iconOnly = false,
  label,
}: {
  children: ReactNode;
  onComplete: () => void;
  duration?: number;
  variant?: 'primary' | 'danger';
  iconOnly?: boolean;
  label?: string;
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
        variant={variant}
        size={iconOnly ? 'icon' : 'normal'}
        aria-label={label}
        data-holding={holding}
        aria-describedby={hintId}
        className="hold-button relative overflow-hidden"
        style={{ '--hold-duration': `${String(duration)}ms` } as CSSProperties}
      >
        <span
          aria-hidden="true"
          className={`hold-fill motion-reduce:hidden ${variant === 'danger' ? 'bg-danger/25' : 'bg-field/25'}`}
        />
        <span
          className={`relative inline-flex items-center gap-2 ${holding && !iconOnly ? 'motion-reduce:hidden' : ''}`}
        >
          {children}
        </span>
        {holding && !iconOnly && (
          <span className="relative hidden motion-reduce:inline">{t('common.keepHolding')}</span>
        )}
      </Button>
      <span id={hintId} className="sr-only">
        {t('common.holdHint')}
      </span>
    </>
  );
}
