/**
 * The public id for a device in one room: a hash of the room id and its secret token. The same
 * phone always gets the same id in a room, so it keeps its seat when it reconnects; other phones
 * only ever see the id, and the id differs from room to room, so it can't follow a phone around.
 */
export async function deviceIdFromToken(token: string, roomId: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${roomId}:${token}`),
  );
  return [...new Uint8Array(digest).slice(0, 8)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
