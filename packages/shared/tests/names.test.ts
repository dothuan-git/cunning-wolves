import { describe, expect, it } from 'vitest';
import { cleanName, isValidName, NAME_MAX, nameKey } from '../src';

describe('cleanName', () => {
  it('trims and joins runs of spaces', () => {
    expect(cleanName('  Minh   Phương \n')).toBe('Minh Phương');
  });

  it('drops invisible and control characters', () => {
    expect(cleanName('Mi\u200bnh\u202e')).toBe('Minh');
    expect(cleanName('\u200b\u200b')).toBe('');
  });

  it('composes accents so the same name is stored the same way', () => {
    expect(cleanName('Phương'.normalize('NFD'))).toBe('Phương'.normalize('NFC'));
  });
});

describe('isValidName', () => {
  it('counts a letter with marks as one character', () => {
    expect(isValidName('Ằ'.repeat(NAME_MAX), NAME_MAX)).toBe(true);
    expect(isValidName('a'.repeat(NAME_MAX + 1), NAME_MAX)).toBe(false);
  });

  it('refuses an empty name', () => {
    expect(isValidName('', NAME_MAX)).toBe(false);
  });
});

describe('nameKey', () => {
  it('ignores case, accents and đ', () => {
    expect(nameKey('Đức')).toBe(nameKey('duc'));
    expect(nameKey('Sói')).toBe('soi');
    expect(nameKey('MINH  phương')).toBe(nameKey('minh phuong'));
  });

  it('sees through invisible characters', () => {
    expect(nameKey('Mi\u200bnh')).toBe(nameKey('Minh'));
  });

  it('keeps different names apart', () => {
    expect(nameKey('Minh')).not.toBe(nameKey('Minh Anh'));
  });
});
