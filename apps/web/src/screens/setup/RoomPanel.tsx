import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Modal, ModalDone } from '../../components/Modal';
import { PlayerChip } from '../../components/PlayerChip';
import type { PlayerListItem } from '../types';

/**
 * The room at the top of setup: its name, whether others can still join, the players who have
 * joined (in a sheet, where one can be removed), and closing or re-opening the room.
 */
export function RoomPanel({
  roomName,
  players,
  open,
  onToggleOpen,
  onRemove,
}: {
  roomName: string;
  players: readonly PlayerListItem[];
  open: boolean;
  onToggleOpen: () => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [showPlayers, setShowPlayers] = useState(false);
  const [removing, setRemoving] = useState<PlayerListItem | null>(null);
  return (
    <section aria-label={t('lobby.room')} className="panel grid gap-3 p-4">
      {/* The chip moves under the name when both do not fit on one line. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="min-w-0 font-display text-title font-semibold break-words">{roomName}</h2>
        <p
          key={String(open)}
          role="status"
          className={`name-pop inline-flex shrink-0 items-center gap-2 rounded-full bg-field px-3 py-1 text-caption font-medium ${open ? 'text-ink' : 'text-muted'}`}
        >
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${open ? 'live-dot bg-live' : 'bg-muted'}`}
          />
          {t(open ? 'lobby.openChip' : 'lobby.closedChip')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="press"
          onClick={() => {
            setShowPlayers(true);
          }}
        >
          <Icon name="person" className="size-4" />
          <span key={players.length} className="count-pop">
            {t('lobby.playersButton', { count: players.length })}
          </span>
        </Button>
        <Button variant="secondary" className="press" onClick={onToggleOpen}>
          {t(open ? 'lobby.close' : 'lobby.reopen')}
        </Button>
      </div>
      {showPlayers && (
        <Modal
          sheet
          footer={<ModalDone />}
          title={t('lobby.playersButton', { count: players.length })}
          onClose={() => {
            setShowPlayers(false);
          }}
        >
          <p className="mb-3 text-caption text-muted">
            {t(open ? 'lobby.openHint' : 'lobby.closedHint')}
          </p>
          {players.length === 0 ? (
            <p className="panel p-3.5 text-control text-muted">{t('lobby.noPlayers')}</p>
          ) : (
            <ul className="panel divide-y divide-line overflow-hidden">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="name-pop flex min-h-12 items-center justify-between gap-3 pl-3.5"
                >
                  <PlayerChip name={player.name} />
                  <Button
                    variant="quiet"
                    size="icon"
                    className="press"
                    aria-label={t('player.remove', { name: player.name })}
                    onClick={() => {
                      setRemoving(player);
                    }}
                  >
                    <Icon name="close" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
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
                onRemove(removing.id);
                setRemoving(null);
              }}
            >
              {t('common.remove')}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
