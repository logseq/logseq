import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const els = [...document.querySelectorAll('body *')].filter(e => e.childElementCount === 0 && e.textContent.trim() === 'PPFixture');
  return els.map(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const chain = [];
    for (let i = 0, p = el; p && i < 8; i++, p = p.parentElement) {
      const pr = p.getBoundingClientRect();
      const pcs = getComputedStyle(p);
      chain.push({
        cls: String(p.className && p.className.baseVal !== undefined ? p.getAttribute('class') : p.className).slice(0, 70),
        x: pr.x | 0, w: pr.width | 0, pl: pcs.paddingLeft, ml: pcs.marginLeft, fs: pcs.fontSize,
      });
    }
    return { tag: el.tagName, cls: String(el.className || ''), rect: [r.x | 0, r.y | 0, r.width | 0, r.height | 0], fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, chain };
  });
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
