import type { Team } from '@werewolf/shared';
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FACTION_TEXT, FACTION_WASH } from '../design/faction';
import { FactionEmblem } from './FactionEmblem';
import { Icon } from './Icon';

/**
 * One faction's block of role cards: its own pale wash, the emblem and name in the faction color,
 * how many players it has, and the cards three to a row. `children` are the list items.
 *
 * With `onToggle`, the faction's name becomes a button that folds the cards away and back; the
 * parent owns `collapsed`.
 */
export function FactionSection({
  team,
  count,
  countText,
  collapsed = false,
  onToggle,
  children,
}: {
  team: Team;
  /** Players in this faction: every copy of every role in it. */
  count: number;
  /** Replaces "N players" where the block counts something else. */
  countText?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const bodyId = useId();
  const name = (
    <>
      <FactionEmblem team={team} className="size-8" />
      {t(`faction.${team}`)}
    </>
  );
  return (
    <section
      aria-labelledby={`faction-${team}`}
      className={`grid rounded-card p-3 ${onToggle ? '' : 'gap-3'} ${FACTION_WASH[team]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id={`faction-${team}`}
          className={`min-w-0 font-display text-role font-semibold ${FACTION_TEXT[team]}`}
        >
          {onToggle ? (
            <button
              type="button"
              aria-expanded={!collapsed}
              aria-controls={bodyId}
              onClick={onToggle}
              className="press group flex min-h-12 min-w-0 items-center gap-2 text-left"
            >
              {name}
              <Icon
                name="arrow"
                className="size-4 rotate-180 group-aria-expanded:-rotate-90 motion-safe:transition-transform motion-safe:duration-200"
              />
            </button>
          ) : (
            <span className="flex items-center gap-2">{name}</span>
          )}
        </h2>
        <p key={count} className="count-pop shrink-0 text-caption text-muted">
          {countText ?? t('common.countPlayers', { count })}
        </p>
      </div>
      {onToggle ? (
        <div id={bodyId} className="fold" data-open={!collapsed || undefined}>
          {/* Room around the cards, with a matching negative margin, keeps focus rings from being
              clipped. Its vertical part sits on the inner box so a closed fold has no height. */}
          <div inert={collapsed} className="-mx-1 -mb-1 min-h-0 overflow-hidden px-1">
            <div className="pt-3 pb-1">
              <ul className="grid grid-cols-3 gap-2">{children}</ul>
            </div>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-3 gap-2">{children}</ul>
      )}
    </section>
  );
}
