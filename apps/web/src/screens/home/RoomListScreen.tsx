import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { ScreenLayout } from '../../components/ScreenLayout';
import woodcut from '../../assets/art/woodcut-village.webp';
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
  // The name is set on two lines with the village woodcut between them.
  const [first = '', ...rest] = t('app.name').split(' ');
  return (
    <ScreenLayout
      title={t('screens.home')}
      hero={
        <>
          <h1 className="grid font-display text-brand font-semibold">
            <span>{first}</span>{' '}
            <img
              src={woodcut}
              alt=""
              width={1000}
              height={500}
              className="my-3 aspect-3/2 w-full object-cover mix-blend-multiply"
            />
            <span>{rest.join(' ')}</span>
          </h1>
          <p className="mt-4 text-body">{t('rooms.intro')}</p>
        </>
      }
      footer={
        <Button onClick={onCreate}>
          <Icon name="plus" />
          {t('rooms.create')}
        </Button>
      }
    >
      {status === 'loading' ? (
        <p role="status" className="py-12 text-center text-control text-muted">
          {t('rooms.loading')}
        </p>
      ) : status === 'error' ? (
        <div className="panel grid gap-2 p-4" role="alert">
          <h2 className="font-display text-role font-semibold">{t('rooms.errorTitle')}</h2>
          <p className="text-control text-muted">{t('rooms.errorBody')}</p>
          <Button variant="secondary" className="mt-1" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="panel grid gap-2 p-4">
          <h2 className="font-display text-role font-semibold">{t('rooms.emptyTitle')}</h2>
          <p className="text-control text-muted">{t('rooms.emptyBody')}</p>
        </div>
      ) : (
        <section aria-label={t('rooms.heading')} className="grid gap-2">
          <h2 className="font-display text-role font-semibold">{t('rooms.heading')}</h2>
          <ul className="panel divide-y divide-line">
            {rooms.map((room) => {
              const joinable = room.isOpen && room.status === 'lobby';
              const open = room.isOpen && room.status !== 'playing';
              return (
                <li key={room.id} className="px-4">
                  <button
                    type="button"
                    onClick={() => {
                      onJoin(room.id);
                    }}
                    disabled={!joinable}
                    aria-label={t('rooms.join', { name: room.name })}
                    className="grid w-full gap-0.5 py-3 text-left disabled:cursor-not-allowed"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span
                        className={`font-display text-role font-semibold ${joinable ? 'text-ink' : 'text-muted'}`}
                      >
                        {room.name}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 text-caption ${joinable ? 'font-medium text-ink' : 'text-muted'}`}
                      >
                        {/* Green while others can join; red when closed or in play. The label says the same. */}
                        <span
                          aria-hidden="true"
                          className={`live-dot size-2 rounded-full ${open ? 'bg-live' : 'bg-danger'}`}
                        />
                        {t(
                          room.status === 'playing'
                            ? 'rooms.playing'
                            : open
                              ? 'rooms.open'
                              : 'rooms.closed',
                        )}
                      </span>
                    </span>
                    <span className="flex flex-wrap justify-between gap-2 text-caption text-muted">
                      <span>{t('rooms.host', { name: room.master })}</span>
                      <span className="tabular-nums">
                        {t('common.countPlayers', { count: room.count })}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </ScreenLayout>
  );
}
