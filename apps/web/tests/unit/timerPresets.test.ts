import { DEFAULT_SETTINGS, TIMER_MAX } from '@werewolf/shared';
import { describe, expect, it } from 'vitest';
import { clockTime, TIMER_PRESETS } from '../../src/components/timerPresets';

describe('clockTime', () => {
  it('shows minutes and two-digit seconds', () => {
    expect(clockTime(0)).toBe('0:00');
    expect(clockTime(5)).toBe('0:05');
    expect(clockTime(90)).toBe('1:30');
    expect(clockTime(300)).toBe('5:00');
    expect(clockTime(TIMER_MAX)).toBe('60:00');
  });

  it('never shows a negative or part second', () => {
    expect(clockTime(-3)).toBe('0:00');
    expect(clockTime(61.9)).toBe('1:01');
  });
});

describe('TIMER_PRESETS', () => {
  it('starts with off, includes the default length and stays in the room’s range', () => {
    expect(TIMER_PRESETS[0]).toBe(0);
    expect(TIMER_PRESETS).toContain(DEFAULT_SETTINGS.timerSeconds);
    for (const seconds of TIMER_PRESETS) {
      expect(Number.isInteger(seconds) && seconds >= 0 && seconds <= TIMER_MAX).toBe(true);
    }
  });
});
