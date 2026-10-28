import type { Team } from '@werewolf/shared';
import { RoleArtwork } from './RoleArtwork';

/** A role's name in its faction color, with its card art as a thumbnail when one is given. */
export function RoleBanner({ name, team, image }: { name: string; team: Team; image?: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2.5">
      {image !== undefined && (
        <span className="size-10 shrink-0 overflow-hidden">
          <RoleArtwork file={image} fit="bust" />
        </span>
      )}
      <span
        className={`min-w-0 font-display text-role font-semibold break-words ${team === 'werewolf' ? 'text-werewolf' : 'text-village'}`}
      >
        {name}
      </span>
    </span>
  );
}
