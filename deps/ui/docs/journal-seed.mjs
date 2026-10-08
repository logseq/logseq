import { chromium } from 'playwright';
const ctx = await chromium.launchPersistentContext(process.env.HOME + '/pw-virt-probe', {
  viewport: { width: 1440, height: 900 },
});
const p = ctx.pages()[0] ?? (await ctx.newPage());
await p.goto('http://localhost:3013/index.html?rtc-test=true');
await p.waitForFunction(() => window.logseq?.api);
await p.waitForTimeout(8000);
const n = await p.evaluate(async () => {
  let made = new Set();
  for (let i = 1; i <= 45; i++) {
    const t = Date.now() - i * 86400000;
    try {
      const pg = await window.logseq.api.create_journal_page(t);
      if (pg && pg.uuid) {
        made.add(pg.title);
        await window.logseq.api.append_block_in_page(pg.uuid, `journal ${pg.title} content`);
      }
    } catch (e) { console.log('ERR', String(e).slice(0, 100)); }
  }
  return [...made];
});
console.log('journal days created:', n.length, n.slice(0, 5));
await ctx.close();
