// Probe date-property upsert formats on master.
import { launch, MASTER_URL } from './lib.mjs';
const { ctx, page } = await launch('master');
await page.goto(MASTER_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(12000);
const out = await page.evaluate(async () => {
  const api = window.logseq.api;
  const log = [];
  const b = await api.append_block_in_page('Seed notes', 'probe-date');
  const u = b && (b.uuid || b['block/uuid']);
  // find the journal page for 2008-08-01 if it exists
  let jp;
  for (const t of ['Aug 1st, 2008', '2008-08-01', 'Aug 1, 2008']) {
    try { jp = await api.get_page(t); if (jp) { log.push('journal page found as ' + t); break; } } catch {}
  }
  if (!jp) {
    try { jp = await api.create_journal_page('2008-08-01'); log.push('created journal ' + JSON.stringify(jp).slice(0, 200)); } catch (e) { log.push('create_journal FAIL ' + String(e).slice(0, 100)); }
  }
  const ju = jp && (jp.uuid || jp['block/uuid']);
  for (const v of [
    ju,
    ju ? { uuid: ju } : null,
    `[[Aug 1st, 2008]]`,
    new Date(2008, 7, 1).getTime(),
    20080801,
    { 'block/uuid': ju },
  ].filter(x => x != null)) {
    try { await api.upsert_block_property(u, 'published', v); log.push(`OK published=${JSON.stringify(v)}`); }
    catch (e) { log.push(`FAIL published=${JSON.stringify(v)} :: ${String(e).slice(0, 100)}`); }
  }
  try {
    const blk = await api.get_block(u);
    log.push('READ ' + JSON.stringify(blk?.properties || blk).slice(0, 600));
  } catch {}
  try { await api.remove_block(u); } catch {}
  return log;
});
console.log(out.join('\n'));
await ctx.close();
