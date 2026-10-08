import { launch, MASTER_URL, LUI_URL } from './lib.mjs';
const tag = process.argv[2];
const { page } = await launch(tag);
await page.goto(tag === 'master' ? MASTER_URL : LUI_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 18000);
const r = await page.evaluate(async () => {
  const p = await window.logseq.api.get_page('PPFixture');
  const u = p.uuid;
  const kids = await window.logseq.api.datascript_query(
    `[:find ?t :where [?b :block/parent ?p] [?p :block/uuid "${u}"] [?b :block/title ?t]]`);
  const flat = (kids || []).map(k => String(k[0]).slice(0, 40));
  return { uuid: u, n: flat.length, last10: flat.slice(-10) };
});
console.log(JSON.stringify(r, null, 1));
process.exit(0);
