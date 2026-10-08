import { launch, LUI_URL } from './lib.mjs';
const { page } = await launch('lui');
await page.goto(LUI_URL + '#/page/07d1c0b9-466b-47af-9461-e3627831d8d8', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(18000);
const r = await page.evaluate(() => {
  const el = document.querySelector('.ls-block');
  return el ? el.outerHTML.slice(0, 400) : 'none';
});
console.log(r);
process.exit(0);
