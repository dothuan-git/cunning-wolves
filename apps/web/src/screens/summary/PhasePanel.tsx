import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../../components/Icon';

/** One night or morning of the journal; its title bar folds the notes away and back. */
export function PhasePanel({
  title,
  night,
  children,
}: {
  title: string;
  night: boolean;
  children: ReactNode;
}) {
  const bodyId = useId();
  const [open, setOpen] = useState(true);
  return (
    <li className="panel min-w-0 overflow-hidden">
      {/* A night's bar is ink and a morning's is field, so the two read apart without color. */}
      <h3 className={night ? 'bg-ink text-field' : 'bg-field text-ink'}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => {
            setOpen(!open);
          }}
          className="press press-card group flex min-h-12 w-full items-center gap-2 px-3.5 text-left font-display text-role font-semibold"
        >
          <Icon name={night ? 'moon' : 'sun'} className="size-4" />
          {title}
          <Icon
            name="arrow"
            className="ml-auto size-4 rotate-180 group-aria-expanded:-rotate-90 motion-safe:transition-transform motion-safe:duration-200"
          />
        </button>
      </h3>
      <div id={bodyId} className="fold" data-open={open || undefined}>
        <div inert={!open} className="min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </li>
  );
}
