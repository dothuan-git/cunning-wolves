import type { PoolRole } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { Modal, ModalDone } from '../../components/Modal';
import { useLocale } from '../../i18n/useLocale';
import type { RoleChoices } from '../types';

/** Opens a player's role picker; ink when a power gave them another role. */
export function RoleChangeButton({
  name,
  changed,
  disabled = false,
  onOpen,
}: {
  name: string;
  changed: boolean;
  disabled?: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={t('player.changeRole', { name })}
      aria-haspopup="dialog"
      disabled={disabled}
      onClick={onOpen}
      className={`press flex min-h-12 min-w-12 shrink-0 items-center justify-center px-2 disabled:cursor-not-allowed disabled:opacity-45 ${changed ? 'text-ink' : 'text-muted hover:text-ink'}`}
    >
      <Icon name="swap" />
    </button>
  );
}

/** The role one player plays now; each change goes straight to the room. */
export function RoleSheet({
  name,
  choices,
  current,
  dealt,
  disabled,
  onChange,
  onClose,
}: {
  name: string;
  choices: RoleChoices;
  /** The role the player plays now */
  current: PoolRole;
  dealt: PoolRole;
  disabled: boolean;
  /** null: back to the dealt role */
  onChange: (roleId: string | null) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const byName = (a: PoolRole, b: PoolRole) => a.name[locale].localeCompare(b.name[locale], locale);
  return (
    <Modal sheet title={t('narrator.roleTitle', { name })} footer={<ModalDone />} onClose={onClose}>
      <label className="grid gap-1 pb-3">
        <span className="text-caption text-muted">{t('narrator.playsRole')}</span>
        <select
          className="min-h-12 rounded-control border border-field-border bg-field px-3 text-body"
          value={current.id}
          disabled={disabled}
          onChange={(event) => {
            const { value } = event.target;
            onChange(value === dealt.id ? null : value);
          }}
        >
          <optgroup label={t('narrator.rolesInGame')}>
            {choices.inGame.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.name[locale]}
              </option>
            ))}
          </optgroup>
          <optgroup label={t('narrator.otherRoles')}>
            {[...choices.others].sort(byName).map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.name[locale]}
              </option>
            ))}
          </optgroup>
        </select>
        {current.id !== dealt.id && (
          <span className="name-pop text-caption text-muted">
            {t('narrator.dealtRole', { role: dealt.name[locale] })}
          </span>
        )}
      </label>
    </Modal>
  );
}
