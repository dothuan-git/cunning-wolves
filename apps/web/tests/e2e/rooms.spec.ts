import { expect, test, type Browser, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

const PIN = '4821';

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
  await page.getByLabel('Room PIN').fill(PIN);
  await page.getByRole('button', { name: 'Open the room' }).click();
  await expect(page).toHaveURL(/\/room\/[a-z0-9]{8}$/);
  await expect(page.getByRole('heading', { name: roomName })).toBeVisible();
}

async function joinFromHome(page: Page, roomName: string, name: string) {
  await page.goto('/');
  await page.getByRole('button', { name: `Join ${roomName}` }).click();
  await page.getByLabel('Your name').fill(name);
  await page.getByLabel('Room PIN').fill(PIN);
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
  await lan.getByLabel('Room PIN').fill(PIN);
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
  await minh.getByLabel('Room PIN').fill(PIN);
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

test('the room keeps what the narrator marks, and no player sees it', async ({ browser }) => {
  const roomName = `Inn ${String(Date.now()).slice(-6)}`;
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
  await master.getByRole('button', { name: 'Review rules', exact: true }).click();
  await master.getByRole('button', { name: 'Start game' }).click();
  await expect(master.getByRole('heading', { name: 'Night 1' })).toBeVisible();

  // No dealt role changes roles, so nobody's role can be changed.
  await expect(master.getByRole('button', { name: /^Change .* role$/ })).toHaveCount(0);

  // A death, a note sent when its field is left, and the end of the night.
  await master.getByRole('button', { name: 'Mark Minh dead' }).click();
  await master.getByRole('textbox', { name: 'Note for Lan' }).fill('Saw the wolves.');
  await master.getByRole('heading', { name: 'Night 1' }).click();
  const endNight = master.getByRole('button', { name: 'Hold to end night', exact: true });
  await endNight.hover();
  await master.mouse.down();
  await master.waitForTimeout(1000);
  await master.mouse.up();
  await expect(master.getByRole('heading', { name: 'Morning 1' })).toBeVisible();

  // The wake order changes in the menu.
  await master.getByRole('button', { name: 'Menu', exact: true }).click();
  await master.getByRole('button', { name: 'Seer, 1 of 2', exact: true }).focus();
  await master.keyboard.press('ArrowRight');
  await expect(master.getByRole('button', { name: 'Seer, 2 of 2', exact: true })).toBeVisible();

  // All of it comes back from the room after a refresh.
  await master.reload();
  await expect(master.getByRole('heading', { name: 'Morning 1' })).toBeVisible();
  await expect(master.getByRole('button', { name: 'Restore Minh' })).toBeVisible();
  await expect(master.getByText('Saw the wolves.', { exact: true })).toBeVisible();
  const panels = master.locator('section[aria-label]').filter({ has: master.locator('h3') });
  await expect(panels.first()).toHaveAttribute('aria-label', 'Werewolf');
  await master.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(master.getByRole('button', { name: 'Seer, 2 of 2', exact: true })).toBeVisible();

  // The players' phones never received any of it.
  for (const message of [...minhMessages, ...lanMessages]) {
    const text = JSON.stringify(message);
    expect(text).not.toContain('Saw the wolves.');
    expect(text).not.toContain('"game"');
  }
});

test('lovers are marked dead one by one, and the narrator gives a player a new role', async ({
  browser,
}) => {
  const roomName = `Chapel ${String(Date.now()).slice(-6)}`;
  const master = await phone(browser);
  const minh = await phone(browser);
  const lan = await phone(browser);
  const minhMessages = roomMessages(minh);
  await createRoom(master, roomName);
  await joinFromHome(minh, roomName, 'Minh');
  await joinFromHome(lan, roomName, 'Lan');
  await expect(master.getByRole('button', { name: 'Players (2)' })).toBeVisible();
  await master.getByRole('button', { name: 'Add village roles', exact: true }).click();
  const picker = master.getByRole('dialog', { name: 'Add village roles' });
  for (const role of ['Cupid', 'Doppelgänger']) {
    await picker.getByRole('button', { name: `Add ${role}`, exact: true }).click();
  }
  await picker.getByRole('button', { name: 'Done', exact: true }).click();
  await master.getByRole('button', { name: 'Review rules', exact: true }).click();
  await master.getByRole('button', { name: 'Start game' }).click();
  await expect(master.getByRole('heading', { name: 'Night 1' })).toBeVisible();

  // With Cupid dealt, a death still marks only the player tapped.
  await master.getByRole('button', { name: 'Mark Minh dead' }).click();
  await expect(master.getByRole('button', { name: 'Restore Minh' })).toBeVisible();
  await expect(master.getByRole('button', { name: 'Mark Lan dead' })).toBeVisible();
  await master.getByRole('button', { name: 'Restore Minh' }).click();
  await expect(master.getByRole('button', { name: 'Mark Minh dead' })).toBeVisible();

  // The Doppelgänger's player now plays the Werewolf: the panel stays, retitled in wolf red.
  const copier = master.getByRole('region', { name: 'Doppelgänger', exact: true });
  await copier.getByRole('button', { name: /^Change .* role$/ }).click();
  const sheet = master.getByRole('dialog', { name: /^Role · / });
  await sheet.getByRole('combobox', { name: 'Plays' }).selectOption({ label: 'Werewolf' });
  await sheet.getByRole('button', { name: 'Done', exact: true }).click();
  const changed = master.getByRole('region', { name: 'Doppelgänger → Werewolf', exact: true });
  await expect(changed.getByRole('heading')).toHaveClass(/bg-werewolf-wash/);
  await expect(copier).toHaveCount(0);
  await master.reload();
  await expect(changed.getByRole('heading')).toHaveClass(/bg-werewolf-wash/);

  // A player's phone never hears of it.
  for (const message of minhMessages) {
    expect(JSON.stringify(message)).not.toContain('newRoles');
  }
});

test('the narrator finishes, everyone sees the summary, and the room plays again', async ({
  browser,
}) => {
  const roomName = `Hall ${String(Date.now()).slice(-6)}`;
  const master = await phone(browser);
  const minh = await phone(browser);
  const lan = await phone(browser);
  const minhMessages = roomMessages(minh);
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
  await master.getByRole('button', { name: 'Start game' }).click();
  await master.getByRole('button', { name: 'Mark Minh dead' }).click();
  await master.getByRole('textbox', { name: 'Note for Lan' }).fill('Saw the wolves.');
  await master.getByRole('heading', { name: 'Night 1' }).click();
  await expect(minh.getByRole('button', { name: 'Flip your card' })).toBeVisible();
  // Until Finish, a player's phone has never seen the whole deal.
  expect(minhMessages.some((message) => JSON.stringify(message).includes('"assignments"'))).toBe(
    false,
  );

  const finish = master.getByRole('button', { name: 'Finish game', exact: true });
  await finish.hover();
  await master.mouse.down();
  await master.waitForTimeout(1600);
  await master.mouse.up();

  // Everyone sees every role and the journal; only the narrator can play again.
  for (const page of [master, minh, lan]) {
    await expect(page.getByRole('heading', { name: 'Game record' })).toBeVisible();
    await expect(page.getByText('Minh', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Lan', { exact: true }).first()).toBeVisible();
    await page.getByRole('tab', { name: 'Night journal' }).click();
    await expect(page.getByText('Saw the wolves.')).toBeVisible();
  }
  for (const player of [minh, lan]) {
    await expect(player.getByRole('button', { name: 'Play again' })).toHaveCount(0);
  }

  // Play again: the same card set, players back in the village.
  await master.getByRole('button', { name: 'Play again' }).click();
  await expect(review).toBeEnabled();
  await expect(master.getByRole('button', { name: 'Edit Seer', exact: true })).toBeVisible();
  await expect(minh.getByText('You’re in the room')).toBeVisible();
  await expect(lan.getByText('You’re in the room')).toBeVisible();

  // A second game deals again from a clean night.
  const dealtBefore = minhMessages.length;
  await review.click();
  await master.getByRole('button', { name: 'Start game' }).click();
  await expect(master.getByRole('heading', { name: 'Night 1' })).toBeVisible();
  await expect(master.getByRole('button', { name: 'Mark Minh dead' })).toBeVisible();
  await expect(minh.getByRole('button', { name: 'Flip your card' })).toBeVisible();
  const secondGame = minhMessages.slice(dealtBefore).map((message) => JSON.stringify(message));
  expect(secondGame.some((text) => text.includes('Saw the wolves.'))).toBe(false);
});

test('a PIN guards the room; the narrator gets back in, hands over and deletes it', async ({
  browser,
}) => {
  const roomName = `Barn ${String(Date.now()).slice(-6)}`;
  const master = await phone(browser);
  const minh = await phone(browser);
  await createRoom(master, roomName);
  await expect(master.getByText(`PIN ${PIN}`)).toBeVisible();

  // A wrong PIN is refused; the right one seats Minh.
  await minh.goto('/');
  await minh.getByRole('button', { name: `Join ${roomName}` }).click();
  await minh.getByLabel('Your name').fill('Minh');
  await minh.getByLabel('Room PIN').fill('0000');
  await minh.getByRole('button', { name: 'Enter the village' }).click();
  await expect(minh.getByText('That PIN is wrong. Ask the narrator again.')).toBeVisible();
  await minh.getByLabel('Room PIN').fill(PIN);
  await minh.getByRole('button', { name: 'Enter the village' }).click();
  await expect(minh.getByText('You’re in the room')).toBeVisible();

  // Closed and left for home, the room is still the narrator's to open.
  await master.getByRole('button', { name: 'Close room' }).click();
  await master.goto('/');
  const row = master.getByRole('button', { name: `Join ${roomName}` });
  await expect(row).toContainText('Closed');
  await expect(row).toContainText('Your room');
  await row.click();
  await expect(master.getByRole('button', { name: 'Reopen room' })).toBeVisible();

  // The narrator hands the room to Minh and becomes a player.
  await master.getByRole('button', { name: 'Players (1)' }).click();
  await master.getByRole('button', { name: 'Make Minh narrator' }).click();
  await master.getByRole('button', { name: 'Hand over', exact: true }).click();
  await expect(master.getByText('You’re in the room')).toBeVisible();
  await expect(minh.getByRole('button', { name: 'Players (1)' })).toBeVisible();
  await expect(minh.getByText(`PIN ${PIN}`)).toBeVisible();

  // Minh deletes it: Minh goes home, the other phone is told.
  await minh.getByRole('button', { name: 'Menu' }).click();
  const remove = minh.getByRole('button', { name: 'Hold to delete room' });
  await remove.hover();
  await minh.mouse.down();
  await minh.waitForTimeout(1600);
  await minh.mouse.up();
  await expect(minh).toHaveURL(/\/$/);
  await expect(
    master.getByRole('heading', { name: 'The narrator deleted this room' }),
  ).toBeVisible();
  await expect(minh.getByRole('button', { name: `Join ${roomName}` })).toHaveCount(0);
});

test('an unknown room says it has closed', async ({ page }) => {
  await page.goto('/room/zzzzzzzz');
  await expect(page.getByRole('alert')).toContainText('This room has closed');
  await page.getByRole('button', { name: 'Back to the rooms' }).click();
  await expect(page).toHaveURL(/\/$/);
});
