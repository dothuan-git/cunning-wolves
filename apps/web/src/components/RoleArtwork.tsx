import { useTranslation } from 'react-i18next';
import placeholder from '../assets/cards/placeholder.svg';

// New role artwork is discovered at build time; a missing file intentionally uses the shared placeholder.
const artwork = import.meta.glob<string>('../assets/cards/*.{webp,png,jpg,jpeg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function RoleArtwork({ file, className = '' }: { file?: string; className?: string }) {
  const { t } = useTranslation();
  const source = file ? artwork[`../assets/cards/${file}`] : undefined;
  return (
    <img
      key={source ?? placeholder}
      src={source ?? placeholder}
      alt={source ? '' : t('card.artPlaceholder')}
      className={`h-full w-full object-contain ${className}`}
      onError={(event) => {
        if (event.currentTarget.dataset.fallback) return;
        // A missing/corrupt optional image must not prevent reading a role card.
        event.currentTarget.dataset.fallback = 'true';
        event.currentTarget.src = placeholder;
        event.currentTarget.alt = t('card.artPlaceholder');
      }}
    />
  );
}
