import { launch, LUI_URL } from './lib.mjs';
const { page } = await launch('lui');
await page.goto(LUI_URL + '#/page/07d1c0b9-466b-47af-9461-e3627831d8d8', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(18000);
const u = await page.evaluate(async () => {
  const p = await window.logseq.api.get_page('PPFixture');
  const b = await window.logseq.api.append_block_in_page(p.uuid, 'ACPROBE2', { sibling: false });
  return b?.uuid;
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const rect = await page.evaluate((u) => {
  const el = document.querySelector(`[data-blockid="${u}"]`);
  el?.scrollIntoView({ block: 'end' });
  const r = el?.getBoundingClientRect();
  return r && { x: r.x + 60, y: r.y + r.height / 2, top: r.top };
}, u);
console.log('blk', JSON.stringify(rect));
await page.mouse.click(rect.x, rect.y);
await page.waitForTimeout(1200);
await page.keyboard.down('Meta'); await page.keyboard.press('a'); await page.keyboard.up('Meta');
await page.keyboard.press('Backspace');
await page.waitForTimeout(400);
const t0 = Date.now();
await page.keyboard.type('/', { delay: 30 });
for (let i = 0; i < 14; i++) {
  await page.waitForTimeout(90);
  const st = await page.evaluate(() => {
    const pop = document.querySelector('.ui__popover-content');
    const inner = document.querySelector('#ui__ac-inner');
    if (!pop) return null;
    const r = pop.getBoundingClientRect();
    return { top: Math.round(r.top), h: Math.round(r.height),
      avail: pop.style.getPropertyValue('--available-height'), innerH: inner?.scrollHeight };
  });
  console.log('t+', Date.now() - t0, JSON.stringify(st));
}
await page.evaluate((u) => window.logseq.api.remove_block(u).catch(() => {}), u);
process.exit(0);
