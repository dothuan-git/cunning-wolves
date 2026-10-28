import { useEffect, useState } from 'react';
import { LobbyConnection, type LobbySnapshot } from './LobbyConnection';
import { wakeOnReturn } from './wake';

/** The live room list, while the home screen is mounted. */
export function useLobby(): LobbySnapshot {
  const [snapshot, setSnapshot] = useState<LobbySnapshot>({ status: 'connecting', rooms: null });

  useEffect(() => {
    const connection = new LobbyConnection();
    const unsubscribe = connection.subscribe(setSnapshot);
    connection.start();
    const stopWaking = wakeOnReturn(connection);
    return () => {
      stopWaking();
      unsubscribe();
      connection.stop();
    };
  }, []);

  return snapshot;
}
