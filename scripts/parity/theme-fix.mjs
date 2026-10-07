// Supplemental: click Appearance -> dark swatch -> shot; restore light
import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
const [, , URL_ = 'http://localhost:3001/', OUT = '/Users/devin/parity/master', TAG = 'master'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(TAG === 'master' ? 12000 : 20000);
// open sidebar for context
const b = page.locator('#left-menu'); if (await b.count()) await b.click();
await page.waitForTimeout(800);
await page.mouse.click(1386, 24);
await page.waitForTimeout(1000);
await page.locator('text="Appearance"').first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/36-appearance-panel.png` });
await page.locator('text=dark').first().click();
await page.waitForTimeout(1800);
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/37-dark-theme.png` });
// restore light
await page.mouse.click(1386, 24);
await page.waitForTimeout(1000);
await page.locator('text="Appearance"').first().click();
await page.waitForTimeout(1500);
await page.locator('text=light').first().click();
await page.waitForTimeout(1500);
await page.keyboard.press('Escape');
await page.screenshot({ path: `${OUT}/38-light-theme.png` });
await browser.close();
console.log('done');
