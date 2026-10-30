import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { DeleteRoomButton } from '../../components/DeleteRoomButton';
import { FactionEmblem } from '../../components/FactionEmblem';
import { Icon } from '../../components/Icon';
import { PlayerChip } from '../../components/PlayerChip';
import { RoleBanner } from '../../components/RoleBanner';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Tabs } from '../../components/Tabs';
import { FACTION_ORDER, FACTION_TEXT, FACTION_WASH } from '../../design/faction';
import { useLocale } from '../../i18n/useLocale';
import type { JournalPhase, Phase, RevealedPlayerItem } from '../types';
import { PhasePanel } from './PhasePanel';

export function SummaryScreen({
  players,
  journal,
  nights,
  roomName,
  initialTab = 'roles',
  onPlayAgain,
  onHome,
  onDelete,
  deleteFailed = false,
}: {
  players: readonly RevealedPlayerItem[];
  /** Phases in order; phases with nothing recorded are left out. */
  journal: readonly JournalPhase[];
  nights: number;
  roomName: string;
  initialTab?: 'roles' | 'notes';
  /** The narrator's button; players only get Home */
  onPlayAgain?: () => void;
  onHome: () => void;
  /** The narrator's Delete room; left out for players */
  onDelete?: () => void;
  deleteFailed?: boolean;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const phaseLabel = (phase: Phase) =>
    t(phase.kind === 'night' ? 'common.night' : 'common.morning', { number: phase.number });
  // A player restored and killed again counts from the last time they died.
  const diedIn = new Map<string, Phase>();
  for (const { phase, deaths } of journal) {
    for (const player of deaths) diedIn.set(player.id, phase);
  }
  const roleOf = new Map(players.map((player) => [player.id, player.role]));
  return (
    <ScreenLayout
      title={t('screens.summary')}
      footer={
        onPlayAgain ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={onHome}>
              {t('common.home')}
            </Button>
            <Button onClick={onPlayAgain}>{t('summary.playAgain')}</Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={onHome}>
            {t('common.home')}
          </Button>
        )
      }
    >
      <section className="panel p-4">
        <h2 className="font-display text-title font-semibold break-words">{roomName}</h2>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="person" className="size-4" />
            {t('common.countPlayers', { count: players.length })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="moon" className="size-4" />
            {t('summary.nightCount', { count: nights })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="tombstone" className="size-4" />
            {t('summary.deadCount', { count: diedIn.size })}
          </span>
        </div>
      </section>
      <Tabs
        label={t('summary.sections')}
        initialId={initialTab}
        items={[
          {
            id: 'roles',
            label: t('summary.rolesTab'),
            content: (
              <div className="stagger grid gap-3">
                <p className="text-caption text-muted">{t('summary.revealedNotice')}</p>
                {/* The reveal answers "who were the wolves?" first, so each faction is its own list. */}
                {FACTION_ORDER.map((team) => {
                  const members = players.filter((player) => player.role.team === team);
                  if (members.length === 0) return null;
                  return (
                    <section
                      key={team}
                      aria-labelledby={`summary-${team}`}
                      className="panel min-w-0 overflow-hidden"
                    >
                      <div
                        className={`flex items-center justify-between gap-3 px-3.5 py-2 ${FACTION_WASH[team]}`}
                      >
                        <h3
                          id={`summary-${team}`}
                          className={`flex min-w-0 items-center gap-2.5 font-display text-role font-semibold ${FACTION_TEXT[team]}`}
                        >
                          <FactionEmblem team={team} className="size-10 shrink-0" />
                          {t(`faction.${team}`)}
                        </h3>
                        <p className="shrink-0 text-caption text-muted tabular-nums">
                          {t('summary.aliveOfTotal', {
                            alive: members.filter((member) => !diedIn.has(member.id)).length,
                            total: members.length,
                          })}
                        </p>
                      </div>
                      <ul className="divide-y divide-line">
                        {members.map((player) => {
                          const death = diedIn.get(player.id);
                          return (
                            <li
                              key={player.id}
                              className="flex min-h-16 items-center justify-between gap-3 px-3.5 py-2"
                            >
                              <div className="min-w-0">
                                <PlayerChip
                                  name={player.name}
                                  dead={death !== undefined}
                                  detail={
                                    death && t('summary.diedIn', { phase: phaseLabel(death) })
                                  }
                                  large
                                />
                              </div>
                              <span className="min-w-0 shrink-0 text-right">
                                <RoleBanner
                                  name={player.role.name[locale]}
                                  team={player.role.team}
                                  image={player.role.image}
                                  dead={death !== undefined}
                                />
                                {player.newRole && (
                                  <span
                                    className={`mt-0.5 block text-caption font-medium ${FACTION_TEXT[player.newRole.team]}`}
                                  >
                                    {t('summary.newRole', { role: player.newRole.name[locale] })}
                                  </span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            ),
          },
          {
            id: 'notes',
            label: t('summary.notesTab'),
            content:
              journal.length === 0 ? (
                <p className="panel p-3.5 text-body text-muted">{t('summary.noNotes')}</p>
              ) : (
                // The whole story reads top to bottom; nights sit on ink so they stand apart from mornings.
                <ol className="stagger grid gap-2.5">
                  {journal.map(({ phase, notes, deaths, newRoles }) => {
                    const night = phase.kind === 'night';
                    return (
                      <PhasePanel
                        key={`${phase.kind}-${String(phase.number)}`}
                        title={phaseLabel(phase)}
                        night={night}
                      >
                        <ul className="divide-y divide-line">
                          {notes.map((note) => {
                            const role = roleOf.get(note.id);
                            return (
                              <li key={note.id} className="px-3.5 py-2.5">
                                <p className="flex flex-wrap items-baseline gap-x-2">
                                  <span className="font-display text-role font-semibold break-words">
                                    {note.name}
                                  </span>
                                  {role && (
                                    <span
                                      className={`text-caption font-medium ${FACTION_TEXT[role.team]}`}
                                    >
                                      {role.name[locale]}
                                    </span>
                                  )}
                                </p>
                                <p className="mt-0.5 text-body break-words whitespace-pre-wrap">
                                  {note.text}
                                </p>
                              </li>
                            );
                          })}
                          {deaths.map((player) => (
                            <li
                              key={`death-${player.id}`}
                              className="flex min-h-12 items-center px-3.5 py-2"
                            >
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-line px-2.5 py-0.5 text-caption font-medium">
                                <Icon name="tombstone" className="size-3.5" />
                                {t('summary.died', { name: player.name })}
                              </span>
                            </li>
                          ))}
                          {newRoles.map((changed) => (
                            <li
                              key={`role-${changed.id}`}
                              className="flex min-h-12 items-center px-3.5 py-2"
                            >
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-field px-2.5 py-0.5 text-caption font-medium">
                                <Icon name="swap" className="size-3.5" />
                                {t('summary.nowPlays', {
                                  name: changed.name,
                                  role: changed.role.name[locale],
                                })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </PhasePanel>
                    );
                  })}
                </ol>
              ),
          },
        ]}
      />
      {onDelete && <DeleteRoomButton failed={deleteFailed} onDelete={onDelete} />}
    </ScreenLayout>
  );
}
