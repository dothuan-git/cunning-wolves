import { describe, expect, it, vi } from 'vitest';
import { getDeviceToken } from '../../src/realtime/deviceToken';

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  clear() {
    this.items.clear();
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}

describe('getDeviceToken', () => {
  it('creates a token once and then reuses it', () => {
    const storage = new MemoryStorage();
    const token = getDeviceToken(storage);
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
    expect(storage.getItem('deviceToken')).toBe(token);
    expect(getDeviceToken(storage)).toBe(token);
  });

  it('gives different devices different tokens', () => {
    expect(getDeviceToken(new MemoryStorage())).not.toBe(getDeviceToken(new MemoryStorage()));
  });

  it('falls back to one in-memory token when storage throws', () => {
    const storage = new MemoryStorage();
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const token = getDeviceToken(storage);
    expect(getDeviceToken(null)).toBe(token);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
