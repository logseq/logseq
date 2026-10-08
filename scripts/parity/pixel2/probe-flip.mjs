import { launch, LUI_URL } from './lib.mjs';
const { page } = await launch('lui');
await page.goto(LUI_URL + '#/page/07d1c0b9-466b-47af-9461-e3627831d8d8', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(18000);
// click the last block, enter edit, clear, type /
const blk = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.ls-block')];
  const e = els[els.length - 1];
  const r = e.getBoundingClientRect();
  return { x: r.x + 200, y: r.y + r.height / 2, txt: e.textContent.slice(0, 40) };
});
console.log('last blk', JSON.stringify(blk));
await page.mouse.click(blk.x, blk.y);
await page.waitForTimeout(1500);
// press End then Enter for a new empty block? just type '/' at end of text
await page.keyboard.press('End');
await page.keyboard.type('/', { delay: 60 });
for (const wait of [200, 500, 1000, 2000]) {
  await page.waitForTimeout(wait);
  const st = await page.evaluate(() => {
    const pop = document.querySelector('.ui__popover-content');
    const inner = document.querySelector('#ui__ac-inner');
    if (!pop) return null;
    const r = pop.getBoundingClientRect();
    return { top: r.top, h: r.height, side: pop.getAttribute('data-side') || pop.closest('[data-side]')?.getAttribute('data-side'),
      avail: getComputedStyle(pop).getPropertyValue('--available-height'), innerH: inner?.scrollHeight, items: inner?.children.length };
  });
  console.log('t+', wait, JSON.stringify(st));
}
process.exit(0);
