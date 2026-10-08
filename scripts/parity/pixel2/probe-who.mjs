import { launch, MASTER_URL } from './lib.mjs';
const { page } = await launch('master');
await page.goto(MASTER_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(14000);
const r = await page.evaluate(async () => {
  const q = window.logseq.api.datascript_query;
  const find = await q('[:find ?t ?c :where [?b :block/title ?t] [(clojure.string/starts-with? ?t "DOING Clocked")] [?b :block/uuid ?c]]');
  const out = { find };
  for (const row of find) {
    const kids = await q(`[:find ?t :in $ ?u :where [?b :block/parent ?p] [?p :block/uuid ?u] [?b :block/title ?t]]`.replace('?u]', `?u]`) , );
    out.kids = 'skip';
  }
  // children of DOING block via parent attr: find parent of DOING, and DOING's children
  const doing = find[0]?.[1];
  if (doing) {
    out.doingChildren = await q(`[:find ?t :where [?c :block/parent ?b] [?b :block/uuid "${doing}"] [?c :block/title ?t]]`);
    out.doingParent = await q(`[:find ?t :where [?b :block/parent ?p] [?b :block/uuid "${doing}"] [?p :block/title ?t]]`);
  }
  // where do the extras live?
  out.logbook = await q('[:find ?t ?par :where [?b :block/title ?t] [(clojure.string/includes? ?t "LOGBOOK")] [?b :block/parent ?pp] [?pp :block/title ?par]]');
  out.sched = await q('[:find ?t ?par :where [?b :block/title ?t] [(clojure.string/includes? ?t "SCHEDULED:")] [?b :block/parent ?pp] [?pp :block/title ?par]]');
  out.embed = await q('[:find ?t ?par :where [?b :block/title ?t] [(clojure.string/includes? ?t "{{embed")] [?b :block/parent ?pp] [?pp :block/title ?par]]');
  return out;
});
console.log(JSON.stringify(r, null, 1).slice(0, 3000));
process.exit(0);
