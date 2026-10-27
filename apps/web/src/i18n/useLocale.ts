import type { Locale } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';

export function useLocale(): Locale {
  const { i18n } = useTranslation();
  return i18n.language === 'vi' ? 'vi' : 'en';
}
