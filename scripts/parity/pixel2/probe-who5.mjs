import { launch, MASTER_URL } from './lib.mjs';
const { page } = await launch('master');
await page.goto(MASTER_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(14000);
const r = await page.evaluate(async () => {
  const q = window.logseq.api.datascript_query;
  const col = await q('[:find ?t ?pname :where [?b :block/title ?t] [(clojure.string/includes? ?t "Collapsible")] [?b :block/page ?pg] [?pg :block/name ?pname]]');
  const clk = await q('[:find ?t ?pname :where [?b :block/title ?t] [(clojure.string/includes? ?t "Clocked")] [?b :block/page ?pg] [?pg :block/name ?pname]]');
  const emb = await q('[:find ?t ?pname :where [?b :block/title ?t] [(clojure.string/includes? ?t "embed")] [?b :block/page ?pg] [?pg :block/name ?pname]]');
  return `col=${JSON.stringify(col)} clk=${JSON.stringify(clk)} emb=${JSON.stringify(emb)}`;
});
console.log(r);
process.exit(0);
