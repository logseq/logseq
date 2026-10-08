import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
const url = process.argv[2] || 'http://localhost:3001/';
const tag = process.argv[3] || 'master';
const ctx = await chromium.launchPersistentContext(`/Users/devin/parity-profiles/${tag}`, {
  channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 },
});
const page = ctx.pages()[0] || await ctx.newPage();
page.on('console', m => { const t = m.text(); if (/error|fail|warn/i.test(t)) console.log('CON:', t.slice(0,150)); });
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,300)));
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(Number(process.argv[4] || 12000));
await page.screenshot({ path: `/tmp/probe-${tag}.png` });
const info = await page.evaluate(() => ({
  url: location.href,
  hasApi: !!window.logseq?.api,
  title: document.title,
  text: document.body?.innerText?.slice(0, 600),
}));
console.log(JSON.stringify(info, null, 1).slice(0, 2000));
await ctx.close();
