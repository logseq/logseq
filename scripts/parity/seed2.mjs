// Explore favoriting: page "..." menu + right-click on Recent item + graph switcher
import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';

const url = 'http://localhost:3001/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const shot = n => page.screenshot({ path: `/tmp/${n}.png` });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
await page.locator('#left-menu').click();
await page.waitForTimeout(600);
// create Alpha via cmd+k
await page.locator('#search-button').click();
await page.waitForTimeout(800);
await page.keyboard.type('Alpha', { delay: 30 });
await page.waitForTimeout(800);
await page.keyboard.press('Enter');
await page.waitForTimeout(2500);

// open "..." menu (header)
await page.mouse.click(1386, 24);
await page.waitForTimeout(1000);
await shot('m2-dots-menu');
const menu = await page.evaluate(() => [...document.querySelectorAll('[role=menuitem], [role=menu] [class*=item], .menu-link, [data-radix-collection-item], [role=menu] *')].map(e => `${e.tagName} "${e.textContent.trim().slice(0, 50)}"`).filter((v, i, a) => a.indexOf(v) === i && !v.endsWith('""')).slice(0, 40));
console.log('DOTS MENU:', JSON.stringify(menu));
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// right-click Recent "Alpha"
const alphaRecent = page.locator('.recent a, .recent [class*=item]', { hasText: 'Alpha' }).first();
await alphaRecent.click({ button: 'right' });
await page.waitForTimeout(1000);
await shot('m2-recent-ctx');
const ctx2 = await page.evaluate(() => [...document.querySelectorAll('[role=menuitem], [role=menu] *')].map(e => `${e.tagName} "${e.textContent.trim().slice(0, 50)}"`).filter((v, i, a) => a.indexOf(v) === i && !v.endsWith('""')).slice(0, 40));
console.log('CTX MENU:', JSON.stringify(ctx2));
await page.keyboard.press('Escape');

// click graph switcher "Demo" (sidebar top)
await page.locator('.sidebar-graphs a, .sidebar-graphs button, .sidebar-graphs [role=button]').first().click().catch(() => page.locator('text=Demo').first().click());
await page.waitForTimeout(1200);
await shot('m2-graph-switcher');
const sw = await page.evaluate(() => [...document.querySelectorAll('[role=menu] *, [role=dialog] *, [class*=dropdown] *')].map(e => `${e.tagName}.${String(e.className).slice(0, 40)} "${e.textContent.trim().slice(0, 60)}"`).filter((v, i, a) => a.indexOf(v) === i && !v.endsWith('""')).slice(0, 50));
console.log('SWITCHER:', JSON.stringify(sw));
await browser.close();
