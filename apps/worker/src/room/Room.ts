import { DurableObject } from 'cloudflare:workers';

/**
 * One per room: holds the authoritative game state and every phone's WebSocket.
 * State machine and per-viewer filtering arrive in Phase 1 (see docs/game-rules.md).
 */
export class Room extends DurableObject<Env> {}
