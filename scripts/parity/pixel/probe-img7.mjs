import { launch, LUI_URL } from './lib.mjs';

const measure = () => {
  const ac = document.querySelector('.asset-container');
  const block = ac.closest('.ls-block');
  const wrap = ac.closest('.block-title-wrap');
  const inline = wrap.parentElement;
  const R = e => { const r = e.getBoundingClientRect(); return Math.round(r.height); };
  const next = block.nextElementSibling;
  return { block: R(block), inline: R(inline), wrap: R(wrap), imgY: Math.round(ac.getBoundingClientRect().y), nextY: next ? Math.round(next.getBoundingClientRect().y) : 0 };
};

const { page } = await launch('lui');
await page.goto(LUI_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(20000);
await page.goto(LUI_URL + '#/page/PPFixture', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
console.log('base:', JSON.stringify(await page.evaluate(measure)));
const variants = [
  ['va-bottom', '.block-title-wrap .asset-container { vertical-align: bottom !important; }'],
  ['va-textbottom', '.block-title-wrap .asset-container { vertical-align: text-bottom !important; }'],
  ['block', '.block-title-wrap .asset-container { display: block !important; }'],
];
for (const [name, css] of variants) {
  await page.evaluate((css) => {
    const st = document.createElement('style');
    st.id = 'probe-style';
    st.textContent = css;
    document.head.appendChild(st);
  }, css);
  await page.waitForTimeout(300);
  console.log(name + ':', JSON.stringify(await page.evaluate(measure)));
  await page.evaluate(() => document.getElementById('probe-style').remove());
}
process.exit(0);
