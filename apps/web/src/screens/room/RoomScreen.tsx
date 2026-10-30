import {
  gameJournal,
  gameRoles,
  currentRole,
  offersNewRoles,
  ROLE_POOL,
  roomRoles,
  wakingOrder,
  type Assignment,
  type GameState,
  type MasterView,
  type PlayerInfo,
  type PlayerView,
  type RoomRole,
  type ServerErrorCode,
} from '@werewolf/shared';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ScreenLayout } from '../../components/ScreenLayout';
import { forgetRoom, rememberRoom } from '../../realtime/myRooms';
import { useRoomConnection } from '../../realtime/useRoomConnection';
import { navigate, paths } from '../../router';
import { NameEntryScreen } from '../name-entry/NameEntryScreen';
import { readSavedName, saveName } from '../name-entry/savedName';
import { MyCardScreen } from '../my-card/MyCardScreen';
import { NarratorScreen } from '../narrator/NarratorScreen';
import { PlayerLobbyScreen } from '../player-lobby/PlayerLobbyScreen';
import { RulesReviewScreen } from '../rules-review/RulesReviewScreen';
import { SetupScreen } from '../setup/SetupScreen';
import { SummaryScreen } from '../summary/SummaryScreen';
import type { GroupPlayerItem, RoleChoices, RoleGroupItem } from '../types';

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

type Send = ReturnType<typeof useRoomConnection>['send'];
/** The refusals the narrator's screens explain; the rest only reach the console. */
type MasterError = 'player-offline' | 'try-again' | null;

/** One room, for whoever is looking: the master gets setup, everyone else joins and waits. */
export function RoomScreen({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const { status, view, error, send } = useRoomConnection(roomId);
  const isMaster = view?.kind === 'master';
  const seated = isMaster || (view?.kind === 'player' && view.seat === 'joined');
  const removed = view?.kind === 'player' && view.seat === 'removed';
  const ended = status === 'gone' || status === 'deleted';

  // Home keeps rooms this phone belongs to tappable, even when closed or in play.
  useEffect(() => {
    if (ended || removed) forgetRoom(roomId);
    else if (seated) rememberRoom(roomId);
  }, [roomId, ended, removed, seated]);

  // The narrator deleted it from this phone: straight home, nothing to explain.
  useEffect(() => {
    if (status === 'deleted' && isMaster) navigate(paths.home, { replace: true });
  }, [status, isMaster]);

  if (status === 'gone') return <Notice title={t('room.goneTitle')} body={t('room.goneBody')} />;
  if (status === 'deleted') {
    return <Notice title={t('room.deletedTitle')} body={t('room.deletedBody')} />;
  }
  if (status === 'replaced') {
    return <Notice title={t('room.replacedTitle')} body={t('room.replacedBody')} />;
  }
  if (!view) return <Notice live title={t('room.connecting')} body={t('lobby.seatKept')} />;

  if (view.kind === 'master') {
    const { setup } = view;
    const reconnecting = status !== 'connected';
    const masterError: MasterError =
      error === 'player-offline' || error === 'try-again' ? error : null;
    const onDelete = () => {
      send({ type: 'deleteRoom' });
    };
    if (view.room.status === 'reveal') {
      return (
        <RulesReviewScreen
          roles={gameRoles(setup)}
          master={{
            reconnecting,
            onBack: () => send({ type: 'backToSetup' }),
            onStart: () => send({ type: 'startGame' }),
            settings: setup.settings,
            waking: wakingOrder(roomRoles(setup), setup.picks, setup.wakeOrder),
            onSettings: (settings) => send({ type: 'setSettings', settings }),
            onWakeOrder: (order) => send({ type: 'setWakeOrder', order }),
            onDelete,
            deleteFailed: masterError === 'try-again',
          }}
        />
      );
    }
    if (view.room.status === 'finished') {
      return (
        <SummaryRoom
          roomName={view.room.name}
          players={view.players}
          roles={roomRoles(setup)}
          assignments={view.assignments}
          game={view.game ?? FIRST_NIGHT}
          onPlayAgain={() => send({ type: 'playAgain' })}
          onDelete={onDelete}
          deleteFailed={masterError === 'try-again'}
        />
      );
    }
    if (view.room.status !== 'lobby') {
      return (
        <NarratorRoom
          view={view}
          reconnecting={reconnecting}
          deleteFailed={masterError === 'try-again'}
          send={send}
        />
      );
    }
    return (
      <SetupScreen
        roomName={view.room.name}
        pin={view.pin}
        players={view.players}
        open={view.room.open}
        roomError={masterError}
        onToggleOpen={() => send({ type: 'setOpen', open: !view.room.open })}
        onRemove={(playerId) => send({ type: 'kick', playerId })}
        onHandOver={(playerId) => send({ type: 'handOver', playerId })}
        onDelete={onDelete}
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

const FIRST_NIGHT: GameState = {
  phase: { kind: 'night', number: 1 },
  deaths: {},
  notes: {},
  newRoles: {},
};

/** The narrator page: the room keeps the deal, phases, deaths, notes and new roles. */
function NarratorRoom({
  view,
  reconnecting,
  deleteFailed,
  send,
}: {
  view: MasterView;
  reconnecting: boolean;
  deleteFailed: boolean;
  send: Send;
}) {
  const { setup, assignments, players } = view;
  const game = view.game ?? FIRST_NIGHT;
  const { newRoles } = game;
  const groups = useMemo<RoleGroupItem[]>(() => {
    const roles = roomRoles(setup);
    const picked = gameRoles(setup).map(({ role }) => role);
    const playing = (assignment: Assignment) =>
      currentRole(assignment.playerId, assignment.roleId, newRoles);
    // A role a power gave someone that nobody was dealt (the Thief's extra card) gets its own panel.
    const extra = roles.filter(
      (role) =>
        !setup.picks.includes(role.id) &&
        assignments.some((assignment) => playing(assignment) === role.id),
    );
    const waking = wakingOrder(
      roles,
      [...setup.picks, ...extra.map((role) => role.id)],
      setup.wakeOrder,
    );
    const resting = [...picked, ...extra].filter((role) => role.defaultWakeOrder === null);
    return [...waking, ...resting].map((role) => ({
      role,
      players: players.flatMap((player): GroupPlayerItem[] => {
        const assignment = assignments.find((known) => known.playerId === player.id);
        if (!assignment || playing(assignment) !== role.id) return [];
        const dealt =
          assignment.roleId === role.id
            ? undefined
            : roles.find((known) => known.id === assignment.roleId);
        return [
          dealt
            ? { id: player.id, name: player.name, dealt }
            : { id: player.id, name: player.name },
        ];
      }),
    }));
  }, [setup, assignments, players, newRoles]);
  const roleChoices = useMemo<RoleChoices | undefined>(() => {
    if (!offersNewRoles(assignments.map(({ roleId }) => roleId))) return undefined;
    const inGame = gameRoles(setup).map(({ role }) => role);
    const others = roomRoles(setup).filter(
      (role) => !role.custom && !inGame.some((known) => known.id === role.id),
    );
    return { inGame, others };
  }, [setup, assignments]);
  return (
    <NarratorScreen
      groups={groups}
      phase={game.phase}
      notes={game.notes}
      deaths={game.deaths}
      roleChoices={roleChoices}
      settings={setup.settings}
      reconnecting={reconnecting}
      onPlayerNote={(night, playerId, text) => send({ type: 'setNote', night, playerId, text })}
      onTogglePlayer={(playerId) => send({ type: 'toggleDeath', playerId })}
      onSetRole={(playerId, roleId) => send({ type: 'setRole', playerId, roleId })}
      onEndPhase={() => send({ type: 'endPhase', phase: game.phase })}
      onWakeOrder={(order) => send({ type: 'setWakeOrder', order })}
      onSettings={(settings) => send({ type: 'setSettings', settings })}
      onFinish={() => send({ type: 'finishGame' })}
      onDelete={() => send({ type: 'deleteRoom' })}
      deleteFailed={deleteFailed}
    />
  );
}

/** The game summary, for the narrator and every player alike. */
function SummaryRoom({
  roomName,
  players,
  roles,
  assignments,
  game,
  onPlayAgain,
  onDelete,
  deleteFailed,
}: {
  roomName: string;
  players: readonly PlayerInfo[];
  roles: readonly RoomRole[];
  assignments: readonly Assignment[];
  game: GameState;
  onPlayAgain?: () => void;
  onDelete?: () => void;
  deleteFailed?: boolean;
}) {
  // A new role may be a pool role nobody was dealt, so the pool backs up this game's roles.
  const findRole = (id: string | undefined) =>
    roles.find((known) => known.id === id) ?? ROLE_POOL.find((known) => known.id === id);
  const revealed = players.flatMap((player) => {
    const roleId = assignments.find((assignment) => assignment.playerId === player.id)?.roleId;
    const role = findRole(roleId);
    if (!role || roleId === undefined) return [];
    const playing = currentRole(player.id, roleId, game.newRoles);
    const newRole = playing === roleId ? undefined : findRole(playing);
    return [
      newRole
        ? { id: player.id, name: player.name, role, newRole }
        : { id: player.id, name: player.name, role },
    ];
  });
  const journal = gameJournal(game, players).map((entry) => ({
    ...entry,
    newRoles: entry.newRoles.flatMap((changed) => {
      const role = findRole(changed.role);
      return role ? [{ id: changed.id, name: changed.name, role }] : [];
    }),
  }));
  return (
    <SummaryScreen
      roomName={roomName}
      players={revealed}
      journal={journal}
      nights={game.phase.number}
      onHome={goHome}
      onPlayAgain={onPlayAgain}
      onDelete={onDelete}
      deleteFailed={deleteFailed}
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
  send: Send;
}) {
  const { t } = useTranslation();
  const [notSent, setNotSent] = useState(false);
  const [rejoining, setRejoining] = useState(false);

  if (view.seat === 'joined' && view.reveal) {
    return (
      <SummaryRoom
        roomName={view.room.name}
        players={view.players}
        roles={view.roles.map(({ role }) => role)}
        assignments={view.reveal.assignments}
        game={view.reveal.game}
      />
    );
  }

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
          if (send({ type: 'leave' })) forgetRoom(view.room.id);
          else console.warn('Left the room screen without leaving the seat');
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
      pinError={
        error === 'pin-wrong'
          ? t('nameEntry.pinWrong')
          : error === 'pin-locked'
            ? t('nameEntry.pinLocked')
            : undefined
      }
      formError={
        notSent
          ? t('nameEntry.notConnected')
          : error === 'room-closed' || (!view.room.open && error === null)
            ? t('nameEntry.closed')
            : undefined
      }
      onContinue={(name, _roomName, pin) => {
        saveName(name);
        setNotSent(!send({ type: 'join', name, pin }));
      }}
      onBack={goHome}
    />
  );
}
