/**
 * Phones drop sockets on screen lock and network changes; check again as soon as they're back.
 * Returns a function that stops listening.
 */
export function wakeOnReturn(connection: { wake: () => void }): () => void {
  const wake = () => {
    if (document.visibilityState === 'visible') connection.wake();
  };
  window.addEventListener('online', wake);
  document.addEventListener('visibilitychange', wake);
  return () => {
    window.removeEventListener('online', wake);
    document.removeEventListener('visibilitychange', wake);
  };
}
