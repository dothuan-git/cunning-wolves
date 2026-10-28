import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { HoldButton } from '../../components/HoldButton';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { PlayerStatusControl } from '../../components/PlayerStatusControl';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { PlayerChip } from '../../components/PlayerChip';
import { RoleBanner } from '../../components/RoleBanner';
import { ScreenLayout } from '../../components/ScreenLayout';
import { WakeOrderSetting } from '../../components/WakeOrderSetting';
import { NoteField } from '../../components/TextField';
import { useLocale } from '../../i18n/useLocale';
import type { Phase, PlayerListItem, RoleGroupItem } from '../types';
import { playerTimeline } from './phase';

export function NarratorScreen({
  groups,
  phase,
  notes,
  deaths,
  onPlayerNote,
  onTogglePlayer,
  onEndPhase,
  onFinish,
}: {
  groups: readonly RoleGroupItem[];
  phase: Phase;
  /** Night number → player id → note. */
  notes: Readonly<Record<number, Readonly<Record<string, string>>>>;
  /** Player id → the phase the narrator marked them dead in. */
  deaths: Readonly<Record<string, Phase>>;
  onPlayerNote: (night: number, playerId: string, text: string) => void;
  onTogglePlayer: (playerId: string) => void;
  onEndPhase: () => void;
  onFinish: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [showTools, setShowTools] = useState(false);
  const [orderedGroups, setOrderedGroups] = useState(() =>
    groups.filter((group) => group.role.defaultWakeOrder !== null),
  );
  const [editing, setEditing] = useState<{ playerId: string; night: number } | null>(null);
  const [seconds, setSeconds] = useState(120);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState(false);
  useEffect(() => {
    if (!running || seconds === 0) return;
    const interval = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [running, seconds]);

  // Roles that never wake still need a place in the list so they can be marked dead.
  const restingGroups = groups.filter((group) => group.role.defaultWakeOrder === null);
  const alive = groups
    .flatMap((group) => group.players)
    .filter((player) => !(player.id in deaths)).length;
  const isNight = phase.kind === 'night';

  function phaseLabel(value: Phase) {
    return t(value.kind === 'night' ? 'common.night' : 'common.morning', { number: value.number });
  }

  function renderPlayer(player: PlayerListItem) {
    const death = deaths[player.id];
    const dead = death !== undefined;
    const playerNotes: Record<number, string> = {};
    for (const [night, byPlayer] of Object.entries(notes)) {
      const text = byPlayer[player.id];
      if (text !== undefined) playerNotes[Number(night)] = text;
    }
    const entries = playerTimeline({
      notes: playerNotes,
      death,
      current: phase,
      editingNight: editing?.playerId === player.id ? editing.night : undefined,
    });
    // Phase labels stay small and grey so the player's name leads the row.
    const labelClass = 'min-w-11 shrink-0 text-caption whitespace-nowrap text-muted';
    return (
      <li key={player.id} className="px-3.5 pb-1.5">
        <div className="flex min-h-12 items-center justify-between gap-2">
          <PlayerChip name={player.name} dead={dead} large />
          <PlayerStatusControl
            name={player.name}
            dead={dead}
            onToggle={() => {
              onTogglePlayer(player.id);
            }}
          />
        </div>
        {entries.length > 0 && (
          // The top padding keeps the first note's overlap off the status pill above it.
          <ol aria-label={t('narrator.history', { name: player.name })} className="pt-1">
            {entries.map((entry) => {
              if (entry.type === 'death') {
                return (
                  <li
                    key="death"
                    className="name-pop flex min-h-8 items-center gap-3 text-body text-muted"
                  >
                    <span className={labelClass}>{phaseLabel(entry.phase)}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="tombstone" className="size-4" />
                      {t('narrator.died')}
                    </span>
                  </li>
                );
              }
              const night = { kind: 'night', number: entry.night } as const;
              if (entry.type === 'input') {
                return (
                  <li
                    key={`night-${String(entry.night)}`}
                    className="name-pop flex items-start gap-3 py-1"
                  >
                    <span aria-hidden="true" className={`${labelClass} pt-2.5`}>
                      {phaseLabel(night)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <NoteField
                        appearance="box"
                        hideLabel
                        label={t('player.note', { name: player.name })}
                        placeholder={t('player.notePlaceholder')}
                        value={notes[entry.night]?.[player.id] ?? ''}
                        maxLength={1000}
                        onChange={(event) => {
                          onPlayerNote(entry.night, player.id, event.target.value);
                        }}
                      />
                    </div>
                  </li>
                );
              }
              const isEditing = editing?.playerId === player.id && editing.night === entry.night;
              return (
                <li key={`night-${String(entry.night)}`}>
                  {isEditing ? (
                    <div className="name-pop flex items-start gap-3 py-1">
                      <span aria-hidden="true" className={`${labelClass} pt-2.5`}>
                        {phaseLabel(night)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <NoteField
                          appearance="box"
                          hideLabel
                          autoFocus
                          label={t('narrator.noteFor', {
                            name: player.name,
                            phase: phaseLabel(night),
                          })}
                          value={entry.text}
                          maxLength={1000}
                          onFocus={(event) => {
                            const end = event.currentTarget.value.length;
                            event.currentTarget.setSelectionRange(end, end);
                          }}
                          onChange={(event) => {
                            onPlayerNote(entry.night, player.id, event.target.value);
                          }}
                          onBlur={() => {
                            setEditing(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') setEditing(null);
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    // A full 48px target that overlaps its neighbours by 4px each way, so notes sit
                    // 40px apart; `relative` keeps it above the next row's padding for taps.
                    <button
                      type="button"
                      className={`press relative -my-1 flex min-h-12 w-full items-baseline gap-3 rounded-control py-3 text-left text-body ${dead ? 'text-muted' : 'text-ink'}`}
                      onClick={() => {
                        setEditing({ playerId: player.id, night: entry.night });
                      }}
                    >
                      <span className="sr-only">
                        {t('narrator.editNote', { name: player.name, phase: phaseLabel(night) })}
                      </span>
                      <span aria-hidden="true" className={labelClass}>
                        {phaseLabel(night)}
                      </span>
                      <span className="min-w-0 flex-1 break-words whitespace-pre-wrap">
                        {entry.text}
                      </span>
                      <Icon name="pencil" className="size-3.5 text-muted" />
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </li>
    );
  }

  return (
    <ScreenLayout
      title={t('screens.narrator')}
      onOpenMenu={() => {
        setShowTools(true);
      }}
      footer={
        <div className="flex gap-2">
          <div className="grid min-w-0 flex-1">
            <HoldButton
              onComplete={() => {
                setEditing(null);
                onEndPhase();
              }}
            >
              <Icon name={isNight ? 'moon' : 'sun'} />
              {t(isNight ? 'narrator.holdEndNight' : 'narrator.holdEndMorning')}
            </HoldButton>
          </div>
          <HoldButton
            variant="danger"
            iconOnly
            label={t('common.finish')}
            duration={1200}
            onComplete={onFinish}
          >
            <Icon name="flag" />
          </HoldButton>
        </div>
      }
    >
      <section className="flex items-center justify-between gap-3" aria-label={phaseLabel(phase)}>
        <h2
          key={`${phase.kind}-${String(phase.number)}`}
          className="name-pop flex items-center gap-2 font-display text-role font-semibold"
        >
          <Icon name={isNight ? 'moon' : 'sun'} className="size-4" />
          {phaseLabel(phase)}
        </h2>
        <p key={alive} role="status" className="name-pop text-caption text-muted">
          {t('narrator.alive', { count: alive })}
        </p>
      </section>
      <div className="grid min-w-0 gap-2.5">
        {[...orderedGroups, ...restingGroups].map((group) => {
          // A role whose players are all dead goes grey: band, name and art.
          const out = group.players.length > 0 && group.players.every((p) => p.id in deaths);
          const wash = out
            ? 'bg-paper'
            : group.role.team === 'werewolf'
              ? 'bg-werewolf-wash'
              : 'bg-village-wash';
          return (
            <section
              key={group.role.id}
              className="panel min-w-0 overflow-hidden"
              aria-label={group.role.name[locale]}
            >
              <h3 className={`px-3.5 py-1.5 motion-safe:transition-colors ${wash}`}>
                <RoleBanner
                  name={group.role.name[locale]}
                  team={group.role.team}
                  image={group.role.image}
                  dead={out}
                />
              </h3>
              <ul className="divide-y divide-line">{group.players.map(renderPlayer)}</ul>
            </section>
          );
        })}
      </div>
      {showTools && (
        <Modal
          sheet
          title={t('setup.settings')}
          onClose={() => {
            setShowTools(false);
          }}
        >
          <div className="grid gap-4 pb-4">
            <div className="flex items-center justify-between text-control">
              <span>{t('language.label')}</span>
              <LanguageSwitch compact />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-control">
                {t('narrator.timer')}{' '}
                <span className="ml-2 tabular-nums" role="timer">
                  {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                  {String(seconds % 60).padStart(2, '0')}
                </span>
              </span>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  disabled={seconds === 0}
                  onClick={() => {
                    setRunning(!running);
                  }}
                >
                  {t(running ? 'narrator.pauseTimer' : 'narrator.startTimer')}
                </Button>
                <Button
                  variant="quiet"
                  aria-label={t('narrator.resetTimer')}
                  onClick={() => {
                    setRunning(false);
                    setSeconds(120);
                  }}
                >
                  <Icon name="reset" />
                </Button>
              </div>
            </div>
            <label className="flex min-h-12 items-center gap-3 text-control">
              <input
                type="checkbox"
                className="size-5 accent-ink"
                checked={sound}
                onChange={(event) => {
                  setSound(event.target.checked);
                }}
              />
              {t('setup.sound')}
            </label>
            <WakeOrderSetting
              roles={orderedGroups.map((group) => group.role)}
              onChange={(order) => {
                setOrderedGroups((current) =>
                  order.flatMap((role) => current.filter((group) => group.role.id === role.id)),
                );
              }}
            />
          </div>
        </Modal>
      )}
    </ScreenLayout>
  );
}
