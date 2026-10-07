import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const out = [];
  document.querySelectorAll('#main-content-container .ls-block').forEach(b => {
    const r = b.getBoundingClientRect();
    const y = r.y + window.scrollY;
    const t = (b.querySelector('.block-title-wrap')?.textContent || '').slice(0, 40);
    out.push([Math.round(y), Math.round(r.height), t]);
  });
  return out;
};

for (const [tag, url] of [['master', MASTER_URL], ['lui', LUI_URL]]) {
  const { page } = await launch(tag);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(tag === 'master' ? 12000 : 20000);
  await page.goto(url + '#/page/PPFixture', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  console.log('=== ' + tag);
  for (const row of await page.evaluate(probe)) console.log(JSON.stringify(row));
}
process.exit(0);
