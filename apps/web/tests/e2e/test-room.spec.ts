import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

function phones(page: Page) {
  return page.locator('[data-device]');
}

async function deviceIds(page: Page): Promise<string[]> {
  return phones(page).evaluateAll((items) =>
    items.map((item) => item.getAttribute('data-device') ?? ''),
  );
}

test('two phones share a room and keep their ids across a refresh', async ({ browser }) => {
  const room = `/test/e2e-${String(Date.now())}`;
  // Separate contexts have separate localStorage, so each is its own device.
  const first = await browser.newContext();
  const second = await browser.newContext();
  const a = await first.newPage();
  const b = await second.newPage();

  await a.goto(room);
  await expect(a.getByRole('status')).toHaveText('Connected');
  await b.goto(room);
  await expect(phones(a)).toHaveCount(2);
  await expect(phones(b)).toHaveCount(2);
  const before = await deviceIds(a);

  await b.reload();
  await expect(b.getByRole('status')).toHaveText('Connected');
  await expect(phones(b)).toHaveCount(2);
  await expect(phones(a)).toHaveCount(2);
  expect(await deviceIds(b)).toEqual(before);

  await second.close();
  await expect(phones(a)).toHaveCount(1);
  await expect(a.getByText('This phone')).toBeVisible();
  await first.close();
});

test('a second tab on the same phone takes over the room', async ({ context }) => {
  const room = `/test/e2e-tabs-${String(Date.now())}`;
  const first = await context.newPage();
  await first.goto(room);
  await expect(first.getByRole('status')).toHaveText('Connected');

  const second = await context.newPage();
  await second.goto(room);
  await expect(second.getByRole('status')).toHaveText('Connected');
  await expect(first.getByRole('status')).toHaveText('Open in another tab');
  await expect(phones(second)).toHaveCount(1);
});

test('rejects a room name that is not allowed', async ({ page }) => {
  await page.goto('/test/Not%20Valid');
  await expect(page.getByRole('alert')).toContainText('Not a test room name');
});

test('test room fits a 390px phone without horizontal scroll', async ({ page }) => {
  await page.goto('/test/a-long-room-name-for-the-overflow-check');
  await expect(page.getByRole('status')).toHaveText('Connected');
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(390);
});
