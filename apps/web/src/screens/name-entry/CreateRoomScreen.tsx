import type { CreateRoomRequest, CreateRoomResponse } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDeviceToken } from '../../realtime/deviceToken';
import { rememberRoom } from '../../realtime/myRooms';
import { navigate, paths } from '../../router';
import { NameEntryScreen } from './NameEntryScreen';
import { readSavedName, saveName } from './savedName';

function isCreateRoomResponse(value: unknown): value is CreateRoomResponse {
  return (
    typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string'
  );
}

/** Names the master and the room, opens it, and goes straight to its setup. */
export function CreateRoomScreen() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function create(name: string, roomName: string, pin: string) {
    saveName(name);
    setBusy(true);
    setFailed(false);
    try {
      const body: CreateRoomRequest = { token: getDeviceToken(), name, roomName, pin };
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
      const data: unknown = await response.json();
      if (!isCreateRoomResponse(data)) throw new Error('Unexpected create-room response');
      rememberRoom(data.id);
      // Replace, so Back from setup goes home rather than to this form.
      navigate(paths.room(data.id), { replace: true });
    } catch (error) {
      console.error('POST /api/rooms failed', error);
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <NameEntryScreen
      mode="create"
      initialName={readSavedName()}
      busy={busy}
      formError={failed ? t('nameEntry.createFailed') : undefined}
      onContinue={(name, roomName, pin) => {
        void create(name, roomName, pin);
      }}
      onBack={() => {
        navigate(paths.home);
      }}
    />
  );
}
