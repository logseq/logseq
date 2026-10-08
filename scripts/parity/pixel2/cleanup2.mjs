import { launch, LUI_URL } from './lib.mjs';
const { page } = await launch('lui');
await page.goto(LUI_URL + '#/page/07d1c0b9-466b-47af-9461-e3627831d8d8', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(18000);
const r = await page.evaluate(async () => {
  const t = await window.logseq.api.get_page_blocks_tree('PPFixture');
  const tops = Array.isArray(t) ? t : [];
  const hits = tops.filter(b => {
    const c = (b.content || b.title || '').trim();
    return c === '/' || c.startsWith('ACPROBE') || c === '@' || c === '[[' || c === '((';
  });
  for (const b of hits) await window.logseq.api.remove_block(b.uuid).catch(() => {});
  return hits.map(b => (b.content || '').slice(0, 20));
});
console.log('removed', JSON.stringify(r));
process.exit(0);
