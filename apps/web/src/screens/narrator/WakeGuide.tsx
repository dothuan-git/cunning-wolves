import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';

/** Night script: names the role to wake now. It guides the narrator; it changes no room state. */
export function WakeGuide({
  roles,
  step,
  onStep,
}: {
  /** Names of the waking roles, in this room's wake order. */
  roles: readonly string[];
  step: number;
  onStep: (delta: number) => void;
}) {
  const { t } = useTranslation();
  const role = roles[step];
  return (
    <section
      aria-label={t('narrator.wakeGuide')}
      className="flex items-center gap-1 rounded-card bg-night py-1 pr-1 pl-4 text-surface shadow-card ring-1 ring-brass ring-inset"
    >
      <div aria-live="polite" className="min-w-0 flex-1 py-2">
        {role === undefined ? (
          <>
            <p className="text-control font-semibold">{t('narrator.wakeDone')}</p>
            <p className="text-caption text-surface/75">{t('narrator.wakeDoneHint')}</p>
          </>
        ) : (
          <>
            <p className="text-caption text-surface/75">
              {t('narrator.wakeStep', { current: step + 1, total: roles.length })}
            </p>
            <p className="text-role font-semibold break-words">{t('narrator.wakes', { role })}</p>
          </>
        )}
      </div>
      <button
        type="button"
        aria-label={t('narrator.wakePrevious')}
        disabled={step === 0}
        onClick={() => {
          onStep(-1);
        }}
        className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-control text-surface/80 hover:text-surface disabled:opacity-35"
      >
        <Icon name="arrow" />
      </button>
      {role !== undefined && (
        <button
          type="button"
          aria-label={t('narrator.wakeNextLabel')}
          onClick={() => {
            onStep(1);
          }}
          className="inline-flex min-h-12 items-center gap-1 rounded-control bg-brass px-4 text-control font-semibold text-ink hover:bg-brass/90"
        >
          {t('narrator.wakeNext')}
          <Icon name="arrow" className="size-4 rotate-180" />
        </button>
      )}
    </section>
  );
}
