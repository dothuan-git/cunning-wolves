import { useState } from 'react';
import { readMyRooms } from '../../realtime/myRooms';
import { useLobby } from '../../realtime/useLobby';
import { navigate, paths } from '../../router';
import { RoomListScreen } from './RoomListScreen';

/** The live room list. */
export function HomeScreen() {
  const { status, rooms } = useLobby();
  // Read once: rooms are remembered or forgotten on the room screen, never while home is open.
  const [mine] = useState(() => new Set(readMyRooms()));
  return (
    <RoomListScreen
      rooms={rooms ?? []}
      mine={mine}
      // The list stays on screen while reconnecting; it is only replaced before it first arrives.
      status={rooms ? 'ready' : status === 'connecting' ? 'loading' : 'error'}
      onCreate={() => {
        navigate(paths.create);
      }}
      onJoin={(id) => {
        navigate(paths.room(id));
      }}
      onRules={() => {
        navigate(paths.rules);
      }}
      onRetry={() => {
        // The connection already retries with backoff; a reload starts over at once.
        window.location.reload();
      }}
    />
  );
}
