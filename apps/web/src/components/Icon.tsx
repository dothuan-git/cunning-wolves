import type { SVGProps } from 'react';

const paths = {
  minus: 'M5 12h14',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  moon: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  pencil: 'M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4',
  reset: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',
  arrow: 'm14 6-6 6 6 6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  wolf: 'm5 10-1-7 6 4h4l6-4-1 7 2 5-9 7-9-7 2-5Zm3 3h1m6 0h1m-5 4h2',
  star: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z',
  person: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3',
  tombstone: 'M5 21V9a7 7 0 0 1 14 0v12M3 21h18M12 6v9m-3-6h6',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  plus: 'M12 5v14M5 12h14',
  book: 'M3 4h6l3 2 3-2h6v16h-6l-3 2-3-2H3V4Zm9 2v16',
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  className = '',
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      {...props}
      className={`${className.includes('size-') ? '' : 'size-5'} shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? '3' : '1.25'}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
