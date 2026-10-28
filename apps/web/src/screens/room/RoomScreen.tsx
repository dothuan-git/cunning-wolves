import { ROLE_POOL, roomRoles, type PlayerView, type ServerErrorCode } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useRoomConnection } from '../../realtime/useRoomConnection';
import { navigate, paths } from '../../router';
import { NameEntryScreen } from '../name-entry/NameEntryScreen';
import { readSavedName, saveName } from '../name-entry/savedName';
import { PlayerLobbyScreen } from '../player-lobby/PlayerLobbyScreen';
import { SetupScreen } from '../setup/SetupScreen';

function goHome() {
  navigate(paths.home);
}

/** A whole-screen notice with a way back to the room list. */
function Notice({ title, body, live }: { title: string; body: string; live?: boolean }) {
  const { t } = useTranslation();
  return (
    <ScreenLayout
      title={t('screens.playerLobby')}
      footer={
        <Button className="press" onClick={goHome}>
          {t('room.home')}
        </Button>
      }
    >
      <div className="panel grid gap-2 p-4" role={live ? 'status' : 'alert'}>
        <h2 className="font-display text-role font-semibold">{title}</h2>
        <p className="text-body text-muted">{body}</p>
      </div>
    </ScreenLayout>
  );
}

/** One room, for whoever is looking: the master gets setup, everyone else joins and waits. */
export function RoomScreen({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const { status, view, error, send } = useRoomConnection(roomId);

  if (status === 'gone') return <Notice title={t('room.goneTitle')} body={t('room.goneBody')} />;
  if (status === 'replaced') {
    return <Notice title={t('room.replacedTitle')} body={t('room.replacedBody')} />;
  }
  if (!view) return <Notice live title={t('room.connecting')} body={t('lobby.seatKept')} />;

  if (view.kind === 'master') {
    const { setup } = view;
    return (
      <SetupScreen
        roomName={view.room.name}
        players={view.players}
        open={view.room.open}
        onToggleOpen={() => send({ type: 'setOpen', open: !view.room.open })}
        onRemove={(playerId) => send({ type: 'kick', playerId })}
        roles={roomRoles(setup)}
        picks={setup.picks}
        wakeOrder={setup.wakeOrder}
        settings={setup.settings}
        reconnecting={status !== 'connected'}
        onAddPick={(roleId) => send({ type: 'addPick', roleId })}
        onRemovePick={(roleId) => send({ type: 'removePick', roleId })}
        onEditRule={(roleId, rule) => send({ type: 'editRule', roleId, rule })}
        onAddCustomRole={(role) => send({ type: 'addCustomRole', role })}
        onWakeOrder={(order) => send({ type: 'setWakeOrder', order })}
        onSettings={(settings) => send({ type: 'setSettings', settings })}
        // Dealing comes in a later phase; for now reviewing the rules closes the room.
        onReady={() => send({ type: 'setOpen', open: false })}
      />
    );
  }
  return <PlayerRoom view={view} error={error} reconnecting={status !== 'connected'} send={send} />;
}

function PlayerRoom({
  view,
  error,
  reconnecting,
  send,
}: {
  view: PlayerView;
  error: ServerErrorCode | null;
  reconnecting: boolean;
  send: ReturnType<typeof useRoomConnection>['send'];
}) {
  const { t } = useTranslation();
  const [notSent, setNotSent] = useState(false);
  const [rejoining, setRejoining] = useState(false);

  if (view.seat === 'joined') {
    return (
      <PlayerLobbyScreen
        roomName={view.room.name}
        players={view.players}
        roles={ROLE_POOL}
        selfId={view.you}
        reconnecting={reconnecting}
        onLeave={() => {
          // Leaving while reconnecting keeps the seat; the narrator can remove it.
          if (!send({ type: 'leave' }))
            console.warn('Left the room screen without leaving the seat');
          goHome();
        }}
      />
    );
  }

  if (view.seat === 'removed' && !rejoining) {
    return (
      <PlayerLobbyScreen
        removed
        roomName={view.room.name}
        players={[]}
        roles={ROLE_POOL}
        selfId={view.you}
        onLeave={goHome}
        onRejoin={
          view.room.open
            ? () => {
                setRejoining(true);
              }
            : undefined
        }
      />
    );
  }

  return (
    <NameEntryScreen
      mode="join"
      roomName={view.room.name}
      initialName={readSavedName()}
      nameError={
        error === 'name-taken'
          ? t('nameEntry.taken')
          : error === 'name-invalid'
            ? t('nameEntry.error')
            : undefined
      }
      formError={
        notSent
          ? t('nameEntry.notConnected')
          : error === 'room-closed' || (!view.room.open && error === null)
            ? t('nameEntry.closed')
            : undefined
      }
      onContinue={(name) => {
        saveName(name);
        setNotSent(!send({ type: 'join', name }));
      }}
      onBack={goHome}
    />
  );
}
