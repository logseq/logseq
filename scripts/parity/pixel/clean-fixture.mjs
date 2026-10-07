// Strip probe artifacts (marker chars committed into block text) from the
// PPFixture page so reseeds aren't needed after caret probes.
// Usage: node clean-fixture.mjs master|lui
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';
import { FIXTURE_PAGE } from './fixture.mjs';

const tag = process.argv[2] || 'lui';
const url = tag === 'master' ? MASTER_URL : LUI_URL;
const { page, ctx } = await launch(tag);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 14000 : 20000);

const r = await page.evaluate(async (name) => {
  const api = window.logseq.api;
  const tree = await api.get_page_blocks_tree(name);
  const flat = [];
  const walk = ns => (ns || []).forEach(n => { flat.push(n); walk(n.children || n['block/children']); });
  walk(Array.isArray(tree) ? tree : (tree?.children || []));
  const dirty = flat.filter(b => /[§]/.test(String(b.content || b.title || '')));
  const out = { dirty: dirty.length, fixed: 0, errs: [] };
  for (const b of dirty) {
    const u = b.uuid || b['block/uuid'];
    const c = String(b.content || b.title || '').replace(/§/g, '');
    try { await api.update_block(u, c); out.fixed++; }
    catch (e) { out.errs.push(String(e).slice(0, 80)); }
  }
  return out;
}, FIXTURE_PAGE);
console.log(tag, JSON.stringify(r));
await ctx.close();
