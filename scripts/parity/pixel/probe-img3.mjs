import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const ac = document.querySelector('.asset-container');
  if (!ac) return 'none';
  const block = ac.closest('.ls-block');
  const wrap = ac.closest('.block-title-wrap');
  const out = {};
  const R = e => { const r = e.getBoundingClientRect(); return [r.x | 0, r.y | 0, r.width | 0, r.height | 0]; };
  out.block = R(block);
  out.wrap = R(wrap);
  // find the text element 'Image below:' inside wrap
  const spans = [...wrap.querySelectorAll('*')].filter(e => e.textContent.trim().startsWith('Image below'));
  out.textEls = spans.map(e => ({ cls: String(e.className || '').slice(0, 45), tag: e.tagName, r: R(e), lh: getComputedStyle(e).lineHeight }));
  out.ac = R(ac);
  out.acMt = getComputedStyle(ac).marginTop;
  out.img = R(ac.querySelector('img'));
  // middle ancestors between wrap and ac
  const mid = [];
  for (let p = ac; p && p !== wrap; p = p.parentElement) mid.push(String(p.className || '').slice(0, 50) + ' @' + R(p).join(','));
  out.mid = mid;
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
  await page.waitForTimeout(500);
  console.log('=== ' + tag);
  console.log(JSON.stringify(await page.evaluate(probe), null, 1));
}
process.exit(0);
