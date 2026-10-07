import { launch, LUI_URL } from './lib.mjs';

const measure = () => {
  const ac = document.querySelector('.asset-container');
  const block = ac.closest('.ls-block');
  const wrap = ac.closest('.block-title-wrap');
  const inline = wrap.parentElement;
  const R = e => { const r = e.getBoundingClientRect(); return Math.round(r.height); };
  return { block: R(block), inline: R(inline), wrap: R(wrap), imgY: Math.round(ac.getBoundingClientRect().y) };
};

const { page } = await launch('lui');
await page.goto(LUI_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(20000);
await page.goto(LUI_URL + '#/page/PPFixture', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
const variants = [
  ['tb+mt6', '.block-title-wrap .asset-container { vertical-align: text-bottom !important; margin-top: 6px !important; }'],
  ['tb+mt8', '.block-title-wrap .asset-container { vertical-align: text-bottom !important; margin-top: 8px !important; }'],
  ['bottom+mt8', '.block-title-wrap .asset-container { vertical-align: bottom !important; margin-top: 8px !important; }'],
  ['block+mt8', '.block-title-wrap .asset-container { display: block !important; margin-top: 8px !important; }'],
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
