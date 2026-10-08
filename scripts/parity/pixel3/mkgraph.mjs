import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
const [url, tag, name] = [process.argv[2], process.argv[3], process.argv[4] || 'PPTest'];
const ctx = await chromium.launchPersistentContext(`/Users/devin/parity-profiles/${tag}`, { channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 } });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);
const r1 = await page.evaluate(async (n) => {
  try { return JSON.stringify(await window.logseq.api.ensure_db_graph(n)).slice(0,300); }
  catch(e) { return 'ERR ' + String(e).slice(0,200); }
}, name);
console.log('ensure_db_graph:', r1);
await page.waitForTimeout(4000);
const r2 = await page.evaluate(async () => ({ cur: await window.logseq.api.get_current_graph(), repo: localStorage.getItem('current-repo') }));
console.log(JSON.stringify(r2).slice(0,400));
await ctx.close();
