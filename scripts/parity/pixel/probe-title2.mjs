import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const out = {};
  const grab = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: r.x | 0, w: r.width | 0, ml: cs.marginLeft, pl: cs.paddingLeft, cls: String(el.className || '').slice(0, 60) };
  };
  out.pageBlocks = grab('.ls-page-blocks');
  // title's block row container: find .ls-block containing 'PPFixture' span at top level
  const spans = [...document.querySelectorAll('span')].filter(e => e.textContent.trim() === 'PPFixture' && e.getBoundingClientRect().x > 0);
  out.titleChain = spans.map(s => {
    const chain = [];
    for (let p = s; p && chain.length < 15; p = p.parentElement) {
      const r = p.getBoundingClientRect();
      const cls = String(p.className && p.className.baseVal !== undefined ? p.getAttribute('class') : p.className);
      if (cls.includes('ls-block') || cls.includes('page') || cls.includes('block-') || chain.length === 0) {
        chain.push(cls.slice(0, 70) + ' @x=' + (r.x | 0) + ' w=' + (r.width | 0) + ' ml=' + getComputedStyle(p).marginLeft);
      }
    }
    return chain;
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
  console.log(JSON.stringify(await page.evaluate(probe), null, 1));
}
process.exit(0);
