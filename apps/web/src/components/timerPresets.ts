/** The night timer lengths the narrator picks from, in seconds; 0 turns the timer off. */
export const TIMER_PRESETS: readonly number[] = [0, 60, 90, 120, 180, 300];

/** Seconds as a clock: 90 → "1:30", 5 → "0:05". */
export function clockTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60))}:${String(whole % 60).padStart(2, '0')}`;
}
