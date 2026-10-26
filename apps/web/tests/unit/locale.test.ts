import { describe, expect, it } from 'vitest';
import { detectLocale } from '../../src/i18n/locale';

describe('detectLocale', () => {
  it('prefers the saved choice', () => {
    expect(detectLocale('en', ['vi-VN'])).toBe('en');
  });

  it('ignores an invalid saved value', () => {
    expect(detectLocale('fr', ['en-US'])).toBe('en');
  });

  it('uses the first supported browser language', () => {
    expect(detectLocale(null, ['fr-FR', 'EN-gb', 'vi'])).toBe('en');
  });

  it('falls back to Vietnamese', () => {
    expect(detectLocale(null, ['fr-FR'])).toBe('vi');
    expect(detectLocale(null, [])).toBe('vi');
  });
});
