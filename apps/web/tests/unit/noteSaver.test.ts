import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTE_SAVE_DELAY_MS, NoteSaver } from '../../src/screens/narrator/noteSaver';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('NoteSaver', () => {
  it('sends the last text once typing pauses', () => {
    const save = vi.fn(() => true);
    const saver = new NoteSaver(save);
    saver.type(1, 'a', 'S');
    saver.type(1, 'a', 'Sa');
    vi.advanceTimersByTime(NOTE_SAVE_DELAY_MS - 1);
    saver.type(1, 'a', 'Saw');
    vi.advanceTimersByTime(NOTE_SAVE_DELAY_MS - 1);
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledExactlyOnceWith(1, 'a', 'Saw');
  });

  it('sends at once when the field is left, and only once', () => {
    const save = vi.fn(() => true);
    const saver = new NoteSaver(save);
    saver.type(2, 'b', 'Woke.');
    saver.flush(2, 'b');
    vi.advanceTimersByTime(NOTE_SAVE_DELAY_MS);
    saver.flush(2, 'b');
    expect(save).toHaveBeenCalledExactlyOnceWith(2, 'b', 'Woke.');
  });

  it('keeps each player and night apart', () => {
    const save = vi.fn(() => true);
    const saver = new NoteSaver(save);
    saver.type(1, 'a', 'One');
    saver.type(1, 'b', 'Two');
    saver.type(2, 'a', 'Three');
    vi.advanceTimersByTime(NOTE_SAVE_DELAY_MS);
    expect(save.mock.calls).toEqual([
      [1, 'a', 'One'],
      [1, 'b', 'Two'],
      [2, 'a', 'Three'],
    ]);
  });

  it('keeps a note it could not send until the connection is back', () => {
    let online = false;
    const save = vi.fn(() => online);
    const saver = new NoteSaver(save);
    saver.type(1, 'a', 'Saw');
    vi.advanceTimersByTime(NOTE_SAVE_DELAY_MS);
    expect(save).toHaveBeenCalledTimes(1);
    online = true;
    saver.flushAll();
    saver.flushAll();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(1, 'a', 'Saw');
  });

  it('stops waiting timers when disposed, and still sends what is left', () => {
    const save = vi.fn(() => true);
    const saver = new NoteSaver(save);
    saver.type(1, 'a', 'Saw');
    saver.dispose();
    vi.advanceTimersByTime(NOTE_SAVE_DELAY_MS);
    expect(save).not.toHaveBeenCalled();
    saver.flushAll();
    expect(save).toHaveBeenCalledExactlyOnceWith(1, 'a', 'Saw');
  });
});
