import { describe, expect, it } from 'vitest';
import { reconnectDelay } from '../../src/realtime/backoff';

describe('reconnectDelay', () => {
  it('doubles the upper bound each attempt', () => {
    const max = () => 1;
    expect([0, 1, 2, 3, 4].map((attempt) => reconnectDelay(attempt, max))).toEqual([
      500, 1000, 2000, 4000, 8000,
    ]);
  });

  it('caps at 10 seconds', () => {
    expect(reconnectDelay(5, () => 1)).toBe(10_000);
    expect(reconnectDelay(50, () => 1)).toBe(10_000);
  });

  it('picks a random wait below the bound', () => {
    expect(reconnectDelay(2, () => 0)).toBe(0);
    expect(reconnectDelay(2, () => 0.5)).toBe(1000);
  });
});
