import { DurableObject } from 'cloudflare:workers';

/** Single instance: tracks open rooms for the home screen. Built in Phase 2. */
export class Lobby extends DurableObject<Env> {}
