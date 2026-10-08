import { chromium } from '/Users/devin/parity-lab/node_modules/playwright/index.mjs';
const url = process.argv[2], tag = process.argv[3], waitMs = Number(process.argv[4] || 12000);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
page.on('console', m => { if (m.type() === 'error') errs.push('C:' + m.text().slice(0, 160)); });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(waitMs);
await page.screenshot({ path: `/tmp/smoke-${tag}.png` });
const info = await page.evaluate(() => ({
  title: document.title,
  hasApi: typeof window.logseq !== 'undefined' && !!window.logseq.api,
  bodyText: document.body.innerText.slice(0, 400),
}));
console.log(JSON.stringify(info, null, 1));
console.log('ERRS:', errs.slice(0, 8));
await browser.close();
