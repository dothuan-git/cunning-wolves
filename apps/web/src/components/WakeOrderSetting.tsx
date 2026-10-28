import type { PoolRole } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../i18n/useLocale';
import { WakeOrderGrid } from './WakeOrderGrid';
import { moveItem } from './wakeOrder';

/**
 * The "Wake order" block of a settings sheet: its title and the draggable tiles. `roles` are the
 * waking roles in their current order; `onChange` gets the new order after each move.
 */
export function WakeOrderSetting({
  roles,
  onChange,
}: {
  roles: readonly PoolRole[];
  onChange: (order: PoolRole[]) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <div>
      <h3 className="mb-4 text-control font-medium">{t('narrator.reorder')}</h3>
      <WakeOrderGrid
        roles={roles.map((role) => ({ id: role.id, name: role.name[locale], team: role.team }))}
        onMove={(from, to) => {
          onChange(moveItem(roles, from, to));
        }}
      />
    </div>
  );
}
