import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'normal' | 'compact' | 'icon';
};

const variants = {
  primary: 'border-ink bg-ink text-field hover:bg-ink/85',
  secondary: 'border-field-border bg-field text-ink hover:border-ink',
  quiet: 'border-transparent bg-transparent text-muted hover:text-ink',
  danger: 'border-danger/40 bg-field text-danger hover:border-danger',
};

const sizes = {
  normal: 'px-4 py-2',
  compact: 'px-2 py-2',
  icon: 'p-2',
};

export function Button({
  variant = 'primary',
  size = 'normal',
  className = '',
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-control border font-medium disabled:cursor-not-allowed disabled:opacity-45 motion-safe:transition-colors ${size === 'compact' ? 'font-sans text-caption' : 'font-sans text-control'} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
