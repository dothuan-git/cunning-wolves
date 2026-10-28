import { LOCALES } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { setLocale } from '../i18n';

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  if (compact)
    return (
      <select
        aria-label={t('language.label')}
        value={i18n.language === 'vi' ? 'vi' : 'en'}
        onChange={(event) => {
          setLocale(event.target.value === 'vi' ? 'vi' : 'en');
        }}
        className="min-h-12 rounded-control border border-field-border bg-field px-2 text-control text-ink"
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {t(`language.${locale}`)}
          </option>
        ))}
      </select>
    );
  return (
    <div role="group" aria-label={t('language.label')} className="flex gap-3">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={i18n.language === locale}
          onClick={() => {
            setLocale(locale);
          }}
          className={`min-h-12 min-w-12 border-b px-1 text-control motion-safe:transition-colors ${i18n.language === locale ? 'border-ink font-medium text-ink' : 'border-transparent text-muted hover:border-line hover:text-ink'}`}
        >
          {t(`language.${locale}`)}
        </button>
      ))}
    </div>
  );
}
