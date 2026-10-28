import type { PoolRole, Team } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { DetailedCard } from '../../components/DetailedCard';
import { FactionEmblem } from '../../components/FactionEmblem';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ThumbnailCard } from '../../components/ThumbnailCard';
import { useLocale } from '../../i18n/useLocale';

const TEAMS: readonly Team[] = ['werewolf', 'village'];

export function RulesReviewScreen({
  roles,
}: {
  roles: readonly { role: PoolRole; count: number }[];
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [read, setRead] = useState(false);
  const [viewing, setViewing] = useState<{ role: PoolRole; count: number } | null>(null);
  const groups = TEAMS.map((team) => ({
    team,
    cards: roles.filter(({ role }) => role.team === team),
  })).filter(({ cards }) => cards.length > 0);
  return (
    <ScreenLayout
      title={t('screens.rulesReview')}
      footer={
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
      }
    >
      <div className="grid gap-1">
        <p className="text-control text-muted">{t('rules.intro')}</p>
        <p className="text-caption text-muted">{t('rules.hint')}</p>
      </div>
      {groups.map(({ team, cards }) => (
        <section
          key={team}
          aria-labelledby={`faction-${team}`}
          className={`grid gap-3 rounded-card p-3 ${team === 'werewolf' ? 'bg-werewolf-wash' : 'bg-village-wash'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id={`faction-${team}`}
              className={`flex min-w-0 items-center gap-2 font-display text-role font-semibold ${team === 'werewolf' ? 'text-werewolf' : 'text-village'}`}
            >
              <FactionEmblem team={team} className="size-8" />
              {t(`faction.${team}`)}
            </h2>
            <p className="shrink-0 text-caption text-muted">
              {t('common.countPlayers', {
                count: cards.reduce((total, { count }) => total + count, 0),
              })}
            </p>
          </div>
          <ul className="grid grid-cols-3 gap-2">
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
          </ul>
        </section>
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
