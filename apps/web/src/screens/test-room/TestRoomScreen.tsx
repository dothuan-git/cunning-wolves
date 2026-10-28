import { ROOM_ID_PATTERN } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useRoomConnection } from '../../realtime/useRoomConnection';
import type { ConnectionStatus } from '../../realtime/RoomConnection';

// Temporary (Phase 1): proves phones connect to a room and survive a refresh. Phase 2's lobby replaces it.
export function TestRoomScreen({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  if (!ROOM_ID_PATTERN.test(roomId)) {
    return (
      <ScreenLayout title={t('testRoom.title')}>
        <div className="panel grid gap-2 p-4" role="alert">
          <h2 className="font-display text-role font-semibold">{t('testRoom.badRoom')}</h2>
          <p className="text-body text-muted">{t('testRoom.badRoomHint')}</p>
        </div>
      </ScreenLayout>
    );
  }
  return <ConnectedRoom roomId={roomId} />;
}

const STATUS_KEY = {
  connecting: 'testRoom.connecting',
  connected: 'testRoom.connected',
  reconnecting: 'testRoom.reconnecting',
  replaced: 'testRoom.replaced',
} as const satisfies Record<ConnectionStatus, string>;

function ConnectedRoom({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const { status, view } = useRoomConnection(roomId);
  const live = status === 'connected';
  return (
    <ScreenLayout title={t('testRoom.title')}>
      <section className="panel grid gap-2 p-4">
        {/* The chip moves under the name when both do not fit on one line. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="min-w-0 font-display text-title font-semibold break-words">{roomId}</h2>
          <p
            role="status"
            data-status={status}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full bg-field px-3 py-1 text-caption font-medium ${live ? 'text-ink' : 'text-muted'}`}
          >
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${live ? 'live-dot bg-live' : status === 'replaced' ? 'bg-danger' : 'bg-muted'}`}
            />
            {t(STATUS_KEY[status])}
          </p>
        </div>
        <p className="text-body text-muted">
          {t(status === 'replaced' ? 'testRoom.replacedHint' : 'testRoom.hint')}
        </p>
      </section>

      {view && (
        <section aria-labelledby="test-room-phones" className="grid gap-2">
          <h2 id="test-room-phones" className="text-caption text-muted">
            {t('testRoom.phones', { count: view.devices.length })}
          </h2>
          <ul className="panel divide-y divide-line px-4">
            {view.devices.map((id) => (
              <li
                key={id}
                data-device={id}
                className="flex min-h-12 items-baseline justify-between gap-3 py-3"
              >
                {/* Only the start of the id: enough to tell phones apart at a glance. */}
                <span className="font-display text-role font-semibold tabular-nums">
                  {id.slice(0, 4)}
                </span>
                {id === view.you && (
                  <span className="text-caption font-medium text-ink">
                    {t('testRoom.thisPhone')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </ScreenLayout>
  );
}
