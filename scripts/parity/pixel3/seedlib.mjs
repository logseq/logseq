import { FIXTURE_PAGE, BLOCKS, PROPS } from './fixture.mjs';

export async function ensureSeed(page, tag, min = 30) {
  const count = await page.evaluate(async (FP) => {
    try {
      const t = await window.logseq?.api?.get_page_blocks_tree?.(FP);
      const flat = [];
      const walk = ns => (ns || []).forEach(n => { flat.push(n); walk(n.children || n['block/children']); });
      walk(Array.isArray(t) ? t : (t ? [t] : []));
      return flat.length;
    } catch { return 0; }
  }, FIXTURE_PAGE);
  if (count >= min) { console.log(`seed ok ${tag}: ${count}`); return count; }
  console.log(`seeding ${tag} (have ${count})`);
  const r = await page.evaluate(
    async ({ FIXTURE_PAGE, BLOCKS, PROPS }) => {
      const api = window.logseq.api;
      const log = [];
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      try {
        let p = await api.get_page(FIXTURE_PAGE);
        if (!p) { p = await api.create_page(FIXTURE_PAGE); }
        const pageUuid = p && (p.uuid || p['block/uuid'] || p.id);
        const Alpha = await api.get_page('Alpha');
        if (!Alpha) await api.create_page('Alpha');
        const tops = (await api.get_page_blocks_tree(FIXTURE_PAGE)) || [];
        const arr = Array.isArray(tops) ? tops : (tops?.children || []);
        for (const n of arr) {
          const u = n.uuid || n['block/uuid'];
          if (u && u !== pageUuid) { try { await api.remove_block(u); } catch {} }
        }
        await sleep(600);
        for (const b of BLOCKS) {
          try { await api.insert_batch_block(pageUuid, [b], { sibling: false }); }
          catch {
            try { await api.insert_block(pageUuid, b.content, { sibling: false }); }
            catch { try { await api.append_block_in_page(pageUuid, b.content, { sibling: false }); } catch {} }
          }
          await sleep(200);
        }
        const tree = await api.get_page_blocks_tree(FIXTURE_PAGE);
        const flat = [];
        const walk = ns => (ns || []).forEach(n => { flat.push(n); walk(n.children || n['block/children']); });
        walk(Array.isArray(tree) ? tree : [tree]);
        const target = flat.find(b => String(b.content || b.title || b['block/title'] || b.rawTitle || '').includes('Block with properties'));
        if (target) {
          for (const [k, v] of PROPS) {
            await api.upsert_block_property(target.uuid || target['block/uuid'], k, v);
            await sleep(250);
          }
        }
        return { ok: true, n: flat.length, log };
      } catch (e) { return { ok: false, err: String(e), log }; }
    },
    { FIXTURE_PAGE, BLOCKS, PROPS },
  );
  console.log(`seed ${tag}:`, JSON.stringify(r).slice(0, 200));
  return r.n || 0;
}
