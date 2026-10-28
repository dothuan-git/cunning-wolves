const BASE_MS = 500;
const MAX_MS = 10_000;

/** Exponential backoff with full jitter: a random wait up to 0.5s × 2^attempt, capped at 10s. */
export function reconnectDelay(attempt: number, random: () => number = Math.random): number {
  return Math.round(random() * Math.min(MAX_MS, BASE_MS * 2 ** attempt));
}
