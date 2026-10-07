import { launch, LUI_URL } from './lib.mjs';

const measure = () => {
  const ac = document.querySelector('.asset-container');
  const block = ac.closest('.ls-block');
  const wrap = ac.closest('.block-title-wrap');
  const R = e => { const r = e.getBoundingClientRect(); return [r.x | 0, r.y | 0, r.width | 0, r.height | 0]; };
  // next block y
  const nb = block.nextElementSibling;
  return { block: R(block), wrap: R(wrap), ac: R(ac), next: nb ? R(nb)[1] : null, wrapPadB: getComputedStyle(wrap).paddingBottom, wrapCS: { d: getComputedStyle(wrap).display, ws: getComputedStyle(wrap).whiteSpace } };
};

const { page } = await launch('lui');
await page.goto(LUI_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(20000);
await page.goto(LUI_URL + '#/page/PPFixture', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
await page.evaluate(() => {
  const els = [...document.querySelectorAll('body *')].filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
  for (const el of els) el.scrollTop = 700;
});
await page.waitForTimeout(500);
console.log('before:', JSON.stringify(await page.evaluate(measure)));
await page.evaluate(() => {
  const st = document.createElement('style');
  st.textContent = '.block-title-wrap .asset-container { margin-top: 4px; }';
  document.head.appendChild(st);
});
await page.waitForTimeout(300);
console.log('after-mt4:', JSON.stringify(await page.evaluate(measure)));
await page.evaluate(() => {
  const st = document.createElement('style');
  st.textContent = '.block-title-wrap { line-height: 0 !important; } .block-title-wrap .asset-container { margin-top: 4px; }';
  document.head.appendChild(st);
});
await page.waitForTimeout(300);
console.log('after-lh0:', JSON.stringify(await page.evaluate(measure)));
process.exit(0);
