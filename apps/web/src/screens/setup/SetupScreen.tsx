import {
  nameKey,
  ROLE_NAME_MAX,
  RULE_MAX,
  TIMER_MAX,
  TEAMS,
  wakingOrder,
  type CustomRoleInput,
  type PoolRole,
  type RoomSettings,
  type Team,
} from '@werewolf/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddCard } from '../../components/AddCard';
import { Button } from '../../components/Button';
import { DeleteRoomButton } from '../../components/DeleteRoomButton';
import { DetailedCard } from '../../components/DetailedCard';
import { FactionSection } from '../../components/FactionSection';
import { Icon } from '../../components/Icon';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { Modal, ModalDone } from '../../components/Modal';
import { ScreenLayout } from '../../components/ScreenLayout';
import { NoteField, TextField } from '../../components/TextField';
import { ThumbnailCard } from '../../components/ThumbnailCard';
import { WakeOrderSetting } from '../../components/WakeOrderSetting';
import { FACTION_ORDER } from '../../design/faction';
import { useLocale } from '../../i18n/useLocale';
import type { SeatedPlayerItem } from '../types';
import { RoomPanel } from './RoomPanel';

const ADD_LABEL = {
  werewolf: 'setup.addWerewolf',
  village: 'setup.addVillage',
  solo: 'setup.addSolo',
} as const satisfies Record<Team, string>;
// A card taken out of the game shrinks away this long before it leaves the grid.
const LEAVE_MS = 160;

export function SetupScreen({
  roomName,
  pin,
  players,
  open,
  roomError = null,
  onToggleOpen,
  onRemove,
  onHandOver,
  onDelete,
  roles,
  picks,
  wakeOrder,
  settings,
  reconnecting = false,
  onAddPick,
  onRemovePick,
  onEditRule,
  onAddCustomRole,
  onWakeOrder,
  onSettings,
  onReady,
}: {
  roomName: string;
  /** The join PIN to read out; null for a room made before PINs */
  pin: string | null;
  /** Players who have joined so far; more join while the roles are set up. */
  players: readonly SeatedPlayerItem[];
  /** Whether new players can still join */
  open: boolean;
  /** The room's last refusal that this screen explains */
  roomError?: 'player-offline' | 'try-again' | null;
  onToggleOpen: () => void;
  onRemove: (playerId: string) => void;
  /** Makes an online player the narrator; this phone then joins as a player */
  onHandOver: (playerId: string) => void;
  onDelete: () => void;
  /** Every role the room can pick from, with this room's rules */
  roles: readonly PoolRole[];
  /** Ids of the roles in the game, one per copy. There can be more or fewer than players. */
  picks: readonly string[];
  /** The waking roles in the order the narrator chose; the rest follow their default order. */
  wakeOrder: readonly string[];
  settings: RoomSettings;
  /** The room can't be reached right now, so changes would not be kept. */
  reconnecting?: boolean;
  onAddPick: (roleId: string) => void;
  /** Takes one copy of the role out of the game */
  onRemovePick: (roleId: string) => void;
  /** Called once the edited card closes, only if the rule changed */
  onEditRule: (roleId: string, rule: string) => void;
  onAddCustomRole: (role: CustomRoleInput) => void;
  onWakeOrder: (order: string[]) => void;
  onSettings: (settings: RoomSettings) => void;
  /**
   * Called with the ids of the waking roles in the order the narrator will wake them.
   * Reviewing the rules closes the room: the roster is fixed from here on.
   */
  onReady: (wakeOrder: string[]) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  // The faction whose roles are being picked from, and what was typed to narrow them.
  const [picking, setPicking] = useState<Team | null>(null);
  const [search, setSearch] = useState('');
  // The selected role open as a detailed card.
  const [viewingId, setViewingId] = useState<string | null>(null);
  // The rule being edited on the open card; the room keeps it once the card closes.
  const [ruleDraft, setRuleDraft] = useState('');
  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [name, setName] = useState('');
  const [rule, setRule] = useState('');
  const [team, setTeam] = useState<Team>('village');
  const [wakes, setWakes] = useState(false);
  const [error, setError] = useState(false);
  // Typed freely in the settings sheet; the room gets it when the sheet closes.
  const [timer, setTimer] = useState('');
  // Roles just taken out of the game, still on the page while their card shrinks away.
  const [leaving, setLeaving] = useState<ReadonlyMap<string, number>>(new Map());
  const leaveTimers = useRef(new Map<string, number>());
  const searchId = useId();
  // Roles are chosen freely; the rules can only be reviewed once there is one per player.
  const gap = players.length - picks.length;
  const matched = gap === 0 && players.length > 0;
  const gapText = reconnecting
    ? t('setup.reconnecting')
    : players.length === 0
      ? t('setup.noPlayers')
      : gap > 0
        ? t('setup.remaining', { count: gap })
        : gap < 0
          ? t('setup.tooMany', { count: -gap })
          : t('setup.allSeated');
  const viewing = roles.find((role) => role.id === viewingId);
  const waking = wakingOrder(roles, picks, wakeOrder);

  function quantity(id: string) {
    return picks.filter((pick) => pick === id).length;
  }

  useEffect(() => {
    const timers = leaveTimers.current;
    return () => {
      for (const timer of timers.values()) window.clearTimeout(timer);
    };
  }, []);

  /** Keeps a role's card on the page while it shrinks away; `wait` holds that back a moment. */
  function startLeaving(id: string, wait: number) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    window.clearTimeout(leaveTimers.current.get(id));
    setLeaving((current) => new Map(current).set(id, wait));
    leaveTimers.current.set(
      id,
      window.setTimeout(
        () => {
          leaveTimers.current.delete(id);
          setLeaving((current) => {
            const next = new Map(current);
            next.delete(id);
            return next;
          });
        },
        wait + LEAVE_MS + 20,
      ),
    );
  }

  function addRole(id: string) {
    // Taken out and put straight back: the card stays.
    window.clearTimeout(leaveTimers.current.get(id));
    leaveTimers.current.delete(id);
    setLeaving((current) => {
      if (!current.has(id)) return current;
      const next = new Map(current);
      next.delete(id);
      return next;
    });
    onAddPick(id);
  }

  function removeOne(id: string, wait = 0) {
    if (quantity(id) === 1) startLeaving(id, wait);
    onRemovePick(id);
  }

  function openPicker(faction: Team) {
    setSearch('');
    setPicking(faction);
  }

  function openCard(role: PoolRole) {
    setRuleDraft(role.rule[locale]);
    setViewingId(role.id);
  }

  function closeCard() {
    // A card cannot be left without a rule: an emptied one keeps the rule it had.
    const draft = ruleDraft.trim();
    if (viewing && draft && draft !== viewing.rule[locale].trim()) onEditRule(viewing.id, draft);
    setViewingId(null);
  }

  function openSettings() {
    setTimer(String(settings.timerSeconds));
    setShowSettings(true);
  }

  function closeSettings() {
    // A number outside the timer's range is pulled into it; anything else leaves the timer as it was.
    const typed = Number.parseInt(timer, 10);
    if (!Number.isNaN(typed)) {
      const timerSeconds = Math.min(TIMER_MAX, Math.max(0, typed));
      if (timerSeconds !== settings.timerSeconds) onSettings({ ...settings, timerSeconds });
    }
    setShowSettings(false);
  }

  function openCreator() {
    setCreating(true);
    setError(false);
    setName('');
    setRule('');
    setTeam(picking ?? 'village');
    setWakes(false);
  }

  const query = nameKey(search);
  const pool = roles.filter(
    (role) => role.team === picking && (!query || nameKey(role.name[locale]).includes(query)),
  );

  return (
    <ScreenLayout
      title={t('screens.setup')}
      onOpenMenu={openSettings}
      footer={
        <>
          {/* Always one line, so the footer keeps its height as the count changes. */}
          <p key={gapText} role="status" className="name-pop text-center text-caption text-muted">
            {gapText}
          </p>
          <Button
            disabled={!matched || reconnecting}
            className="press"
            onClick={() => {
              onReady(waking.map((role) => role.id));
            }}
          >
            {t('setup.ready')}
          </Button>
        </>
      }
    >
      <RoomPanel
        roomName={roomName}
        pin={pin}
        players={players}
        open={open}
        offlineError={roomError === 'player-offline'}
        onToggleOpen={onToggleOpen}
        onRemove={onRemove}
        onHandOver={onHandOver}
      />
      {FACTION_ORDER.map((faction) => {
        const chosen = roles.filter(
          (role) => role.team === faction && (quantity(role.id) > 0 || leaving.has(role.id)),
        );
        return (
          <FactionSection
            key={faction}
            team={faction}
            count={chosen.reduce((total, role) => total + quantity(role.id), 0)}
          >
            {chosen.map((role) => {
              const count = quantity(role.id);
              return (
                <li
                  key={role.id}
                  className={`aspect-2/3 ${count > 0 ? 'card-in' : 'card-out'}`}
                  style={
                    count > 0
                      ? undefined
                      : { animationDelay: `${String(leaving.get(role.id) ?? 0)}ms` }
                  }
                >
                  <ThumbnailCard
                    role={role}
                    count={count}
                    label={t('setup.editRole', { role: role.name[locale] })}
                    onClick={() => {
                      openCard(role);
                    }}
                  />
                </li>
              );
            })}
            <li className="aspect-2/3">
              <AddCard
                label={t(ADD_LABEL[faction])}
                onClick={() => {
                  openPicker(faction);
                }}
              />
            </li>
          </FactionSection>
        );
      })}
      {picking && (
        <Modal
          sheet
          steady
          footer={<ModalDone />}
          title={t(ADD_LABEL[picking])}
          onClose={() => {
            setPicking(null);
          }}
        >
          <p key={gapText} className="name-pop mb-3 text-caption text-muted">
            {gapText}
          </p>
          <div className="mb-3 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={searchId} className="sr-only">
                {t('setup.search')}
              </label>
              <input
                id={searchId}
                type="search"
                placeholder={t('setup.search')}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                className="min-h-12 w-full min-w-0 rounded-control border border-field-border bg-field px-3 py-2.5 font-sans text-body text-ink placeholder:text-muted"
              />
            </div>
            <Button variant="secondary" aria-label={t('setup.custom')} onClick={openCreator}>
              <Icon name="plus" />
              {t('setup.customShort')}
            </Button>
          </div>
          {pool.length === 0 ? (
            <p className="name-pop py-6 text-center text-control text-muted">
              {t('setup.noMatch')}
            </p>
          ) : (
            // Top padding leaves room for the "−" over the first row's corners.
            <ul className="grid grid-cols-3 gap-2 pt-3 pb-1">
              {pool.map((role) => {
                const count = quantity(role.id);
                return (
                  <li key={role.id} className="card-in aspect-2/3">
                    <ThumbnailCard
                      role={role}
                      count={count > 0 ? count : undefined}
                      label={t('setup.addRole', { role: role.name[locale] })}
                      onClick={() => {
                        addRole(role.id);
                      }}
                      decreaseLabel={t('setup.removeRole', { role: role.name[locale] })}
                      onDecrease={() => {
                        removeOne(role.id);
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Modal>
      )}
      {viewing && (
        <DetailedCard
          role={viewing}
          count={quantity(viewing.id)}
          editRule={{
            value: ruleDraft,
            label: t('setup.rule'),
            onChange: setRuleDraft,
          }}
          quantity={{
            value: quantity(viewing.id),
            canIncrease: true,
            decreaseLabel: t('setup.removeRole', { role: viewing.name[locale] }),
            increaseLabel: t('setup.addRole', { role: viewing.name[locale] }),
            onDecrease: () => {
              // The card is on its way out too, so wait for it to close before the grid card shrinks.
              removeOne(viewing.id, LEAVE_MS);
            },
            onIncrease: () => {
              addRole(viewing.id);
            },
          }}
          onClose={closeCard}
        />
      )}
      {showSettings && (
        <Modal sheet title={t('setup.settings')} onClose={closeSettings}>
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
            <DeleteRoomButton
              disabled={reconnecting}
              failed={roomError === 'try-again'}
              onDelete={onDelete}
            />
          </div>
        </Modal>
      )}
      {creating && (
        <Modal
          sheet
          title={t('setup.custom')}
          onClose={() => {
            setCreating(false);
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
              onAddCustomRole({ name: name.trim(), rule: rule.trim(), team, wakes });
              setCreating(false);
            }}
          >
            <TextField
              label={t('setup.name')}
              value={name}
              maxLength={ROLE_NAME_MAX}
              onChange={(event) => {
                setName(event.target.value);
              }}
              error={error ? t('setup.roleRequired') : undefined}
            />
            <NoteField
              label={t('setup.rule')}
              rows={3}
              value={rule}
              maxLength={RULE_MAX}
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
                  setTeam(TEAMS.find((option) => option === event.target.value) ?? 'village');
                }}
              >
                {TEAMS.map((option) => (
                  <option key={option} value={option}>
                    {t(`faction.${option}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-12 items-center gap-3 text-control">
              <input
                className="size-5 accent-ink"
                type="checkbox"
                checked={wakes}
                onChange={(event) => {
                  setWakes(event.target.checked);
                }}
              />
              {t('setup.wakes')}
            </label>
            <Button type="submit">{t('common.save')}</Button>
          </form>
        </Modal>
      )}
    </ScreenLayout>
  );
}
