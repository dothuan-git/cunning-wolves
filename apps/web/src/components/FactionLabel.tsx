import type { Team } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { FACTION_TEXT } from '../design/faction';
import { FactionEmblem } from './FactionEmblem';

export function FactionLabel({ team }: { team: Team }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-caption font-medium ${FACTION_TEXT[team]}`}
    >
      <FactionEmblem team={team} className="size-7" />
      {t(`faction.${team}`)}
    </span>
  );
}
