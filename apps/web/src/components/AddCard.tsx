import { Icon } from './Icon';

/**
 * An empty grey card with a "+", the last in a block of role cards: tapping it opens the list to
 * add from. It fills the 2:3 box it is given, with the corners of a thumbnail card.
 */
export function AddCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="thumbnail-card size-full">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="press press-card grid size-full place-items-center border border-field-border bg-paper text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-village"
      >
        <Icon name="plus" className="size-8" />
      </button>
    </div>
  );
}
