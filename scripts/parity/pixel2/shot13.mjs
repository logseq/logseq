import { launch, MASTER_URL } from './lib.mjs';
const { page } = await launch('master');
await page.goto(MASTER_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const dark = () => page.evaluate(() => {
  document.documentElement.classList.add('dark');
  document.documentElement.setAttribute('data-theme', 'dark');
  document.body?.classList.add('dark');
});
await dark();
const pageUrl = MASTER_URL + '#/page/' + await page.evaluate(async () => {
  const p = await window.logseq?.api?.get_page?.('PPFixture');
  return p?.uuid || 'ppfixture';
});
await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
await dark();
// stepped scroll to force-mount lazy rows, then back to the target block
for (let y = 0; y <= 2000; y += 400) {
  await page.evaluate(y => {
    const els = [...document.querySelectorAll('body *')]
      .filter(e => e.scrollHeight > e.clientHeight + 50
        && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
    for (const el of els) el.scrollTop = y;
  }, y);
  await page.waitForTimeout(350);
}
const find = () => page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(e =>
    e.children.length === 0 && e.textContent.trim() === 'Collapsible parent');
  if (!els.length) return null;
  els[0].scrollIntoView({ block: 'center' });
  const r = els[0].getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
let colp = await find();
await page.waitForTimeout(700);
if (!colp) colp = await find();
if (colp) {
  colp = await find();
  await page.mouse.move(colp.x - 14, colp.y + colp.h / 2);
  await page.waitForTimeout(600);
  await page.mouse.click(colp.x - 14, colp.y + colp.h / 2);
  await page.waitForTimeout(1000);
  await dark();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/devin/repos/logseq/docs/pixel2-outliner/dark/master-13-collapsed.png' });
  console.log('shot ok', JSON.stringify(colp));
} else console.log('NO COLLAPSIBLE');
process.exit(0);
