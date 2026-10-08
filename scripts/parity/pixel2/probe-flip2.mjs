import { launch, LUI_URL } from './lib.mjs';
const { page } = await launch('lui');
await page.goto(LUI_URL + '#/page/07d1c0b9-466b-47af-9461-e3627831d8d8', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(18000);
const blk = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.ls-block')].filter(e =>
    e.textContent.includes('deprecated'));
  if (!els.length) return null;
  els[0].scrollIntoView({ block: 'end' });
  const r = els[0].getBoundingClientRect();
  return { x: r.x + 200, y: r.y + r.height - 4 };
});
console.log('blk', JSON.stringify(blk));
await page.mouse.click(blk.x, blk.y);
await page.waitForTimeout(1500);
await page.keyboard.press('End');
const t0 = Date.now();
await page.keyboard.type('/', { delay: 30 });
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(100);
  const st = await page.evaluate(() => {
    const pop = document.querySelector('.ui__popover-content');
    const inner = document.querySelector('#ui__ac-inner');
    if (!pop) return null;
    const r = pop.getBoundingClientRect();
    const pos = pop.closest('[class*=positioner],[style*=top]') || pop.parentElement;
    return { top: Math.round(r.top), h: Math.round(r.height),
      side: pos?.getAttribute('data-side'), avail: pop.style.getPropertyValue('--available-height'),
      innerH: inner?.scrollHeight };
  });
  console.log('t+', Date.now() - t0, JSON.stringify(st));
}
await page.screenshot({ path: '/tmp/probe-flip.png' });
process.exit(0);
