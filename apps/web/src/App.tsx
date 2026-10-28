import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { parseRoute, usePathname } from './router';
import { HomeScreen } from './screens/home/HomeScreen';
import { CreateRoomScreen } from './screens/name-entry/CreateRoomScreen';
import { RoomScreen } from './screens/room/RoomScreen';

const DesignPreview = import.meta.env.DEV
  ? lazy(() => import('./design/preview/PreviewApp'))
  : null;

export function App() {
  const { t } = useTranslation();
  const route = parseRoute(usePathname());
  switch (route.name) {
    case 'design':
      return DesignPreview ? (
        <Suspense fallback={<p role="status">{t('preview.loading')}</p>}>
          <DesignPreview />
        </Suspense>
      ) : (
        <HomeScreen />
      );
    case 'create':
      return <CreateRoomScreen />;
    case 'room':
      // Keyed so a different room starts with a fresh connection and empty state.
      return <RoomScreen key={route.id} roomId={route.id} />;
    case 'home':
      return <HomeScreen />;
  }
}
