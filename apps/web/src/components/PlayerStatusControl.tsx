import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

/** One tap marks a player dead or alive again; the screen offers Undo. */
export function PlayerStatusControl({
  name,
  dead,
  onToggle,
  disabled = false,
}: {
  name: string;
  dead: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  // The pill pops when the status changes, not when the list first appears.
  const [shown, setShown] = useState(dead);
  const [changes, setChanges] = useState(0);
  if (shown !== dead) {
    setShown(dead);
    setChanges(changes + 1);
  }
  return (
    <button
      type="button"
      aria-label={t(dead ? 'player.restore' : 'player.markDead', { name })}
      onClick={onToggle}
      disabled={disabled}
      className="press group -mr-2 flex min-h-12 shrink-0 items-center px-2 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {/* Alive keeps a quiet outline with a live green dot; a death fills the pill. */}
      <span
        key={changes}
        aria-hidden="true"
        className={`inline-flex ${changes > 0 ? 'count-pop' : ''} items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-medium motion-safe:transition-colors ${dead ? 'border-transparent bg-line text-ink group-hover:border-field-border' : 'border-field-border bg-field text-ink group-hover:border-ink'}`}
      >
        {dead ? (
          <Icon name="tombstone" className="size-3.5" />
        ) : (
          <span className="live-dot size-2 rounded-full bg-live" />
        )}
        {t(dead ? 'player.dead' : 'player.alive')}
      </span>
    </button>
  );
}
