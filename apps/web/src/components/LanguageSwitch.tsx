import { LOCALES } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { setLocale } from '../i18n';

export function LanguageSwitch() {
  const { t, i18n } = useTranslation();

  return (
    <div role="group" aria-label={t('language.label')} className="flex gap-3">
      {LOCALES.map((locale) => {
        const active = i18n.language === locale;
        return (
          <button
            key={locale}
            type="button"
            aria-pressed={active}
            onClick={() => {
              setLocale(locale);
            }}
            className={`min-h-12 border-b px-1 text-control motion-safe:transition-colors ${
              active
                ? 'border-forest font-medium text-forest'
                : 'border-transparent text-muted hover:border-line hover:text-ink'
            }`}
          >
            {t(`language.${locale}`)}
          </button>
        );
      })}
    </div>
  );
}
