import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const scrollTo = y => {
    const els = [...document.querySelectorAll('body *')].filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
    for (const el of els) el.scrollTop = y;
  };
  scrollTo(700);
  return [...document.querySelectorAll('.ls-block')].map(b => {
    const r = b.getBoundingClientRect();
    const t = (b.querySelector('.block-title-wrap') || b).textContent.trim().slice(0, 30);
    return [r.x | 0, r.y | 0, r.height | 0, t];
  }).filter(r => r[1] > 40 && r[1] < 780);
};

for (const [tag, url] of [['master', MASTER_URL], ['lui', LUI_URL]]) {
  const { page } = await launch(tag);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(tag === 'master' ? 12000 : 20000);
  await page.goto(url + '#/page/PPFixture', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  const rows = await page.evaluate(probe);
  await new Promise(r => setTimeout(r, 800));
  const rows2 = await page.evaluate(probe);
  console.log('=== ' + tag);
  rows2.forEach(r => console.log(r.join(' | ')));
}
process.exit(0);
