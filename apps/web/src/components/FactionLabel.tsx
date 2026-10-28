import type { Team } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';

export function FactionLabel({ team }: { team: Team }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-caption font-medium ${team === 'werewolf' ? 'text-werewolf' : 'text-village'}`}
    >
      <span className="size-2 bg-current" aria-hidden="true" />
      {t(`faction.${team}`)}
    </span>
  );
}
