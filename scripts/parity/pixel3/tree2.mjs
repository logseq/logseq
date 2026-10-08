import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
const [url, tag] = [process.argv[2], process.argv[3]];
const ctx = await chromium.launchPersistentContext(`/Users/devin/parity-profiles/${tag}`, { channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 } });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(Number(process.argv[4] || 10000));
const out = await page.evaluate(async () => {
  const p = await window.logseq.api.get_page('PPFixture');
  const t = await window.logseq.api.get_page_blocks_tree('PPFixture');
  return { page: p ? (p.uuid || 'obj') : null, treeType: typeof t, isArr: Array.isArray(t), len: t?.length, keys: t ? Object.keys(t).slice(0,10) : null, raw: JSON.stringify(t)?.slice(0, 500) };
});
console.log(JSON.stringify(out, null, 1));
await ctx.close();
