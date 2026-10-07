// Quick probe: open a URL in playwright chrome, screenshot, dump visible text/buttons
import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';

const url = process.argv[2] || 'http://localhost:3001/';
const out = process.argv[3] || '/tmp/probe.png';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text().slice(0, 300)); });
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0, 300)));
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(15000);
await page.screenshot({ path: out, fullPage: false });
const info = await page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const btns = [...document.querySelectorAll('button, a, input, [role=button]')]
    .filter(vis).map(e => (e.innerText || e.textContent || e.getAttribute('aria-label') || e.getAttribute('placeholder') || e.tagName).trim())
    .filter(Boolean).slice(0, 80);
  return { title: document.title, bodyText: document.body.innerText.slice(0, 2000), btns };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
