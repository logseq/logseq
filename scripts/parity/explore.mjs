// Explore master header + sidebar DOM
import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';

const url = process.argv[2] || 'http://localhost:3001/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0, 200)));
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);

// dump header buttons with their icon classes
const header = await page.evaluate(() => {
  return [...document.querySelectorAll('header button, .cp__header button, header a, .cp__header a')].map(b => ({
    id: b.id, cls: b.className.slice(0, 60),
    icon: (b.querySelector('svg')?.getAttribute('class') || '').slice(0, 60),
    label: b.getAttribute('aria-label') || b.textContent.trim().slice(0, 30),
    box: JSON.stringify(b.getBoundingClientRect()),
  })).slice(0, 30);
});
console.log(JSON.stringify(header, null, 1));

// click hamburger by position (top-left)
await page.mouse.click(25, 24);
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/master-sidebar.png' });
const sideInfo = await page.evaluate(() => {
  const els = document.querySelectorAll('[class*=sidebar]');
  return [...els].map(e => `${e.tagName}.${String(e.className).slice(0, 80)} visible=${e.getBoundingClientRect().width > 0}`).slice(0, 30);
});
console.log(sideInfo.join('\n'));
await browser.close();
