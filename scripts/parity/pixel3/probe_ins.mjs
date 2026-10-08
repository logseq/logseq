import { launch, MASTER_URL } from './lib3.mjs';
const { ctx, page } = await launch('master');
await page.goto(MASTER_URL + '#/page/ppfixture', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);
const r = await page.evaluate(async () => {
  const api = window.logseq.api;
  const p = await api.get_page('PPFixture');
  const out = [];
  for (const [i, c] of [
    'Tags #parity and #[[multi word tag]] inline.',
    'TODO Task alpha [#A]',
  ].entries()) {
    try {
      const b = await api.insert_block(p.uuid || 'PPFixture', c, { sibling: false });
      out.push('insert ok: ' + JSON.stringify(b).slice(0, 120));
    } catch (e) { out.push('insert fail: ' + String(e).slice(0, 120)); }
    await new Promise(r => setTimeout(r, 400));
  }
  const tree = await api.get_page_blocks_tree('PPFixture');
  const flat = [];
  const walk = ns => (ns || []).forEach(n => { flat.push(n); walk(n.children || n['block/children']); });
  walk(tree);
  out.push('LAST3: ' + JSON.stringify(flat.slice(-5).map(n => String(n.content || n.title || '').slice(0, 70))));
  return out;
});
console.log(r.join('\n'));
await ctx.close();
