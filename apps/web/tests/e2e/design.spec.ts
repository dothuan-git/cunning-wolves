import { expect, test, type Locator, type Page } from '@playwright/test';

/** Presses and holds a button long enough to fire it (HoldButton needs 800 ms). */
async function hold(page: Page, name: string, ms = 1000) {
  await page.getByRole('button', { name, exact: true }).hover();
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

/** Waits for the animations that end (not the ones that loop, like the live dot). */
async function settle(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

async function closeSheet(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
}

const screens = [
  'home',
  'name-entry',
  'summary',
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

test('marking a player dead during the night keeps that night’s note as its only row', async ({
  page,
}) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  const linh = page.getByRole('textbox', { name: 'Note for Linh', exact: true });
  const record = page.getByRole('list', { name: 'Linh’s record', exact: true });
  await linh.fill('Bitten by the wolves');
  await page.getByRole('button', { name: 'Mark Linh dead', exact: true }).click();
  await expect(linh).toHaveValue('Bitten by the wolves');
  await expect(page.getByRole('button', { name: 'Restore Linh', exact: true })).toBeVisible();
  await expect(record).not.toContainText('Died');
  await page.getByRole('button', { name: 'Restore Linh', exact: true }).click();
  await expect(linh).toHaveValue('Bitten by the wolves');
});

test('the marks sheet switches marks, moves a single mark, and leaves the status alone', async ({
  page,
}) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  await page.getByRole('button', { name: 'Marks for Hà (1)', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Marks · Hà', exact: true });
  await expect(sheet.getByRole('checkbox', { name: /Heal potion used/ })).toBeChecked();
  await expect(sheet).toContainText('Now with Linh');
  await sheet.getByRole('checkbox', { name: /Kill potion used/ }).check();
  await sheet.getByRole('checkbox', { name: /Sheriff/ }).check();
  await closeSheet(page);
  await expect(page.getByRole('button', { name: 'Marks for Hà (3)', exact: true })).toBeVisible();
  // Only the witch's holder is offered her potions.
  await page.getByRole('button', { name: 'Marks for Minh (0)', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('checkbox')).toHaveCount(1);
  await closeSheet(page);
  await expect(page.getByRole('status')).toHaveText('6 players alive');
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

test('the card is dealt in from above when the page opens, but not with reduced motion', async ({
  page,
}) => {
  await page.goto('/design?screen=my-card&state=hidden&lang=en&capture=1');
  await expect(page.locator('.flip-card')).toHaveCSS('animation-name', 'deal-in');
  await expect(page.locator('.flip-card')).toHaveCSS('animation-duration', '0.45s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/design?screen=my-card&state=hidden&lang=en&capture=1');
  await expect(page.locator('.flip-card')).toHaveCSS('animation-name', 'none');
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

test('the setup settings sheet sets the wake order, and it is kept when reopened', async ({
  page,
}) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  const open = async () => {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await settle(page);
  };
  await open();
  await expect(page.getByRole('heading', { name: 'Wake order', level: 3 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seer, 1 of 3', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Wolf, 2 of 3', exact: true })).toBeVisible();
  const witch = page.getByRole('button', { name: 'Witch, 3 of 3', exact: true });
  await witch.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Witch, 2 of 3', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await open();
  await expect(page.getByRole('button', { name: 'Witch, 2 of 3', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Wolf, 3 of 3', exact: true })).toBeVisible();
});

test('the wake order title keeps a gap above its tiles', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await settle(page);
  const title = await page.getByRole('heading', { name: 'Wake order', level: 3 }).boundingBox();
  const tile = await page.getByRole('button', { name: 'Seer, 1 of 3', exact: true }).boundingBox();
  if (!title || !tile) throw new Error('wake order is not rendered');
  expect(tile.y - (title.y + title.height)).toBeGreaterThanOrEqual(16);
});

test('roles are chosen freely, but the rules open only with one role per player', async ({
  page,
}) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  const ready = page.getByRole('button', { name: 'Review rules', exact: true });
  const line = page.locator('footer').getByRole('status');
  // Five roles for six players.
  await expect(line).toHaveText('Choose 1 more role.');
  await expect(ready).toBeDisabled();
  await page.getByRole('button', { name: 'Add village roles', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add village roles', exact: true });
  const villager = picker.getByRole('button', { name: 'Add Villager', exact: true });
  await villager.click();
  await expect(picker).toContainText('Every player has a role.');
  // More roles than players can be chosen: the narrator may expect more to join.
  await villager.click();
  await villager.click();
  await expect(villager).toBeEnabled();
  await expect(picker).toContainText('2 roles too many.');
  await picker.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(line).toHaveText('2 roles too many.');
  await expect(ready).toBeDisabled();
  // Taking the last copy off in the detailed card takes the role out of the game.
  await page.getByRole('button', { name: 'Edit Seer', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Seer', exact: true })
    .getByRole('button', { name: 'Remove one Seer', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit Seer', exact: true })).toHaveCount(0);
  await expect(line).toHaveText('1 role too many.');
  await page.getByRole('button', { name: 'Edit Witch', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Witch', exact: true })
    .getByRole('button', { name: 'Remove one Witch', exact: true })
    .click();
  await expect(line).toHaveText('Every player has a role.');
  await expect(ready).toBeEnabled();
});

test('the room panel lists the players, removes one, and closes the room', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  const room = page.getByRole('region', { name: 'Room', exact: true });
  await expect(room.getByRole('heading', { level: 2 })).toHaveText('The old mill');
  await expect(room.getByRole('status')).toHaveText('Open');
  await room.getByRole('button', { name: 'Close room', exact: true }).click();
  await expect(room.getByRole('status')).toHaveText('Closed');
  await room.getByRole('button', { name: 'Reopen room', exact: true }).click();
  await expect(room.getByRole('status')).toHaveText('Open');
  // Six players and five roles; removing a player matches them.
  await room.getByRole('button', { name: 'Players (6)', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Players (6)', exact: true });
  await sheet.getByRole('button', { name: 'Remove Mai', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Remove player?', exact: true });
  await expect(confirm).toContainText('Mai will leave the room.');
  await confirm.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(confirm).toHaveCount(0);
  const after = page.getByRole('dialog', { name: 'Players (5)', exact: true });
  await expect(after.getByText('Mai', { exact: true })).toHaveCount(0);
  await after.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Review rules', exact: true })).toBeEnabled();
});

test('with no players yet, setup says it is waiting for them', async ({ page }) => {
  await page.goto('/design?screen=setup&state=empty&lang=en&capture=1');
  await expect(page.locator('footer').getByRole('status')).toHaveText(
    'Waiting for players to join.',
  );
  await expect(page.getByRole('button', { name: 'Review rules', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Players (0)', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('No one has joined yet.');
});

test('each faction has a grey card that opens its own list of roles to add', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  const blocks = page.locator('main section[aria-labelledby^="faction-"]');
  await expect(blocks.nth(0).getByRole('heading', { level: 2 })).toHaveText('Wolves');
  await expect(blocks.nth(1).getByRole('heading', { level: 2 })).toHaveText('Village');
  await expect(blocks.nth(2).getByRole('heading', { level: 2 })).toHaveText('Third faction');
  await expect(blocks.nth(0).getByRole('button', { name: 'Add wolf roles' })).toBeVisible();
  await page.getByRole('button', { name: 'Add wolf roles', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add wolf roles', exact: true });
  // Only that faction's roles are listed.
  await expect(picker.getByRole('button', { name: 'Add Wolf', exact: true })).toBeVisible();
  await expect(picker.getByRole('button', { name: 'Add Seer', exact: true })).toHaveCount(0);
  await picker.getByRole('button', { name: 'Add Wolf', exact: true }).click();
  await expect(picker).toContainText('Every player has a role.');
  // Copies come off one per tap.
  const minus = picker.getByRole('button', { name: 'Remove one Wolf', exact: true });
  await minus.click();
  await expect(picker).toContainText('Choose 1 more role.');
  await minus.click();
  await minus.click();
  // At none the role is out, and its "−" goes.
  await expect(picker).toContainText('Choose 3 more roles.');
  await expect(minus).toHaveCount(0);
});

test('the list of roles can be searched, ignoring accents', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=vi&capture=1');
  await page.getByRole('button', { name: 'Thêm vai phe Dân', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Thêm vai phe Dân', exact: true });
  const search = picker.getByRole('searchbox', { name: 'Tìm vai trò', exact: true });
  await expect(picker.getByRole('button', { name: /^Thêm / })).toHaveCount(7);
  await search.fill('tien');
  await expect(picker.getByRole('button', { name: /^Thêm / })).toHaveCount(1);
  await expect(picker.getByRole('button', { name: 'Thêm Tiên tri', exact: true })).toBeVisible();
  await search.fill('zzz');
  await expect(picker.getByText('Không có vai trò nào khớp.')).toBeVisible();
});

test('a custom role is made from the list and shows up in it', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  await page.getByRole('button', { name: 'Add wolf roles', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add wolf roles', exact: true });
  await picker.getByRole('button', { name: 'Create custom role', exact: true }).click();
  const creator = page.getByRole('dialog', { name: 'Create custom role', exact: true });
  await creator.getByRole('textbox', { name: 'Role name', exact: true }).fill('Lantern keeper');
  await creator
    .getByRole('textbox', { name: 'Role description', exact: true })
    .fill('A sample role for this room.');
  await expect(creator.getByRole('combobox', { name: 'Faction' })).toHaveValue('werewolf');
  await creator.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(creator).toHaveCount(0);
  await picker.getByRole('button', { name: 'Add Lantern keeper', exact: true }).click();
  await picker.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Edit Lantern keeper', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review rules', exact: true })).toBeEnabled();
});

test('name entry validates whitespace and accepts Vietnamese accents', async ({ page }) => {
  await page.goto('/design?screen=name-entry&lang=en&capture=1');
  await page.getByRole('textbox', { name: 'Room PIN', exact: true }).fill('4821');
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('   ');
  await page.getByRole('button', { name: 'Open the room', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter a name with 1–24 characters.');
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Hà Nguyễn');
  // The PIN keeps digits only, and needs all four.
  const pin = page.getByRole('textbox', { name: 'Room PIN', exact: true });
  await pin.fill('4a8');
  await expect(pin).toHaveValue('48');
  await page.getByRole('button', { name: 'Open the room', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter 4 digits.');
  await pin.fill('4821');
  await page.getByRole('button', { name: 'Open the room', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Prepare the roles', exact: true })).toBeVisible();
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
  await settle(page);
  const wolf = page.getByRole('button', { name: 'Wolf, 2 of 3', exact: true });
  const seer = page.getByRole('button', { name: 'Seer, 1 of 3', exact: true });
  const from = await wolf.boundingBox();
  const to = await seer.boundingBox();
  if (!from || !to) throw new Error('wake tiles are not rendered');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Wolf, 1 of 3', exact: true })).toBeVisible();
  await closeSheet(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(menu).toBeFocused();
  await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText('Wolf');
  await expect(page.getByRole('textbox', { name: 'Note for Minh', exact: true })).toHaveValue(
    'Wolf observation',
  );
});

test('wake order tiles sit four to a row and move with the arrow keys', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const seer = page.getByRole('button', { name: 'Seer, 1 of 3', exact: true });
  const wolf = page.getByRole('button', { name: 'Wolf, 2 of 3', exact: true });
  const [seerBox, wolfBox] = await Promise.all([seer.boundingBox(), wolf.boundingBox()]);
  if (!seerBox || !wolfBox) throw new Error('wake tiles are not rendered');
  expect(Math.round(wolfBox.y)).toBe(Math.round(seerBox.y));
  expect(wolfBox.x).toBeGreaterThan(seerBox.x);
  await seer.focus();
  await page.keyboard.press('ArrowRight');
  const moved = page.getByRole('button', { name: 'Seer, 2 of 3', exact: true });
  await expect(moved).toBeFocused();
  await expect(page.getByText('Seer is now 2 of 3', { exact: true })).toBeAttached();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Seer, 1 of 3', exact: true })).toBeFocused();
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
    await settle(page);
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
  // The journal is open top to bottom, with no phase to expand.
  await expect(page.getByRole('heading', { name: 'Morning 1', exact: true })).toBeVisible();
  await expect(page.getByText('Huy died', { exact: true })).toBeVisible();
  await notes.press('Home');
  await expect(roles).toBeFocused();
  await expect(revealed).toBeVisible();
});

test('summary journal sections fold away and open again', async ({ page }) => {
  await page.goto('/design?screen=summary&state=notes&lang=en&capture=1');
  const night = page.getByRole('button', { name: 'Night 1', exact: true });
  const note = page.getByText('Checked Minh: a Wolf.', { exact: true });
  await expect(night).toHaveAttribute('aria-expanded', 'true');
  await expect(note).toBeVisible();
  await night.click();
  await expect(night).toHaveAttribute('aria-expanded', 'false');
  await expect(note).toBeHidden();
  await night.click();
  await expect(note).toBeVisible();
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

test('one tap marks a player dead and a second tap restores them, with no Undo bar', async ({
  page,
}) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  await expect(page.getByRole('status')).toHaveText('6 players alive');
  await page.getByRole('button', { name: 'Mark Minh dead', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('5 players alive');
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore Minh', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('6 players alive');
  await expect(page.getByRole('button', { name: 'Mark Minh dead', exact: true })).toBeVisible();
});

test('the square finish button needs a long hold, and finishing is not in the menu', async ({
  page,
}) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  const finish = page.locator('footer').getByRole('button', { name: 'Finish game', exact: true });
  const box = await finish.boundingBox();
  if (!box) throw new Error('finish button is not rendered');
  expect(Math.round(box.width)).toBe(Math.round(box.height));
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const menu = page.getByRole('dialog');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Finish game', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await hold(page, 'Finish game', 500);
  await expect(page.getByText('Narrator', { exact: true }).first()).toBeVisible();
  await hold(page, 'Finish game', 1600);
  await expect(page.getByText('Game record', { exact: true }).first()).toBeVisible();
});

test('a status change animates its pill and the alive count, and holds still with reduced motion', async ({
  page,
}) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  const mark = page.getByRole('button', { name: 'Mark Minh dead', exact: true });
  await expect(mark.locator('span').first()).toHaveCSS('animation-name', 'none');
  await mark.click();
  const pill = page
    .getByRole('button', { name: 'Restore Minh', exact: true })
    .locator('span')
    .first();
  await expect(pill).toHaveCSS('animation-name', 'count-pop');
  await expect(page.getByRole('status')).toHaveCSS('animation-name', 'name-pop');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(pill).toHaveCSS('animation-name', 'none');
});

test('a role goes grey only when all its players are dead', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  const band = (role: string) =>
    page.getByRole('region', { name: role, exact: true }).locator('h3');
  const seerTitle = band('Seer').locator('span').last();
  const wolfBand = band('Wolf');
  const seerBefore = await seerTitle.evaluate((el) => getComputedStyle(el).color);
  await page.getByRole('button', { name: 'Mark Linh dead', exact: true }).click();
  await expect(seerTitle).toHaveCSS('color', 'rgb(92, 88, 82)');
  await expect(band('Seer')).toHaveCSS('background-color', 'rgb(207, 202, 193)');
  expect(seerBefore).not.toBe('rgb(92, 88, 82)');
  const wolfBefore = await wolfBand.evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.getByRole('button', { name: 'Mark Minh dead', exact: true }).click();
  await expect(wolfBand).toHaveCSS('background-color', wolfBefore);
  await page.getByRole('button', { name: 'Mark An dead', exact: true }).click();
  await expect(wolfBand).toHaveCSS('background-color', 'rgb(207, 202, 193)');
  await page.getByRole('button', { name: 'Restore An', exact: true }).click();
  await expect(wolfBand).toHaveCSS('background-color', wolfBefore);
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

test('the narrator has no wake guide and every alive dot is green and blinks', async ({ page }) => {
  await page.goto('/design?screen=narrator&lang=en&capture=1');
  await expect(page.getByRole('region', { name: 'Wake order', exact: true })).toHaveCount(0);
  const dot = page
    .getByRole('button', { name: 'Mark Linh dead', exact: true })
    .locator('span span')
    .first();
  await expect(dot).toHaveCSS('background-color', 'rgb(42, 143, 85)');
  await expect(dot).toHaveCSS('animation-name', 'blink');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(dot).toHaveCSS('animation-name', 'none');
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

test('a selected card opens as a detailed card where the rule and the quantity are edited', async ({
  page,
}) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  await page.getByRole('button', { name: 'Edit Seer', exact: true }).click();
  const card = page.getByRole('dialog', { name: 'Seer', exact: true });
  // The rule reads as text, with a hint, until it is tapped.
  await expect(card.getByText('Tap to edit rule.')).toBeVisible();
  await expect(card.getByRole('textbox')).toHaveCount(0);
  await card
    .getByRole('button', {
      name: 'Each night, choose one player to learn whether they are a Wolf.',
      exact: true,
    })
    .click();
  const rule = card.getByRole('textbox', { name: 'Role description', exact: true });
  await expect(rule).toBeFocused();
  await expect(rule).toHaveValue('Each night, choose one player to learn whether they are a Wolf.');
  // One copy: it can go either way.
  await expect(card.getByRole('button', { name: 'Remove one Seer', exact: true })).toBeEnabled();
  await card.getByRole('button', { name: 'Add Seer', exact: true }).click();
  await expect(card.getByText('2', { exact: true })).toBeVisible();
  // There is no limit on copies.
  await expect(card.getByRole('button', { name: 'Add Seer', exact: true })).toBeEnabled();
  await expect(card.getByRole('button', { name: 'Remove one Seer', exact: true })).toBeEnabled();
  // The stepper took focus, so the rule is text again: tap it to edit.
  await card
    .getByRole('button', {
      name: 'Each night, choose one player to learn whether they are a Wolf.',
      exact: true,
    })
    .click();
  await rule.fill('Looks at one player each night.');
  await page.mouse.click(5, 5);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Review rules', exact: true })).toBeEnabled();
  // The changes were kept.
  await page.getByRole('button', { name: 'Edit Seer', exact: true }).click();
  await expect(
    page
      .getByRole('dialog', { name: 'Seer', exact: true })
      .getByRole('button', { name: 'Looks at one player each night.', exact: true }),
  ).toBeVisible();
});

test('a card cannot be left without a rule', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  await page.getByRole('button', { name: 'Edit Seer', exact: true }).click();
  const card = page.getByRole('dialog', { name: 'Seer', exact: true });
  await card
    .getByRole('button', {
      name: 'Each night, choose one player to learn whether they are a Wolf.',
      exact: true,
    })
    .click();
  const rule = card.getByRole('textbox', { name: 'Role description', exact: true });
  await rule.fill('');
  // Leaving the box puts the rule back and shows it as text again.
  await card.getByRole('heading', { name: 'Seer' }).click();
  await expect(card.getByRole('textbox')).toHaveCount(0);
  await expect(
    card.getByRole('button', {
      name: 'Each night, choose one player to learn whether they are a Wolf.',
      exact: true,
    }),
  ).toBeVisible();
  // Closing while it is empty puts it back too.
  await card
    .getByRole('button', {
      name: 'Each night, choose one player to learn whether they are a Wolf.',
      exact: true,
    })
    .click();
  await rule.fill('');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit Seer', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Seer', exact: true }).getByRole('button', {
      name: 'Each night, choose one player to learn whether they are a Wolf.',
      exact: true,
    }),
  ).toBeVisible();
});

test('the "−" on a card in the list sits over its corner and has a 48px touch area', async ({
  page,
}) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  await page.getByRole('button', { name: 'Add village roles', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add village roles', exact: true });
  const cross = picker.getByRole('button', { name: 'Remove one Seer', exact: true });
  await expect(cross).toBeVisible();
  await settle(page);
  const card = await picker.getByRole('button', { name: 'Add Seer', exact: true }).boundingBox();
  const box = await cross.boundingBox();
  const dot = await cross.locator('.decrease-dot').boundingBox();
  if (!card || !box || !dot) throw new Error('no boxes');
  expect(box.width).toBeGreaterThanOrEqual(47.9);
  expect(box.height).toBeGreaterThanOrEqual(47.9);
  // The ink circle's middle is on the card's top right corner.
  expect(Math.abs(dot.x + dot.width / 2 - (card.x + card.width))).toBeLessThan(3);
  expect(Math.abs(dot.y + dot.height / 2 - card.y)).toBeLessThan(3);
  // The cards on the page itself have no "−".
  await picker.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Remove one / })).toHaveCount(0);
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
  const box = await dialog.locator('.detailed-card').boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - (viewport?.width ?? 0) / 2)).toBeLessThan(
    2,
  );
  // Tapping the card itself keeps it open; only the background and Escape close it.
  await dialog.locator('.detailed-card').click();
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

test('a room on the home page has a blinking dot: green when open, red when in play', async ({
  page,
}) => {
  await page.goto('/design?screen=home&lang=en&capture=1');
  const dotOf = (label: string) =>
    page.locator('li', { hasText: label }).locator('span[aria-hidden="true"]');
  const open = dotOf('Open').first();
  const playing = dotOf('In play').first();
  await expect(open).toHaveCSS('background-color', 'rgb(42, 143, 85)');
  await expect(open).toHaveCSS('animation-name', 'blink');
  await expect(playing).toHaveCSS('background-color', 'rgb(163, 50, 31)');
  await expect(playing).toHaveCSS('animation-name', 'blink');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(open).toHaveCSS('animation-name', 'none');
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
  await expect(dialog).toHaveCSS('animation-name', 'zoom-in');
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
    const list = document.querySelector<HTMLElement>('main .scroll-area');
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

test('tonight’s roles lists the cards three to a row, one block per faction', async ({ page }) => {
  await page.goto('/design?screen=rules-review&state=many&lang=en&capture=1');
  const blocks = page.locator('main section');
  await expect(blocks).toHaveCount(2);
  await expect(blocks.nth(0).getByRole('heading', { level: 2 })).toHaveText('Wolves');
  await expect(blocks.nth(1).getByRole('heading', { level: 2 })).toHaveText('Village');
  await expect(blocks.nth(0).getByRole('button')).toHaveCount(2);
  await expect(blocks.nth(1).getByRole('button')).toHaveCount(7);
  const tops = await blocks
    .nth(1)
    .getByRole('button')
    .evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().top)));
  expect(new Set(tops.slice(0, 3)).size).toBe(1);
  expect(new Set(tops.slice(3, 6)).size).toBe(1);
  expect(tops[3]).toBeGreaterThan(tops[0] ?? 0);
  // Each card says how many of it are in the game.
  await expect(
    page.getByRole('button', { name: 'Look closer at Villager, 2 in this game', exact: true }),
  ).toBeVisible();
});

test('tonight’s roles fits the narrowest phone in both languages', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const lang of ['en', 'vi']) {
    await page.goto(`/design?screen=rules-review&state=many&lang=${lang}&capture=1`);
    await expect(page.locator('[data-design-screen]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  }
});

test('a card opens enlarged on its own with its count, and a tap on the background closes it', async ({
  page,
}) => {
  await page.goto('/design?screen=rules-review&lang=en&capture=1');
  const opener = page.getByRole('button', {
    name: 'Look closer at Witch, 1 in this game',
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Witch', exact: true });
  await expect(dialog.locator('.detailed-card')).toHaveCount(1);
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Witch');
  await expect(dialog).toContainText('1 in this game');
  // A tap on the card keeps it open; a tap on the background closes it and returns focus.
  await dialog.locator('.detailed-card').click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('an enlarged role card closes with Escape and animates in, but not with reduced motion', async ({
  page,
}) => {
  await page.goto('/design?screen=rules-review&lang=en&capture=1');
  await page
    .getByRole('button', { name: 'Look closer at Wolf, 2 in this game', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Wolf', exact: true });
  await expect(dialog).toHaveCSS('animation-name', 'zoom-in');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(dialog).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('reading the rules marks the button done', async ({ page }) => {
  await page.goto('/design?screen=rules-review&lang=en&capture=1');
  await page.getByRole('button', { name: 'I’ve read the rules', exact: true }).click();
  const done = page.getByRole('button', { name: 'Done', exact: true });
  await expect(done).toBeDisabled();
  await expect(done.locator('.name-pop')).toHaveCSS('animation-name', 'name-pop');
});

test('the role carousel can be dragged with a mouse, settles on a card, and a drag opens nothing', async ({
  page,
}) => {
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const deck = page.locator('.deck');
  const left = () => deck.evaluate((el) => Math.round(el.scrollLeft));
  const start = await left();
  const box = await deck.boundingBox();
  if (!box) throw new Error('the carousel has no box');
  const y = box.y + box.height / 2;
  // Press on a card and drag it sideways; release over another card.
  await page.mouse.move(box.x + box.width * 0.5, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5 - 120, y, { steps: 10 });
  await expect(deck).toHaveAttribute('data-dragging', 'true');
  await page.mouse.up();
  await expect(deck).not.toHaveAttribute('data-dragging');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(left).toBeGreaterThan(start + 60);
  // It comes to rest with a card in the middle.
  await page.waitForTimeout(700);
  const off = await deck.evaluate((el) => {
    const middle = el.getBoundingClientRect().x + el.clientWidth / 2;
    return Math.min(
      ...[...el.children].map((card) => {
        const rect = card.getBoundingClientRect();
        return Math.abs(rect.x + rect.width / 2 - middle);
      }),
    );
  });
  expect(off).toBeLessThan(3);
  // A plain click, with no movement, still opens the card in the middle.
  await page.mouse.click(box.x + box.width / 2, y);
  await expect(page.getByRole('dialog')).toHaveCount(1);
});

test('the role carousel resting a pixel short of the first card does not jump a whole set', async ({
  page,
}) => {
  // No auto-advance, so only the loop's own wrap can move the row.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  const deck = page.locator('.deck');
  const left = () => deck.evaluate((el) => el.scrollLeft);
  // Wait for fonts and art: until they load, the cards can still change size and the row move.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  await expect
    .poll(async () => {
      const before = await left();
      await page.waitForTimeout(200);
      return (await left()) === before;
    })
    .toBe(true);
  const start = await left();
  // Rounding on some screens leaves the row a fraction short of the card; snapping is turned off
  // here so the row can be put there.
  await deck.evaluate((el) => {
    el.style.scrollSnapType = 'none';
    el.scrollLeft -= 1;
  });
  await page.waitForTimeout(500);
  expect(Math.abs((await left()) - (start - 1))).toBeLessThan(2);
});

test('while reconnecting, the room name keeps its width and the chip moves under it', async ({
  page,
}) => {
  for (const lang of ['en', 'vi']) {
    await page.goto(`/design?screen=player-lobby&state=loading&lang=${lang}&capture=1`);
    const name = page.getByRole('heading', { level: 2 }).first();
    // The room name stays on one line instead of being squeezed into a narrow column.
    expect(await name.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(45);
    const chip = page.getByRole('status').first();
    await expect(chip).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  }
  await expect(page.getByRole('status').first()).toHaveText('Đang kết nối lại…');
  await expect(page.getByText('Vị trí của bạn trong phòng vẫn được giữ.')).toBeVisible();
});

test('the players scroll area fades only at the edges with more past them', async ({ page }) => {
  await page.goto('/design?screen=player-lobby&state=many&lang=en&capture=1');
  const area = page.locator('main .scroll-area');
  await expect(area).toHaveAttribute('data-more-above', 'false');
  await expect(area).toHaveAttribute('data-more-below', 'true');
  await area.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(area).toHaveAttribute('data-more-above', 'true');
  await expect(area).toHaveAttribute('data-more-below', 'false');
  // With few players nothing is hidden, so nothing fades.
  await page.goto('/design?screen=player-lobby&lang=en&capture=1');
  await expect(page.locator('main .scroll-area')).toHaveAttribute('data-more-below', 'false');
});

test('the players section is the same height with few or many players, and the third row peeks in', async ({
  page,
}) => {
  const measure = async (state: string) => {
    await page.goto(`/design?screen=player-lobby&state=${state}&lang=en&capture=1`);
    return page.locator('main .scroll-area').evaluate((el) => {
      const area = el.getBoundingClientRect();
      const tiles = [...el.querySelectorAll('li')].map((tile) => tile.getBoundingClientRect());
      const footer = document.querySelector('footer')?.getBoundingClientRect();
      return {
        height: Math.round(area.height),
        // How much of the third row (the 11th tile) shows above the bottom of the area.
        peek: tiles[10] ? area.bottom - tiles[10].top : null,
        coveredByFooter: footer ? footer.top < area.bottom - 1 : false,
      };
    });
  };
  const few = await measure('default');
  const many = await measure('many');
  expect(many.height).toBe(few.height);
  expect(many.peek).toBeGreaterThan(8);
  expect(many.peek).toBeLessThan(20);
  expect(many.coveredByFooter).toBe(false);
});

test('a sheet slides in, closes with a tap on the background, and holds still with reduced motion', async ({
  page,
}) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  await page.getByRole('button', { name: 'Add village roles', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add village roles', exact: true });
  await expect(picker).toHaveCSS('animation-name', 'sheet-in');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(picker).toHaveCSS('animation-name', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // A tap above the sheet, on the dimmed page, closes it; a tap inside it does not.
  await picker.getByRole('heading', { name: 'Add village roles' }).click();
  await expect(picker).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(picker).toHaveAttribute('data-closing', 'true');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add village roles', exact: true })).toBeFocused();
});

// Older Safari (every iPhone browser) sizes a flex item with a 0% basis from that 0 inside a
// content-sized column, so a `flex-1` sheet body collapsed to nothing there. Chromium hides it.
test('every sheet body is sized by its content, so it shows on iPhones', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  for (const opener of ['Add village roles', 'Players (6)', 'Menu']) {
    await page.getByRole('button', { name: opener, exact: true }).click();
    const body = page.getByRole('dialog').locator('.scroll-area');
    await expect(body).toHaveCSS('flex-basis', 'auto');
    expect((await body.boundingBox())?.height ?? 0).toBeGreaterThan(48);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
});

test('the Done button of a sheet plays the closing animation too', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  await page.getByRole('button', { name: 'Add village roles', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add village roles', exact: true });
  await picker.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(picker).toHaveAttribute('data-closing', 'true');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a card taken out of the game shrinks away before it leaves the page', async ({ page }) => {
  await page.clock.install();
  await page.goto('/design?screen=setup&lang=en&capture=1');
  await page.getByRole('button', { name: 'Add village roles', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add village roles', exact: true });
  await picker.getByRole('button', { name: 'Remove one Seer', exact: true }).click();
  // Still on the page, shrinking.
  const leaving = page.locator('main li.card-out');
  await expect(leaving).toHaveCount(1);
  await expect(leaving).toHaveCSS('animation-name', 'card-out');
  await page.clock.runFor(400);
  await expect(leaving).toHaveCount(0);
  await expect(page.locator('footer').getByRole('status')).toHaveText('Choose 2 more roles.');
});

test('putting a card back while it shrinks keeps it', async ({ page }) => {
  await page.clock.install();
  await page.goto('/design?screen=setup&lang=en&capture=1');
  await page.getByRole('button', { name: 'Add village roles', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add village roles', exact: true });
  await picker.getByRole('button', { name: 'Remove one Seer', exact: true }).click();
  await picker.getByRole('button', { name: 'Add Seer', exact: true }).click();
  await page.clock.runFor(400);
  await expect(page.locator('main li.card-out')).toHaveCount(0);
  await picker.getByRole('button', { name: 'Done', exact: true }).click();
  await page.clock.runFor(400);
  await expect(page.getByRole('button', { name: 'Edit Seer', exact: true })).toBeVisible();
});

test('nothing on the setup page jumps when something appears or changes', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  const footer = page.locator('footer');
  const height = (locator: Locator) =>
    locator.evaluate((el) => Math.round(el.getBoundingClientRect().height));
  const top = (locator: Locator) =>
    locator.evaluate((el) => Math.round(el.getBoundingClientRect().top));
  const footerBefore = await height(footer);

  await page.getByRole('button', { name: 'Add village roles', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add village roles', exact: true });
  await settle(page);
  // Only the sheet's body scrolls: one scrolling box, not one inside another.
  expect(
    await picker.evaluate(
      (el) =>
        [el, ...el.querySelectorAll('*')].filter((node) =>
          /(auto|scroll)/.test(getComputedStyle(node).overflowY),
        ).length,
    ),
  ).toBe(1);
  const sheetTop = await top(picker);
  const name = picker.locator('[aria-label="Add Hunter"] .thumbnail-name');
  const nameTop = await top(name);
  // The "−" appearing does not move the card's name, and the sheet stays where it is.
  await picker.getByRole('button', { name: 'Add Hunter', exact: true }).click();
  await expect(
    picker.getByRole('button', { name: 'Remove one Hunter', exact: true }),
  ).toBeVisible();
  await settle(page);
  expect(await top(name)).toBe(nameTop);
  expect(await top(picker)).toBe(sheetTop);
  // A search that empties the list does not shrink the sheet.
  await picker.getByRole('searchbox').fill('zzz');
  await settle(page);
  expect(await top(picker)).toBe(sheetTop);
  await picker.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // The roles now match the players: the footer keeps its height.
  expect(await height(footer)).toBe(footerBefore);

  // Starting to edit the rule does not resize the card's art.
  await page.getByRole('button', { name: 'Edit Seer', exact: true }).click();
  const card = page.getByRole('dialog', { name: 'Seer', exact: true });
  await settle(page);
  const art = card.locator('.detailed-card img');
  const artBefore = await height(art);
  await card.getByRole('button', { name: /^Each night/ }).click();
  await expect(card.getByRole('textbox', { name: 'Role description' })).toBeFocused();
  expect(await height(art)).toBe(artBefore);
});

test('buttons fade between enabled and disabled, and not with reduced motion', async ({ page }) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  const ready = page.getByRole('button', { name: 'Review rules', exact: true });
  await expect(ready).toHaveCSS('transition-property', /opacity/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(ready).not.toHaveCSS('transition-property', /opacity/);
});

test('everything that scrolls uses the app scrollbar, and the carousel shows none', async ({
  page,
}) => {
  const border = 'rgb(143, 137, 127)';
  await page.goto('/design?screen=setup&state=many&lang=en&capture=1');
  for (const target of [page.locator('html'), page.locator('textarea, input').first()]) {
    if ((await target.count()) === 0) continue;
    await expect(target).toHaveCSS('scrollbar-width', 'thin');
    await expect(target).toHaveCSS('scrollbar-color', `${border} rgba(0, 0, 0, 0)`);
  }
  await page.getByRole('button', { name: 'Add village roles', exact: true }).click();
  await expect(page.locator('dialog .scroll-area')).toHaveCSS('scrollbar-width', 'thin');
  await page.goto('/design?screen=player-lobby&state=many&lang=en&capture=1');
  await expect(page.locator('main .scroll-area')).toHaveCSS('scrollbar-width', 'thin');
  await expect(page.locator('.deck')).toHaveCSS('scrollbar-width', 'none');
});

test('an open card keeps the page scrollbar and closes as one piece with its stepper', async ({
  page,
}) => {
  await page.goto('/design?screen=setup&state=many&lang=en&capture=1');
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  await page.getByRole('button', { name: 'Edit Seer', exact: true }).click();
  const card = page.getByRole('dialog', { name: 'Seer', exact: true });
  // The page behind keeps its scrollbar.
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  // The card and the stepper sit in the one dialog, which zooms in and out.
  await expect(card).toHaveCSS('animation-name', 'zoom-in');
  await page.keyboard.press('Escape');
  await expect(card).toHaveCSS('animation-name', 'zoom-out');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
});

test('the add sheet fits its cards up to three quarters of the screen, and never scrolls sideways', async ({
  page,
}) => {
  await page.goto('/design?screen=setup&lang=en&capture=1');
  // Wolves: two cards, a short sheet.
  await page.getByRole('button', { name: 'Add wolf roles', exact: true }).click();
  const wolves = page.getByRole('dialog', { name: 'Add wolf roles', exact: true });
  await settle(page);
  const short = await wolves.evaluate((el) => el.getBoundingClientRect().height);
  expect(short).toBeLessThan(844 * 0.6);
  await wolves.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Village: seven cards, as tall as allowed.
  await page.getByRole('button', { name: 'Add village roles', exact: true }).click();
  const village = page.getByRole('dialog', { name: 'Add village roles', exact: true });
  await settle(page);
  const tall = await village.evaluate((el) => el.getBoundingClientRect().height);
  expect(tall).toBeLessThanOrEqual(Math.ceil(844 * 0.75));
  expect(tall).toBeGreaterThan(short);
  // Three chosen cards in one row put a "−" at the right edge: still no sideways scroll.
  await village.getByRole('button', { name: 'Remove one Seer', exact: true }).waitFor();
  const body = village.locator('.scroll-area');
  expect(await body.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(body).toHaveCSS('overflow-x', 'hidden');
  // Searching does not shrink it.
  await village.getByRole('searchbox').fill('zzz');
  await settle(page);
  expect(Math.round(await village.evaluate((el) => el.getBoundingClientRect().height))).toBe(
    Math.round(tall),
  );
});

/** Makes the page behave as if a 15px desktop scrollbar took up room (headless and phones have none). */
async function fakeScrollbar(page: Page) {
  // The app measures the real scrollbar (0 here) and would put it back, so this one wins.
  await page.addStyleTag({ content: ':root { --scrollbar: 15px !important; }' });
  await page.evaluate(() => {
    document.body.style.width = 'calc(100vw - 15px)';
  });
}

test('the page keeps its content width when its scrollbar appears', async ({ page }) => {
  await page.goto('/design?screen=setup&state=many&lang=en&capture=1');
  const section = page.locator('main section').first();
  await expect(section).toBeVisible();
  const width = () => section.evaluate((el) => el.getBoundingClientRect().width);
  const before = await width();
  await fakeScrollbar(page);
  expect(Math.abs((await width()) - before)).toBeLessThan(1);
  // The right padding gave up those 15px, and the left padding stayed.
  const padding = await page
    .locator('main')
    .evaluate((el) => [getComputedStyle(el).paddingLeft, getComputedStyle(el).paddingRight]);
  expect(padding).toEqual(['20px', '5px']);
});

for (const screen of screens) {
  test(`${screen} never pushes anything past the right edge, with or without a scrollbar`, async ({
    page,
  }) => {
    await page.goto(`/design?screen=${screen}&lang=vi&capture=1`);
    await expect(page.locator('[data-design-screen]')).toBeVisible();
    const pastEdge = () =>
      page.evaluate(() => {
        const edge = document.body.getBoundingClientRect().right;
        // Something past the edge only matters when nothing clips it first: a carousel card that
        // peeks out inside its own scrolling row is fine.
        const clipped = (node: Element) => {
          for (let parent = node.parentElement; parent && parent !== document.body;) {
            if (
              getComputedStyle(parent).overflowX !== 'visible' &&
              parent.getBoundingClientRect().right <= edge + 0.5
            ) {
              return true;
            }
            parent = parent.parentElement;
          }
          return false;
        };
        return [...document.querySelectorAll('body *')]
          .filter((node) => {
            const box = node.getBoundingClientRect();
            return box.width > 0 && box.right > edge + 0.5 && !clipped(node);
          })
          .map((node) => `${node.tagName.toLowerCase()}.${node.className.slice(0, 40)}`);
      });
    expect(await pastEdge()).toEqual([]);
    await fakeScrollbar(page);
    expect(await pastEdge()).toEqual([]);
  });
}
