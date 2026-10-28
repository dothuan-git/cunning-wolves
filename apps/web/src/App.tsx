import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { HomeScreen } from './screens/home/HomeScreen';

const DesignPreview = import.meta.env.DEV
  ? lazy(() => import('./design/preview/PreviewApp'))
  : null;

export function App() {
  const { t } = useTranslation();
  if (DesignPreview && window.location.pathname.replace(/\/$/, '') === '/design') {
    return (
      <Suspense fallback={<p role="status">{t('preview.loading')}</p>}>
        <DesignPreview />
      </Suspense>
    );
  }
  return <HomeScreen />;
}
