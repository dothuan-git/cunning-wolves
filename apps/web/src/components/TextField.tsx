import { useId, useLayoutEffect, useRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type Labels = { label: string; hint?: string; error?: string };
type InputProps = Labels & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hideLabel?: boolean;
  appearance?: 'field' | 'line';
};

const fieldClass =
  'min-h-12 w-full min-w-0 rounded-control border bg-field px-3 py-2.5 font-sans text-body text-ink placeholder:text-muted disabled:opacity-50';

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
  const grows = appearance === 'line';
  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!grows || !textarea) return;
    // Underlined notes grow with their text instead of scrolling inside one line.
    // Their scroll margin (scroll-mb-24) keeps a focused note clear of the sticky footer.
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
        className={
          grows
            ? `min-h-12 w-full min-w-0 resize-none scroll-mb-24 overflow-hidden border-0 border-b border-field-border bg-transparent px-0 py-2.5 font-sans text-body text-ink placeholder:text-muted focus-visible:outline-offset-2 ${className}`
            : `${fieldClass} min-h-12 resize-y border-field-border ${className}`
        }
      />
    </div>
  );
}
