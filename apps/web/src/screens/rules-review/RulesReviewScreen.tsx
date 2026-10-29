import type { PoolRole } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { DetailedCard } from '../../components/DetailedCard';
import { FactionSection } from '../../components/FactionSection';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ThumbnailCard } from '../../components/ThumbnailCard';
import { FACTION_ORDER } from '../../design/faction';
import { useLocale } from '../../i18n/useLocale';

export function RulesReviewScreen({
  roles,
  master,
}: {
  roles: readonly { role: PoolRole; count: number }[];
  /** The narrator's controls; players get "I've read the rules" instead */
  master?: { reconnecting: boolean; onBack: () => void; onStart: () => void };
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [read, setRead] = useState(false);
  const [viewing, setViewing] = useState<{ role: PoolRole; count: number } | null>(null);
  const groups = FACTION_ORDER.map((team) => ({
    team,
    cards: roles.filter(({ role }) => role.team === team),
  })).filter(({ cards }) => cards.length > 0);
  return (
    <ScreenLayout
      title={t('screens.rulesReview')}
      footer={
        master ? (
          <>
            <p role="status" className="text-center text-caption text-muted">
              {t(master.reconnecting ? 'setup.reconnecting' : 'rules.masterWaiting')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                disabled={master.reconnecting}
                className="press"
                onClick={master.onBack}
              >
                {t('rules.back')}
              </Button>
              <Button disabled={master.reconnecting} className="press" onClick={master.onStart}>
                {t('rules.startGame')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p role="status" className="text-center text-caption text-muted">
              {t('rules.waiting')}
            </p>
            <Button
              variant={read ? 'secondary' : 'primary'}
              disabled={read}
              className="press"
              onClick={() => {
                setRead(true);
              }}
            >
              <span key={String(read)} className="name-pop">
                {t(read ? 'common.done' : 'rules.understood')}
              </span>
            </Button>
          </>
        )
      }
    >
      <div className="grid gap-1">
        <p className="text-control text-muted">{t(master ? 'rules.masterIntro' : 'rules.intro')}</p>
        <p className="text-caption text-muted">{t('rules.hint')}</p>
      </div>
      {groups.map(({ team, cards }) => (
        <FactionSection
          key={team}
          team={team}
          count={cards.reduce((total, { count }) => total + count, 0)}
        >
          {cards.map(({ role, count }) => (
            <li key={role.id} className="aspect-2/3">
              <ThumbnailCard
                role={role}
                count={count}
                label={t('rules.lookCloser', { role: role.name[locale], count })}
                onClick={() => {
                  setViewing({ role, count });
                }}
              />
            </li>
          ))}
        </FactionSection>
      ))}
      {viewing !== null && (
        <DetailedCard
          role={viewing.role}
          count={viewing.count}
          onClose={() => {
            setViewing(null);
          }}
        />
      )}
    </ScreenLayout>
  );
}
