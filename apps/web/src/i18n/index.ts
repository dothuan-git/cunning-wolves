import type { Locale } from '@werewolf/shared';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import { detectLocale, readSavedLocale, saveLocale } from './locale';
import vi from './vi.json';

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: detectLocale(readSavedLocale(), navigator.languages),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLocale(locale: Locale): void {
  saveLocale(locale);
  void i18n.changeLanguage(locale);
}
