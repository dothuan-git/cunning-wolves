import type { MarkDef, PoolRole } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { Modal, ModalDone } from '../../components/Modal';
import { useLocale } from '../../i18n/useLocale';
import type { RoleChoices } from '../types';

/** The role picker at the top of the sheet, for games with a role that changes roles. */
export interface RoleOption extends RoleChoices {
  /** The role the player plays now */
  current: PoolRole;
  dealt: PoolRole;
  /** null: back to the dealt role */
  onChange: (roleId: string | null) => void;
}

/** Opens a player's marks; shows how many they carry. */
export function MarksButton({
  name,
  count,
  disabled = false,
  onOpen,
}: {
  name: string;
  count: number;
  disabled?: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={t('player.marks', { name, number: count })}
      disabled={disabled}
      onClick={onOpen}
      className={`press flex min-h-12 min-w-12 shrink-0 items-center justify-center gap-1 px-2 disabled:cursor-not-allowed disabled:opacity-45 ${count > 0 ? 'text-ink' : 'text-muted hover:text-ink'}`}
    >
      <Icon name="tag" />
      {count > 0 && (
        <span
          key={count}
          aria-hidden="true"
          className="count-pop text-caption font-medium tabular-nums"
        >
          {count}
        </span>
      )}
    </button>
  );
}

export interface MarkOption {
  mark: MarkDef;
  /** The phase this player got it in; undefined when they don't have it */
  since: string | undefined;
  /** Another player holding a single mark, who loses it if this player gets it */
  heldBy: string | undefined;
}

/** One player's marks as switches; each tap goes straight to the room. */
export function MarksSheet({
  name,
  options,
  role,
  disabled,
  onToggle,
  onClose,
}: {
  name: string;
  options: readonly MarkOption[];
  role?: RoleOption | undefined;
  disabled: boolean;
  onToggle: (markId: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const byName = (a: PoolRole, b: PoolRole) => a.name[locale].localeCompare(b.name[locale], locale);
  return (
    <Modal
      sheet
      title={t('narrator.marksTitle', { name })}
      footer={<ModalDone />}
      onClose={onClose}
    >
      {role && (
        <label className="grid gap-1 pb-3">
          <span className="text-caption text-muted">{t('narrator.playsRole')}</span>
          <select
            className="min-h-12 rounded-control border border-field-border bg-field px-3 text-body"
            value={role.current.id}
            disabled={disabled}
            onChange={(event) => {
              const { value } = event.target;
              role.onChange(value === role.dealt.id ? null : value);
            }}
          >
            <optgroup label={t('narrator.rolesInGame')}>
              {role.inGame.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.name[locale]}
                </option>
              ))}
            </optgroup>
            <optgroup label={t('narrator.otherRoles')}>
              {[...role.others].sort(byName).map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.name[locale]}
                </option>
              ))}
            </optgroup>
          </select>
          {role.current.id !== role.dealt.id && (
            <span className="name-pop text-caption text-muted">
              {t('narrator.dealtRole', { role: role.dealt.name[locale] })}
            </span>
          )}
        </label>
      )}
      <ul className="grid pb-2">
        {options.map(({ mark, since, heldBy }) => (
          <li key={mark.id}>
            <label className="flex min-h-12 items-center gap-3 py-1 text-control">
              <input
                type="checkbox"
                className="check-pop size-5 shrink-0 accent-ink"
                checked={since !== undefined}
                disabled={disabled}
                onChange={() => {
                  onToggle(mark.id);
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block break-words">{mark.label[locale]}</span>
                {/* Keyed by its text, so a changed line slides in again. */}
                {since !== undefined ? (
                  <span key={`since-${since}`} className="name-pop block text-caption text-muted">
                    {t('narrator.markSince', { phase: since })}
                  </span>
                ) : (
                  heldBy !== undefined && (
                    <span key={`held-${heldBy}`} className="name-pop block text-caption text-muted">
                      {t('narrator.markHeldBy', { name: heldBy })}
                    </span>
                  )
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
