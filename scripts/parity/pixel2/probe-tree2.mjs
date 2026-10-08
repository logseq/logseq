import { launch, MASTER_URL, LUI_URL } from './lib.mjs';
const tag = process.argv[2];
const { page } = await launch(tag);
await page.goto(tag === 'master' ? MASTER_URL : LUI_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 18000);
const r = await page.evaluate(async () => {
  const pages = await window.logseq.api.datascript_query(
    '[:find ?u ?n :where [?p :block/name "ppfixture"] [?p :block/uuid ?u] [?p :block/title ?n]]');
  const out = { pages };
  for (const [u] of pages) {
    const t = await window.logseq.api.get_page_blocks_tree(u);
    out[u] = (Array.isArray(t) ? t : []).map(b => (b.content || b.title || '').slice(0, 30));
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
process.exit(0);
