import type { Locale, PoolRole } from '@werewolf/shared';
import { useTranslation } from 'react-i18next';
import { RoleArtwork } from './RoleArtwork';

/**
 * The front of a role card: the name running down the top right in its faction color, the art, and
 * the rule centered. It fills a positioned, clipped card frame. `compact` is for small previews:
 * a smaller name, no rule, and no heading (a preview sits inside a button).
 */
export function RoleFace({ role, compact = false }: { role: PoolRole; compact?: boolean }) {
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language === 'vi' ? 'vi' : 'en';
  const Name = compact ? 'span' : 'h2';
  return (
    <div className={`flex h-full flex-col ${compact ? 'p-3' : 'p-5'}`}>
      <Name
        className={`role-title absolute z-10 font-display font-semibold ${compact ? 'top-3 right-3 text-role' : 'top-5 right-5 text-title'} ${role.team === 'werewolf' ? 'text-werewolf' : 'text-village'}`}
      >
        {role.name[locale]}
      </Name>
      <div className="min-h-0 flex-1">
        <RoleArtwork file={role.image} />
      </div>
      {!compact && <p className="pt-3 text-center text-body text-pretty">{role.rule[locale]}</p>}
    </div>
  );
}
