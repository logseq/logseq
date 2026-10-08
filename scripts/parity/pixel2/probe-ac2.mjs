import { launch, LUI_URL } from './lib.mjs';
const { page } = await launch('lui');
await page.goto(LUI_URL + '#/page/07d1c0b9-466b-47af-9461-e3627831d8d8', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(18000);
const u = await page.evaluate(async () => {
  const p = await window.logseq.api.get_page('PPFixture');
  const b = await window.logseq.api.append_block_in_page(p.uuid, 'ACPROBE', { sibling: false });
  return b?.uuid || JSON.stringify(b);
});
console.log('uuid', u);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const r = await page.evaluate((u) => {
  const el = document.querySelector(`.ls-block[blockid="${u}"]`);
  const all = [...document.querySelectorAll('.ls-block')].map(e => e.getAttribute('blockid'));
  return { hit: !!el, n: all.length, hasUuid: all.includes(u), sample: all.slice(-4) };
}, u);
console.log(JSON.stringify(r));
process.exit(0);
