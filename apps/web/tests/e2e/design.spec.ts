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

test('the card shows its back, flips on a tap, and removes the role when hidden', async ({
  page,
}) => {
  await page.goto('/design?screen=my-card&state=hidden&lang=en&capture=1');
  const seer = page.getByRole('heading', { name: 'Seer', exact: true });
  const rule = page.getByText('Each night, choose one player', { exact: false });
  const card = page.getByRole('button', { name: 'Flip your card', exact: true });
  await expect(seer).toHaveCount(0);
  await expect(rule).toHaveCount(0);
  await expect(card).toHaveAttribute('aria-pressed', 'false');
  await card.click();
  await expect(card).toHaveAttribute('aria-pressed', 'true');
  await expect(seer).toBeVisible();
  await expect(rule).toBeVisible();
  // The seer has its own art; the name beside it is the accessible text, so the art has empty alt.
  await expect(page.locator('.role-card img[src*="seer"]')).toBeVisible();
  await card.click();
  await expect(seer).toHaveCount(0);
  await expect(rule).toHaveCount(0);
});

test('the card can be flipped from the keyboard', async ({ page }) => {
  await page.goto('/design?screen=my-card&state=hidden&lang=en&capture=1');
  const seer = page.getByRole('heading', { name: 'Seer', exact: true });
  await page.getByRole('button', { name: 'Flip your card', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(seer).toBeVisible();
  await page.keyboard.press('Space');
  await expect(seer).toHaveCount(0);
});

for (const size of [
  { width: 390, height: 844 },
  { width: 360, height: 640 },
  { width: 320, height: 568 },
]) {
  for (const lang of ['en', 'vi']) {
    test(`the card page never scrolls at ${String(size.width)}x${String(size.height)} in ${lang}`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto(`/design?screen=my-card&lang=${lang}&capture=1`);
      const card = page.locator('.flip-card');
      await expect(card).toBeVisible();
      const fit = await page.evaluate(() => ({
        pageHeight: document.documentElement.scrollHeight,
        pageWidth: document.documentElement.scrollWidth,
        face: (() => {
          const face = document.querySelector<HTMLElement>('.flip-front');
          return face ? face.scrollHeight - face.clientHeight : 0;
        })(),
      }));
      expect(fit.pageHeight).toBeLessThanOrEqual(size.height);
      expect(fit.pageWidth).toBeLessThanOrEqual(size.width);
      // Nothing inside the revealed face is cut off at the bottom.
      expect(fit.face).toBeLessThanOrEqual(0);
    });
  }
}

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
  await expect(page.locator('.role-card')).toHaveCSS('transition-duration', '0s');
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

test('the village shows players as lettered squares, five to a row, with your own highlighted', async ({
  page,
}) => {
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const squares = page.locator('main ul.grid-cols-5 > li');
  await expect(squares).toHaveCount(6);
  await expect(squares).toHaveText(['LLinh (you)', 'MMinh', 'AAn', 'HHà', 'HHuy', 'MMai']);
  const boxes = await squares.evaluateAll((items) =>
    items.map((item) => {
      const box = item.getBoundingClientRect();
      return {
        top: Math.round(box.top),
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
    }),
  );
  expect(new Set(boxes.slice(0, 5).map((box) => box.top)).size).toBe(1);
  expect(boxes[5]?.top ?? 0).toBeGreaterThan(boxes[0]?.top ?? 0);
  expect(boxes.every((box) => box.width === box.height)).toBe(true);
  await expect(squares.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('main ul.grid-cols-5 > li[aria-current]')).toHaveCount(1);
});

test('a role card in the village carousel opens enlarged and closes again', async ({ page }) => {
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const card = page.getByRole('button', { name: 'Look closer at Seer', exact: true });
  const dialog = page.getByRole('dialog', { name: 'Seer', exact: true });
  await expect(dialog).toHaveCount(0);
  await card.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Seer', exact: true })).toBeVisible();
  await expect(dialog.getByText('Each night, choose one player', { exact: false })).toBeVisible();
  // The enlarged card sits in the middle of the phone.
  const box = await dialog.locator('.zoom-card').boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - (viewport?.width ?? 0) / 2)).toBeLessThan(
    2,
  );
  // Tapping the card itself keeps it open; only the background and Escape close it.
  await dialog.locator('.zoom-card').click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Close', { exact: true })).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
  await card.click();
  await page.mouse.click(5, 5);
  await expect(dialog).toHaveCount(0);
});

test('the village page has no sideways page scroll in Vietnamese with many players', async ({
  page,
}) => {
  await page.goto('/design?screen=player-lobby&lang=vi&capture=1');
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
});

test('the live dot in the village is green and blinks, and holds still with reduced motion', async ({
  page,
}) => {
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const dot = page.getByRole('status').locator('span').first();
  await expect(dot).toHaveCSS('background-color', 'rgb(42, 143, 85)');
  await expect(dot).toHaveCSS('animation-name', 'blink');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(dot).toHaveCSS('animation-name', 'none');
});

test('your own tile glows and the others do not', async ({ page }) => {
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const tiles = page.locator('main ul.grid-cols-5 > li > button');
  await expect(tiles.nth(0)).not.toHaveCSS('box-shadow', 'none');
  await expect(tiles.nth(1)).toHaveCSS('box-shadow', 'none');
});

test('tapping a player tile shows their full name, and tapping again hides it', async ({
  page,
}) => {
  await page.goto('/design?screen=player-lobby&state=long&lang=en&capture=1');
  const hint = page.getByText('Tap a tile for the full name.', { exact: true });
  await expect(hint).toBeVisible();
  const tiles = page.locator('main ul.grid-cols-5 > li > button');
  await tiles.nth(1).click();
  await expect(page.getByText('Minh', { exact: true }).first()).toBeVisible();
  await expect(tiles.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(hint).toHaveCount(0);
  // Your own tile reads as you, with the whole long name.
  await tiles.nth(0).click();
  await expect(
    page.locator('[aria-live="polite"]').getByText('Nguyễn Hoàng Minh Phương (you)'),
  ).toBeVisible();
  await expect(tiles.nth(1)).toHaveAttribute('aria-pressed', 'false');
  await tiles.nth(0).click();
  await expect(hint).toBeVisible();
});

test('picking a tile never changes the height of the name row or moves the tiles', async ({
  page,
}) => {
  await page.goto('/design?screen=player-lobby&state=long&lang=en&capture=1');
  const tiles = page.locator('main ul.grid-cols-5 > li > button');
  const top = async () => Math.round((await tiles.first().boundingBox())?.y ?? 0);
  const before = await top();
  await tiles.nth(1).click();
  expect(await top()).toBe(before);
  await tiles.nth(0).click();
  await expect(
    page.locator('[aria-live="polite"]').getByText('Nguyễn Hoàng Minh Phương (you)'),
  ).toBeVisible();
  expect(await top()).toBe(before);
  await tiles.nth(0).click();
  expect(await top()).toBe(before);
});

test('the picked name slides in, a tile sinks when pressed, and both hold still with reduced motion', async ({
  page,
}) => {
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const tiles = page.locator('main ul.grid-cols-5 > li > button');
  await tiles.nth(1).click();
  await expect(page.locator('[aria-live="polite"]')).toHaveCSS('animation-name', 'name-pop');
  await expect(tiles.nth(1)).toHaveCSS('transition-duration', '0.15s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[aria-live="polite"]')).toHaveCSS('animation-name', 'none');
  await expect(tiles.nth(1)).toHaveCSS('transition-duration', '0s');
});

test('an enlarged card animates out before it is removed', async ({ page }) => {
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  await page.getByRole('button', { name: 'Look closer at Seer', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Seer', exact: true });
  await expect(dialog.locator('.zoom-card')).toHaveCSS('animation-name', 'zoom-in');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveAttribute('data-closing', 'true');
  await expect(dialog).toHaveCount(0);
});

test('with many players only the players section scrolls, and the page stays one screen high', async ({
  page,
}) => {
  await page.goto('/design?screen=player-lobby&state=many&lang=vi&capture=1');
  const tiles = page.locator('main ul.grid-cols-5 > li');
  await expect(tiles).toHaveCount(18);
  const fit = await page.evaluate(() => {
    const list = document.querySelector<HTMLElement>('main ul.grid-cols-5');
    const deck = document.querySelector<HTMLElement>('.deck');
    return {
      pageHeight: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
      listScrolls: list ? list.scrollHeight > list.clientHeight + 1 : false,
      deckHeight: deck ? deck.clientHeight : 0,
    };
  });
  expect(fit.pageHeight).toBeLessThanOrEqual(fit.viewport);
  expect(fit.listScrolls).toBe(true);
  // The cards keep a usable size.
  expect(fit.deckHeight).toBeGreaterThan(150);
  // The last tile can be reached and tapped.
  const last = page.locator('main ul.grid-cols-5 > li > button').last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
});

test('the role carousel loops without end and wraps back to the middle when it rests', async ({
  page,
}) => {
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const deck = page.locator('.deck');
  const read = () => deck.evaluate((el) => ({ left: el.scrollLeft, width: el.scrollWidth }));
  const start = await read();
  // Far to the right, past a whole set of cards.
  await deck.evaluate((el) => {
    el.scrollLeft += el.scrollWidth / 5 + 40;
  });
  // After it rests, it is back within the middle set, showing the same cards.
  await expect
    .poll(async () => {
      const now = await read();
      return Math.abs(now.left - start.left) < now.width / 5;
    })
    .toBe(true);
  // Only one set of cards is exposed to the keyboard and screen readers.
  await expect(page.getByRole('button', { name: /^Look closer at/ })).toHaveCount(4);
  // Swiping the other way loops too.
  await deck.evaluate((el) => {
    el.scrollLeft -= el.scrollWidth / 5 + 40;
  });
  await expect
    .poll(async () => {
      const now = await read();
      return now.left > now.width / 5 && now.left < (now.width * 4) / 5;
    })
    .toBe(true);
});

test('the role carousel moves on by itself, and not with reduced motion or after a touch', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const deck = page.locator('.deck');
  const left = () => deck.evaluate((el) => el.scrollLeft);
  const start = await left();
  await page.clock.runFor(4500);
  await expect.poll(left).toBeGreaterThan(start + 20);
  // A touch pauses it for a while. Let the smooth scroll finish first.
  await page.waitForTimeout(900);
  const touched = await left();
  await deck.dispatchEvent('pointerdown');
  await page.clock.runFor(4500);
  await page.waitForTimeout(600);
  expect(Math.abs((await left()) - touched)).toBeLessThan(4);
});

test('the role carousel picks up again soon after an enlarged card is closed', async ({ page }) => {
  await page.clock.install();
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const deck = page.locator('.deck');
  const left = () => deck.evaluate((el) => el.scrollLeft);
  await page.getByRole('button', { name: 'Look closer at Seer', exact: true }).click();
  await page.clock.runFor(12000);
  await page.mouse.click(5, 5);
  await page.clock.runFor(300);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.waitForTimeout(300);
  const closed = await left();
  await page.clock.runFor(2000);
  await expect.poll(left).toBeGreaterThan(closed + 20);
});

test('the role carousel stays still with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const deck = page.locator('.deck');
  const start = await deck.evaluate((el) => el.scrollLeft);
  await page.clock.runFor(9000);
  await page.waitForTimeout(600);
  expect(Math.abs((await deck.evaluate((el) => el.scrollLeft)) - start)).toBeLessThan(4);
});
