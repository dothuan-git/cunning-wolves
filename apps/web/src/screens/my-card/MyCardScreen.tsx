import type { PoolRole } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { RoleCard } from '../../components/RoleCard';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useHold } from '../../components/useHold';

export function MyCardScreen({
  role,
  peeking = false,
}: {
  role: PoolRole;
  /** Shows the face without a hold. Only the design preview uses it. */
  peeking?: boolean;
}) {
  const { t } = useTranslation();
  const { holding, handlers } = useHold();
  const revealed = peeking || holding;
  return (
    <ScreenLayout
      title={t('screens.myCard')}
      footer={
        <Button {...handlers} variant="secondary" className="hold-button">
          <Icon name="eye" />
          {t(revealed ? 'card.holdHint' : 'card.hold')}
        </Button>
      }
    >
      {/* Touch and mouse can also hold the card itself; the button below covers the keyboard. */}
      <div {...handlers} className="hold-button">
        <RoleCard role={role} revealed={revealed} />
      </div>
      <p className="text-center text-caption text-muted">{t('card.private')}</p>
    </ScreenLayout>
  );
}
