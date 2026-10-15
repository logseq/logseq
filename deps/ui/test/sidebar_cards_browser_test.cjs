// Run after current Melange/Vite builds, using the installed Playwright dependency.
const assert = require('node:assert/strict');
const test = require('node:test');
const {chromium} = require('playwright');
const origin = process.env.LOGSEQ_UI_TEST_URL || 'http://localhost:3002';

test('sidebar cards fold without losing their mounted body or reference spacing', async () => {
  const browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    await page.goto(`${origin}/?rtc-test=true`);
    await page.getByTestId('page title').waitFor({timeout: 120000});
    // The public API prepares a disposable built-in page item; folding itself
    // uses real keyboard activation, not DOM clicks or forced pointer delivery.
    await page.evaluate(() => globalThis.logseq.api.open_in_right_sidebar(
      '00000004-1690-2597-3200-000000000000'));
    const card = page.locator('.sidebar-item').first();
    const header = page.locator('#sidebar-panel-header-0');
    const body = page.locator('#sidebar-panel-content-0');
    await header.waitFor();
    await page.waitForFunction(() => {
      const body = document.querySelector('#sidebar-panel-content-0');
      return body && body.textContent.includes('Open properties');
    });
    await body.evaluate(element => { globalThis.sidebarBodyBeforeFold = element; });
    const height = async () => (await card.boundingBox()).height;
    assert.equal(await height(), 220);
    const props = body.getByRole('button', {name: 'Open properties'});
    const [bodyRect, propsRect] = await Promise.all([body.boundingBox(), props.boundingBox()]);
    assert.equal(propsRect.x, bodyRect.x + 20);
    assert.equal(propsRect.y, bodyRect.y + 16);
    assert.equal(propsRect.height, 28);
    assert.ok(propsRect.width < 150);
    await header.focus();
    await page.keyboard.press('Enter');
    assert.equal(await body.isVisible(), false);
    assert.equal(await height(), 32);
    await page.keyboard.press('Enter');
    assert.equal(await body.isVisible(), true);
    assert.equal(await height(), 220);
    assert.equal(await body.evaluate(element => element === globalThis.sidebarBodyBeforeFold), true);
  } finally {
    await browser.close();
  }
});
