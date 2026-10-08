import { launch, MASTER_URL } from './lib.mjs';
const { page } = await launch('master');
await page.goto(MASTER_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(14000);
const r = await page.evaluate(async () => {
  const q = window.logseq.api.datascript_query;
  return {
    byContent: await q('[:find ?t :where [?b :block/content ?t] [(clojure.string/includes? ?t "Clocked")]]'),
    anyClocked: await q('[:find ?a ?v :where [?b ?a ?v] [(= ?a :block/content)] [(clojure.string/includes? ?v "Clocked")]]'),
    total: await q('[:find (count ?b) :where [?b :block/content _]]'),
    pageChildren: await q('[:find (count ?b) :where [?b :block/page ?p] [?p :block/name "ppfixture"]]'),
  };
});
console.log(JSON.stringify(r, null, 1).slice(0, 2000));
process.exit(0);
