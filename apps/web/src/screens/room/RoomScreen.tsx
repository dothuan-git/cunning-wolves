import {
  gameRoles,
  ROLE_POOL,
  roomRoles,
  wakingOrder,
  type MasterView,
  type PlayerView,
  type ServerErrorCode,
} from '@werewolf/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useRoomConnection } from '../../realtime/useRoomConnection';
import { navigate, paths } from '../../router';
import { NameEntryScreen } from '../name-entry/NameEntryScreen';
import { readSavedName, saveName } from '../name-entry/savedName';
import { MyCardScreen } from '../my-card/MyCardScreen';
import { NarratorScreen } from '../narrator/NarratorScreen';
import { nextPhase } from '../narrator/phase';
import { PlayerLobbyScreen } from '../player-lobby/PlayerLobbyScreen';
import { RulesReviewScreen } from '../rules-review/RulesReviewScreen';
import { SetupScreen } from '../setup/SetupScreen';
import type { Phase, RoleGroupItem } from '../types';

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
    const reconnecting = status !== 'connected';
    if (view.room.status === 'reveal') {
      return (
        <RulesReviewScreen
          roles={gameRoles(setup)}
          master={{
            reconnecting,
            onBack: () => send({ type: 'backToSetup' }),
            onStart: () => send({ type: 'startGame' }),
          }}
        />
      );
    }
    if (view.room.status !== 'lobby') return <NarratorRoom view={view} />;
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
        reconnecting={reconnecting}
        onAddPick={(roleId) => send({ type: 'addPick', roleId })}
        onRemovePick={(roleId) => send({ type: 'removePick', roleId })}
        onEditRule={(roleId, rule) => send({ type: 'editRule', roleId, rule })}
        onAddCustomRole={(role) => send({ type: 'addCustomRole', role })}
        onWakeOrder={(order) => send({ type: 'setWakeOrder', order })}
        onSettings={(settings) => send({ type: 'setSettings', settings })}
        // The wake order is already in the room; the room checks roles = players again.
        onReady={() => send({ type: 'review' })}
      />
    );
  }
  return <PlayerRoom view={view} error={error} reconnecting={status !== 'connected'} send={send} />;
}

/**
 * The narrator page on the real deal. Phases, deaths and notes live here until the room keeps them
 * (Phase 5), so a refresh starts again at Night 1.
 */
function NarratorRoom({ view }: { view: MasterView }) {
  const { setup, assignments, players } = view;
  const groups = useMemo<RoleGroupItem[]>(() => {
    const picked = gameRoles(setup).map(({ role }) => role);
    const waking = wakingOrder(roomRoles(setup), setup.picks, setup.wakeOrder);
    const resting = picked.filter((role) => role.defaultWakeOrder === null);
    return [...waking, ...resting].map((role) => ({
      role,
      players: players
        .filter((player) =>
          assignments.some(
            (assignment) => assignment.playerId === player.id && assignment.roleId === role.id,
          ),
        )
        .map(({ id, name }) => ({ id, name })),
    }));
  }, [setup, assignments, players]);
  const [phase, setPhase] = useState<Phase>({ kind: 'night', number: 1 });
  const [deaths, setDeaths] = useState<Record<string, Phase>>({});
  const [notes, setNotes] = useState<Record<number, Record<string, string>>>({});
  return (
    <NarratorScreen
      groups={groups}
      phase={phase}
      notes={notes}
      deaths={deaths}
      onPlayerNote={(night, playerId, text) => {
        setNotes((current) => ({ ...current, [night]: { ...current[night], [playerId]: text } }));
      }}
      onTogglePlayer={(playerId) => {
        setDeaths((current) =>
          playerId in current
            ? Object.fromEntries(Object.entries(current).filter(([id]) => id !== playerId))
            : { ...current, [playerId]: phase },
        );
      }}
      onEndPhase={() => {
        setPhase(nextPhase);
      }}
    />
  );
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

  if (view.seat === 'joined' && view.card) {
    return <MyCardScreen role={view.card} />;
  }

  if (view.seat === 'joined' && view.roles.length > 0) {
    return <RulesReviewScreen roles={view.roles} />;
  }

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
