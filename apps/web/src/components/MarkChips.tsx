/** A player's marks as small chips, one tone step lighter than the panel. */
export function MarkChips({ labels }: { labels: readonly string[] }) {
  if (labels.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <li
          key={label}
          className="name-pop rounded-full bg-field px-2.5 py-0.5 text-caption font-medium text-ink"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
