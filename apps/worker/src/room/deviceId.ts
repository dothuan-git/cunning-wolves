/**
 * The public id for a device: a hash of its secret token. The same token always gives the same id,
 * so a phone that reconnects keeps its seat, and other phones only ever see the id.
 */
export async function deviceIdFromToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest).slice(0, 8)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
