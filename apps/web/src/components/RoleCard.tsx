import type { Locale, PoolRole } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { FactionLabel } from './FactionLabel';
import { RoleArtwork } from './RoleArtwork';
import seal from '../assets/tabletop/wolf-seal.png';

export function RoleCard({ role, revealed = true }: { role: PoolRole; revealed?: boolean }) {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'vi' ? 'vi' : 'en';
  return (
    <div
      data-revealed={revealed}
      className="role-card folio relative flex min-h-130 flex-col overflow-hidden p-5 shadow-card"
    >
      {revealed ? (
        <>
          <div className="relative flex min-h-56 flex-1">
            <div className="min-w-0 flex-1 pr-12">
              <RoleArtwork file={role.image} />
            </div>
            <h2
              className={`role-title absolute top-0 right-0 font-display text-heading font-semibold ${role.team === 'werewolf' ? 'text-werewolf' : 'text-village'}`}
            >
              {role.name[locale]}
            </h2>
          </div>
          <div className="mt-4 grid justify-items-center gap-2 border-t border-line pt-4 text-center">
            <FactionLabel team={role.team} />
            <p className="text-body">{role.rule[locale]}</p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center text-forest">
          <img src={seal} alt="" aria-hidden="true" className="size-20 object-contain" />
          <span className="font-display text-title font-bold">{t('app.name')}</span>
          <p className="max-w-60 text-control text-balance text-muted">{t('card.hiddenHint')}</p>
        </div>
      )}
    </div>
  );
}
