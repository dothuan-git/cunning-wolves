/** Moves one item to another index; an index outside the list is clamped to its ends. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length) return next;
  const target = Math.min(Math.max(to, 0), next.length - 1);
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(target, 0, item);
  return next;
}
