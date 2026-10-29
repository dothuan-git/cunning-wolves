import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

/**
 * A setting that is on or off: its name, with a square switch on the right. It is a real checkbox, so it keeps its label and keyboard behaviour.
 */
export function SwitchRow({
  label,
  ...props
}: { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2 has-disabled:cursor-not-allowed"
    >
      <span className="min-w-0 text-control font-medium">{label}</span>
      <span className="relative h-7 w-12 shrink-0">
        {/* The real checkbox covers the track, so it takes the tap and shows focus on it. */}
        <input
          {...props}
          id={id}
          type="checkbox"
          className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-control border border-field-border bg-field peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-village peer-disabled:opacity-45 motion-safe:transition-colors motion-safe:duration-150 peer-checked:[&>span]:translate-x-5 peer-checked:[&>span]:bg-field"
        >
          <span className="absolute top-0.5 left-0.5 size-5 rounded-control bg-field-border motion-safe:transition-transform motion-safe:duration-150" />
        </span>
      </span>
    </label>
  );
}
