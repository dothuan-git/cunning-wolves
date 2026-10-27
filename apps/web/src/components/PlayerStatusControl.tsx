import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

/** One tap marks a player dead or alive again; the screen offers Undo. */
export function PlayerStatusControl({
  name,
  dead,
  onToggle,
}: {
  name: string;
  dead: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={t(dead ? 'player.restore' : 'player.markDead', { name })}
      onClick={onToggle}
      className="group -mr-2 flex min-h-12 shrink-0 items-center px-2"
    >
      <span
        aria-hidden="true"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-semibold motion-safe:transition-colors ${dead ? 'border-line bg-surface text-muted group-hover:border-field-border' : 'border-transparent bg-alive-surface text-alive group-hover:border-alive/30'}`}
      >
        {dead ? (
          <Icon name="tombstone" className="size-3.5" />
        ) : (
          <span className="size-1.5 rounded-full bg-alive" />
        )}
        {t(dead ? 'player.dead' : 'player.alive')}
      </span>
    </button>
  );
}
