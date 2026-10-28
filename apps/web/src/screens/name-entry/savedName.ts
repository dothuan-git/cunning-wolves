const STORAGE_KEY = 'playerName';

// localStorage throws in some private-browsing modes; remembering the name is a convenience, so fall back silently.
export function readSavedName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // see readSavedName
  }
}
