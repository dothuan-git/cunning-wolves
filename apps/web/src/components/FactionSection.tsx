import type { Team } from '@werewolf/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FACTION_TEXT, FACTION_WASH } from '../design/faction';
import { FactionEmblem } from './FactionEmblem';

/**
 * One faction's block of role cards: its own pale wash, the emblem and name in the faction color,
 * how many players it has, and the cards three to a row. `children` are the list items.
 */
export function FactionSection({
  team,
  count,
  children,
}: {
  team: Team;
  /** Players in this faction: every copy of every role in it. */
  count: number;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby={`faction-${team}`}
      className={`grid gap-3 rounded-card p-3 ${FACTION_WASH[team]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id={`faction-${team}`}
          className={`flex min-w-0 items-center gap-2 font-display text-role font-semibold ${FACTION_TEXT[team]}`}
        >
          <FactionEmblem team={team} className="size-8" />
          {t(`faction.${team}`)}
        </h2>
        <p key={count} className="count-pop shrink-0 text-caption text-muted">
          {t('common.countPlayers', { count })}
        </p>
      </div>
      <ul className="grid grid-cols-3 gap-2">{children}</ul>
    </section>
  );
}
