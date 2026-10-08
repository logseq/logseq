import { launch, MASTER_URL, LUI_URL } from './lib.mjs';
const tag = process.argv[2];
const { page } = await launch(tag);
await page.goto(tag === 'master' ? MASTER_URL : LUI_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 18000);
const tree = await page.evaluate(async () => {
  const t = await window.logseq.api.get_page_blocks_tree('PPFixture');
  const flat = (n, d) => (n || []).flatMap(b =>
    [[d, (b.content || b.title || '').slice(0, 45)], ...flat(b.children, d + 1)]);
  return flat(Array.isArray(t) ? t : [], 0);
});
tree.forEach(([d, c]) => console.log(' '.repeat(d * 2) + c));
process.exit(0);
