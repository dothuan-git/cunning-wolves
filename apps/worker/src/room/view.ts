import type { RoomView } from '@werewolf/shared';

/** The room as one viewer may see it. Later phases split this into master and player views. */
export function buildView(viewer: string, devices: readonly string[]): RoomView {
  return { you: viewer, devices: [...devices] };
}
