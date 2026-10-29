import {
  NOTE_MAX,
  TIMER_MAX,
  wakesOnNight,
  type MarkDef,
  type RoomSettings,
} from '@werewolf/shared';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { DeleteRoomButton } from '../../components/DeleteRoomButton';
import { HoldButton } from '../../components/HoldButton';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { MarkChips } from '../../components/MarkChips';
import { PlayerStatusControl } from '../../components/PlayerStatusControl';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { PlayerChip } from '../../components/PlayerChip';
import { RoleBanner } from '../../components/RoleBanner';
import { ScreenLayout } from '../../components/ScreenLayout';
import { SwitchRow } from '../../components/SwitchRow';
import { WakeOrderSetting } from '../../components/WakeOrderSetting';
import { NoteField, TextField } from '../../components/TextField';
import { FACTION_TEXT, FACTION_WASH } from '../../design/faction';
import { useFlip } from '../../design/useFlip';
import { useLeaving } from '../../design/useLeaving';
import { useLocale } from '../../i18n/useLocale';
import { playChime, unlockSound } from '../../sound/chime';
import type { GroupPlayerItem, Phase, RoleChoices, RoleGroupItem } from '../types';
import { NoteSaver, noteKey, type SaveNote } from './noteSaver';
import { packExtras } from './pack';
import { MarksButton, MarksSheet } from './PlayerMarks';
import { playerTimeline } from './phase';

// As long as the `row-out` animation in index.css.
const ROW_LEAVE_MS = 160;

export function NarratorScreen({
  groups,
  phase,
  notes,
  deaths,
  marks,
  markOptions,
  roleChoices,
  settings,
  reconnecting = false,
  onPlayerNote,
  onTogglePlayer,
  onToggleMark,
  onSetRole,
  onEndPhase,
  onWakeOrder,
  onSettings,
  onFinish,
  onDelete,
  deleteFailed = false,
}: {
  /** Waking roles in wake order; roles that never wake may come anywhere */
  groups: readonly RoleGroupItem[];
  phase: Phase;
  /** Night number → player id → note. */
  notes: Readonly<Record<number, Readonly<Record<string, string>>>>;
  /** Player id → the phase the narrator marked them dead in. */
  deaths: Readonly<Record<string, Phase>>;
  /** Player id → mark id → the phase it was marked in. */
  marks: Readonly<Record<string, Readonly<Record<string, Phase>>>>;
  /** Player id → the marks that player may carry in this game, in display order. */
  markOptions: Readonly<Record<string, readonly MarkDef[]>>;
  /** The roles a power can give a player; left out when no dealt role changes roles */
  roleChoices?: RoleChoices;
  settings: RoomSettings;
  /** The room can't be told anything right now */
  reconnecting?: boolean;
  /** Sends a note; returns false when it could not be sent, so it is tried again later */
  onPlayerNote: SaveNote;
  onTogglePlayer: (playerId: string) => void;
  onToggleMark: (playerId: string, markId: string) => void;
  /** The role a player plays now; null goes back to the dealt one */
  onSetRole: (playerId: string, roleId: string | null) => void;
  onEndPhase: () => void;
  onWakeOrder: (order: string[]) => void;
  onSettings: (settings: RoomSettings) => void;
  /** Leaves out the Finish game control when not given */
  onFinish?: () => void;
  /** Leaves out Delete room when not given */
  onDelete?: () => void;
  deleteFailed?: boolean;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [showTools, setShowTools] = useState(false);
  const [timerDraft, setTimerDraft] = useState('');
  const [editing, setEditing] = useState<{ playerId: string; night: number } | null>(null);
  // The player whose marks sheet is open.
  const [marking, setMarking] = useState<string | null>(null);

  // The countdown lives on this phone; a new length from the room resets it.
  const length = settings.timerSeconds;
  const [timer, setTimer] = useState({ length, seconds: length, running: false });
  if (timer.length !== length) setTimer({ length, seconds: length, running: false });
  const { seconds, running } = timer;
  const chime = useEffectEvent(() => {
    if (settings.soundOn) playChime();
  });
  useEffect(() => {
    if (!running) return;
    if (seconds === 0) {
      chime();
      return;
    }
    const interval = window.setInterval(() => {
      setTimer((value) => ({ ...value, seconds: Math.max(0, value.seconds - 1) }));
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [running, seconds]);

  // Notes are typed into local drafts and sent after a pause or when the field is left.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const saver = useRef<NoteSaver | null>(null);
  const saveNote = useEffectEvent(onPlayerNote);
  useEffect(() => {
    const created = new NoteSaver((night, playerId, text) => saveNote(night, playerId, text));
    saver.current = created;
    return () => {
      // Leaving the page still sends what was typed.
      created.flushAll();
      created.dispose();
      saver.current = null;
    };
  }, []);
  useEffect(() => {
    if (!reconnecting) saver.current?.flushAll();
  }, [reconnecting]);
  function typeNote(night: number, playerId: string, text: string) {
    setDrafts((current) => ({ ...current, [noteKey(night, playerId)]: text }));
    saver.current?.type(night, playerId, text);
  }
  function flushNote(night: number, playerId: string) {
    saver.current?.flush(night, playerId);
  }
  function noteText(night: number, playerId: string): string {
    return drafts[noteKey(night, playerId)] ?? notes[night]?.[playerId] ?? '';
  }

  function closeTools() {
    // A number outside the timer's range is pulled into it; anything else leaves it as it was.
    const typed = Number.parseInt(timerDraft, 10);
    if (!Number.isNaN(typed)) {
      const timerSeconds = Math.min(TIMER_MAX, Math.max(0, typed));
      if (timerSeconds !== length) onSettings({ ...settings, timerSeconds });
    }
    setShowTools(false);
  }

  const wakingGroups = groups.filter((group) => group.role.defaultWakeOrder !== null);
  // A role whose every player now plays another one has nobody left to wake.
  const held = groups.filter((group) => group.players.length > 0);
  const tonightGroups = held.filter((group) => wakesOnNight(group.role, phase.number));
  // Roles that don't wake tonight still need a place in the list so they can be marked.
  const restingGroups = held.filter((group) => !wakesOnNight(group.role, phase.number));
  const everyone = groups.flatMap((group) => group.players);
  const alive = everyone.filter((player) => !(player.id in deaths)).length;
  // The plain werewolves hold the pack (else the first wolf role woken tonight); players moved to
  // it show under its own.
  const packGroup =
    tonightGroups.find((group) => group.role.id === 'werewolf') ??
    tonightGroups.find((group) => group.role.team === 'werewolf');
  const pack = packGroup ? packExtras(groups, marks) : [];
  const marksOf = (playerId: string): Readonly<Record<string, Phase>> =>
    (Object.hasOwn(marks, playerId) ? marks[playerId] : undefined) ?? {};
  const isNight = phase.kind === 'night';
  const markingGroup =
    marking === null
      ? undefined
      : groups.find((group) => group.players.some((player) => player.id === marking));
  const markingDealt = markingGroup?.players.find((player) => player.id === marking)?.dealt;
  // A death just undone keeps its row a moment, so it slides out instead of vanishing.
  const shownDeaths = useLeaving(
    Object.entries(deaths).map(([id, at]) => ({ id, at })),
    (death) => death.id,
    ROW_LEAVE_MS,
  );
  // Panels slide to their new places when the wake order or a player's role changes.
  const panels = useRef<HTMLDivElement>(null);
  useFlip(
    panels,
    [
      ...[...tonightGroups, ...restingGroups].map(
        (group) => `${group.role.id}:${group.players.map((player) => player.id).join(',')}`,
      ),
      `pack:${pack.map(({ player }) => player.id).join(',')}`,
    ].join('|'),
  );

  function phaseLabel(value: Phase) {
    return t(value.kind === 'night' ? 'common.night' : 'common.morning', { number: value.number });
  }

  function renderPlayer(player: GroupPlayerItem) {
    const death = deaths[player.id];
    const dead = death !== undefined;
    const playerNotes: Record<number, string> = {};
    for (let night = 1; night <= phase.number; night++) {
      const text = noteText(night, player.id);
      if (text !== '') playerNotes[night] = text;
    }
    // Marks off hides the tag button and chips; what was marked stays in the room.
    const options = settings.marksOn ? (markOptions[player.id] ?? []) : [];
    const own = marksOf(player.id);
    const carried = options.filter((mark) => Object.hasOwn(own, mark.id));
    const entries = playerTimeline({
      notes: playerNotes,
      death,
      current: phase,
      editingNight: editing?.playerId === player.id ? editing.night : undefined,
    });
    const undone = dead
      ? undefined
      : shownDeaths.find((shown) => shown.leaving && shown.key === player.id)?.item.at;
    if (undone) entries.push({ type: 'death', phase: undone });
    // Phase labels stay small and grey so the player's name leads the row.
    const labelClass = 'min-w-11 shrink-0 text-caption whitespace-nowrap text-muted';
    return (
      <li key={player.id} data-flip={`player:${player.id}`} className="px-3.5 pb-1.5">
        <div className="flex min-h-12 items-center justify-between gap-2">
          <PlayerChip
            name={player.name}
            dead={dead}
            detail={player.dealt && t('narrator.dealtRole', { role: player.dealt.name[locale] })}
            large
          />
          <div className="flex shrink-0 items-center">
            {options.length > 0 && (
              <MarksButton
                name={player.name}
                count={carried.length}
                disabled={reconnecting}
                onOpen={() => {
                  setMarking(player.id);
                }}
              />
            )}
            <PlayerStatusControl
              name={player.name}
              dead={dead}
              disabled={reconnecting}
              onToggle={() => {
                onTogglePlayer(player.id);
              }}
            />
          </div>
        </div>
        <MarkChips marks={carried} fold className="pb-1.5" />
        {entries.length > 0 && (
          // The top padding keeps the first note's overlap off the status pill above it.
          <ol aria-label={t('narrator.history', { name: player.name })} className="pt-1">
            {entries.map((entry) => {
              if (entry.type === 'death') {
                return (
                  <li
                    key="death"
                    aria-hidden={!dead || undefined}
                    className={`${dead ? 'name-pop' : 'row-out'} flex min-h-8 items-center gap-3 text-body text-muted`}
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
                        value={noteText(entry.night, player.id)}
                        maxLength={NOTE_MAX}
                        onChange={(event) => {
                          typeNote(entry.night, player.id, event.target.value);
                        }}
                        onBlur={() => {
                          flushNote(entry.night, player.id);
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
                          maxLength={NOTE_MAX}
                          onFocus={(event) => {
                            const end = event.currentTarget.value.length;
                            event.currentTarget.setSelectionRange(end, end);
                          }}
                          onChange={(event) => {
                            typeNote(entry.night, player.id, event.target.value);
                          }}
                          onBlur={() => {
                            flushNote(entry.night, player.id);
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
        setTimerDraft(String(length));
        setShowTools(true);
      }}
      footer={
        <>
          {reconnecting && (
            <p role="status" className="name-pop text-center text-caption text-muted">
              {t('setup.reconnecting')}
            </p>
          )}
          <div className="flex gap-2">
            <div className="grid min-w-0 flex-1">
              <HoldButton
                disabled={reconnecting}
                onComplete={() => {
                  setEditing(null);
                  onEndPhase();
                }}
              >
                <Icon name={isNight ? 'moon' : 'sun'} />
                {t(isNight ? 'narrator.holdEndNight' : 'narrator.holdEndMorning')}
              </HoldButton>
            </div>
            {onFinish && (
              <HoldButton
                variant="danger"
                iconOnly
                label={t('common.finish')}
                duration={1200}
                onComplete={onFinish}
              >
                <Icon name="flag" />
              </HoldButton>
            )}
          </div>
        </>
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
      <div ref={panels} className="grid min-w-0 gap-2.5">
        {[...tonightGroups, ...restingGroups].map((group) => {
          // A role whose players are all dead goes grey: band, name and art.
          const out = group.players.length > 0 && group.players.every((p) => p.id in deaths);
          const wash = out ? 'bg-line' : FACTION_WASH[group.role.team];
          return (
            <section
              key={group.role.id}
              data-flip={`role:${group.role.id}`}
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
              {group === packGroup && pack.length > 0 && (
                <section
                  aria-label={t('narrator.packExtras')}
                  data-flip="pack"
                  className="border-t border-line px-3.5 py-2"
                >
                  <h4 className="text-caption text-muted">{t('narrator.packExtras')}</h4>
                  <ul>
                    {pack.map(({ player, role }) => (
                      <li
                        key={player.id}
                        data-flip={`pack:${player.id}`}
                        className="flex min-h-10 flex-wrap items-baseline gap-x-2 py-1"
                      >
                        <PlayerChip name={player.name} dead={player.id in deaths} large />
                        <span className={`text-caption font-medium ${FACTION_TEXT[role.team]}`}>
                          {role.name[locale]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </section>
          );
        })}
      </div>
      {marking !== null && settings.marksOn && (
        <MarksSheet
          name={everyone.find((player) => player.id === marking)?.name ?? ''}
          disabled={reconnecting}
          role={
            roleChoices && markingGroup
              ? {
                  ...roleChoices,
                  current: markingGroup.role,
                  dealt: markingDealt ?? markingGroup.role,
                  onChange: (roleId) => {
                    onSetRole(marking, roleId);
                  },
                }
              : undefined
          }
          options={(markOptions[marking] ?? []).map((mark) => {
            const own = marksOf(marking);
            const since = Object.hasOwn(own, mark.id) ? own[mark.id] : undefined;
            const holder = mark.single
              ? everyone.find(
                  (player) => player.id !== marking && Object.hasOwn(marksOf(player.id), mark.id),
                )
              : undefined;
            return {
              mark,
              since: since && phaseLabel(since),
              heldBy: holder?.name,
            };
          })}
          onToggle={(markId) => {
            onToggleMark(marking, markId);
          }}
          onClose={() => {
            setMarking(null);
          }}
        />
      )}
      {showTools && (
        <Modal sheet title={t('setup.settings')} onClose={closeTools}>
          <div className="grid gap-4 pb-4">
            <div className="flex items-center justify-between text-control">
              <span>{t('language.label')}</span>
              <LanguageSwitch compact />
            </div>
            {length > 0 && (
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
                      // The tap that starts the timer is what lets the phone play its chime.
                      if (!running) unlockSound();
                      setTimer((value) => ({ ...value, running: !value.running }));
                    }}
                  >
                    {t(running ? 'narrator.pauseTimer' : 'narrator.startTimer')}
                  </Button>
                  <Button
                    variant="quiet"
                    aria-label={t('narrator.resetTimer')}
                    onClick={() => {
                      setTimer({ length, seconds: length, running: false });
                    }}
                  >
                    <Icon name="reset" />
                  </Button>
                </div>
              </div>
            )}
            <TextField
              type="number"
              min="0"
              max={TIMER_MAX}
              label={t('setup.timer')}
              hint={t('setup.timerHint')}
              value={timerDraft}
              disabled={reconnecting}
              onChange={(event) => {
                setTimerDraft(event.target.value);
              }}
            />
            <div className="divide-y divide-line border-y border-line">
              <SwitchRow
                label={t('setup.sound')}
                hint={t('setup.soundHint')}
                checked={settings.soundOn}
                disabled={reconnecting}
                onChange={(event) => {
                  if (event.target.checked) unlockSound();
                  onSettings({ ...settings, soundOn: event.target.checked });
                }}
              />
              <SwitchRow
                label={t('setup.marks')}
                hint={t('setup.marksHint')}
                checked={settings.marksOn}
                disabled={reconnecting}
                onChange={(event) => {
                  onSettings({ ...settings, marksOn: event.target.checked });
                }}
              />
            </div>
            {wakingGroups.length > 0 && (
              <WakeOrderSetting
                roles={wakingGroups.map((group) => group.role)}
                onChange={(order) => {
                  onWakeOrder(order.map((role) => role.id));
                }}
              />
            )}
            {onDelete && (
              <DeleteRoomButton disabled={reconnecting} failed={deleteFailed} onDelete={onDelete} />
            )}
          </div>
        </Modal>
      )}
    </ScreenLayout>
  );
}
