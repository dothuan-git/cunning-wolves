import type { Locale, PoolRole } from '@werewolf/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { RoleArtwork } from './RoleArtwork';
import { FACTION_TEXT } from '../design/faction';

// A thumbnail card scales with its own width (see `.thumbnail-card` in index.css), so the same
// face fits a row of three and a wide carousel card. The detailed card has fixed sizes.
const LOOK = {
  detailed: {
    face: 'p-5',
    name: 'top-5 right-5 text-title',
    chip: 'top-5 left-5 px-2',
    art: '',
  },
  thumbnail: {
    face: 'thumbnail-face',
    name: 'thumbnail-name',
    chip: 'thumbnail-chip px-1.5 py-0.5 leading-none',
    art: 'thumbnail-art',
  },
} as const;

/**
 * The layout shared by every role card: the name running down the top right in its faction color,
 * the art, and (detailed only) the rule centered. It fills a positioned, clipped card frame.
 * A thumbnail card has no rule and no heading, because it sits inside a button. `count` adds how
 * many of this role are in the game, top left. `rule` replaces the rule text on the detailed card,
 * for a text box that edits it.
 */
export function RoleFace({
  role,
  variant = 'detailed',
  count,
  rule,
}: {
  role: PoolRole;
  variant?: keyof typeof LOOK;
  count?: number;
  rule?: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'vi' ? 'vi' : 'en';
  const thumbnail = variant === 'thumbnail';
  const Name = thumbnail ? 'span' : 'h2';
  const look = LOOK[variant];
  const team = FACTION_TEXT[role.team];
  return (
    <div className={`flex h-full flex-col ${look.face}`}>
      <Name className={`role-title absolute z-10 font-display font-semibold ${look.name} ${team}`}>
        {role.name[locale]}
      </Name>
      {count !== undefined && (
        <span
          key={count}
          className={`count-pop absolute z-10 rounded-full bg-ink font-display text-caption font-semibold text-field ${look.chip}`}
        >
          <span aria-hidden="true">×{count}</span>
          <span className="sr-only">{t('rules.copies', { count })}</span>
        </span>
      )}
      <div className={`min-h-0 flex-1 ${look.art}`}>
        <RoleArtwork file={role.image} />
      </div>
      {!thumbnail &&
        (rule ?? <p className="pt-3 text-center text-body text-pretty">{role.rule[locale]}</p>)}
    </div>
  );
}
