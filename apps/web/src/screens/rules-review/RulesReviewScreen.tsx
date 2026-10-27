import type { PoolRole } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { FactionLabel } from '../../components/FactionLabel';
import { RoleArtwork } from '../../components/RoleArtwork';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useLocale } from '../../i18n/useLocale';

export function RulesReviewScreen({
  roles,
}: {
  roles: readonly { role: PoolRole; count: number }[];
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [read, setRead] = useState(false);
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
            onClick={() => {
              setRead(true);
            }}
          >
            {t(read ? 'common.done' : 'rules.understood')}
          </Button>
        </>
      }
    >
      <p className="text-control text-muted">{t('rules.intro')}</p>
      <ul className="grid gap-3">
        {roles.map(({ role, count }) => (
          <li key={role.id} className="folio grid grid-cols-[2.5rem_1fr] gap-3 p-3.5">
            <div className="size-10 rounded-full bg-folio p-1 ring-1 ring-edge ring-inset">
              <RoleArtwork file={role.image} />
            </div>
            <div className="grid gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <h2
                  className={`font-display text-role font-semibold ${role.team === 'werewolf' ? 'text-werewolf' : 'text-village'}`}
                >
                  {role.name[locale]}
                </h2>
                <FactionLabel team={role.team} />
              </div>
              <p className="text-control leading-relaxed">{role.rule[locale]}</p>
              <p className="text-caption text-muted">{t('rules.copies', { count })}</p>
            </div>
          </li>
        ))}
      </ul>
    </ScreenLayout>
  );
}
