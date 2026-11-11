import type { PoolRole, RoomSettings, SettingsChange } from '@werewolf/shared';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { unlockSound } from '../sound/chime';
import { Button } from './Button';
import { DeleteRoomButton } from './DeleteRoomButton';
import { Icon } from './Icon';
import { LanguageSwitch } from './LanguageSwitch';
import { Modal } from './Modal';
import { SwitchRow } from './SwitchRow';
import { clockTime, TIMER_PRESETS } from './timerPresets';
import { WakeOrderSetting } from './WakeOrderSetting';

/** The narrator's running countdown; it lives on the screen, so it keeps going with the sheet shut. */
export interface Countdown {
  seconds: number;
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
}

/**
 * The narrator's settings sheet, before and during the game: language, the night timer, sound,
 * Blind wolf, wake order and deleting the room. Every control saves as it is used. During the game
 * the timer row also holds the countdown.
 */
export function RoomSettingsSheet({
  settings,
  waking,
  countdown,
  reconnecting = false,
  deleteFailed = false,
  onSettings,
  onWakeOrder,
  onDelete,
  onClose,
}: {
  settings: RoomSettings;
  /** The waking roles in the order the narrator will wake them */
  waking: readonly PoolRole[];
  /** Shows the countdown beside the timer; only while playing */
  countdown?: Countdown;
  /** The room can't be told anything right now */
  reconnecting?: boolean;
  deleteFailed?: boolean;
  /** Gets only the setting a control changed */
  onSettings: (change: SettingsChange) => void;
  onWakeOrder: (order: string[]) => void;
  /** Leaves out Delete room when not given */
  onDelete?: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const timerLabel = useId();
  // A change shows at once, not after the room answers; the room's next settings replace it.
  const [fromRoom, setFromRoom] = useState(settings);
  const [shown, setShown] = useState(settings);
  if (fromRoom !== settings) {
    setFromRoom(settings);
    setShown(settings);
  }
  function change(next: SettingsChange) {
    setShown((current) => ({ ...current, ...next }));
    onSettings(next);
  }
  const length = shown.timerSeconds;

  return (
    <Modal sheet title={t('setup.settings')} onClose={onClose}>
      <div className="divide-y divide-line border-b border-line">
        <div className="flex min-h-14 items-center justify-between gap-4 py-1">
          <span className="text-control font-medium">{t('language.label')}</span>
          <LanguageSwitch compact />
        </div>
        <div className="grid gap-2 py-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <span id={timerLabel} className="text-control font-medium">
              {t('setup.timer')}
            </span>
            {countdown && length > 0 && (
              <div className="-my-1 flex items-center">
                <span
                  role="timer"
                  className="mr-1 font-display text-role font-semibold tabular-nums"
                >
                  {clockTime(countdown.seconds)}
                </span>
                <Button
                  variant="quiet"
                  size="icon"
                  className="press"
                  aria-label={t(countdown.running ? 'narrator.pauseTimer' : 'narrator.startTimer')}
                  disabled={countdown.seconds === 0}
                  onClick={countdown.onToggle}
                >
                  <Icon name={countdown.running ? 'pause' : 'play'} />
                </Button>
                <Button
                  variant="quiet"
                  size="icon"
                  className="press"
                  aria-label={t('narrator.resetTimer')}
                  onClick={countdown.onReset}
                >
                  <Icon name="reset" />
                </Button>
              </div>
            )}
          </div>
          {/* Six lengths fit one row on a phone; a narrower screen wraps them instead of scrolling. */}
          <div role="group" aria-labelledby={timerLabel} className="flex flex-wrap gap-1">
            {TIMER_PRESETS.map((seconds) => {
              const picked = seconds === length;
              return (
                <button
                  key={seconds}
                  type="button"
                  aria-pressed={picked}
                  disabled={reconnecting}
                  className={`press min-h-12 min-w-12 grow basis-12 rounded-control border text-control font-medium tabular-nums disabled:cursor-not-allowed disabled:opacity-45 motion-safe:transition-colors ${picked ? 'border-ink bg-ink text-field' : 'border-field-border bg-field text-ink hover:border-ink'}`}
                  onClick={() => {
                    if (!picked) change({ timerSeconds: seconds });
                  }}
                >
                  {seconds === 0 ? t('setup.timerOff') : clockTime(seconds)}
                </button>
              );
            })}
          </div>
        </div>
        <SwitchRow
          label={t('setup.sound')}
          checked={shown.soundOn}
          disabled={reconnecting}
          onChange={(event) => {
            // The tap that turns sound on is what lets the phone play its chime.
            if (event.target.checked) unlockSound();
            change({ soundOn: event.target.checked });
          }}
        />
        <SwitchRow
          label={t('setup.blindWolf')}
          hint={t('setup.blindWolfHint')}
          checked={shown.blindWolf}
          disabled={reconnecting}
          onChange={(event) => {
            change({ blindWolf: event.target.checked });
          }}
        />
      </div>
      {waking.length > 0 && (
        <div className="pt-4">
          <WakeOrderSetting
            roles={waking}
            onChange={(order) => {
              onWakeOrder(order.map((role) => role.id));
            }}
          />
        </div>
      )}
      {onDelete && (
        <div className="pt-5 pb-1">
          <DeleteRoomButton disabled={reconnecting} failed={deleteFailed} onDelete={onDelete} />
        </div>
      )}
    </Modal>
  );
}
