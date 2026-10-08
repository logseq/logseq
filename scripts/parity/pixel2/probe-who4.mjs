import { launch, MASTER_URL } from './lib.mjs';
const { page } = await launch('master');
await page.goto(MASTER_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(14000);
const r = await page.evaluate(async () => {
  const q = window.logseq.api.datascript_query;
  return {
    collapsible: await q('[:find ?t ?pname :where [?b :block/title ?t] [(clojure.string/includes? ?t "Collapsible")] [?b :block/page ?pg] [?pg :block/name ?pname]]'),
    clocked: await q('[:find ?t ?pname :where [?b :block/title ?t] [(clojure.string/includes? ?t "Clocked")] [?b :block/page ?pg] [?pg :block/name ?pname]]'),
    pages: await q('[:find ?n (count ?b) :where [?b :block/page ?pg] [?pg :block/name ?n]]'),
  };
});
console.log(JSON.stringify(r, null, 1).slice(0, 2500));
process.exit(0);
