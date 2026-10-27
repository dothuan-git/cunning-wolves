import type { Team } from '@werewolf/shared';

/** Heraldic pennant naming a role, in its faction color. */
export function RoleBanner({ name, team }: { name: string; team: Team }) {
  return (
    <span
      className={`role-banner inline-block max-w-full py-0.5 pr-4 pl-2.5 text-caption font-semibold break-words text-surface ${team === 'werewolf' ? 'bg-werewolf' : 'bg-village'}`}
    >
      {name}
    </span>
  );
}
