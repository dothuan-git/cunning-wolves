import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';

const STEPS = ['narrator', 'night', 'morning', 'win'] as const;

/** A few lines on how a game goes, folded away until asked for. */
export function HowToPlay() {
  const { t } = useTranslation();
  const bodyId = useId();
  const [open, setOpen] = useState(false);
  return (
    <section className="panel min-w-0 overflow-hidden">
      <h2 className="font-display text-role font-semibold">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => {
            setOpen(!open);
          }}
          className="press press-card group flex min-h-12 w-full items-center gap-2 px-4 text-left"
        >
          {t('ruleBook.howTitle')}
          <Icon
            name="arrow"
            className="ml-auto size-4 rotate-180 group-aria-expanded:-rotate-90 motion-safe:transition-transform motion-safe:duration-200"
          />
        </button>
      </h2>
      <div id={bodyId} className="fold" data-open={open || undefined}>
        <div inert={!open} className="min-h-0 overflow-hidden">
          <ol className="grid list-decimal gap-2 pr-4 pb-4 pl-9 text-control">
            {STEPS.map((step) => (
              <li key={step}>{t(`ruleBook.how.${step}`)}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
