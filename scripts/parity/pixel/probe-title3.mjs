import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const row = document.querySelector('.is-page-title-row');
  if (!row) return 'no row';
  const out = { rowMl: getComputedStyle(row).marginLeft, kids: [] };
  for (const k of row.children) {
    const r = k.getBoundingClientRect();
    out.kids.push({ cls: String(k.className || '').slice(0, 60), rect: [r.x | 0, r.y | 0, r.width | 0, r.height | 0], html: k.innerHTML.slice(0, 120) });
    for (const kk of k.children) {
      const rr = kk.getBoundingClientRect();
      out.kids.push({ cls: '  ' + String(kk.className || '').slice(0, 55), rect: [rr.x | 0, rr.y | 0, rr.width | 0, rr.height | 0] });
    }
  }
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
