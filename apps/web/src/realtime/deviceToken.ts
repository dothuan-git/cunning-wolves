const STORAGE_KEY = 'deviceToken';

let memoryToken: string | null = null;

/**
 * This device's secret token, created on first use and kept in localStorage.
 * Send it only in the socket's hello message; it works like a password for this phone's seat.
 */
export function getDeviceToken(storage: Storage | null = safeLocalStorage()): string {
  if (storage) {
    try {
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) return saved;
      const token = crypto.randomUUID();
      storage.setItem(STORAGE_KEY, token);
      return token;
    } catch (error) {
      console.warn('Device token not saved; this tab gets a temporary one', error);
    }
  }
  // Without storage the token lasts only for this tab, so a refresh makes a new device.
  memoryToken ??= crypto.randomUUID();
  return memoryToken;
}

// Reading the localStorage property itself throws in some private-browsing modes.
function safeLocalStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}
