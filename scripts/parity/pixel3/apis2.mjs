import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
const ctx = await chromium.launchPersistentContext('/Users/devin/parity-profiles/lui', { channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 } });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('http://localhost:3003/index.html?rtc-test=true', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const api = await page.evaluate(() => Object.keys(window.logseq?.api || {}).sort());
console.log(api.filter(k => /export|download|graph|page|block|edn|import/i.test(k)).join('\n'));
await ctx.close();
