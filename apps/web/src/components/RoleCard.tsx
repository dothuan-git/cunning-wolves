import type { Locale, PoolRole } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { FactionLabel } from './FactionLabel';
import { RoleArtwork } from './RoleArtwork';
import cardBack from '../assets/art/card-back.webp';

export function RoleCard({ role, revealed = true }: { role: PoolRole; revealed?: boolean }) {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'vi' ? 'vi' : 'en';
  return (
    <div
      data-revealed={revealed}
      className="role-card panel relative flex flex-col overflow-hidden"
    >
      {revealed ? (
        <>
          <div className="aspect-4/5 bg-field">
            <RoleArtwork file={role.image} fit="cover" />
          </div>
          <div className="grid gap-2 p-5">
            <h2
              className={`font-display text-title font-semibold break-words ${role.team === 'werewolf' ? 'text-werewolf' : 'text-village'}`}
            >
              {role.name[locale]}
            </h2>
            <FactionLabel team={role.team} />
            <p className="text-body">{role.rule[locale]}</p>
          </div>
        </>
      ) : (
        <>
          <img src={cardBack} alt="" className="aspect-2/3 w-full object-cover" />
          <p className="p-4 text-control text-muted">{t('card.hiddenHint')}</p>
        </>
      )}
    </div>
  );
}
