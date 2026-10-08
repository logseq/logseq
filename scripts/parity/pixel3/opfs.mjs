import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
const ctx = await chromium.launchPersistentContext('/Users/devin/parity-profiles/lui', { channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 } });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('http://localhost:3003/index.html?rtc-test=true', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
const out = await page.evaluate(async () => {
  const root = await navigator.storage.getDirectory();
  const walk = async (dir, prefix) => {
    const res = [];
    for await (const [name, h] of dir.entries()) {
      if (h.kind === 'directory') res.push(...await walk(h, prefix + name + '/'));
      else { const f = await h.getFile(); res.push(prefix + name + ' ' + f.size); }
    }
    return res;
  };
  return await walk(root, '');
});
console.log(out.join('\n'));
await ctx.close();
