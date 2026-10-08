import { launch, MASTER_URL } from './lib.mjs';
const { page } = await launch('master');
await page.goto(MASTER_URL + '#/page/6ac6e19d-837a-4973-b2ce-61a47482fb99', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(15000);
const sc = await page.evaluate(() => {
  const els = [...document.querySelectorAll('body *')]
    .filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto','scroll'].includes(getComputedStyle(e).overflowY))
    .sort((a, b) => b.scrollHeight - a.scrollHeight);
  const e = els[0];
  return { cls: e?.className?.slice(0,60), sh: e?.scrollHeight, ch: e?.clientHeight };
});
console.log('scroller', JSON.stringify(sc));
// step-scroll the real scroller to the end, letting lazy rows mount
for (let i = 0; i < 10; i++) {
  await page.evaluate(() => {
    const els = [...document.querySelectorAll('body *')]
      .filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto','scroll'].includes(getComputedStyle(e).overflowY))
      .sort((a, b) => b.scrollHeight - a.scrollHeight);
    els[0].scrollTop += 500;
  });
  await page.waitForTimeout(600);
}
const r = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.ls-block')];
  const vis = rows.filter(e => { const b = e.getBoundingClientRect(); return b.top < 790 && b.bottom > 0; });
  return { n: rows.length, visible: vis.slice(-10).map(e => e.textContent.trim().slice(0, 60)) };
});
console.log(JSON.stringify(r, null, 1));
await page.screenshot({ path: '/tmp/master-truebottom.png' });
process.exit(0);
