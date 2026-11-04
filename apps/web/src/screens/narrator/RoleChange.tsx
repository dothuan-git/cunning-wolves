import type { PoolRole } from '@werewolf/shared';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { useModalClose } from '../../components/modalClose';
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

/** One tappable list of roles; a tap sends the change and closes the sheet. */
function RoleList({
  title,
  roles,
  current,
  dealt,
  disabled,
  onChange,
}: {
  title: string;
  roles: readonly PoolRole[];
  current: PoolRole;
  dealt: PoolRole;
  disabled: boolean;
  onChange: (roleId: string | null) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const close = useModalClose();
  const titleId = useId();
  if (roles.length === 0) return null;
  return (
    <section aria-labelledby={titleId} className="pb-3">
      <h3 id={titleId} className="pb-1 text-caption text-muted">
        {title}
      </h3>
      <ul className="divide-y divide-line">
        {roles.map((role) => {
          const playing = role.id === current.id;
          return (
            <li key={role.id}>
              <button
                type="button"
                aria-pressed={playing}
                disabled={disabled}
                onClick={() => {
                  if (!playing) onChange(role.id === dealt.id ? null : role.id);
                  close();
                }}
                className="press flex min-h-12 w-full items-center justify-between gap-3 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="min-w-0 font-display text-role font-semibold break-words">
                  {role.name[locale]}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-caption text-muted">
                  {role.id === dealt.id && t('narrator.dealt')}
                  {playing && <Icon name="check" className="text-ink" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Picks the role one player plays now; the change goes straight to the room. */
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
  const shared = { current, dealt, disabled, onChange };
  return (
    <Modal sheet title={t('narrator.roleTitle', { name })} onClose={onClose}>
      <RoleList title={t('narrator.rolesInGame')} roles={choices.inGame} {...shared} />
      <RoleList
        title={t('narrator.otherRoles')}
        roles={[...choices.others].sort(byName)}
        {...shared}
      />
    </Modal>
  );
}
