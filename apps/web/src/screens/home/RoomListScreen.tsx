import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { SceneBanner } from '../../components/SceneBanner';
import { ScreenLayout } from '../../components/ScreenLayout';
import type { RoomListItem } from '../types';

export function RoomListScreen({
  rooms,
  status = 'ready',
  onCreate,
  onJoin,
  onRetry,
}: {
  rooms: readonly RoomListItem[];
  status?: 'ready' | 'loading' | 'error';
  onCreate: () => void;
  onJoin: (id: string) => void;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ScreenLayout
      title={t('screens.home')}
      footer={
        <Button onClick={onCreate}>
          <Icon name="plus" />
          {t('rooms.create')}
        </Button>
      }
    >
      <SceneBanner className="flex min-h-20 items-start gap-2.5 pb-4">
        <Icon name="moon" className="mt-0.5 size-5 text-ochre" />
        <p className="text-body text-muted">{t('rooms.intro')}</p>
      </SceneBanner>
      {status === 'loading' ? (
        <p role="status" className="py-12 text-center text-control text-muted">
          {t('rooms.loading')}
        </p>
      ) : status === 'error' ? (
        <div className="folio grid gap-2 p-3.5" role="alert">
          <h2 className="font-display text-heading font-semibold">{t('rooms.errorTitle')}</h2>
          <p className="text-control text-muted">{t('rooms.errorBody')}</p>
          <Button variant="secondary" className="mt-1" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="folio grid gap-2 p-3.5">
          <Icon name="book" className="size-7 text-ochre" />
          <h2 className="font-display text-heading font-semibold">{t('rooms.emptyTitle')}</h2>
          <p className="text-control text-muted">{t('rooms.emptyBody')}</p>
        </div>
      ) : (
        <section aria-label={t('rooms.heading')}>
          <h2 className="mb-2 text-caption text-muted">{t('rooms.heading')}</h2>
          <ul className="grid gap-3">
            {rooms.map((room) => (
              <li key={room.id} className="folio px-4">
                <button
                  type="button"
                  onClick={() => {
                    onJoin(room.id);
                  }}
                  disabled={!room.isOpen || room.status !== 'lobby'}
                  aria-label={t('rooms.join', { name: room.name })}
                  className="grid w-full gap-1 py-3.5 text-left disabled:opacity-55"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-heading font-semibold">{room.name}</span>
                    <span className="text-caption text-forest">
                      {t(
                        room.status === 'playing'
                          ? 'rooms.playing'
                          : room.isOpen
                            ? 'rooms.open'
                            : 'rooms.closed',
                      )}
                    </span>
                  </span>
                  <span className="flex flex-wrap justify-between gap-2 text-caption text-muted">
                    <span>{t('rooms.host', { name: room.master })}</span>
                    <span>{t('common.countPlayers', { count: room.count })}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ScreenLayout>
  );
}
