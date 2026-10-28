import { nameKey, type PoolRole, type Team } from '@werewolf/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddCard } from '../../components/AddCard';
import { Button } from '../../components/Button';
import { DetailedCard } from '../../components/DetailedCard';
import { FactionSection } from '../../components/FactionSection';
import { Icon } from '../../components/Icon';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { Modal, ModalDone } from '../../components/Modal';
import { ScreenLayout } from '../../components/ScreenLayout';
import { NoteField, TextField } from '../../components/TextField';
import { ThumbnailCard } from '../../components/ThumbnailCard';
import { WakeOrderSetting } from '../../components/WakeOrderSetting';
import { useLocale } from '../../i18n/useLocale';
import type { PlayerListItem } from '../types';
import { RoomPanel } from './RoomPanel';

// Wolves first, like the summary and the rules review.
const TEAMS: readonly Team[] = ['werewolf', 'village'];
// A card taken out of the game shrinks away this long before it leaves the grid.
const LEAVE_MS = 160;

export function SetupScreen({
  roomName,
  players,
  open,
  onToggleOpen,
  onRemove,
  roles: initialRoles,
  initialPicks,
  onReady,
}: {
  roomName: string;
  /** Players who have joined so far; more join while the roles are set up. */
  players: readonly PlayerListItem[];
  /** Whether new players can still join */
  open: boolean;
  onToggleOpen: () => void;
  onRemove: (playerId: string) => void;
  roles: readonly PoolRole[];
  /** Ids of the roles in the game, one per copy. There can be more or fewer than players. */
  initialPicks: readonly string[];
  /**
   * Called with the ids of the waking roles in the order the narrator will wake them.
   * Reviewing the rules closes the room: the roster is fixed from here on.
   */
  onReady: (wakeOrder: string[]) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [roles, setRoles] = useState(initialRoles);
  const [picks, setPicks] = useState(initialPicks);
  // The faction whose roles are being picked from, and what was typed to narrow them.
  const [picking, setPicking] = useState<Team | null>(null);
  const [search, setSearch] = useState('');
  // The selected role open as a detailed card.
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [name, setName] = useState('');
  const [rule, setRule] = useState('');
  const [team, setTeam] = useState<Team>('village');
  const [error, setError] = useState(false);
  const [sound, setSound] = useState(false);
  const [timer, setTimer] = useState('120');
  // The order the narrator reordered the waking roles into; roles not in it yet follow their default.
  const [customOrder, setCustomOrder] = useState<readonly string[]>([]);
  // The rule as it was when the detailed card opened, to put back if it is emptied.
  const ruleBefore = useRef('');
  // Roles just taken out of the game, still on the page while their card shrinks away.
  const [leaving, setLeaving] = useState<ReadonlyMap<string, number>>(new Map());
  const leaveTimers = useRef(new Map<string, number>());
  const searchId = useId();
  // Roles are chosen freely; the rules can only be reviewed once there is one per player.
  const gap = players.length - picks.length;
  const matched = gap === 0 && players.length > 0;
  const gapText =
    players.length === 0
      ? t('setup.noPlayers')
      : gap > 0
        ? t('setup.remaining', { count: gap })
        : gap < 0
          ? t('setup.tooMany', { count: -gap })
          : t('setup.allSeated');
  const viewing = roles.find((role) => role.id === viewingId);
  // The waking roles in the game, in wake order: the narrator's order first, then the rest by default.
  const waking = roles
    .filter((role) => role.defaultWakeOrder !== null && picks.includes(role.id))
    .sort((a, b) => {
      const place = (role: PoolRole) => {
        const index = customOrder.indexOf(role.id);
        return index < 0 ? customOrder.length + (role.defaultWakeOrder ?? 0) : index;
      };
      return place(a) - place(b);
    });

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
    setPicks((current) => [...current, id]);
  }

  function removeOne(id: string, wait = 0) {
    if (quantity(id) === 1) startLeaving(id, wait);
    setPicks((current) => {
      const index = current.lastIndexOf(id);
      return current.filter((_, pick) => pick !== index);
    });
  }

  function openPicker(faction: Team) {
    setSearch('');
    setPicking(faction);
  }

  function openCard(role: PoolRole) {
    ruleBefore.current = role.rule[locale];
    setViewingId(role.id);
  }

  function closeCard() {
    // A card cannot be left without a rule.
    if (viewing && !viewing.rule[locale].trim()) editRule(viewing.id, ruleBefore.current);
    setViewingId(null);
  }

  function editRule(id: string, value: string) {
    setRoles((current) =>
      current.map((role) =>
        role.id === id ? { ...role, rule: { ...role.rule, [locale]: value } } : role,
      ),
    );
  }

  function openCreator() {
    setCreating(true);
    setError(false);
    setName('');
    setRule('');
    setTeam(picking ?? 'village');
  }

  const query = nameKey(search);
  const pool = roles.filter(
    (role) => role.team === picking && (!query || nameKey(role.name[locale]).includes(query)),
  );

  return (
    <ScreenLayout
      title={t('screens.setup')}
      onOpenMenu={() => {
        setShowSettings(true);
      }}
      footer={
        <>
          {/* Always one line, so the footer keeps its height as the count changes. */}
          <p key={gapText} role="status" className="name-pop text-center text-caption text-muted">
            {gapText}
          </p>
          <Button
            disabled={!matched}
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
        players={players}
        open={open}
        onToggleOpen={onToggleOpen}
        onRemove={onRemove}
      />
      {TEAMS.map((faction) => {
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
                label={t(faction === 'werewolf' ? 'setup.addWerewolf' : 'setup.addVillage')}
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
          title={t(picking === 'werewolf' ? 'setup.addWerewolf' : 'setup.addVillage')}
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
            value: viewing.rule[locale],
            label: t('setup.rule'),
            onChange: (value) => {
              editRule(viewing.id, value);
            },
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
            {waking.length > 0 && (
              <WakeOrderSetting
                roles={waking}
                onChange={(order) => {
                  setCustomOrder(order.map((role) => role.id));
                }}
              />
            )}
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
              setCreating(false);
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
