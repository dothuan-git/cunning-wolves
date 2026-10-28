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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-4 pb-6">
      <div className="flex justify-end">
        <LanguageSwitch />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3 py-12">
        <h1 className="font-display text-title font-semibold">{t('app.name')}</h1>
        <p className="text-body text-muted">{t('home.tagline')}</p>
        {import.meta.env.DEV && (
          <a
            href="/design"
            className="inline-flex min-h-12 items-center text-control text-village underline underline-offset-4"
          >
            {t('preview.title')}
          </a>
        )}
      </div>

      <p
        role="status"
        className={`border-t border-line pt-4 text-control ${api.status === 'error' ? 'text-danger' : 'text-muted'}`}
      >
        {api.status === 'loading' && t('home.apiLoading')}
        {api.status === 'ok' && t('home.apiOk', { message: api.message })}
        {api.status === 'error' && t('home.apiError')}
      </p>
    </main>
  );
}
