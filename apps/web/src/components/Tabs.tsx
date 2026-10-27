import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export function Tabs({
  label,
  items,
  initialId,
}: {
  label: string;
  items: readonly { id: string; label: string; content: ReactNode }[];
  initialId?: string;
}) {
  const id = useId();
  const [selected, setSelected] = useState(initialId ?? items[0]?.id ?? '');
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const active = items.find((item) => item.id === selected);
  return (
    <div className="grid gap-4">
      <div
        role="tablist"
        aria-label={label}
        className="flex rounded-control border border-line bg-folio shadow-field"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${item.id}`}
            aria-controls={`${id}-panel-${item.id}`}
            aria-selected={selected === item.id}
            tabIndex={selected === item.id ? 0 : -1}
            onClick={() => {
              setSelected(item.id);
            }}
            onKeyDown={(event) => {
              let next: number;
              if (event.key === 'ArrowRight') next = (index + 1) % items.length;
              else if (event.key === 'ArrowLeft') next = (index + items.length - 1) % items.length;
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = items.length - 1;
              else return;
              event.preventDefault();
              const target = items[next];
              if (target) {
                setSelected(target.id);
                buttons.current[next]?.focus();
              }
            }}
            className={`min-h-12 min-w-12 flex-1 rounded-control border-t-2 px-3 py-2 font-display text-name font-semibold ${selected === item.id ? 'border-ochre bg-surface text-ink shadow-card' : 'border-transparent text-muted'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {active && (
        <section
          role="tabpanel"
          id={`${id}-panel-${active.id}`}
          aria-labelledby={`${id}-tab-${active.id}`}
          tabIndex={0}
        >
          {active.content}
        </section>
      )}
    </div>
  );
}
