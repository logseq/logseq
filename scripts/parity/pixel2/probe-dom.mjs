import { launch, MASTER_URL } from './lib.mjs';
const { page } = await launch('master');
await page.goto(MASTER_URL + '#/page/6ac6e19d-837a-4973-b2ce-61a47482fb99', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const r0 = await page.evaluate(() => {
  const els = [...document.querySelectorAll('body *')]
    .filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto','scroll'].includes(getComputedStyle(e).overflowY))
    .sort((a, b) => b.scrollHeight - a.scrollHeight);
  const sc = els[0];
  sc.scrollTop = sc.scrollHeight;
  return { cls: sc?.className?.slice(0,50), sh: sc?.scrollHeight, ch: sc?.clientHeight };
});
console.log('scroller', JSON.stringify(r0));
await page.waitForTimeout(2500);
const r = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.ls-block')];
  const vis = rows.filter(e => { const b = e.getBoundingClientRect(); return b.top < 800 && b.bottom > 0; });
  return {
    n: rows.length,
    last5: rows.slice(-5).map(e => e.textContent.trim().slice(0, 60)),
    visible: vis.slice(-8).map(e => e.textContent.trim().slice(0, 60)),
  };
});
console.log(JSON.stringify(r, null, 1));
await page.screenshot({ path: '/tmp/master-bottom.png' });
process.exit(0);
