import { ROLE_POOL } from '@werewolf/shared';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate, parseRoute, paths, usePathname } from './router';
import { HomeScreen } from './screens/home/HomeScreen';
import { CreateRoomScreen } from './screens/name-entry/CreateRoomScreen';
import { RoomScreen } from './screens/room/RoomScreen';
import { RuleBookScreen } from './screens/rule-book/RuleBookScreen';

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
    case 'rules':
      return (
        <RuleBookScreen
          roles={ROLE_POOL}
          onBack={() => {
            navigate(paths.home);
          }}
        />
      );
    case 'room':
      // Keyed so a different room starts with a fresh connection and empty state.
      return <RoomScreen key={route.id} roomId={route.id} />;
    case 'home':
      return <HomeScreen />;
  }
}
