import { useId, useLayoutEffect, useRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type Labels = { label: string; hint?: string; error?: string };
type InputProps = Labels & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hideLabel?: boolean;
  /** `box` is a field that grows with its text instead of scrolling inside. */
  appearance?: 'field' | 'box';
};

const fieldBase =
  'w-full min-w-0 rounded-control border bg-field px-3 font-sans text-body text-ink placeholder:text-muted disabled:opacity-50';
const fieldClass = `${fieldBase} min-h-12 py-2.5`;

export function TextField({
  label,
  hint,
  error,
  id: suppliedId,
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="text-control">
        {label}
      </label>
      <input
        {...props}
        id={id}
        className={`${fieldClass} ${error ? 'border-danger' : 'border-field-border'} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-help` : undefined}
      />
      {(error || hint) && (
        <p
          id={`${id}-help`}
          className={`text-caption ${error ? 'name-pop text-danger' : 'text-muted'}`}
          role={error ? 'alert' : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function NoteField({
  label,
  id: suppliedId,
  className = '',
  hideLabel = false,
  appearance = 'field',
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const ref = useRef<HTMLTextAreaElement>(null);
  const grows = appearance === 'box';
  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!grows || !textarea) return;
    textarea.style.height = 'auto';
    const border = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = `${String(textarea.scrollHeight + border)}px`;
  }, [grows, props.value]);
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-control'}>
        {label}
      </label>
      <textarea
        {...props}
        ref={ref}
        id={id}
        rows={props.rows ?? 1}
        onFocus={(event) => {
          props.onFocus?.(event);
          // The browser skips scrolling a field that is on screen but under the sticky footer;
          // scrolling to it with its scroll margin (scroll-mb-24) lifts it clear.
          if (grows) event.currentTarget.scrollIntoView({ block: 'nearest' });
        }}
        className={
          grows
            ? `${fieldBase} min-h-10 resize-none scroll-mb-24 overflow-hidden border-field-border py-1.5 ${className}`
            : `${fieldClass} min-h-12 resize-y border-field-border ${className}`
        }
      />
    </div>
  );
}
