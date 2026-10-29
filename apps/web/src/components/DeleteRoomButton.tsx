import { useTranslation } from 'react-i18next';
import { HoldButton } from './HoldButton';
import { Icon } from './Icon';

/** The narrator's way to end the room for everyone: a long hold, so it can't happen by accident. */
export function DeleteRoomButton({
  onDelete,
  failed = false,
  disabled = false,
}: {
  onDelete: () => void;
  /** The room couldn't delete itself; nothing changed */
  failed?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-1.5">
      <HoldButton variant="danger" duration={1200} disabled={disabled} onComplete={onDelete}>
        <Icon name="trash" />
        {t('room.delete')}
      </HoldButton>
      {failed && (
        <p role="alert" className="name-pop text-caption text-danger">
          {t('room.deleteFailed')}
        </p>
      )}
    </div>
  );
}
