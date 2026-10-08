// Seed PPFixture into an app idempotently (clears existing top-level blocks,
// keeps the page), dump block count. Usage: node seed3.mjs <master|lui>
import fs from 'node:fs';
import { launch, MASTER_URL, LUI_URL } from './lib3.mjs';
import { FIXTURE_PAGE, BLOCKS, PROPS } from './fixture.mjs';

const tag = process.argv[2] || 'lui';
const url = tag === 'master' ? MASTER_URL : LUI_URL;
const { ctx, page } = await launch(tag);
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0, 200)));
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 16000);

const log = await page.evaluate(
  async ({ FIXTURE_PAGE, BLOCKS, PROPS }) => {
    const api = window.logseq.api;
    const log = [];
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const flatOf = async () => {
      const tree = await api.get_page_blocks_tree(FIXTURE_PAGE);
      const flat = [];
      const walk = ns => (ns || []).forEach(n => { flat.push(n); walk(n.children || n['block/children']); });
      walk(Array.isArray(tree) ? tree : (tree?.children || tree ? [tree] : []));
      return flat;
    };
    try {
      let p = await api.get_page(FIXTURE_PAGE);
      if (!p) { p = await api.create_page(FIXTURE_PAGE); log.push('created page'); }
      const pageUuid = p && (p.uuid || p['block/uuid'] || p.id);
      log.push('page uuid: ' + pageUuid);
      // ensure Alpha exists (page-ref target)
      const Alpha = await api.get_page('Alpha');
      if (!Alpha) { await api.create_page('Alpha'); log.push('created Alpha'); }
      // clear existing top-level blocks (deleting the page orphans children)
      const tops = (await api.get_page_blocks_tree(FIXTURE_PAGE)) || [];
      const arr = Array.isArray(tops) ? tops : (tops?.children || []);
      for (const n of arr) {
        const u = n.uuid || n['block/uuid'];
        if (u && u !== pageUuid) {
          try { await api.remove_block(u); } catch (e) { log.push('rm ' + String(u).slice(0,8) + ': ' + String(e).slice(0,60)); }
        }
      }
      if (arr.length) { log.push('cleared ' + arr.length + ' stale blocks'); await sleep(600); }
      for (let i = 0; i < BLOCKS.length; i++) {
        const b = BLOCKS[i];
        const label = (b.content || '').slice(0, 32).replace(/\n/g, ' ');
        try {
          await api.insert_batch_block(pageUuid, [b], { sibling: false });
          log.push(`${i} batch   ${label}`);
        } catch (e) {
          try {
            await api.insert_block(pageUuid, b.content, { sibling: false });
            log.push(`${i} insert  ${label} (batch: ${String(e).slice(0, 60)})`);
          } catch (e2) {
            try {
              await api.append_block_in_page(pageUuid, b.content, { sibling: false });
              log.push(`${i} append  ${label} (insert: ${String(e2).slice(0, 50)})`);
            } catch (e3) {
              log.push(`${i} FAIL    ${label} :: ${String(e3).slice(0, 90)}`);
            }
          }
        }
        await sleep(220);
      }
      const flat = await flatOf();
      const target = flat.find(b => String(b.content || b.title || b['block/title'] || b.rawTitle || '').includes('Block with properties'));
      if (target) {
        for (const [k, v] of PROPS) {
          await api.upsert_block_property(target.uuid || target['block/uuid'], k, v);
          await sleep(300);
        }
        log.push('props ok');
      } else log.push('props target NOT FOUND');
      log.push('tree blocks: ' + flat.length);
      const titles = flat.map(n => String(n.content || n.title || n['block/title'] || n.rawTitle || '').slice(0, 60));
      return { log, titles };
    } catch (e) { log.push('FAIL: ' + String(e).slice(0, 200)); return { log, titles: [] }; }
  },
  { FIXTURE_PAGE, BLOCKS, PROPS },
);
console.log(log.log.join('\n'));
fs.writeFileSync(`/Users/devin/parity-work/tree-${tag}.json`, JSON.stringify(log.titles, null, 1));
await ctx.close();
