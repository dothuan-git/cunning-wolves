import { useEffect, useRef, useState } from 'react';
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
import { NoteField } from '../../components/TextField';
import { UndoBar } from '../../components/UndoBar';
import { useLocale } from '../../i18n/useLocale';
import type { Phase, PlayerListItem, RoleGroupItem } from '../types';
import { playerTimeline, wakeStep } from './phase';
import { WakeGuide } from './WakeGuide';

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
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [orderedGroups, setOrderedGroups] = useState(() =>
    groups.filter((group) => group.role.defaultWakeOrder !== null),
  );
  const [editing, setEditing] = useState<{ playerId: string; night: number } | null>(null);
  // The wake guide starts again at the first role each night.
  const [wake, setWake] = useState({ night: phase.number, step: 0 });
  const [undo, setUndo] = useState<{ key: number; playerId: string; message: string } | null>(null);
  const groupRefs = useRef(new Map<string, HTMLElement>());
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
  const step = wake.night === phase.number ? wake.step : 0;
  const wakingRole = isNight ? orderedGroups[step]?.role.id : undefined;

  function moveWake(delta: number) {
    const next = wakeStep(step, delta, orderedGroups.length);
    setWake({ night: phase.number, step: next });
    const roleId = orderedGroups[next]?.role.id;
    const element = roleId === undefined ? undefined : groupRefs.current.get(roleId);
    if (!element) return;
    const smooth = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    element.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  }

  function togglePlayer(player: PlayerListItem) {
    const nowDead = !(player.id in deaths);
    onTogglePlayer(player.id);
    setUndo((current) => ({
      key: (current?.key ?? 0) + 1,
      playerId: player.id,
      message: t(nowDead ? 'player.markedDead' : 'player.markedAlive', { name: player.name }),
    }));
  }

  function phaseLabel(value: Phase) {
    return t(value.kind === 'night' ? 'common.night' : 'common.morning', { number: value.number });
  }

  function moveRole(index: number, direction: number) {
    const next = [...orderedGroups];
    const item = next[index];
    if (!item || index + direction < 0 || index + direction >= next.length) return;
    next.splice(index, 1);
    next.splice(index + direction, 0, item);
    setOrderedGroups(next);
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
    const labelClass = `w-20 shrink-0 text-control font-medium ${dead ? 'text-muted' : 'text-ink'}`;
    return (
      <div key={player.id} className="px-3.5 pt-1 pb-2">
        <div className="flex min-h-12 items-center justify-between gap-2">
          <PlayerChip name={player.name} dead={dead} />
          <PlayerStatusControl
            name={player.name}
            dead={dead}
            onToggle={() => {
              togglePlayer(player);
            }}
          />
        </div>
        {entries.length > 0 && (
          <ol aria-label={t('narrator.history', { name: player.name })}>
            {entries.map((entry) => {
              if (entry.type === 'death') {
                return (
                  <li key="death" className="flex min-h-10 items-center gap-3 text-body text-muted">
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
                  <li key={`night-${String(entry.night)}`} className="flex items-start gap-3">
                    <span aria-hidden="true" className={`${labelClass} pt-3.5`}>
                      {phaseLabel(night)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <NoteField
                        appearance="line"
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
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className={`${labelClass} pt-3.5`}>
                        {phaseLabel(night)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <NoteField
                          appearance="line"
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
                    <button
                      type="button"
                      className={`flex min-h-12 w-full items-baseline gap-3 rounded-control py-2.5 text-left text-body ${dead ? 'text-muted' : 'text-ink'}`}
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
      </div>
    );
  }

  return (
    <ScreenLayout
      title={t('screens.narrator')}
      onOpenMenu={() => {
        setShowTools(true);
      }}
      footer={
        <>
          {undo && (
            <UndoBar
              key={undo.key}
              message={undo.message}
              onUndo={() => {
                onTogglePlayer(undo.playerId);
                setUndo(null);
              }}
              onClose={() => {
                setUndo(null);
              }}
            />
          )}
          <HoldButton
            onComplete={() => {
              setEditing(null);
              setUndo(null);
              onEndPhase();
            }}
          >
            <Icon name={isNight ? 'moon' : 'sun'} />
            {t(isNight ? 'narrator.holdEndNight' : 'narrator.holdEndMorning')}
          </HoldButton>
        </>
      }
    >
      <section className="flex items-center justify-between gap-3" aria-label={phaseLabel(phase)}>
        <h2 className="flex items-center gap-2 font-display text-role font-semibold">
          <Icon name={isNight ? 'moon' : 'sun'} className="size-4" />
          {phaseLabel(phase)}
        </h2>
        <p role="status" className="text-caption text-muted">
          {t('narrator.alive', { count: alive })}
        </p>
      </section>
      {isNight && orderedGroups.length > 0 && (
        <WakeGuide
          roles={orderedGroups.map((group) => ({
            id: group.role.id,
            name: group.role.name[locale],
            image: group.role.image,
          }))}
          step={step}
          onStep={moveWake}
        />
      )}
      <div className="grid min-w-0 gap-3">
        {[...orderedGroups, ...restingGroups].map((group) => {
          const waking = group.role.id === wakingRole;
          const wash = group.role.team === 'werewolf' ? 'bg-werewolf-wash' : 'bg-village-wash';
          return (
            <section
              key={group.role.id}
              ref={(element) => {
                if (element) groupRefs.current.set(group.role.id, element);
                else groupRefs.current.delete(group.role.id);
              }}
              className={`panel min-w-0 scroll-my-24 overflow-hidden ${waking ? `${wash} outline-2 outline-ink` : ''}`}
              aria-label={group.role.name[locale]}
              aria-current={waking ? 'step' : undefined}
            >
              <h3 className="px-3.5 pt-3">
                <RoleBanner
                  name={group.role.name[locale]}
                  team={group.role.team}
                  image={group.role.image}
                />
              </h3>
              <div className="divide-y divide-line">{group.players.map(renderPlayer)}</div>
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
            <div>
              <h3 className="mb-1 text-control font-medium">{t('narrator.reorder')}</h3>
              {orderedGroups.map((group, index) => (
                <div
                  key={group.role.id}
                  className="flex items-center justify-between border-b border-line"
                >
                  <span className="text-control">{group.role.name[locale]}</span>
                  <div className="flex">
                    <Button
                      variant="quiet"
                      disabled={index === 0}
                      aria-label={t('narrator.moveUp', { role: group.role.name[locale] })}
                      onClick={() => {
                        moveRole(index, -1);
                      }}
                      size="icon"
                    >
                      <Icon name="arrow" className="rotate-90" />
                    </Button>
                    <Button
                      variant="quiet"
                      disabled={index === orderedGroups.length - 1}
                      aria-label={t('narrator.moveDown', { role: group.role.name[locale] })}
                      onClick={() => {
                        moveRole(index, 1);
                      }}
                      size="icon"
                    >
                      <Icon name="arrow" className="-rotate-90" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              setShowTools(false);
              setConfirmFinish(true);
            }}
          >
            {t('common.finish')}
          </Button>
        </Modal>
      )}
      {confirmFinish && (
        <Modal
          title={t('narrator.finishTitle')}
          onClose={() => {
            setConfirmFinish(false);
          }}
        >
          <p className="mb-5 text-control">{t('narrator.finishBody')}</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="quiet"
              onClick={() => {
                setConfirmFinish(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={onFinish}>
              {t('common.finish')}
            </Button>
          </div>
        </Modal>
      )}
    </ScreenLayout>
  );
}
