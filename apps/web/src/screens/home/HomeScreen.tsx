import { useLobby } from '../../realtime/useLobby';
import { navigate, paths } from '../../router';
import { RoomListScreen } from './RoomListScreen';

/** The live room list. */
export function HomeScreen() {
  const { status, rooms } = useLobby();
  return (
    <RoomListScreen
      rooms={rooms ?? []}
      // The list stays on screen while reconnecting; it is only replaced before it first arrives.
      status={rooms ? 'ready' : status === 'connecting' ? 'loading' : 'error'}
      onCreate={() => {
        navigate(paths.create);
      }}
      onJoin={(id) => {
        navigate(paths.room(id));
      }}
      onRetry={() => {
        // The connection already retries with backoff; a reload starts over at once.
        window.location.reload();
      }}
    />
  );
}
