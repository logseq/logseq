// Probe which value formats upsert_block_property accepts per schema type.
import { launch, MASTER_URL } from './lib.mjs';
const { ctx, page } = await launch('master');
await page.goto(MASTER_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const out = await page.evaluate(async () => {
  const api = window.logseq.api;
  const log = [];
  const b = await api.append_block_in_page('Seed notes', 'probe-block');
  const u = b && (b.uuid || b['block/uuid']);
  for (const [k, v] of [
    ['published', '2008-08-01'],
    ['published', 'Aug 1st, 2008'],
    ['finished', 'true'],
    ['finished', true],
    ['rating', 5],
    ['rating', '5'],
  ]) {
    try { await api.upsert_block_property(u, k, v); log.push(`OK ${k}=${JSON.stringify(v)}`); }
    catch (e) { log.push(`FAIL ${k}=${JSON.stringify(v)} :: ${String(e).slice(0, 100)}`); }
  }
  // read back
  try {
    const blk = await api.get_block(u);
    log.push('READ ' + JSON.stringify(blk).slice(0, 800));
  } catch (e) { log.push('read FAIL ' + e); }
  try { await api.remove_block(u); } catch {}
  return log;
});
console.log(out.join('\n'));
await ctx.close();
