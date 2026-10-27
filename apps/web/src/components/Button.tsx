import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'normal' | 'compact' | 'icon';
};

const variants = {
  primary: 'tabletop-primary border-brass bg-forest text-surface hover:bg-forest/90',
  secondary: 'border-edge bg-surface text-ink hover:border-field-border',
  quiet: 'border-transparent bg-transparent text-muted hover:text-ink',
  danger: 'border-danger/30 bg-surface text-danger hover:border-danger',
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
      className={`inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-control border font-semibold disabled:cursor-not-allowed disabled:opacity-45 motion-safe:transition-colors ${size === 'compact' ? 'font-sans text-caption' : 'font-sans text-control'} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
