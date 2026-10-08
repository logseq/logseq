import { launch } from './lib.mjs';
const tag = process.argv[2] || 'master';
const { page } = await launch(tag);
await page.waitForTimeout(3000);
const pageName = tag === 'master' ? 'PPFixture' : 'PPFixture';
const p = await page.evaluate(async (n) => {
  const pg = await window.logseq.api.get_page(n);
  return pg ? (pg.uuid || pg['block/uuid']) : null;
}, pageName);
console.log('page uuid', p);
const blocks = await page.evaluate(async (n) => {
  const q = await window.logseq.api.datascript_query(
    `[:find (pull ?b [:block/title]) :where [?p :block/name "${n.toLowerCase()}"] [?b :block/parent ?p]]`.replace('${n.toLowerCase()}', JSON.stringify(n.toLowerCase()).slice(1,-1))
  );
  return null;
}, pageName);
// simpler: get page blocks tree
const tree = await page.evaluate(async (n) => {
  const t = await window.logseq.api.get_page_blocks_tree(n);
  return (t || []).map(b => (b.title || b.content || '').slice(0, 50));
}, pageName);
console.log('top-level blocks:', JSON.stringify(tree, null, 0));
process.exit(0);
