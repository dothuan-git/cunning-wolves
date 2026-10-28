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

test('an unknown room says it has closed', async ({ page }) => {
  await page.goto('/room/zzzzzzzz');
  await expect(page.getByRole('alert')).toContainText('This room has closed');
  await page.getByRole('button', { name: 'Back to the rooms' }).click();
  await expect(page).toHaveURL(/\/$/);
});
