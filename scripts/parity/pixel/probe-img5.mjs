import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const ac = document.querySelector('.asset-container');
  if (!ac) return 'none';
  const out = {};
  const R = e => { const r = e.getBoundingClientRect(); return [r.x | 0, r.y | 0, r.width | 0, r.height | 0]; };
  // every ancestor from ac up to .ls-block with heights + the block's children
  const chain = [];
  for (let p = ac; p; p = p.parentElement) {
    chain.push(String(p.className || '').slice(0, 55) + ' @' + R(p).join(','));
    if (String(p.className || '').includes('ls-block')) break;
  }
  out.chain = chain;
  const block = ac.closest('.ls-block');
  out.blockKids = [...block.children].map(k => String(k.className || '').slice(0, 50) + ' @' + R(k).join(','));
  // siblings after wrap inside content
  const wrap = ac.closest('.block-title-wrap');
  out.wrapNext = wrap.nextElementSibling ? String(wrap.nextElementSibling.className || '').slice(0, 40) + ' @' + R(wrap.nextElementSibling).join(',') : null;
  out.wrapPrev = wrap.previousElementSibling ? String(wrap.previousElementSibling.className || '').slice(0, 40) + ' @' + R(wrap.previousElementSibling).join(',') : null;
  return out;
};

for (const [tag, url] of [['master', MASTER_URL], ['lui', LUI_URL]]) {
  const { page } = await launch(tag);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(tag === 'master' ? 12000 : 20000);
  await page.goto(url + '#/page/PPFixture', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  await page.evaluate(() => {
    const els = [...document.querySelectorAll('body *')].filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
    for (const el of els) el.scrollTop = 700;
  });
  await page.waitForTimeout(400);
  console.log('=== ' + tag);
  const o = await page.evaluate(probe);
  console.log(JSON.stringify(o, null, 1));
}
process.exit(0);
