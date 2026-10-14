// Build js_app, run vite build, then css:build before running this test.
// Reuse the repository's installed Playwright dependency through NODE_PATH.
const assert = require('node:assert/strict');
const test = require('node:test');
const {chromium} = require('playwright');

const origin = process.env.LOGSEQ_UI_TEST_URL || 'http://localhost:3002';

test('page spacing has one typed margin owner, without legacy web padding', async () => {
  const browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    await page.goto(`${origin}/?rtc-test=true`);
    const inner = page.locator('.cp__page-inner-wrap > .page-inner').first();
    await inner.waitFor({timeout: 120000});
    const assertSpacing = async () => {
      const spacing = await inner.evaluate(element => {
        const style = getComputedStyle(element);
        return {padding: style.paddingBottom, margin: style.marginBottom};
      });
      assert.equal(spacing.margin, '64px', 'page/journal spacing follows the typed reference margin');
      assert.equal(spacing.padding, '0px', 'the old stylesheet must not add another footer gap');
    };
    await assertSpacing();
    await page.keyboard.press('Control+k');
    await page.locator('.cp__cmdk__modal .cp__cmdk-search-input').fill('Spacing fixture page');
    await page.keyboard.press('Enter');
    await page.getByTestId('page title').filter({hasText: 'Spacing fixture page'}).waitFor();
    await assertSpacing();
  } finally {
    await browser.close();
  }
});
