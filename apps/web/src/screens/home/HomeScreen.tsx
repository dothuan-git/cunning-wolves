import type { HelloResponse } from '@werewolf/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '../../components/LanguageSwitch';

type ApiState = { status: 'loading' } | { status: 'ok'; message: string } | { status: 'error' };

// Placeholder until Phase 2 turns this into the room list; it proves the app and worker are wired together.
export function HomeScreen() {
  const { t } = useTranslation();
  const [api, setApi] = useState<ApiState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    void fetch('/api/hello', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
        const body = (await response.json()) as HelloResponse;
        setApi({ status: 'ok', message: body.message });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error('GET /api/hello failed', error);
        setApi({ status: 'error' });
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-4 pb-8">
      <div className="flex justify-end">
        <LanguageSwitch />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4">
        <h1 className="text-4xl font-extrabold text-forest">{t('app.name')}</h1>
        <p className="text-lg">{t('home.tagline')}</p>
        <p role="status" className={api.status === 'error' ? 'text-berry' : 'text-forest'}>
          {api.status === 'loading' && t('home.apiLoading')}
          {api.status === 'ok' && t('home.apiOk', { message: api.message })}
          {api.status === 'error' && t('home.apiError')}
        </p>
      </div>
    </main>
  );
}
