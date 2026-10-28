import type { PoolRole } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ScrollArea } from '../../components/ScrollArea';
import type { PlayerListItem } from '../types';
import { RoleCarousel } from './RoleCarousel';

/** The first letter of a name, as one whole character even when it carries Vietnamese marks. */
function initial(name: string) {
  const first = Array.from(name.trim().normalize('NFC'))[0];
  return first ? first.toLocaleUpperCase() : '?';
}

export function PlayerLobbyScreen({
  roomName,
  players,
  roles,
  selfId,
  onLeave,
  reconnecting = false,
  removed = false,
}: {
  roomName: string;
  players: readonly PlayerListItem[];
  /** The role cards waiting players can look at. */
  roles: readonly PoolRole[];
  /** This device's own player, highlighted in the list. */
  selfId: string;
  onLeave: () => void;
  reconnecting?: boolean;
  removed?: boolean;
}) {
  const { t } = useTranslation();
  const [pickedId, setPickedId] = useState<string | null>(null);
  if (removed)
    return (
      <ScreenLayout
        title={t('screens.playerLobby')}
        footer={<Button onClick={onLeave}>{t('common.back')}</Button>}
      >
        <div className="panel grid gap-2 p-3.5" role="alert">
          <h2 className="font-display text-heading font-semibold">{t('lobby.removed')}</h2>
          <p className="text-control text-muted">{t('lobby.removedHint')}</p>
        </div>
      </ScreenLayout>
    );
  const picked = players.find((player) => player.id === pickedId);
  return (
    <ScreenLayout
      fixed
      title={t('screens.playerLobby')}
      footer={
        <Button variant="quiet" className="press" onClick={onLeave}>
          {t('lobby.leave')}
        </Button>
      }
    >
      <section className="panel grid shrink-0 gap-2 p-4">
        {/* The chip moves under the name when both do not fit on one line. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="min-w-0 font-display text-title font-semibold break-words">{roomName}</h2>
          <p
            role="status"
            className={`inline-flex shrink-0 items-center gap-2 rounded-full bg-field px-3 py-1 text-caption font-medium ${reconnecting ? 'text-muted' : 'text-ink'}`}
          >
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${reconnecting ? 'bg-muted' : 'live-dot bg-live'}`}
            />
            {t(reconnecting ? 'lobby.reconnecting' : 'lobby.ready')}
          </p>
        </div>
        <p className="text-body text-muted">
          {t(reconnecting ? 'lobby.seatKept' : 'lobby.waitingBody')}
        </p>
      </section>
      <RoleCarousel roles={roles} />
      {/* The players sit at the bottom. With many of them, only this section scrolls. */}
      <section className="players flex shrink-0 flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="shrink-0 text-caption text-muted">
            {t('common.countPlayers', { count: players.length })}
          </h2>
          {/* Name and hint share one size, so picking a tile never changes this row's height. */}
          <p
            key={picked?.id ?? 'hint'}
            aria-live="polite"
            className={`name-pop min-w-0 text-right text-caption break-words ${picked ? 'font-medium text-ink' : 'text-muted'}`}
          >
            {picked
              ? picked.id === selfId
                ? t('player.nameYou', { name: picked.name })
                : picked.name
              : t('lobby.tapForName')}
          </p>
        </div>
        {/* Padding makes room for the glow around your own tile, which the scroll area would clip.
            No negative bottom margin: the footer would cover the peeking third row. */}
        <ScrollArea className="players-scroll -mx-3 -mt-3 p-3">
          <ul className="grid grid-cols-5 content-start gap-2">
            {players.map((player) => {
              const self = player.id === selfId;
              return (
                <li
                  key={player.id}
                  aria-current={self ? 'true' : undefined}
                  className="aspect-square"
                >
                  <button
                    type="button"
                    aria-pressed={pickedId === player.id}
                    onClick={() => {
                      setPickedId(pickedId === player.id ? null : player.id);
                    }}
                    className={`press relative flex size-full items-center justify-center rounded-tile font-display text-title font-semibold text-ink outline-2 outline-offset-2 focus-visible:outline-village ${self ? 'bg-field shadow-glow' : 'bg-surface'} ${pickedId === player.id ? 'outline-ink' : 'outline-transparent'}`}
                  >
                    <span aria-hidden="true">{initial(player.name)}</span>
                    <span className="sr-only">
                      {self ? t('player.nameYou', { name: player.name }) : player.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </section>
    </ScreenLayout>
  );
}
