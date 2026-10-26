import { describe, expect, it } from 'vitest';
import { LOCALES, ROLE_POOL } from '../src';

describe('ROLE_POOL', () => {
  it('has unique kebab-case ids', () => {
    const ids = ROLE_POOL.map((role) => role.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has a name and rule in every locale', () => {
    for (const role of ROLE_POOL) {
      for (const locale of LOCALES) {
        expect(role.name[locale].trim(), `${role.id} name.${locale}`).not.toBe('');
        expect(role.rule[locale].trim(), `${role.id} rule.${locale}`).not.toBe('');
      }
    }
  });

  it('has unique wake orders among roles that wake', () => {
    const orders = ROLE_POOL.flatMap((role) =>
      role.defaultWakeOrder === null ? [] : [role.defaultWakeOrder],
    );
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('names card art after the role id', () => {
    for (const role of ROLE_POOL)
      expect(role.image).toMatch(new RegExp(`^${role.id}\\.(webp|png|svg)$`));
  });
});
