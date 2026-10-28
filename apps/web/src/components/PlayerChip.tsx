import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

export function PlayerChip({
  name,
  dead = false,
  detail,
}: {
  name: string;
  dead?: boolean;
  detail?: string;
}) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${dead ? 'text-muted' : 'text-ink'}`}>
      {dead && <Icon name="tombstone" className="size-4" />}
      <span className="min-w-0">
        <span
          className={`block font-sans text-name font-medium break-words ${dead ? 'line-through' : ''}`}
        >
          {name}
        </span>
        {detail && <span className="block text-caption text-muted">{detail}</span>}
      </span>
      {dead && <span className="sr-only">{t('player.dead')}</span>}
    </span>
  );
}
