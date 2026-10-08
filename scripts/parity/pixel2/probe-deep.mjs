import { launch, MASTER_URL } from './lib.mjs';
const { page } = await launch('master');
await page.goto(MASTER_URL + '#/page/6ac6e19d-837a-4973-b2ce-61a47482fb99', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(15000);
const scSel = () => [...document.querySelectorAll('body *')]
  .filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto','scroll'].includes(getComputedStyle(e).overflowY))
  .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
for (let i = 0; i < 25; i++) {
  const done = await page.evaluate(() => {
    const sc = [...document.querySelectorAll('body *')]
      .filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto','scroll'].includes(getComputedStyle(e).overflowY))
      .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    const before = sc.scrollTop;
    sc.scrollTop += 320;
    return sc.scrollTop === before || sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2;
  });
  await page.waitForTimeout(800);
  if (done) break;
}
const r = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.ls-block')];
  const vis = rows.filter(e => { const b = e.getBoundingClientRect(); return b.top < 790 && b.bottom > 0; });
  return { n: rows.length, visible: vis.slice(-12).map(e => e.textContent.trim().slice(0, 60)) };
});
console.log(JSON.stringify(r, null, 1));
await page.screenshot({ path: '/tmp/master-deepbottom.png' });
process.exit(0);
