import { expect, test, type Locator, type Page } from '@playwright/test';

/** Presses and holds a button long enough to fire it (HoldButton needs 800 ms). */
async function hold(page: Page, name: string, ms = 1000) {
  await page.getByRole('button', { name, exact: true }).hover();
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

async function closeSheet(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
}

const screens = [
  'home',
  'name-entry',
  'summary',
  'master-lobby',
  'setup',
  'narrator',
  'player-lobby',
  'rules-review',
  'my-card',
  'components',
];

for (const lang of ['vi', 'en']) {
  for (const screen of screens) {
    test(`${screen} renders in ${lang} on a phone`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`/design?screen=${screen}&lang=${lang}&capture=1`);
      await expect(page.locator('[data-design-screen]')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((image) => image.decode()));
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390,
      );
      expect(
        await page
          .locator('img')
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
            ),
          ),
      ).toBe(true);
      expect(errors).toEqual([]);
      if (screen === 'narrator') {
        const night = page.getByRole('heading', { level: 2 });
        expect(
          await night.evaluate((element) => element.getBoundingClientRect().height),
        ).toBeLessThanOrEqual(36);
      }
    });
  }
}

test('each night adds a note for every living player and earlier notes become text', async ({
  page,
}) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  const phase = page.getByRole('heading', { level: 2 });
  const minh = page.getByRole('textbox', { name: 'Note for Minh', exact: true });
  const an = page.getByRole('textbox', { name: 'Note for An', exact: true });
  await expect(phase).toHaveText('Night 2');
  await minh.fill('Chose Linh');
  await an.fill('Stayed quiet');
  await expect(page.getByRole('button', { name: 'Mark Minh dead', exact: true })).toBeVisible();
  await hold(page, 'Hold to end night');

  await expect(phase).toHaveText('Morning 2');
  await expect(page.getByRole('textbox')).toHaveCount(0);
  const minhRecord = page.getByRole('list', { name: 'Minh’s record', exact: true });
  await expect(minhRecord).toContainText('Chose Hà.');
  await expect(minhRecord).toContainText('Chose Linh');
  await expect(page.getByRole('list', { name: 'An’s record', exact: true })).toContainText(
    'Stayed quiet',
  );
  await page.getByRole('button', { name: 'Mark An dead', exact: true }).click();
  await hold(page, 'Hold to end morning');

  await expect(phase).toHaveText('Night 3');
  await expect(minh).toHaveValue('');
  await expect(an).toHaveCount(0);
  const anRecord = page.getByRole('list', { name: 'An’s record', exact: true });
  await expect(anRecord).toContainText('Stayed quiet');
  await expect(anRecord).toContainText('Morning 2');
  await expect(anRecord).toContainText('Died');
  await expect(page.getByRole('status')).toHaveText('5 players alive');
});

test('a player who died before the night gets no new note', async ({ page }) => {
  await page.goto('/design?screen=narrator&state=dead&lang=en&capture=1');
  await expect(page.getByRole('textbox', { name: 'Note for Linh', exact: true })).toHaveCount(0);
  const record = page.getByRole('list', { name: 'Linh’s record', exact: true });
  await expect(record).toContainText('Checked Minh: a Wolf.');
  await expect(record).toContainText('Morning 1');
  await page.getByRole('button', { name: 'Restore Linh', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Note for Linh', exact: true })).toBeVisible();
});

test('marking a player dead during the night keeps that night’s note', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  const linh = page.getByRole('textbox', { name: 'Note for Linh', exact: true });
  const record = page.getByRole('list', { name: 'Linh’s record', exact: true });
  await linh.fill('Bitten by the wolves');
  await page.getByRole('button', { name: 'Mark Linh dead', exact: true }).click();
  await expect(linh).toHaveValue('Bitten by the wolves');
  await expect(record).toContainText('Died');
  await page.getByRole('button', { name: 'Restore Linh', exact: true }).click();
  await expect(record).not.toContainText('Died');
});

test('tapping an earlier note edits it without changing the player status', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  await page.getByRole('button', { name: /^Edit Minh’s note for Night 1/ }).click();
  const field = page.getByRole('textbox', { name: 'Minh’s note for Night 1', exact: true });
  await expect(field).toBeFocused();
  await field.fill('Chose Huy.');
  await page.getByRole('button', { name: 'Mark Minh dead', exact: true }).focus();
  await expect(field).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Minh’s record', exact: true })).toContainText(
    'Chose Huy.',
  );
  await expect(page.getByRole('button', { name: 'Mark Minh dead', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('6 players alive');
});

test('a concealed card removes its role and description from the page', async ({ page }) => {
  await page.goto('/design?screen=my-card&state=hidden&lang=en&capture=1');
  const seer = page.getByRole('heading', { name: 'Seer', exact: true });
  const rule = page.getByText('Each night, choose one player', { exact: false });
  await expect(seer).toHaveCount(0);
  await expect(rule).toHaveCount(0);
  await page.getByRole('button', { name: 'Hold to see your card', exact: true }).hover();
  await page.mouse.down();
  await expect(seer).toBeVisible();
  // The seer has its own art now; the name beside it is the accessible text, so the art has empty alt.
  const art = page.locator('.role-card[data-revealed="true"] img');
  await expect(art).toBeVisible();
  await expect(art).toHaveAttribute('src', /seer/);
  await page.mouse.up();
  await expect(seer).toHaveCount(0);
  await expect(rule).toHaveCount(0);
});

test('the card can be held from the keyboard and hides when released', async ({ page }) => {
  await page.goto('/design?screen=my-card&state=hidden&lang=en&capture=1');
  const seer = page.getByRole('heading', { name: 'Seer', exact: true });
  await page.getByRole('button', { name: 'Hold to see your card', exact: true }).focus();
  await page.keyboard.down('Enter');
  await expect(seer).toBeVisible();
  await page.keyboard.up('Enter');
  await expect(seer).toHaveCount(0);
});

test('all seats must be filled before reviewing the rules', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  const ready = page.getByRole('button', { name: 'Review rules', exact: true });
  await expect(ready).toBeDisabled();
  await page.getByRole('button', { name: 'Add Villager', exact: true }).click();
  await expect(ready).toBeEnabled();
  await page.getByRole('button', { name: 'Remove one Wolf', exact: true }).click();
  await expect(ready).toBeDisabled();
});

test('role editor supports custom roles and an accessible dialog', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  await expect(page.getByRole('button', { name: 'Create custom role', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Add roles', exact: true }).click();
  await page.getByRole('button', { name: 'Create custom role', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Role name', exact: true }).fill('Lantern keeper');
  await dialog
    .getByRole('textbox', { name: 'Role description', exact: true })
    .fill('A sample role for this room.');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveAccessibleName('Add roles');
  await dialog.getByRole('button', { name: 'Add Lantern keeper', exact: true }).click();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Edit Lantern keeper', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review rules', exact: true })).toBeEnabled();
});

test('name entry validates whitespace and accepts Vietnamese accents', async ({ page }) => {
  await page.goto('/design?screen=name-entry&lang=en&capture=1');
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('   ');
  await page.getByRole('button', { name: 'Enter the village', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter a name with 1–24 characters.');
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Hà Nguyễn');
  await page.getByRole('button', { name: 'Enter the village', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Gather the village', exact: true }),
  ).toBeVisible();
});

test('long card text and player names remain within the phone width', async ({ page }) => {
  for (const screen of ['my-card', 'narrator']) {
    await page.goto(`/design?screen=${screen}&state=long&lang=en&capture=1`);
    await expect(page.locator('[data-design-screen]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  }
});

test('language switching preserves note text', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  await page
    .getByRole('textbox', { name: 'Note for Linh', exact: true })
    .fill('A note in either language');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('vi');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('textbox', { name: 'Ghi chú cho Linh', exact: true })).toHaveValue(
    'A note in either language',
  );
});

test('narrator tools can reorder roles without mixing their player notes', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  await page.getByRole('textbox', { name: 'Note for Minh', exact: true }).fill('Wolf observation');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.click();
  await page.getByRole('button', { name: 'Move Wolf earlier', exact: true }).click();
  await closeSheet(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(menu).toBeFocused();
  await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText('Wolf');
  await expect(page.getByRole('textbox', { name: 'Note for Minh', exact: true })).toHaveValue(
    'Wolf observation',
  );
});

test('removed players see a clear return action', async ({ page }) => {
  await page.goto('/design?screen=player-lobby&state=removed&lang=en&capture=1');
  await expect(page.getByRole('alert')).toContainText('You were removed from the room.');
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeVisible();
  await expect(page.getByText('6 players', { exact: true })).toHaveCount(0);
});

test('screen actions keep 48px touch targets', async ({ page }) => {
  for (const screen of screens) {
    await page.goto(`/design?screen=${screen}&lang=en&capture=1`);
    await expect(page.locator('[data-design-screen]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const undersized = await page.locator('button, select').evaluateAll((buttons) =>
      buttons.flatMap((button) => {
        const box = button.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && (box.width < 47.9 || box.height < 47.9)
          ? [button.getAttribute('aria-label') ?? button.textContent]
          : [];
      }),
    );
    expect(undersized).toEqual([]);
  }
});

test('keyboard focus is visible and reduced motion disables card animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/design?screen=my-card&lang=en&capture=1');
  await expect(page.locator('[data-design-screen]')).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const language = page.getByRole('combobox', { name: 'Language', exact: true });
  await language.focus();
  await expect(language).toHaveCSS('outline-style', 'solid');
  await expect(language).toHaveCSS('outline-color', 'rgb(42, 65, 112)');
  await page.keyboard.press('Escape');
  await expect(page.locator('.role-card')).toHaveCSS('animation-name', 'none');
});

test('summary separates roles and night notes with keyboard-accessible tabs', async ({ page }) => {
  await page.goto('/design?screen=summary&lang=en&capture=1');
  const roles = page.getByRole('tab', { name: 'Roles', exact: true });
  const notes = page.getByRole('tab', { name: 'Night journal', exact: true });
  const revealed = page.getByText('Everyone’s roles are now revealed.', { exact: true });
  const note = page.getByText('Checked Minh: a Wolf.', { exact: true });
  await expect(roles).toHaveAttribute('aria-selected', 'true');
  await expect(revealed).toBeVisible();
  await expect(note).toHaveCount(0);
  await roles.focus();
  await roles.press('ArrowRight');
  await expect(notes).toBeFocused();
  await expect(notes).toHaveAttribute('aria-selected', 'true');
  await expect(note).toBeVisible();
  await expect(revealed).toHaveCount(0);
  await page.getByText('Morning 1', { exact: true }).click();
  await expect(page.getByText('Huy died', { exact: true })).toBeVisible();
  await notes.press('Home');
  await expect(roles).toBeFocused();
  await expect(revealed).toBeVisible();
});

test('empty night journal and return-home action are clear', async ({ page }) => {
  await page.goto('/design?screen=summary&state=empty&lang=en&capture=1');
  await expect(page.getByRole('tab', { name: 'Night journal', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByText('No notes were recorded.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to home', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cunning Wolves', level: 1 })).toBeVisible();
});

test('one tap marks a player dead and Undo restores them', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  await expect(page.getByRole('status')).toHaveText('6 players alive');
  await page.getByRole('button', { name: 'Mark Minh dead', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('5 players alive');
  await expect(page.getByText('Minh marked dead', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('6 players alive');
  await expect(page.getByRole('button', { name: 'Mark Minh dead', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(0);
});

test('a short press does not end the night', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  const phase = page.getByRole('heading', { level: 2 });
  await hold(page, 'Hold to end night', 300);
  await page.waitForTimeout(800);
  await expect(phase).toHaveText('Night 2');
  await page.getByRole('button', { name: 'Hold to end night', exact: true }).focus();
  await page.keyboard.down('Enter');
  await expect(phase).toHaveText('Morning 2');
  await page.keyboard.up('Enter');
});

test('the wake guide steps through waking roles in order', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  const guide = page.getByRole('region', { name: 'Wake order', exact: true });
  const next = guide.getByRole('button', { name: 'Wake the next role', exact: true });
  await expect(guide).toContainText('Waking 1 of 3');
  await expect(guide).toContainText('Seer wakes up');
  await expect(page.getByRole('region', { name: 'Seer', exact: true })).toHaveAttribute(
    'aria-current',
    'step',
  );
  await next.click();
  await expect(guide).toContainText('Wolf wakes up');
  await expect(page.getByRole('region', { name: 'Wolf', exact: true })).toHaveAttribute(
    'aria-current',
    'step',
  );
  await expect(page.getByRole('region', { name: 'Seer', exact: true })).not.toHaveAttribute(
    'aria-current',
  );
  await next.click();
  await next.click();
  await expect(guide).toContainText('Everyone has woken');
  await expect(next).toHaveCount(0);
  await guide.getByRole('button', { name: 'Back to the previous role', exact: true }).click();
  await expect(guide).toContainText('Witch wakes up');
  await hold(page, 'Hold to end night');
  await expect(guide).toHaveCount(0);
});

test('narrator note fields grow with their text instead of scrolling inside', async ({ page }) => {
  const scrolledOut = (field: Locator) =>
    field.evaluate((element) => element.scrollHeight - element.clientHeight);
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  const current = page.getByRole('textbox', { name: 'Note for Minh', exact: true });
  await current.fill('Chose Linh.\nThe witch hesitated.\nThe seer pointed at An.\nQuiet after.');
  expect(await scrolledOut(current)).toBeLessThanOrEqual(0);

  await page.goto('/design?screen=narrator&state=long&lang=en&capture=1');
  await page
    .getByRole('button', { name: /^Edit Nguyễn Hoàng Minh Phương’s note for Night 1/ })
    .click();
  const edited = page.getByRole('textbox', {
    name: 'Nguyễn Hoàng Minh Phương’s note for Night 1',
    exact: true,
  });
  await expect(edited).toBeFocused();
  expect(await scrolledOut(edited)).toBeLessThanOrEqual(0);
});

test('a focused note field is not hidden behind the end-night button', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=vi&capture=1');
  const field = page.getByRole('textbox', { name: 'Ghi chú cho Hà', exact: true });
  await field.focus();
  const [fieldBox, footerBox] = await Promise.all([
    field.boundingBox(),
    page.locator('footer').boundingBox(),
  ]);
  if (!fieldBox || !footerBox) throw new Error('note field or footer is not rendered');
  expect(fieldBox.y + fieldBox.height).toBeLessThanOrEqual(footerBox.y);
});

test('focusing the sticky end-night button does not scroll the page', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  await page.getByRole('button', { name: 'Hold to end night', exact: true }).focus();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('role quantities stop at capacity and removed roles can be added from the library', async ({
  page,
}) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  await page.getByRole('button', { name: 'Remove one Seer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit Seer', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Add roles', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Add Seer', exact: true }).click();
  await dialog.getByRole('button', { name: 'Add Villager', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Add Wolf', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Review rules', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Add Seer', exact: true })).toBeDisabled();
});
