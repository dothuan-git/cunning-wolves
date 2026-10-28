import type { PoolRole, Team } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { RoleBanner } from '../../components/RoleBanner';
import { ScreenLayout } from '../../components/ScreenLayout';
import { NoteField, TextField } from '../../components/TextField';
import { useLocale } from '../../i18n/useLocale';

export function SetupScreen({
  roles: initialRoles,
  initialSlots,
  onReady,
}: {
  roles: readonly PoolRole[];
  initialSlots: readonly (string | null)[];
  onReady: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [roles, setRoles] = useState(initialRoles);
  const [slots, setSlots] = useState(initialSlots);
  const [showPool, setShowPool] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editing, setEditing] = useState<PoolRole | 'new' | null>(null);
  const [name, setName] = useState('');
  const [rule, setRule] = useState('');
  const [team, setTeam] = useState<Team>('village');
  const [error, setError] = useState(false);
  const [sound, setSound] = useState(false);
  const [timer, setTimer] = useState('120');
  const filled = slots.filter(Boolean).length;

  function openEditor(role: PoolRole | 'new') {
    setShowPool(false);
    setEditing(role);
    setError(false);
    setName(role === 'new' ? '' : role.name[locale]);
    setRule(role === 'new' ? '' : role.rule[locale]);
    setTeam(role === 'new' ? 'village' : role.team);
  }

  function addRole(id: string) {
    setSlots((current) => {
      const empty = current.indexOf(null);
      return current.map((item, index) => (index === empty ? id : item));
    });
  }

  return (
    <ScreenLayout
      title={t('screens.setup')}
      onOpenMenu={() => {
        setShowSettings(true);
      }}
      footer={
        <>
          {filled < slots.length && (
            <p className="text-center text-caption text-muted">
              {t('setup.remaining', { count: slots.length - filled })}
            </p>
          )}
          <Button disabled={filled !== slots.length || slots.length === 0} onClick={onReady}>
            {t('setup.ready')}
          </Button>
        </>
      }
    >
      <section aria-label={t('setup.slots')}>
        <p className="mb-1.5 px-0.5 text-caption text-muted" role="status">
          {t('setup.filled', { filled, total: slots.length })}
        </p>
        <div className="panel overflow-hidden">
          {filled === 0 && (
            <p className="px-3.5 py-6 text-control text-muted">{t('setup.empty')}</p>
          )}
          <ul className="divide-y divide-line">
            {roles
              .filter((role) => slots.includes(role.id))
              .map((role) => (
                <li key={role.id} className="flex min-h-13 items-center gap-1 pr-1 pl-3.5">
                  <button
                    type="button"
                    className="min-h-12 min-w-12 flex-1 text-left"
                    aria-label={t('setup.editRole', { role: role.name[locale] })}
                    onClick={() => {
                      openEditor(role);
                    }}
                  >
                    <RoleBanner name={role.name[locale]} team={role.team} image={role.image} />
                  </button>
                  <Button
                    variant="quiet"
                    size="icon"
                    aria-label={t('setup.removeRole', { role: role.name[locale] })}
                    onClick={() => {
                      setSlots((current) => {
                        const index = current.lastIndexOf(role.id);
                        return current.map((item, slot) => (slot === index ? null : item));
                      });
                    }}
                  >
                    <Icon name="minus" />
                  </Button>
                  <span className="w-5 text-center text-control tabular-nums">
                    {slots.filter((id) => id === role.id).length}
                  </span>
                  <Button
                    variant="quiet"
                    size="icon"
                    disabled={filled === slots.length}
                    aria-label={t('setup.addRole', { role: role.name[locale] })}
                    onClick={() => {
                      addRole(role.id);
                    }}
                  >
                    <Icon name="plus" />
                  </Button>
                </li>
              ))}
          </ul>
          <button
            type="button"
            className={`flex min-h-12 w-full items-center gap-2 px-3.5 text-control font-medium text-ink hover:bg-field ${filled > 0 ? 'border-t border-line' : ''}`}
            onClick={() => {
              setShowPool(true);
            }}
          >
            <Icon name="plus" />
            {t('setup.addRoles')}
          </button>
        </div>
      </section>
      {showPool && (
        <Modal
          sheet
          title={t('setup.addRoles')}
          onClose={() => {
            setShowPool(false);
          }}
        >
          <p role="status" className="mb-3 text-caption text-muted">
            {t('setup.filled', { filled, total: slots.length })}
          </p>
          <ul className="divide-y divide-line">
            {roles.map((role) => (
              <li key={role.id} className="flex min-h-14 items-center gap-3">
                <button
                  type="button"
                  className={`min-h-12 min-w-12 flex-1 text-left text-control ${role.team === 'werewolf' ? 'text-werewolf' : 'text-village'}`}
                  aria-label={t('setup.editRole', { role: role.name[locale] })}
                  onClick={() => {
                    openEditor(role);
                  }}
                >
                  {role.name[locale]}
                </button>
                <span className="text-caption text-muted">
                  {slots.filter((id) => id === role.id).length}
                </span>
                <Button
                  variant="quiet"
                  size="icon"
                  disabled={filled === slots.length}
                  aria-label={t('setup.addRole', { role: role.name[locale] })}
                  onClick={() => {
                    addRole(role.id);
                  }}
                >
                  <Icon name="plus" />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            variant="quiet"
            className="mt-3 w-full"
            onClick={() => {
              openEditor('new');
            }}
          >
            <Icon name="plus" />
            {t('setup.custom')}
          </Button>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              setShowPool(false);
            }}
          >
            {t('common.done')}
          </Button>
        </Modal>
      )}
      {showSettings && (
        <Modal
          sheet
          title={t('setup.settings')}
          onClose={() => {
            setShowSettings(false);
          }}
        >
          <div className="mb-5 flex items-center justify-between text-control">
            <span>{t('language.label')}</span>
            <LanguageSwitch compact />
          </div>
          <div className="grid gap-3 pb-3">
            <TextField
              type="number"
              min="0"
              max="3600"
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
                checked={sound}
                onChange={(event) => {
                  setSound(event.target.checked);
                }}
              />
              {t('setup.sound')}
            </label>
          </div>
        </Modal>
      )}
      {editing && (
        <Modal
          sheet
          title={editing === 'new' ? t('setup.custom') : t('card.roleDetails')}
          onClose={() => {
            setEditing(null);
          }}
        >
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim() || !rule.trim()) {
                setError(true);
                return;
              }
              if (editing === 'new') {
                setRoles([
                  ...roles,
                  {
                    id: `custom-${String(roles.length)}`,
                    name: { vi: name.trim(), en: name.trim() },
                    rule: { vi: rule.trim(), en: rule.trim() },
                    team,
                    defaultWakeOrder: null,
                    image: '',
                  },
                ]);
              } else {
                setRoles(
                  roles.map((roleItem) =>
                    roleItem.id === editing.id
                      ? {
                          ...roleItem,
                          name: { ...roleItem.name, [locale]: name.trim() },
                          rule: { ...roleItem.rule, [locale]: rule.trim() },
                          team,
                        }
                      : roleItem,
                  ),
                );
              }
              setEditing(null);
              if (editing === 'new') setShowPool(true);
            }}
          >
            <TextField
              label={t('setup.name')}
              value={name}
              maxLength={60}
              onChange={(event) => {
                setName(event.target.value);
              }}
              error={error ? t('setup.roleRequired') : undefined}
            />
            <NoteField
              label={t('setup.rule')}
              rows={3}
              value={rule}
              maxLength={500}
              onChange={(event) => {
                setRule(event.target.value);
              }}
            />
            <label className="grid gap-1.5 text-control">
              {t('setup.team')}
              <select
                className="min-h-12 rounded-control border border-field-border bg-field px-3 text-body"
                value={team}
                onChange={(event) => {
                  setTeam(event.target.value === 'werewolf' ? 'werewolf' : 'village');
                }}
              >
                <option value="village">{t('faction.village')}</option>
                <option value="werewolf">{t('faction.werewolf')}</option>
              </select>
            </label>
            <Button type="submit">{t('common.save')}</Button>
          </form>
        </Modal>
      )}
    </ScreenLayout>
  );
}
