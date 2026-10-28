import { expect, test } from '@playwright/test';

test.use({ locale: 'vi-VN' });

test('home page loads the room list from the worker', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Either the list or the empty state, depending on what other tests left behind.
  await expect(
    page.getByRole('heading', { name: /^(Phòng đang mở|Ngôi làng còn yên ắng)$/ }),
  ).toBeVisible();
});

test('language switch updates the page language', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tùy chọn' }).click();
  await page.getByRole('combobox').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('combobox').selectOption('vi');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
});

test('fits a 390px phone without horizontal scroll', async ({ page }) => {
  await page.goto('/');
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(390);
});
