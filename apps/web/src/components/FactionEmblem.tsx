import type { Team } from '@werewolf/shared';
// The hooded wanderer stands in for the third faction until it has its own emblem.
import solo from '../assets/art/card-art-fallback.webp';
import village from '../assets/art/faction-village.webp';
import werewolf from '../assets/art/faction-werewolf.webp';

const EMBLEMS: Record<Team, string> = { village, werewolf, solo };

/**
 * The faction's own emblem: the cottage for the village, the wolf's head for the wolves, the
 * hooded wanderer for the third faction.
 * Decorative: the faction's name is always shown beside it.
 */
export function FactionEmblem({ team, className = '' }: { team: Team; className?: string }) {
  return (
    <img
      src={EMBLEMS[team]}
      alt=""
      width={192}
      height={192}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
