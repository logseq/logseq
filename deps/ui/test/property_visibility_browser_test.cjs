// Run after the current Melange, Vite and CSS builds, using installed Playwright.
const assert = require('node:assert/strict');
const test = require('node:test');
const {chromium} = require('playwright');
const origin = process.env.LOGSEQ_UI_TEST_URL || 'http://localhost:3002';

test('hidden-only page properties stay collapsed until explicitly shown', async () => {
  const browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    await page.goto(`${origin}/?rtc-test=true`);
    await page.getByTestId('page title').waitFor({timeout: 120000});
    await page.keyboard.press('Control+k');
    await page.locator('.cp__cmdk__modal .cp__cmdk-search-input').fill('Hidden property fixture');
    await page.keyboard.press('Enter');
    await page.getByTestId('page title').filter({hasText: 'Hidden property fixture'}).waitFor();
    await page.locator('.ed-input').waitFor();
    await page.keyboard.press('Escape');
    const uuid = await page.locator('.ls-page-title .ls-block').first().getAttribute('data-blockid');
    assert.ok(uuid);
    await page.evaluate(uuid => globalThis.logseq.api.upsert_block_property(
      uuid, 'logseq.property/publishing-public?', false), uuid);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const panel = page.locator('.ls-properties-area.ls-page-properties');
    assert.equal(await panel.count(), 0, 'hidden-only metadata must not add an empty page panel');
    await page.keyboard.press('p');
    await page.keyboard.press('a');
    const checkbox = panel.locator('[role="checkbox"], input[type="checkbox"]');
    await checkbox.waitFor();
    assert.equal(await checkbox.isChecked(), false);
    const rect = await checkbox.boundingBox();
    assert.equal(rect.width, 16);
    assert.equal(rect.height, 16);
    await page.keyboard.press('p');
    await page.keyboard.press('a');
    await panel.waitFor({state: 'detached'});
  } finally {
    await browser.close();
  }
});
