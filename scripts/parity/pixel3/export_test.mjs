import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
const ctx = await chromium.launchPersistentContext('/Users/devin/parity-profiles/master2', { channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 } });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const g = await page.evaluate(async () => JSON.stringify(await window.logseq.api.get_current_graph()));
console.log('graph:', g);
// quick seed: one page one block
await page.evaluate(async () => {
  await window.logseq.api.create_page('PPFixture');
  await window.logseq.api.append_block_in_page('PPFixture', 'hello **bold** [[Alpha]]');
});
await page.waitForTimeout(1500);
try {
  const dl = page.waitForEvent('download', { timeout: 15000 });
  await page.evaluate(() => window.logseq.api.download_graph_db());
  const d = await dl;
  const p = '/Users/devin/parity-work/master-db.sqlite';
  await d.saveAs(p);
  console.log('saved', p, d.suggestedFilename());
} catch (e) { console.log('download err', String(e).slice(0, 300)); }
await ctx.close();
