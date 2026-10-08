// Seed the interaction-perf fixture: graph logseq_db_Demo (auto-opened by
// ?rtc-test=true), BenchSmall ~55 blocks (bench-x, indent-me, fold-me,
// [[BenchBig]] link) + BenchBig ~200 blocks. Idempotent — skips pages that
// already have the expected block count.
// Usage: node scripts/serve-static.mjs 3013  (repo root)
//        node deps/ui/docs/seed-interaction-perf.mjs
import { chromium } from 'playwright';

const CTX = process.env.HOME + '/pw-lui-perf';
const URL_ = 'http://localhost:3013/index.html?rtc-test=true';

const ctx = await chromium.launchPersistentContext(CTX, { viewport: { width: 1440, height: 900 } });
const p = ctx.pages()[0] ?? (await ctx.newPage());
p.setDefaultTimeout(30000);
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto(URL_);
await p.waitForTimeout(12000);

const info = await p.evaluate(async () => ({
  api: !!window.logseq?.api,
  graph: await window.logseq?.api?.get_current_graph().catch(() => null),
}));
console.log('api:', info.api, 'graph:', JSON.stringify(info.graph));
if (!info.api) { console.error('no logseq.api — aborting'); process.exit(1); }

const blockCount = async (title) =>
  p.evaluate(async (t) => {
    const pg = await window.logseq.api.get_page(t);
    if (!pg) return -1;
    const uuid = pg.uuid || pg['block/uuid'];
    location.hash = '#/page/' + uuid;
    await new Promise((r) => setTimeout(r, 2000));
    return document.querySelectorAll('.ls-block').length;
  }, title);

const titles = () =>
  p.evaluate(() => [...document.querySelectorAll('.ls-block')].map((e) => e.getAttribute('data-block-title')));

const append = async (page, text) =>
  p.evaluate(([pg, t]) => window.logseq.api.append_block_in_page(pg, t, {}), [page, text]);

// --- BenchSmall ---
const smallCount = await blockCount('BenchSmall');
console.log('BenchSmall blocks:', smallCount);
if (smallCount < 50) {
  const have = await titles();
  if (!have.includes('bench-x')) await append('BenchSmall', 'bench-x');
  if (!have.includes('indent-me')) await append('BenchSmall', 'indent-me');
  if (!have.includes('fold-me')) await append('BenchSmall', 'fold-me');
  const filler = 55 - Math.max(smallCount, 0) - 3;
  for (let i = 0; i < filler; i++) await append('BenchSmall', 'filler ' + i);
  await append('BenchSmall', 'go to [[BenchBig]]');
  console.log('BenchSmall seeded:', await blockCount('BenchSmall'));
}

// fold-me must have a child
const fid = await p.evaluate(() => {
  const el = [...document.querySelectorAll('.ls-block')].find((e) => e.getAttribute('data-block-title') === 'fold-me');
  return el?.getAttribute('haschild') === 'true' ? null : el?.getAttribute('blockid');
});
if (fid) {
  await p.evaluate((id) => window.logseq.api.append_block_in_page(id, 'fold child', {}), fid);
  console.log('fold child added');
}

// --- BenchBig ---
const bigCount = await blockCount('BenchBig');
console.log('BenchBig blocks:', bigCount);
if (bigCount < 190) {
  const needed = 200 - Math.max(bigCount, 0);
  for (let i = 0; i < needed; i++) await append('BenchBig', 'big row ' + i);
  console.log('BenchBig seeded:', await blockCount('BenchBig'));
}

await ctx.close();
console.log('seed done');
