import { TIMER_MAX, type PoolRole, type RoomSettings } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeleteRoomButton } from './DeleteRoomButton';
import { LanguageSwitch } from './LanguageSwitch';
import { Modal } from './Modal';
import { TextField } from './TextField';
import { WakeOrderSetting } from './WakeOrderSetting';

/**
 * The narrator's settings sheet before the game: language, timer, sound, marks, wake order and
 * deleting the room. The timer is typed freely and the room gets it when the sheet closes.
 */
export function RoomSettingsSheet({
  settings,
  waking,
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
  reconnecting?: boolean;
  deleteFailed?: boolean;
  onSettings: (settings: RoomSettings) => void;
  onWakeOrder: (order: string[]) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [timer, setTimer] = useState(String(settings.timerSeconds));

  function close() {
    // A number outside the timer's range is pulled into it; anything else leaves the timer as it was.
    const typed = Number.parseInt(timer, 10);
    if (!Number.isNaN(typed)) {
      const timerSeconds = Math.min(TIMER_MAX, Math.max(0, typed));
      if (timerSeconds !== settings.timerSeconds) onSettings({ ...settings, timerSeconds });
    }
    onClose();
  }

  return (
    <Modal sheet title={t('setup.settings')} onClose={close}>
      <div className="mb-5 flex items-center justify-between text-control">
        <span>{t('language.label')}</span>
        <LanguageSwitch compact />
      </div>
      <div className="grid gap-3 pb-3">
        <TextField
          type="number"
          min="0"
          max={TIMER_MAX}
          label={t('setup.timer')}
          hint={t('setup.timerHint')}
          value={timer}
          onChange={(event) => {
            setTimer(event.target.value);
          }}
        />
        <label className="flex min-h-12 items-center gap-3 text-control">
          <input
            className="size-5 accent-ink"
            type="checkbox"
            checked={settings.soundOn}
            onChange={(event) => {
              onSettings({ ...settings, soundOn: event.target.checked });
            }}
          />
          {t('setup.sound')}
        </label>
        <label className="flex min-h-12 items-center gap-3 text-control">
          <input
            className="size-5 accent-ink"
            type="checkbox"
            checked={settings.marksOn}
            onChange={(event) => {
              onSettings({ ...settings, marksOn: event.target.checked });
            }}
          />
          {t('setup.marks')}
        </label>
        {waking.length > 0 && (
          <WakeOrderSetting
            roles={waking}
            onChange={(order) => {
              onWakeOrder(order.map((role) => role.id));
            }}
          />
        )}
      </div>
      <div className="pt-3 pb-4">
        <DeleteRoomButton disabled={reconnecting} failed={deleteFailed} onDelete={onDelete} />
      </div>
    </Modal>
  );
}
