import type { Team } from '@werewolf/shared';
import solo from '../assets/art/faction-solo.webp';
import village from '../assets/art/faction-village.webp';
import werewolf from '../assets/art/faction-werewolf.webp';

const EMBLEMS: Record<Team, string> = { village, werewolf, solo };

/**
 * The faction's own emblem: the cottage for the village, the wolf's head for the wolves, the
 * half-masked hood for the third faction.
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
