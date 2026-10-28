import { ROOM_ID_PATTERN } from '@werewolf/shared';
import { useSyncExternalStore } from 'react';

export type Route =
  { name: 'home' } | { name: 'create' } | { name: 'room'; id: string } | { name: 'design' };

const ROOM_PATH = /^\/room\/([^/]+)$/;
const NAVIGATE_EVENT = 'app:navigate';

/** Unknown paths and bad room ids fall back to home. */
export function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/new') return { name: 'create' };
  if (path === '/design') return { name: 'design' };
  const id = ROOM_PATH.exec(path)?.[1];
  if (id !== undefined && ROOM_ID_PATTERN.test(id)) return { name: 'room', id };
  return { name: 'home' };
}

export const paths = {
  home: '/',
  create: '/new',
  room: (id: string) => `/room/${id}`,
};

export function navigate(path: string, { replace = false }: { replace?: boolean } = {}): void {
  if (replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  // pushState fires no event of its own.
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

/** The current path, re-rendering on navigate() and on the browser's back and forward. */
export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}
