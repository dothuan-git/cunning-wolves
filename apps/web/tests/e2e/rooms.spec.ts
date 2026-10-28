import { expect, test, type Browser, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

/** A fresh phone: its own storage, so its own device token. */
async function phone(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ locale: 'en-US' });
  return context.newPage();
}

async function createRoom(page: Page, roomName: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a room' }).click();
  await page.getByRole('textbox', { name: 'Room name' }).fill(roomName);
  await page.getByLabel('Your name').fill('Thuận');
  await page.getByRole('button', { name: 'Open the room' }).click();
  await expect(page).toHaveURL(/\/room\/[a-z0-9]{8}$/);
  await expect(page.getByRole('heading', { name: roomName })).toBeVisible();
}

async function joinFromHome(page: Page, roomName: string, name: string) {
  await page.goto('/');
  await page.getByRole('button', { name: `Join ${roomName}` }).click();
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Enter the village' }).click();
}

/** Every room message this phone receives, parsed. */
function roomMessages(page: Page): unknown[] {
  const messages: unknown[] = [];
  page.on('websocket', (socket) => {
    if (!socket.url().includes('/api/rooms/')) return;
    socket.on('framereceived', ({ payload }) => {
      if (typeof payload !== 'string' || payload === 'pong') return;
      messages.push(JSON.parse(payload));
    });
  });
  return messages;
}

/** The card ids in a player's messages, so a test can check they only ever got their own. */
function cardIds(messages: unknown[]): Set<string> {
  const ids = new Set<string>();
  for (const message of messages) {
    const text = JSON.stringify(message);
    const match = /"card":\{"id":"([^"]+)"/.exec(text);
    if (match?.[1]) ids.add(match[1]);
  }
  return ids;
}

test('a group gathers in a room', async ({ browser }) => {
  const roomName = `Mill ${String(Date.now()).slice(-6)}`;
  const master = await phone(browser);
  const minh = await phone(browser);
  const lan = await phone(browser);

  // Lan watches the home list while the room is created.
  await lan.goto('/');
  await createRoom(master, roomName);
  const row = lan.getByRole('button', { name: `Join ${roomName}` });
  await expect(row).toBeVisible();
  await expect(row).toContainText('Open');

  await joinFromHome(minh, roomName, 'Minh');
  await expect(minh.getByText('You’re in the room')).toBeVisible();
  await expect(master.getByRole('button', { name: 'Players (1)' })).toBeVisible();

  // The same name with other case and accents is taken.
  await row.click();
  await lan.getByLabel('Your name').fill('mính');
  await lan.getByRole('button', { name: 'Enter the village' }).click();
  await expect(lan.getByText('That name is taken in this room. Try another.')).toBeVisible();
  await lan.getByLabel('Your name').fill('Lan');
  await lan.getByRole('button', { name: 'Enter the village' }).click();
  await expect(lan.getByText('You’re in the room')).toBeVisible();
  await expect(master.getByRole('button', { name: 'Players (2)' })).toBeVisible();

  // A refresh keeps the seat.
  await minh.reload();
  await expect(minh.getByText('You’re in the room')).toBeVisible();
  await expect(master.getByRole('button', { name: 'Players (2)' })).toBeVisible();

  // The master removes Minh, then closes the room.
  await master.getByRole('button', { name: 'Players (2)' }).click();
  await master.getByRole('button', { name: 'Remove Minh' }).click();
  await master.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(minh.getByText('You were removed from the room.')).toBeVisible();
  await master.getByRole('button', { name: 'Done' }).click();
  await master.getByRole('button', { name: 'Close room' }).click();

  const home = await phone(browser);
  await home.goto('/');
  await expect(home.getByRole('button', { name: `Join ${roomName}` })).toContainText('Closed');
  await expect(minh.getByRole('button', { name: 'Join again' })).toHaveCount(0);

  // Re-opened, Minh can come back.
  await master.getByRole('button', { name: 'Reopen room' }).click();
  await minh.getByRole('button', { name: 'Join again' }).click();
  await minh.getByLabel('Your name').fill('Minh');
  await minh.getByRole('button', { name: 'Enter the village' }).click();
  await expect(minh.getByText('You’re in the room')).toBeVisible();
  await expect(master.getByRole('button', { name: 'Players (2)' })).toBeVisible();

  // Leaving takes the seat away.
  await lan.getByRole('button', { name: 'Leave room' }).click();
  await expect(lan).toHaveURL(/\/$/);
  await expect(master.getByRole('button', { name: 'Players (1)' })).toBeVisible();

  for (const page of [master, minh, lan, home]) {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  }
});

test('the master builds a card set the room keeps, and players never see it', async ({
  browser,
}) => {
  const roomName = `Barn ${String(Date.now()).slice(-6)}`;
  const master = await phone(browser);
  const minh = await phone(browser);
  await createRoom(master, roomName);
  await joinFromHome(minh, roomName, 'Minh');
  await expect(master.getByRole('button', { name: 'Players (1)' })).toBeVisible();
  const line = master.locator('footer').getByRole('status');
  const ready = master.getByRole('button', { name: 'Review rules', exact: true });

  // One werewolf for one player opens the rules review.
  await master.getByRole('button', { name: 'Add wolf roles', exact: true }).click();
  const picker = master.getByRole('dialog', { name: 'Add wolf roles' });
  await picker.getByRole('button', { name: 'Add Werewolf', exact: true }).click();
  await picker.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(line).toHaveText('Every player has a role.');
  await expect(ready).toBeEnabled();

  // A custom role that wakes, picked once: one role too many.
  await master.getByRole('button', { name: 'Add village roles', exact: true }).click();
  const village = master.getByRole('dialog', { name: 'Add village roles' });
  await village.getByRole('button', { name: 'Create custom role', exact: true }).click();
  const creator = master.getByRole('dialog', { name: 'Create custom role' });
  await creator.getByRole('textbox', { name: 'Role name', exact: true }).fill('Lantern keeper');
  await creator
    .getByRole('textbox', { name: 'Role description', exact: true })
    .fill('Lights the way.');
  await creator.getByRole('checkbox', { name: 'Wakes at night' }).check();
  await creator.getByRole('button', { name: 'Save', exact: true }).click();
  await village.getByRole('button', { name: 'Add Lantern keeper', exact: true }).click();
  await village.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(line).toHaveText('1 role too many.');
  await expect(ready).toBeDisabled();

  // An edited rule is kept by the room.
  await master.getByRole('button', { name: 'Edit Werewolf', exact: true }).click();
  const card = master.getByRole('dialog', { name: 'Werewolf', exact: true });
  await card.getByRole('button', { name: /^Each night, wake with the other werewolves/ }).click();
  await card.getByRole('textbox', { name: 'Role description', exact: true }).fill('House rule.');
  await master.mouse.click(5, 5);
  await expect(master.getByRole('dialog')).toHaveCount(0);

  // A refresh brings it all back from the room.
  await master.reload();
  await expect(line).toHaveText('1 role too many.');
  await expect(
    master.getByRole('button', { name: 'Edit Lantern keeper', exact: true }),
  ).toBeVisible();
  await master.getByRole('button', { name: 'Edit Werewolf', exact: true }).click();
  await expect(card.getByRole('button', { name: 'House rule.', exact: true })).toBeVisible();

  // Nothing of the card set reaches a player's phone.
  await minh.reload();
  await expect(minh.getByText('You’re in the room')).toBeVisible();
  const text = await minh.content();
  expect(text).not.toContain('Lantern keeper');
  expect(text).not.toContain('House rule.');
});

test('the master shows the rules, then deals each player only their own card', async ({
  browser,
}) => {
  const roomName = `Well ${String(Date.now()).slice(-6)}`;
  const master = await phone(browser);
  const minh = await phone(browser);
  const lan = await phone(browser);
  const minhMessages = roomMessages(minh);
  const lanMessages = roomMessages(lan);
  await createRoom(master, roomName);
  await joinFromHome(minh, roomName, 'Minh');
  await joinFromHome(lan, roomName, 'Lan');
  await expect(master.getByRole('button', { name: 'Players (2)' })).toBeVisible();

  for (const [team, role] of [
    ['village', 'Seer'],
    ['wolf', 'Werewolf'],
  ] as const) {
    await master.getByRole('button', { name: `Add ${team} roles`, exact: true }).click();
    const picker = master.getByRole('dialog', { name: `Add ${team} roles` });
    await picker.getByRole('button', { name: `Add ${role}`, exact: true }).click();
    await picker.getByRole('button', { name: 'Done', exact: true }).click();
  }
  const review = master.getByRole('button', { name: 'Review rules', exact: true });
  await review.click();

  // Everyone reads the rules; nobody has a card yet.
  await expect(master.getByRole('button', { name: 'Start game' })).toBeVisible();
  for (const player of [minh, lan]) {
    await expect(player.getByRole('heading', { name: 'Tonight’s roles' })).toBeVisible();
    await expect(player.getByRole('button', { name: 'I’ve read the rules' })).toBeVisible();
  }

  // Back to setup, and the players go back to the village.
  await master.getByRole('button', { name: 'Edit roles' }).click();
  await expect(review).toBeVisible();
  await expect(minh.getByText('You’re in the room')).toBeVisible();
  await review.click();
  await master.getByRole('button', { name: 'Start game' }).click();

  // Each player gets one card, and the two cards differ.
  const names: string[] = [];
  for (const player of [minh, lan]) {
    const flip = player.getByRole('button', { name: 'Flip your card' });
    await flip.click();
    await expect(flip).toHaveAttribute('aria-pressed', 'true');
    const face = player.locator('.flip-front');
    await expect(face).toContainText(/Seer|Werewolf/);
    names.push((await face.textContent()) ?? '');
  }
  const [minhRole, lanRole] = names.map((text) => (text.includes('Seer') ? 'seer' : 'werewolf'));
  expect(minhRole).not.toBe(lanRole);

  // The narrator sees who holds what.
  await expect(master.getByRole('heading', { name: 'Narrator' })).toBeVisible();
  await expect(master.getByText('Minh', { exact: true })).toBeVisible();
  await expect(master.getByText('Lan', { exact: true })).toBeVisible();

  // A refresh shows the back of the same card.
  await minh.reload();
  const flip = minh.getByRole('button', { name: 'Flip your card' });
  await expect(flip).toHaveAttribute('aria-pressed', 'false');

  // Each phone only ever received its own card, and never the deal.
  expect([...cardIds(minhMessages)]).toEqual([minhRole]);
  expect([...cardIds(lanMessages)]).toEqual([lanRole]);
  for (const message of [...minhMessages, ...lanMessages]) {
    expect(JSON.stringify(message)).not.toContain('assignments');
  }
});

test('an unknown room says it has closed', async ({ page }) => {
  await page.goto('/room/zzzzzzzz');
  await expect(page.getByRole('alert')).toContainText('This room has closed');
  await page.getByRole('button', { name: 'Back to the rooms' }).click();
  await expect(page).toHaveURL(/\/$/);
});
