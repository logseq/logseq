import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const els = [...document.querySelectorAll('body *')].filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
  for (const el of els) el.scrollTop = 1400;
  const R = e => { const r = e.getBoundingClientRect(); return [r.x | 0, r.y | 0, r.width | 0, r.height | 0]; };
  const rows = [...document.querySelectorAll('.property-pair, [class*=property-panel-row]')].filter(e => e.getBoundingClientRect().y > 40 && e.getBoundingClientRect().y < 780);
  return rows.map(row => {
    const kp = row.querySelector('.property-key-panel');
    const ki = row.querySelector('.property-key-inner');
    const vp = row.querySelector('.property-value-panel');
    const cs = getComputedStyle(row);
    return {
      cls: String(row.className).slice(0, 45), row: R(row), gap: cs.columnGap || cs.gap, pr: cs.paddingRight,
      kp: kp && R(kp), ki: ki && R(ki), vp: vp && R(vp),
    };
  });
};

for (const [tag, url] of [['master', MASTER_URL], ['lui', LUI_URL]]) {
  const { page } = await launch(tag);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(tag === 'master' ? 12000 : 20000);
  await page.goto(url + '#/page/PPFixture', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  console.log('=== ' + tag);
  const rows = await page.evaluate(probe);
  rows.forEach(r => console.log(JSON.stringify(r)));
}
process.exit(0);
