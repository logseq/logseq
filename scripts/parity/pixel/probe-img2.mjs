import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const scrollTo = y => {
    const els = [...document.querySelectorAll('body *')].filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
    for (const el of els) el.scrollTop = y;
  };
  scrollTo(700);
  const ac = document.querySelector('.asset-container');
  if (!ac) return 'none';
  const out = {};
  const tw = ac.closest('.block-title-wrap');
  out.wrap = (() => { const r = tw.getBoundingClientRect(); return [r.x | 0, r.y | 0, r.width | 0, r.height | 0]; })();
  out.kids = [...tw.children].map(k => {
    const r = k.getBoundingClientRect();
    return { cls: String(k.className || '').slice(0, 50), tag: k.tagName, rect: [r.x | 0, r.y | 0, r.width | 0, r.height | 0], txt: k.textContent.trim().slice(0, 20) };
  });
  // all text nodes / spans inside wrap before asset
  out.all = [...tw.querySelectorAll('*')].filter(e => e.childElementCount === 0).map(e => {
    const r = e.getBoundingClientRect();
    return { cls: String(e.className || '').slice(0, 40), tag: e.tagName, rect: [r.x | 0, r.y | 0, r.width | 0, r.height | 0], txt: e.textContent.trim().slice(0, 20) };
  }).slice(0, 12);
  return out;
};

for (const [tag, url] of [['master', MASTER_URL], ['lui', LUI_URL]]) {
  const { page } = await launch(tag);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(tag === 'master' ? 12000 : 20000);
  await page.goto(url + '#/page/PPFixture', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  console.log('=== ' + tag);
  console.log(JSON.stringify(await page.evaluate(probe), null, 1));
}
process.exit(0);
