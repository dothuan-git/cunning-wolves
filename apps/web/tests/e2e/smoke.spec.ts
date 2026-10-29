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

test('rule book opens from home, searches and shows a rule', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sách luật' }).click();
  await expect(page).toHaveURL(/\/rules$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Sách luật' })).toBeVisible();
  // Accents ignored; matches Phù thủy and Phù thủy sói.
  await page.getByRole('searchbox').fill('phu thuy');
  await expect(page.getByRole('status')).toHaveText(/^2\/\d+ vai$/);
  await page.getByRole('button', { name: 'Đọc luật của Phù thủy', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('searchbox').fill('zzz');
  await expect(page.getByText('Không có vai trò nào khớp.')).toBeVisible();
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('rule book factions fold away and back', async ({ page }) => {
  await page.goto('/rules');
  const wolves = page.getByRole('button', { name: /^Phe Sói/ });
  const card = page.getByRole('button', { name: 'Đọc luật của Ma sói', exact: true });
  await expect(card).toBeVisible();
  await wolves.click();
  await expect(wolves).toHaveAttribute('aria-expanded', 'false');
  await expect(card).toBeHidden();
  // A search opens every faction again, so a match is never hidden.
  await page.getByRole('searchbox').fill('ma soi');
  await expect(wolves).toHaveAttribute('aria-expanded', 'true');
  await expect(card).toBeVisible();
  await wolves.click();
  await wolves.click();
  await expect(card).toBeVisible();
});
