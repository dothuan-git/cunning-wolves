import type { HelloResponse } from '@werewolf/shared';
import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

describe('worker fetch', () => {
  it('answers /api/hello', async () => {
    const response = await exports.default.fetch('http://localhost/api/hello');
    expect(response.status).toBe(200);
    expect(await response.json<HelloResponse>()).toEqual({ message: 'hello' });
  });

  it('returns 404 for unknown API routes', async () => {
    const response = await exports.default.fetch('http://localhost/api/nope');
    expect(response.status).toBe(404);
  });
});
