const STORAGE_KEY = 'myRooms';
/** Enough for any real evening; the oldest are dropped first. */
export const MY_ROOMS_MAX = 20;

/**
 * Rooms this phone created or has a seat in, newest first, so home can take it back in while the
 * room is closed or in play. Only a hint for the list: the room still decides what this phone sees.
 * Remembering is a convenience, so storage errors fall back to an empty list.
 */
export function readMyRooms(storage: Storage | null = safeLocalStorage()): string[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch (error) {
    console.warn('My rooms not read', error);
    return [];
  }
}

export function rememberRoom(id: string, storage: Storage | null = safeLocalStorage()): void {
  const rooms = readMyRooms(storage);
  if (rooms[0] === id) return;
  write([id, ...rooms.filter((room) => room !== id)].slice(0, MY_ROOMS_MAX), storage);
}

export function forgetRoom(id: string, storage: Storage | null = safeLocalStorage()): void {
  const rooms = readMyRooms(storage);
  if (rooms.includes(id))
    write(
      rooms.filter((room) => room !== id),
      storage,
    );
}

function write(rooms: string[], storage: Storage | null): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch (error) {
    console.warn('My rooms not saved', error);
  }
}

// Reading the localStorage property itself throws in some private-browsing modes.
function safeLocalStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}
