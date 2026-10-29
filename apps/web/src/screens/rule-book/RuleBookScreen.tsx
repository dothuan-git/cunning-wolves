import type { PoolRole, Team } from '@werewolf/shared';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { DetailedCard } from '../../components/DetailedCard';
import { FactionSection } from '../../components/FactionSection';
import { Icon } from '../../components/Icon';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ThumbnailCard } from '../../components/ThumbnailCard';
import { FACTION_ORDER } from '../../design/faction';
import { useLocale } from '../../i18n/useLocale';
import { filterRoles } from './filterRoles';

/** Every role in the pool, by faction, to read outside a game. */
export function RuleBookScreen({
  roles,
  onBack,
}: {
  roles: readonly PoolRole[];
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<PoolRole | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<Team>>(new Set());
  const searchId = useId();
  const shown = filterRoles(roles, search);
  const groups = FACTION_ORDER.map((team) => ({
    team,
    cards: shown.filter((role) => role.team === team),
  })).filter(({ cards }) => cards.length > 0);
  return (
    <ScreenLayout
      title={t('screens.ruleBook')}
      action={
        <Button variant="quiet" size="compact" onClick={onBack}>
          <Icon name="arrow" />
          {t('common.back')}
        </Button>
      }
    >
      {/* Stays in reach while the list scrolls under it, above the cards' names (z-10). */}
      <div className="sticky top-0 z-30 -mt-3 grid gap-2 bg-paper pt-3 pb-1">
        <label htmlFor={searchId} className="sr-only">
          {t('ruleBook.search')}
        </label>
        <input
          id={searchId}
          type="search"
          placeholder={t('ruleBook.search')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            // A match must never hide inside a folded faction.
            setCollapsed(new Set());
          }}
          className="min-h-12 w-full min-w-0 rounded-control border border-field-border bg-field px-3 py-2.5 font-sans text-body text-ink placeholder:text-muted"
        />
        <p role="status" className="text-caption text-muted tabular-nums">
          {shown.length === roles.length
            ? t('ruleBook.count', { count: roles.length })
            : t('ruleBook.shown', { shown: shown.length, count: roles.length })}
        </p>
      </div>
      {groups.length === 0 ? (
        <p className="name-pop py-6 text-center text-control text-muted">{t('ruleBook.noMatch')}</p>
      ) : (
        groups.map(({ team, cards }) => (
          <FactionSection
            key={team}
            team={team}
            count={cards.length}
            countText={t('ruleBook.count', { count: cards.length })}
            collapsed={collapsed.has(team)}
            onToggle={() => {
              const next = new Set(collapsed);
              if (!next.delete(team)) next.add(team);
              setCollapsed(next);
            }}
          >
            {cards.map((role) => (
              <li key={role.id} className="aspect-2/3">
                <ThumbnailCard
                  role={role}
                  label={t('ruleBook.lookCloser', { role: role.name[locale] })}
                  onClick={() => {
                    setViewing(role);
                  }}
                />
              </li>
            ))}
          </FactionSection>
        ))
      )}
      {viewing !== null && (
        <DetailedCard
          role={viewing}
          onClose={() => {
            setViewing(null);
          }}
        />
      )}
    </ScreenLayout>
  );
}
