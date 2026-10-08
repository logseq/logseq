import { launch, MASTER_URL, LUI_URL } from './lib3.mjs';
const tag = process.argv[2] || 'master';
const url = tag === 'master' ? MASTER_URL : LUI_URL;
const { ctx, page } = await launch(tag);
await page.goto(url + '#/page/ppfixture', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 9000 : 14000);
const tree = await page.evaluate(async () => window.logseq.api.get_page_blocks_tree('PPFixture'));
const show = (ns, d) => (ns || []).forEach(n => {
  const t = String(n.content || n.title || n['block/title'] || n.rawTitle || '').replace(/\n/g, '\\n').slice(0, 60);
  console.log('  '.repeat(d) + JSON.stringify(t));
  show(n.children || n['block/children'], d + 1);
});
show(Array.isArray(tree) ? tree : (tree?.children || []), 0);
await ctx.close();
