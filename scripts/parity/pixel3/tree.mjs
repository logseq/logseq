import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
const [url, tag] = [process.argv[2], process.argv[3]];
const ctx = await chromium.launchPersistentContext(`/Users/devin/parity-profiles/${tag}`, { channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 } });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(Number(process.argv[4] || 12000));
const tree = await page.evaluate(async () => {
  const t = await window.logseq.api.get_page_blocks_tree('PPFixture');
  const flat = [];
  const walk = (ns, d) => (ns||[]).forEach(n => { flat.push('  '.repeat(d) + (n.content||n.title||'').slice(0,60).replace(/\n/g,'\\n')); walk(n.children||[], d+1); });
  walk(t, 0);
  return flat;
});
console.log(tree.join('\n'));
console.log('COUNT', tree.length);
await ctx.close();
