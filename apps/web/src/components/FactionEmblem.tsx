import type { Team } from '@werewolf/shared';
import village from '../assets/art/faction-village.webp';
import werewolf from '../assets/art/faction-werewolf.webp';

/**
 * The faction's own emblem: the cottage for the village, the wolf's head for the wolves.
 * Decorative: the faction's name is always shown beside it.
 */
export function FactionEmblem({ team, className = '' }: { team: Team; className?: string }) {
  return (
    <img
      src={team === 'werewolf' ? werewolf : village}
      alt=""
      width={192}
      height={192}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
