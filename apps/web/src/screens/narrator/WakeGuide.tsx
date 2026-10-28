import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { RoleArtwork } from '../../components/RoleArtwork';

/** Night script: the line the narrator reads aloud. It guides the narrator; it changes no room state. */
export function WakeGuide({
  roles,
  step,
  onStep,
}: {
  /** The waking roles, in this room's wake order. */
  roles: readonly { id: string; name: string; image: string }[];
  step: number;
  onStep: (delta: number) => void;
}) {
  const { t } = useTranslation();
  const role = roles[step];
  return (
    <section aria-label={t('narrator.wakeGuide')} className="grid gap-3">
      <div aria-live="polite">
        {role === undefined ? (
          <>
            <p className="font-display text-title font-semibold">{t('narrator.wakeDone')}</p>
            <p className="mt-1 text-body text-muted">{t('narrator.wakeDoneHint')}</p>
          </>
        ) : (
          <>
            <p className="text-caption text-muted">
              {t('narrator.wakeStep', { current: step + 1, total: roles.length })}
            </p>
            {/* The role's card art sits inside the sentence, at the height of its letters. */}
            <p className="font-display text-title font-semibold break-words">
              <span className="wake-art mr-2 inline-block overflow-hidden align-baseline">
                <RoleArtwork file={role.image} fit="bust" />
              </span>
              {t('narrator.wakes', { role: role.name })}
            </p>
          </>
        )}
      </div>
      <ol className="flex flex-wrap gap-x-3 gap-y-1 text-control">
        {roles.map((item, index) => (
          <li
            key={item.id}
            aria-current={index === step ? 'step' : undefined}
            className={
              index === step
                ? 'font-medium text-ink underline decoration-2 underline-offset-4'
                : index < step
                  ? 'text-muted line-through'
                  : 'text-muted'
            }
          >
            {item.name}
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          aria-label={t('narrator.wakePrevious')}
          disabled={step === 0}
          onClick={() => {
            onStep(-1);
          }}
        >
          <Icon name="arrow" />
        </Button>
        {role !== undefined && (
          <Button
            variant="secondary"
            className="flex-1"
            aria-label={t('narrator.wakeNextLabel')}
            onClick={() => {
              onStep(1);
            }}
          >
            {t('narrator.wakeNext')}
            <Icon name="arrow" className="size-4 rotate-180" />
          </Button>
        )}
      </div>
    </section>
  );
}
