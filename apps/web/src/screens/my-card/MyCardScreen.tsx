import type { PoolRole } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { RoleCard } from '../../components/RoleCard';
import { ScreenLayout } from '../../components/ScreenLayout';

export function MyCardScreen({
  role,
  initiallyRevealed = false,
  dealIn = true,
  onReviewRoles,
}: {
  /** null while the narrator's Blind wolf keeps the card off this phone: only its back shows */
  role: PoolRole | null;
  /** Starts with the role showing. Only the design preview uses it. */
  initiallyRevealed?: boolean;
  dealIn?: boolean;
  /** Goes back to this game's roles */
  onReviewRoles?: () => void;
}) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(initiallyRevealed);
  // A locked card turns face down, so unlocking it later doesn't show the role at once.
  if (!role && revealed) setRevealed(false);
  return (
    <ScreenLayout
      title={t('screens.myCard')}
      fixed
      action={
        onReviewRoles && (
          <Button variant="quiet" size="compact" className="press" onClick={onReviewRoles}>
            <Icon name="arrow" />
            {t('common.back')}
          </Button>
        )
      }
    >
      <div className="card-stage -mx-2 flex min-h-0 flex-1 items-center justify-center">
        <RoleCard
          role={role}
          revealed={revealed && role !== null}
          dealIn={dealIn}
          onToggle={() => {
            setRevealed((value) => !value);
          }}
        />
      </div>
      <p className="text-center text-caption text-muted">{t(role ? 'card.hint' : 'card.locked')}</p>
    </ScreenLayout>
  );
}
