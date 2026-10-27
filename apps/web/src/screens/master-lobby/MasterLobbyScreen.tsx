import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { PlayerChip } from '../../components/PlayerChip';
import { ScreenLayout } from '../../components/ScreenLayout';
import type { PlayerListItem } from '../types';

export function MasterLobbyScreen({
  roomName,
  players: initialPlayers,
  onPrepare,
}: {
  roomName: string;
  players: readonly PlayerListItem[];
  onPrepare: () => void;
}) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState(initialPlayers);
  const [open, setOpen] = useState(true);
  const [removing, setRemoving] = useState<PlayerListItem | null>(null);
  return (
    <ScreenLayout
      title={t('screens.masterLobby')}
      footer={
        <Button onClick={onPrepare} disabled={players.length === 0}>
          {t('lobby.prepare')}
        </Button>
      }
    >
      <section aria-label={t('lobby.room')} className="folio p-3.5">
        <p className="text-caption text-muted">{t('lobby.room')}</p>
        <h2 className="font-display text-heading font-semibold">{roomName}</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p
            role="status"
            className={`inline-flex items-center gap-1.5 text-caption ${open ? 'text-alive' : 'text-muted'}`}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {t(open ? 'lobby.openHint' : 'lobby.closedHint')}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setOpen(!open);
            }}
          >
            {t(open ? 'lobby.close' : 'lobby.reopen')}
          </Button>
        </div>
      </section>
      <section>
        <h2 className="mb-1.5 px-0.5 text-caption text-muted">
          {t('common.countPlayers', { count: players.length })}
        </h2>
        {players.length === 0 && (
          <p className="folio p-3.5 text-control text-muted">{t('lobby.noPlayers')}</p>
        )}
        <ul className="folio divide-y divide-line overflow-hidden empty:hidden">
          {players.map((player) => (
            <li key={player.id} className="flex min-h-12 items-center justify-between gap-3 pl-3.5">
              <PlayerChip name={player.name} />
              <Button
                variant="quiet"
                aria-label={t('player.remove', { name: player.name })}
                size="icon"
                onClick={() => {
                  setRemoving(player);
                }}
              >
                <Icon name="close" />
              </Button>
            </li>
          ))}
        </ul>
      </section>
      {removing && (
        <Modal
          title={t('lobby.removeTitle')}
          onClose={() => {
            setRemoving(null);
          }}
        >
          <p className="mb-5 text-control">{t('lobby.removeBody', { name: removing.name })}</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="quiet"
              onClick={() => {
                setRemoving(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setPlayers(players.filter((player) => player.id !== removing.id));
                setRemoving(null);
              }}
            >
              {t('common.remove')}
            </Button>
          </div>
        </Modal>
      )}
    </ScreenLayout>
  );
}
