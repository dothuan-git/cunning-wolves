// Fails when the locale files disagree: a key in one but not the other, an empty value,
// or different {{placeholders}} for the same key.
import { readFileSync } from 'node:fs';

const LOCALES = ['vi', 'en'];
const I18N_DIR = new URL('../apps/web/src/i18n/', import.meta.url);

/** @returns {Map<string, unknown>} dotted key -> leaf value */
function flatten(value, prefix = '', out = new Map()) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    out.set(prefix, value);
  }
  return out;
}

function placeholders(text) {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1]).sort();
}

const files = Object.fromEntries(
  LOCALES.map((locale) => {
    const path = new URL(`${locale}.json`, I18N_DIR);
    return [locale, flatten(JSON.parse(readFileSync(path, 'utf8')))];
  }),
);

const errors = [];
const allKeys = new Set(LOCALES.flatMap((locale) => [...files[locale].keys()]));

for (const key of [...allKeys].sort()) {
  for (const locale of LOCALES) {
    const value = files[locale].get(key);
    if (value === undefined) errors.push(`${locale}.json is missing "${key}"`);
    else if (typeof value !== 'string') errors.push(`${locale}.json "${key}" is not a string`);
    else if (value.trim() === '') errors.push(`${locale}.json "${key}" is empty`);
  }

  const [first, ...rest] = LOCALES.map((locale) => files[locale].get(key));
  if (typeof first !== 'string') continue;
  for (const [index, other] of rest.entries()) {
    if (typeof other !== 'string') continue;
    const a = placeholders(first).join(',');
    const b = placeholders(other).join(',');
    if (a !== b) {
      errors.push(
        `"${key}" placeholders differ: ${LOCALES[0]} {${a}} vs ${LOCALES[index + 1]} {${b}}`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`i18n check failed (${errors.length}):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`i18n check passed: ${allKeys.size} keys in ${LOCALES.join(', ')}.`);
