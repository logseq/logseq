import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const scrollTo = y => {
    const els = [...document.querySelectorAll('body *')].filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
    for (const el of els) el.scrollTop = y;
  };
  scrollTo(700);
  const ac = [...document.querySelectorAll('.asset-container')].map(e => {
    const r = e.getBoundingClientRect();
    const img = e.querySelector('img');
    const ir = img ? img.getBoundingClientRect() : null;
    const cs = getComputedStyle(e);
    return { rect: [r.x | 0, r.y | 0, r.width | 0, r.height | 0], img: ir ? [ir.x | 0, ir.y | 0, ir.width | 0, ir.height | 0] : null, mt: cs.marginTop, cls: String(e.className).slice(0, 60), parent: String(e.parentElement.className || '').slice(0, 50), pRect: (() => { const p = e.parentElement.getBoundingClientRect(); return [p.x | 0, p.y | 0, p.width | 0, p.height | 0]; })() };
  });
  // also the table block
  const tbl = [...document.querySelectorAll('.table-wrapper, .markdown-table, table')].map(e => {
    const r = e.getBoundingClientRect();
    return { cls: String(e.className).slice(0, 40), rect: [r.x | 0, r.y | 0, r.width | 0, r.height | 0] };
  });
  return { ac, tbl };
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
