import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
const ctx = await chromium.launchPersistentContext('/Users/devin/parity-profiles/lui', { channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 } });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('http://localhost:3003/index.html?rtc-test=true', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const g = await page.evaluate(async () => JSON.stringify(await window.logseq.api.get_current_graph()));
console.log('lui graph:', g);
const opfs = await page.evaluate(async () => {
  try {
    const root = await navigator.storage.getDirectory();
    const names = [];
    for await (const [k] of root.entries()) names.push(k);
    return names.join(',');
  } catch (e) { return 'ERR ' + e; }
});
console.log('opfs:', opfs);
await ctx.close();
