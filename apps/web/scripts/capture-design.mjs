/* global document */
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(workspace, 'docs/design/mockups');
const baseURL = process.env.DESIGN_BASE_URL ?? 'http://localhost:5173';
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
];
const extras = [
  ['home', 'empty'],
  ['home', 'loading'],
  ['home', 'error'],
  ['master-lobby', 'empty'],
  ['setup', 'empty'],
  ['player-lobby', 'loading'],
  ['player-lobby', 'removed'],
  ['summary', 'empty'],
  ['summary', 'notes'],
  ['my-card', 'hidden'],
  ['my-card', 'long'],
  ['narrator', 'dead'],
  ['narrator', 'morning'],
  ['narrator', 'long'],
  ['components', 'default'],
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const report = [];
try {
  for (const lang of ['vi', 'en']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      locale: lang === 'vi' ? 'vi-VN' : 'en-US',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const [screen, state] of [...screens.map((screen) => [screen, 'default']), ...extras]) {
      const query = new URLSearchParams({ screen, state, lang, capture: '1' });
      await page.goto(`${baseURL}/design?${query}`);
      await page.locator('[data-design-screen]').waitFor();
      await page.waitForFunction((expected) => document.documentElement.lang === expected, lang);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((image) => image.decode()));
      });
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }));
      if (dimensions.width > 390)
        throw new Error(`${screen}/${state}/${lang}: horizontal overflow (${dimensions.width}px)`);
      const suffix = state === 'default' ? '' : `.${state}`;
      const filename = `${screen}${suffix}${lang === 'en' ? '.en' : ''}.png`;
      await page.screenshot({ path: path.join(output, filename), scale: 'css' });
      const fullFilename = `${screen}${suffix}.full${lang === 'en' ? '.en' : ''}.png`;
      if (dimensions.height > 844 || existsSync(path.join(output, fullFilename))) {
        await page.screenshot({
          path: path.join(output, fullFilename),
          fullPage: true,
          scale: 'css',
        });
      }
      report.push({ screen, state, lang, filename, ...dimensions });
    }
    for (const [screen, state, action] of [
      [
        'setup',
        'library',
        async () =>
          page
            .getByRole('button', {
              name: lang === 'en' ? 'Add roles' : 'Thêm vai trò',
              exact: true,
            })
            .click(),
      ],
      [
        'setup',
        'settings',
        async () =>
          page
            .getByRole('button', { name: lang === 'en' ? 'Menu' : 'Tùy chọn', exact: true })
            .click(),
      ],
      [
        'narrator',
        'menu',
        async () =>
          page
            .getByRole('button', { name: lang === 'en' ? 'Menu' : 'Tùy chọn', exact: true })
            .click(),
      ],
    ]) {
      await page.goto(`${baseURL}/design?screen=${screen}&lang=${lang}&capture=1`);
      await page.locator('[data-design-screen]').waitFor();
      await action();
      await page.getByRole('dialog').waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((image) => image.decode()));
      });
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }));
      if (dimensions.width > 390)
        throw new Error(`${screen}/${state}/${lang}: horizontal overflow`);
      const filename = `${screen}.${state}${lang === 'en' ? '.en' : ''}.png`;
      await page.screenshot({ path: path.join(output, filename), scale: 'css' });
      report.push({ screen, state, lang, filename, ...dimensions });
    }
    if (errors.length) throw new Error(errors.join('\n'));
    await context.close();
  }

  // A compact review sheet of the nine default screens, using the captured pixels.
  const sheet = await browser.newPage({
    viewport: { width: 1170, height: 1540 },
    deviceScaleFactor: 1,
  });
  for (const lang of ['vi', 'en']) {
    const figures = await Promise.all(
      screens.map(async (screen) => {
        const png = await readFile(path.join(output, `${screen}${lang === 'en' ? '.en' : ''}.png`));
        return `<figure><figcaption>${screen}</figcaption><img src="data:image/png;base64,${png.toString('base64')}" /></figure>`;
      }),
    );
    await sheet.setContent(
      `<style>body{margin:0;padding:24px;background:#eae8e2;font:14px sans-serif}main{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}figure{margin:0}figcaption{padding-bottom:8px}img{width:100%;display:block}</style><main>${figures.join('')}</main>`,
    );
    await sheet.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
    await sheet.screenshot({
      path: path.join(output, lang === 'en' ? 'overview.en.png' : 'overview.png'),
      fullPage: true,
      scale: 'css',
    });
  }
} finally {
  await browser.close();
}
await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `Captured ${report.length} phone mockups in Vietnamese and English. No horizontal overflow or page errors.`,
);
