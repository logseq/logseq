// Seed master via cmd+k: create pages Alpha, Beta, Foo/Bar/Baz; favorite 2; explore menus
import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';

const url = process.argv[2] || 'http://localhost:3001/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0, 200)));
const shot = n => page.screenshot({ path: `/tmp/${n}.png` });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);

async function openPage(name) {
  await page.locator('#search-button').click();
  await page.waitForTimeout(1200);
  await page.keyboard.type(name, { delay: 40 });
  await page.waitForTimeout(1200);
  await shot(`m-search-${name.replaceAll('/', '_')}`);
  // dump palette options first time
  const opts = await page.evaluate(() => [...document.querySelectorAll('[class*=palette] *, [class*=command] *, [role=option], .cp__cmdk *')].map(e => `${e.tagName}.${String(e.className).slice(0, 50)} "${e.textContent.trim().slice(0, 50)}"`).filter(s => !s.endsWith('""')).slice(0, 30));
  console.log(`OPTS ${name}:`, JSON.stringify(opts));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  await shot(`m-page-${name.replaceAll('/', '_')}`);
  console.log('URL now:', page.url());
}

await page.locator('#left-menu').click();
await page.waitForTimeout(800);
await openPage('Alpha');
await openPage('Beta');
await openPage('Foo/Bar/Baz');
await shot('m-final');
await browser.close();
