// Seed the PixelParity fixture identically on master and LUI.
// Uses append_block_in_page for leaves (end-append → fixture order on both)
// and insert_block(parent, content, {sibling:false}) for children, so no
// reliance on insert_batch_block (which master's API rejects for
// #tag/[#A] content and which prepends differently).
// Usage: node seed3.mjs master|lui
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';
import { FIXTURE_PAGE, BLOCKS, PROPS } from './fixture.mjs';

const tag = process.argv[2] || 'master';
const url = tag === 'master' ? MASTER_URL : LUI_URL;
const { ctx, page } = await launch(tag);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 20000);

const waitMs = ms => page.waitForTimeout(ms);

// expose helpers to the page
const api = {
  get: n => page.evaluate(n => window.logseq.api.get_page(n), n),
  del: n => page.evaluate(n => window.logseq.api.delete_page(n), n),
  create: n => page.evaluate(n => window.logseq.api.create_page(n), n),
  append: (p, c) => page.evaluate(
    ([p, c]) => window.logseq.api.append_block_in_page(p, c, { sibling: false }), [p, c]),
  insertChild: (pu, c) => page.evaluate(
    ([pu, c]) => window.logseq.api.insert_block(pu, c, { sibling: false }), [pu, c]),
  prop: (b, k, v) => page.evaluate(
    ([b, k, v]) => window.logseq.api.upsert_block_property(b, k, v), [b, k, v]),
  tree: n => page.evaluate(n => window.logseq.api.get_page_blocks_tree(n), n),
};

const existing = await api.get(FIXTURE_PAGE);
if (existing) {
  await api.del(FIXTURE_PAGE);
  await waitMs(1500);
  // delete_page only recycles: the entity keeps its name and later name
  // lookups still resolve to the recycled node — purge it so create_page
  // produces a genuinely fresh page (not all builds expose this api)
  await page.evaluate(n => window.logseq.api.delete_recycled_page_permanently?.(n), FIXTURE_PAGE).catch(() => {});
  await waitMs(1000);
}
await api.create(FIXTURE_PAGE);
await waitMs(1500);
const p = await api.get(FIXTURE_PAGE);
const puuid = p.uuid;
console.log('page uuid', puuid);

// when delete/recycle semantics differ across builds the page can survive
// with old blocks — always clear every top-level block so reseeds are exact
{
  const t0 = await api.tree(puuid);
  const tops0 = Array.isArray(t0) ? t0 : (t0?.children || []);
  for (const n of tops0) {
    const u = n.uuid || n['block/uuid'];
    if (u) await page.evaluate(u => window.logseq.api.remove_block(u), u).catch(() => {});
    await waitMs(80);
  }
  if (tops0.length) console.log('cleared', tops0.length, 'stale top blocks');
}

const uuidOf = r => r?.uuid ?? r?.['block/uuid'] ?? r;

// append a leaf (or a parent), then insert children each as FIRST child
// in reverse so final order matches the fixture
async function emit(b, parentUuid) {
  let u;
  if (parentUuid) u = uuidOf(await api.insertChild(parentUuid, b.content));
  else u = uuidOf(await api.append(puuid, b.content));
  if (!u) console.log('  !! no uuid for', b.content.slice(0, 30));
  // reversed: each insert becomes the new first child
  const kids = b.children || [];
  for (let i = kids.length - 1; i >= 0; i--) await emit(kids[i], u);
  return u;
}

let propTarget = null;
for (const b of BLOCKS) {
  const u = await emit(b, null);
  if (b.content === 'Block with properties') propTarget = u;
  await waitMs(60);
}
if (propTarget) {
  for (const [k, v] of PROPS) await api.prop(propTarget, k, v);
}

// leading empty head block (create_page may seed one) — drop it
const tree = await api.tree(puuid);
const tops = Array.isArray(tree) ? tree : (tree?.children || []);
if (tops.length && !(tops[0].content || tops[0]['block/content'] || '').trim()) {
  const u0 = tops[0].uuid || tops[0]['block/uuid'];
  console.log('removing empty head', u0);
  await page.evaluate(u => window.logseq.api.remove_block(u), u0);
}

const t2 = await api.tree(puuid);
console.log('blocks:', JSON.stringify(t2).split('uuid').length - 1);
await ctx.close();
console.log('done', tag);
