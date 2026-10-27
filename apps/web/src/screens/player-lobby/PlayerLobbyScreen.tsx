import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { PlayerChip } from '../../components/PlayerChip';
import { ScreenLayout } from '../../components/ScreenLayout';
import type { PlayerListItem } from '../types';

export function PlayerLobbyScreen({
  roomName,
  players,
  onLeave,
  reconnecting = false,
  removed = false,
}: {
  roomName: string;
  players: readonly PlayerListItem[];
  onLeave: () => void;
  reconnecting?: boolean;
  removed?: boolean;
}) {
  const { t } = useTranslation();
  if (removed)
    return (
      <ScreenLayout
        title={t('screens.playerLobby')}
        footer={<Button onClick={onLeave}>{t('common.back')}</Button>}
      >
        <div className="folio grid gap-2 p-3.5" role="alert">
          <h2 className="font-display text-heading font-semibold">{t('lobby.removed')}</h2>
          <p className="text-control text-muted">{t('lobby.removedHint')}</p>
        </div>
      </ScreenLayout>
    );
  return (
    <ScreenLayout
      title={t('screens.playerLobby')}
      footer={
        <Button variant="quiet" onClick={onLeave}>
          {t('lobby.leave')}
        </Button>
      }
    >
      <section className="folio flex items-start gap-3 p-3.5">
        <Icon name="moon" className="mt-1 size-6 text-ochre" />
        <div className="min-w-0">
          <h2 className="font-display text-heading font-semibold">{roomName}</h2>
          <p className="text-control text-muted">{t('lobby.waitingBody')}</p>
          <p
            role="status"
            className={`mt-2 inline-flex items-center gap-1.5 text-caption ${reconnecting ? 'text-ochre' : 'text-alive'}`}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {t(reconnecting ? 'preview.reconnecting' : 'lobby.ready')}
          </p>
        </div>
      </section>
      <section>
        <h2 className="mb-1.5 px-0.5 text-caption text-muted">
          {t('common.countPlayers', { count: players.length })}
        </h2>
        <ul className="folio divide-y divide-line">
          {players.map((player, index) => (
            <li key={player.id} className="flex min-h-12 items-center px-3.5 py-1.5">
              <PlayerChip name={player.name} detail={index === 0 ? t('player.you') : undefined} />
            </li>
          ))}
        </ul>
      </section>
    </ScreenLayout>
  );
}
