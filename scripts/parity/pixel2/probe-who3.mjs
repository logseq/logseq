import { launch, MASTER_URL } from './lib.mjs';
const { page } = await launch('master');
await page.goto(MASTER_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(14000);
const r = await page.evaluate(async () => {
  const q = window.logseq.api.datascript_query;
  return await q('[:find ?t ?pt :where [?b :block/page ?pg] [?pg :block/name "ppfixture"] [?b :block/title ?t] [(get-else $ ?b :block/parent ?pg) ?p] [(get-else $ ?p :block/title "?") ?pt]]');
});
for (const row of r) console.log(JSON.stringify(row));
process.exit(0);
