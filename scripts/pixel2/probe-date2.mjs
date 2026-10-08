// Probe date-property upsert with entityId opts on master.
import { launch, MASTER_URL } from './lib.mjs';
const { ctx, page } = await launch('master');
await page.goto(MASTER_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const out = await page.evaluate(async () => {
  const api = window.logseq.api;
  const log = [];
  const b = await api.append_block_in_page('Seed notes', 'probe-date2');
  const u = b && (b.uuid || b['block/uuid']);
  const jp = await api.get_page('Aug 1st, 2008');
  const ju = jp && (jp.uuid || jp['block/uuid']);
  log.push('journal uuid ' + ju);
  for (const [v, o] of [
    [ju, { entityId: true }],
    [ju, { entityId: 'true' }],
    ['Aug 1st, 2008', { entityId: true }],
    [ju, {}],
  ]) {
    try { await api.upsert_block_property(u, 'published', v, o); log.push(`OK published=${JSON.stringify(v)} opts=${JSON.stringify(o)}`); }
    catch (e) { log.push(`FAIL published=${JSON.stringify(v)} opts=${JSON.stringify(o)} :: ${String(e).slice(0, 100)}`); }
  }
  const blk = await api.get_block(u);
  log.push('READ ' + JSON.stringify(blk?.properties || {}).slice(0, 500));
  try { await api.remove_block(u); } catch {}
  return log;
});
console.log(out.join('\n'));
await ctx.close();
