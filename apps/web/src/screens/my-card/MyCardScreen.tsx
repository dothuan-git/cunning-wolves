import type { PoolRole } from '@werewolf/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RoleCard } from '../../components/RoleCard';
import { ScreenLayout } from '../../components/ScreenLayout';

export function MyCardScreen({
  role,
  initiallyRevealed = false,
}: {
  role: PoolRole;
  /** Starts with the role showing. Only the design preview uses it. */
  initiallyRevealed?: boolean;
}) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(initiallyRevealed);
  return (
    <ScreenLayout title={t('screens.myCard')} fixed>
      <div className="card-stage -mx-2 flex min-h-0 flex-1 items-center justify-center">
        <RoleCard
          role={role}
          revealed={revealed}
          onToggle={() => {
            setRevealed((value) => !value);
          }}
        />
      </div>
      <p className="text-center text-caption text-muted">{t('card.hint')}</p>
    </ScreenLayout>
  );
}
