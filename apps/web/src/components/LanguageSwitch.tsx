import { LOCALES } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { setLocale } from '../i18n';

export function LanguageSwitch() {
  const { t, i18n } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="flex gap-1 rounded-full bg-white p-1"
    >
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
            className={`min-h-12 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${
              active ? 'bg-forest text-white' : 'text-ink'
            }`}
          >
            {t(`language.${locale}`)}
          </button>
        );
      })}
    </div>
  );
}
