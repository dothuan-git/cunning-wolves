import { useEffect, useState } from 'react';
import { getDeviceToken } from './deviceToken';
import { RoomConnection, roomSocketUrl, type RoomSnapshot } from './RoomConnection';

/** Connects this phone to a room for as long as the component is mounted. */
export function useRoomConnection(roomId: string): RoomSnapshot {
  const [snapshot, setSnapshot] = useState<RoomSnapshot>({ status: 'connecting', view: null });

  useEffect(() => {
    const connection = new RoomConnection(roomSocketUrl(roomId), getDeviceToken());
    const unsubscribe = connection.subscribe(setSnapshot);
    connection.start();

    // Phones drop sockets on screen lock and network changes; check again as soon as they're back.
    const wake = () => {
      if (document.visibilityState === 'visible') connection.wake();
    };
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', wake);

    return () => {
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', wake);
      unsubscribe();
      connection.stop();
    };
  }, [roomId]);

  return snapshot;
}
