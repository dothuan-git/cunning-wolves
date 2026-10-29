import { describe, expect, it } from 'vitest';
import { forgetRoom, MY_ROOMS_MAX, readMyRooms, rememberRoom } from '../../src/realtime/myRooms';

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

describe('my rooms', () => {
  it('remembers rooms newest first, once each', () => {
    const storage = new MemoryStorage();
    rememberRoom('mill0000', storage);
    rememberRoom('farm0000', storage);
    rememberRoom('mill0000', storage);
    expect(readMyRooms(storage)).toEqual(['mill0000', 'farm0000']);
  });

  it('forgets a room', () => {
    const storage = new MemoryStorage();
    rememberRoom('mill0000', storage);
    rememberRoom('farm0000', storage);
    forgetRoom('mill0000', storage);
    expect(readMyRooms(storage)).toEqual(['farm0000']);
  });

  it('keeps only the newest rooms', () => {
    const storage = new MemoryStorage();
    for (let index = 0; index <= MY_ROOMS_MAX; index += 1) {
      rememberRoom(`room${String(index).padStart(4, '0')}`, storage);
    }
    const rooms = readMyRooms(storage);
    expect(rooms).toHaveLength(MY_ROOMS_MAX);
    expect(rooms[0]).toBe(`room${String(MY_ROOMS_MAX).padStart(4, '0')}`);
    expect(rooms).not.toContain('room0000');
  });

  it('reads anything unexpected as no rooms', () => {
    const storage = new MemoryStorage();
    storage.setItem('myRooms', '{not json');
    expect(readMyRooms(storage)).toEqual([]);
    storage.setItem('myRooms', '{"a":1}');
    expect(readMyRooms(storage)).toEqual([]);
  });

  it('works without storage', () => {
    rememberRoom('mill0000', null);
    expect(readMyRooms(null)).toEqual([]);
  });
});
