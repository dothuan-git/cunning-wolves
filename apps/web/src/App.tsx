import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { HomeScreen } from './screens/home/HomeScreen';
import { TestRoomScreen } from './screens/test-room/TestRoomScreen';

const DesignPreview = import.meta.env.DEV
  ? lazy(() => import('./design/preview/PreviewApp'))
  : null;

const TEST_ROOM_PATH = /^\/test\/([^/]+)$/;

export function App() {
  const { t } = useTranslation();
  const path = window.location.pathname.replace(/\/$/, '');
  if (DesignPreview && path === '/design') {
    return (
      <Suspense fallback={<p role="status">{t('preview.loading')}</p>}>
        <DesignPreview />
      </Suspense>
    );
  }
  const testRoom = TEST_ROOM_PATH.exec(path)?.[1];
  if (testRoom !== undefined) return <TestRoomScreen roomId={safeDecode(testRoom)} />;
  return <HomeScreen />;
}

// A malformed escape like %E0 throws; the raw text then fails the room id check instead.
function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}
