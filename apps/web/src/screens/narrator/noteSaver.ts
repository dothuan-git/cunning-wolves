/** How long typing must pause before a note is sent. */
export const NOTE_SAVE_DELAY_MS = 1000;

/** Sends a note; false when it could not be sent (no connection). */
export type SaveNote = (night: number, playerId: string, text: string) => boolean;

interface Unsent {
  night: number;
  playerId: string;
  text: string;
}

/**
 * Sends each note once typing pauses or its field is left, and keeps any that could not be sent
 * until `flushAll` (called when the connection is back).
 */
export class NoteSaver {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly unsent = new Map<string, Unsent>();

  constructor(
    private readonly save: SaveNote,
    private readonly delay = NOTE_SAVE_DELAY_MS,
  ) {}

  type(night: number, playerId: string, text: string): void {
    const key = noteKey(night, playerId);
    this.unsent.set(key, { night, playerId, text });
    clearTimeout(this.timers.get(key));
    this.timers.set(
      key,
      setTimeout(() => {
        this.flush(night, playerId);
      }, this.delay),
    );
  }

  flush(night: number, playerId: string): void {
    const key = noteKey(night, playerId);
    clearTimeout(this.timers.get(key));
    this.timers.delete(key);
    const note = this.unsent.get(key);
    if (note && this.save(note.night, note.playerId, note.text)) this.unsent.delete(key);
  }

  flushAll(): void {
    for (const { night, playerId } of [...this.unsent.values()]) this.flush(night, playerId);
  }

  /** Stops waiting timers; unsent notes are kept. */
  dispose(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }
}

export function noteKey(night: number, playerId: string): string {
  return `${String(night)}:${playerId}`;
}
