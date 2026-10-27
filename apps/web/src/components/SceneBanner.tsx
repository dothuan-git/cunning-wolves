import type { ReactNode } from 'react';
import village from '../assets/tabletop/village.png';

export function SceneBanner({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      <img
        src={village}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover object-bottom opacity-35"
      />
      {children}
    </div>
  );
}
