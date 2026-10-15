// Run against the current Melange/Vite/CSS build with installed Playwright.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const {chromium} = require('playwright');
const origin = process.env.LOGSEQ_UI_TEST_URL || 'http://localhost:3002';

for (const [mode, query, minimums] of [
  ['desktop', '', [500, 500]],
  ['nonvirtual-test', '?rtc-test=true', [500, 250]],
  ['forced-virtual-test', '?rtc-test=true&virtualized=true', [500, 500]]
]) {
  test(`journal rows preserve reference minimums and separators in ${mode} mode`, async () => {
    const browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
    try {
      const page = await browser.newPage({viewport: {width: 1280, height: 900}});
      await page.goto(`${origin}/${query}`);
      await page.getByTestId('page title').waitFor({timeout: 120000});
      await page.evaluate(() => {
        const previousDay = new Date();
        previousDay.setDate(previousDay.getDate() - 1);
        return globalThis.logseq.api.create_journal_page(previousDay.getTime());
      });
      await page.reload();
      await page.waitForFunction(() => document.querySelectorAll('#journals .journal-item').length >= 2);
      const metrics = await page.locator('#journals .journal-item').evaluateAll(rows => rows.map(row => {
        const rect = row.getBoundingClientRect();
        const lines = [...row.querySelectorAll('div')].filter(element =>
          element.style.background.includes('--lx-gray-04') && element.getBoundingClientRect().height === 1);
        return {minHeight: parseFloat(getComputedStyle(row).minHeight), y: rect.y, height: rect.height,
          separators: lines.map(element => {const line = element.getBoundingClientRect(); return {y: line.y, height: line.height};})};
      }));
      assert.deepEqual(metrics.slice(0, 2).map(row => row.minHeight), minimums);
      assert.equal(metrics[0].height, 500);
      assert.equal(metrics[1].y, metrics[0].y + metrics[0].height);
      for (let index = 0; index < metrics.length; index++) {
        const row = metrics[index];
        assert.equal(row.separators.length, index === metrics.length - 1 ? 0 : 1);
        if (row.separators.length) assert.equal(row.separators[0].y, row.y + row.height - 1);
      }
      if (process.env.LOGSEQ_UI_EVIDENCE_DIR) {
        const directory = process.env.LOGSEQ_UI_EVIDENCE_DIR;
        await fs.mkdir(directory, {recursive: true});
        await fs.writeFile(path.join(directory, `browser-${mode}.json`), JSON.stringify(metrics, null, 2));
        await page.screenshot({path: path.join(directory, `browser-${mode}.png`)});
      }
    } finally {
      await browser.close();
    }
  });
}
