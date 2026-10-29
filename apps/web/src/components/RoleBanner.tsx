import type { Team } from '@werewolf/shared';
import { FACTION_TEXT } from '../design/faction';
import { RoleArtwork } from './RoleArtwork';

/**
 * A role's name in its faction color, with its card art as a thumbnail when one is given.
 * `dead` greys out the name and the art.
 */
export function RoleBanner({
  name,
  team,
  image,
  dead = false,
}: {
  name: string;
  team: Team;
  image?: string;
  dead?: boolean;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2.5">
      {image !== undefined && (
        <span
          className={`size-10 shrink-0 overflow-hidden motion-safe:transition-[filter,opacity] ${dead ? 'opacity-60 grayscale' : ''}`}
        >
          <RoleArtwork file={image} fit="bust" />
        </span>
      )}
      <span
        className={`min-w-0 font-display text-role font-semibold break-words motion-safe:transition-colors ${dead ? 'text-muted' : FACTION_TEXT[team]}`}
      >
        {name}
      </span>
    </span>
  );
}
