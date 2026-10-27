import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { PlayerChip } from '../../components/PlayerChip';
import { RoleArtwork } from '../../components/RoleArtwork';
import { RoleBanner } from '../../components/RoleBanner';
import { SceneBanner } from '../../components/SceneBanner';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Tabs } from '../../components/Tabs';
import { useLocale } from '../../i18n/useLocale';
import type { JournalPhase, RevealedPlayerItem } from '../types';

export function SummaryScreen({
  players,
  journal,
  nights,
  roomName,
  initialTab = 'roles',
  onPlayAgain,
  onHome,
}: {
  players: readonly RevealedPlayerItem[];
  /** Phases in order; phases with nothing recorded are left out. */
  journal: readonly JournalPhase[];
  nights: number;
  roomName: string;
  initialTab?: 'roles' | 'notes';
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <ScreenLayout
      title={t('screens.summary')}
      footer={
        <>
          <Button onClick={onPlayAgain}>{t('summary.playAgain')}</Button>
          <Button variant="secondary" onClick={onHome}>
            {t('common.home')}
          </Button>
        </>
      }
    >
      <SceneBanner className="folio p-3.5 pb-14">
        <h2 className="font-display text-heading font-semibold">{roomName}</h2>
        <div className="mt-1 flex flex-wrap gap-4 text-caption text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="person" className="size-4" />
            {t('common.countPlayers', { count: players.length })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="moon" className="size-4" />
            {t('summary.nightCount', { count: nights })}
          </span>
        </div>
      </SceneBanner>
      <Tabs
        label={t('summary.sections')}
        initialId={initialTab}
        items={[
          {
            id: 'roles',
            label: t('summary.rolesTab'),
            content: (
              <div className="grid gap-2">
                <p className="px-0.5 text-caption text-muted">{t('summary.revealedNotice')}</p>
                <ul className="folio divide-y divide-line">
                  {players.map((player) => (
                    <li
                      key={player.id}
                      className="grid min-h-13 grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-3.5 py-2"
                    >
                      <div className="size-9 rounded-full bg-folio p-1 ring-1 ring-edge ring-inset">
                        <RoleArtwork file={player.role.image} />
                      </div>
                      <PlayerChip name={player.name} />
                      <span className="min-w-0">
                        <RoleBanner name={player.role.name[locale]} team={player.role.team} />
                        <span className="sr-only">, {t(`faction.${player.role.team}`)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          },
          {
            id: 'notes',
            label: t('summary.notesTab'),
            content:
              journal.length === 0 ? (
                <div className="folio p-3.5 text-control text-muted">{t('summary.noNotes')}</div>
              ) : (
                <div className="grid gap-3">
                  {journal.map(({ phase, notes, deaths }, index) => (
                    <details
                      key={`${phase.kind}-${String(phase.number)}`}
                      className="group folio px-3.5"
                      open={index === 0}
                    >
                      <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-3 text-role font-semibold">
                        <Icon
                          name={phase.kind === 'night' ? 'moon' : 'sun'}
                          className="size-4 text-brass"
                        />
                        {t(phase.kind === 'night' ? 'common.night' : 'common.morning', {
                          number: phase.number,
                        })}
                        <Icon
                          name="arrow"
                          className="ml-auto size-4 rotate-180 text-muted group-open:-rotate-90 motion-safe:transition-transform"
                        />
                      </summary>
                      <ul className="grid gap-3 pb-4 text-control">
                        {notes.map((note) => (
                          <li key={note.id}>
                            <span className="block text-name font-semibold">{note.name}</span>
                            <span className="block break-words whitespace-pre-wrap text-muted">
                              {note.text}
                            </span>
                          </li>
                        ))}
                        {deaths.map((player) => (
                          <li
                            key={`death-${player.id}`}
                            className="flex items-center gap-2 text-muted"
                          >
                            <Icon name="tombstone" className="size-4" />
                            {t('summary.died', { name: player.name })}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              ),
          },
        ]}
      />
    </ScreenLayout>
  );
}
