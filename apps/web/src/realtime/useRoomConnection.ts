import type { RoomAction } from '@werewolf/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getDeviceToken } from './deviceToken';
import { RoomConnection, roomSocketUrl, type RoomSnapshot } from './RoomConnection';
import { wakeOnReturn } from './wake';

const INITIAL: RoomSnapshot = { status: 'connecting', view: null, error: null };

/** Connects this phone to a room while mounted. Key the screen by room id so a new room starts clean. */
export function useRoomConnection(roomId: string): RoomSnapshot & {
  send: (action: RoomAction) => boolean;
} {
  const [snapshot, setSnapshot] = useState<RoomSnapshot>(INITIAL);
  const connectionRef = useRef<RoomConnection | null>(null);

  useEffect(() => {
    const connection = new RoomConnection(roomSocketUrl(roomId), getDeviceToken());
    connectionRef.current = connection;
    const unsubscribe = connection.subscribe(setSnapshot);
    connection.start();
    const stopWaking = wakeOnReturn(connection);
    return () => {
      stopWaking();
      unsubscribe();
      connection.stop();
      connectionRef.current = null;
    };
  }, [roomId]);

  const send = useCallback(
    (action: RoomAction) => connectionRef.current?.send(action) ?? false,
    [],
  );
  return { ...snapshot, send };
}
