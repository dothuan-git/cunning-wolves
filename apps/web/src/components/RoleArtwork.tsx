import { useTranslation } from 'react-i18next';
import fallback from '../assets/art/card-art-fallback.webp';

// Role art is found at build time; a missing file intentionally uses the shared fallback figure.
const artwork = import.meta.glob<string>('../assets/cards/*.{webp,png,jpg,jpeg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function RoleArtwork({
  file,
  className = '',
  fit = 'contain',
}: {
  file?: string;
  className?: string;
  /** `cover` fills the frame from the top; `bust` crops to the head and shoulders for thumbnails. */
  fit?: 'contain' | 'cover' | 'bust';
}) {
  const { t } = useTranslation();
  const source = file ? artwork[`../assets/cards/${file}`] : undefined;
  return (
    <img
      key={source ?? fallback}
      src={source ?? fallback}
      alt={source ? '' : t('card.artPlaceholder')}
      className={`h-full w-full ${fit === 'contain' ? 'object-contain' : fit === 'bust' ? 'art-bust' : 'object-cover object-top'} ${className}`}
      onError={(event) => {
        if (event.currentTarget.dataset.fallback) return;
        // A missing/corrupt optional image must not prevent reading a role card.
        event.currentTarget.dataset.fallback = 'true';
        event.currentTarget.src = fallback;
        event.currentTarget.alt = t('card.artPlaceholder');
      }}
    />
  );
}
