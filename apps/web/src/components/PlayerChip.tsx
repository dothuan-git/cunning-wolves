import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

export function PlayerChip({
  name,
  dead = false,
  detail,
  large = false,
}: {
  name: string;
  dead?: boolean;
  detail?: string;
  /** The name at role-heading size, for lists where it leads a block of notes. */
  large?: boolean;
}) {
  const { t } = useTranslation();
  const nameClass = large
    ? 'font-display text-role font-semibold'
    : 'font-sans text-name font-medium';
  return (
    <span
      className={`inline-flex min-w-0 items-center gap-2 motion-safe:transition-colors ${dead ? 'text-muted' : 'text-ink'}`}
    >
      {dead && <Icon name="tombstone" className="size-4" />}
      <span className="min-w-0">
        <span className={`block ${nameClass} break-words ${dead ? 'line-through' : ''}`}>
          {name}
        </span>
        {detail && <span className="block text-caption text-muted">{detail}</span>}
      </span>
      {dead && <span className="sr-only">{t('player.dead')}</span>}
    </span>
  );
}
