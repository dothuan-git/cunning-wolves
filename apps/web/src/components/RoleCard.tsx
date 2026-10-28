import type { Locale, PoolRole } from '@werewolf/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import cardBack from '../assets/art/card-back.webp';
import { RoleArtwork } from './RoleArtwork';

const FLIP_MS = 250;

/** A round playing card that shows its back until it is tapped, then flips to the role. */
export function RoleCard({
  role,
  revealed,
  onToggle,
}: {
  role: PoolRole;
  revealed: boolean;
  onToggle: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'vi' ? 'vi' : 'en';
  // The role is in the page only while it shows or turns away, so a hidden card can't be read.
  const [faceMounted, setFaceMounted] = useState(revealed);
  if (revealed && !faceMounted) setFaceMounted(true);
  useEffect(() => {
    if (revealed) return;
    const timer = window.setTimeout(() => {
      setFaceMounted(false);
    }, FLIP_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [revealed]);
  return (
    <div className="flip-card">
      <div className="role-card" data-revealed={revealed}>
        <div className="flip-face border border-field-border shadow-card">
          <img src={cardBack} alt="" className="size-full object-cover" />
        </div>
        <div
          className="flip-face flip-front border border-field-border bg-ivory shadow-card"
          aria-hidden={!revealed}
          inert={!revealed}
        >
          {faceMounted && (
            <div className="flex h-full flex-col p-5">
              <h2
                className={`role-title absolute top-5 right-5 z-10 font-display text-title font-semibold ${role.team === 'werewolf' ? 'text-werewolf' : 'text-village'}`}
              >
                {role.name[locale]}
              </h2>
              <div className="min-h-0 flex-1">
                <RoleArtwork file={role.image} />
              </div>
              <p className="pt-3 text-center text-body text-pretty">{role.rule[locale]}</p>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        aria-pressed={revealed}
        aria-label={t('card.flip')}
        onClick={onToggle}
        className="absolute inset-0 rounded-playing"
      />
    </div>
  );
}
