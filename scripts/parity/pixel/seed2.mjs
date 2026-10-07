// Seed fixture into a persistent profile. Usage: node seed2.mjs master|lui
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';
import { FIXTURE_PAGE, BLOCKS, PROPS } from './fixture.mjs';
const tag = process.argv[2] || 'master';
const url = tag === 'master' ? MASTER_URL : LUI_URL;
const { ctx, page } = await launch(tag);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 20000);
const out = await page.evaluate(async ({ FIXTURE_PAGE, BLOCKS, PROPS }) => {
  const api = window.logseq.api; const log = [];
  try {
    const existing = await api.get_page(FIXTURE_PAGE);
    if (existing && api.delete_page) { await api.delete_page(FIXTURE_PAGE); log.push('deleted stale page'); }
  } catch (e) { log.push('pre-clean: ' + String(e).slice(0, 100)); }
  const page = await api.create_page(FIXTURE_PAGE);
  const pageUuid = page && (page.uuid || page['block/uuid'] || page.id);
  for (let i = 0; i < BLOCKS.length; i++) {
    const b = BLOCKS[i];
    try { await api.insert_batch_block(pageUuid, [b], { sibling: false }); }
    catch (e) {
      try { await api.append_block_in_page(pageUuid, b.content, { sibling: false }); }
      catch (e2) { log.push(`${i} FAIL ${(b.content||'').slice(0,30)} :: ${String(e2).slice(0,80)}`); }
    }
    await new Promise(r => setTimeout(r, 250));
  }
  try {
    const tree = await api.get_page_blocks_tree(FIXTURE_PAGE);
    const flat = []; const walk = ns => (ns || []).forEach(n => { flat.push(n); walk(n.children); });
    walk(tree);
    const target = flat.find(b => String(b.content || b.title || '').includes('Block with properties'));
    if (target) {
      for (const [k, v] of PROPS) { await api.upsert_block_property(target.uuid, k, v); await new Promise(r => setTimeout(r, 400)); }
      log.push('props ok');
    }
    log.push('tree blocks: ' + flat.length);
    // drop a leading empty block if present
    if (flat[0] && !String(flat[0].content || flat[0].title || '').trim() && api.remove_block) {
      await api.remove_block(flat[0].uuid); log.push('removed empty head');
    }
  } catch (e) { log.push('tree FAIL: ' + String(e).slice(0, 200)); }
  return log;
}, { FIXTURE_PAGE, BLOCKS, PROPS });
console.log(out.join('\n'));
await page.waitForTimeout(2000);
await ctx.close();
