import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const out = [];
  for (const el of document.querySelectorAll('.block-tags, .ls-block-right')) {
    const r = el.getBoundingClientRect();
    if (r.y < 40 || r.y > 780 || r.width === 0) continue;
    out.push({
      cls: String(el.className).slice(0, 50),
      rect: [r.x | 0, r.y | 0, r.width | 0, r.height | 0],
      text: el.textContent.trim().slice(0, 40),
      html: el.innerHTML.slice(0, 200),
    });
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
  (await page.evaluate(probe)).forEach(r => console.log(JSON.stringify(r)));
}
process.exit(0);
