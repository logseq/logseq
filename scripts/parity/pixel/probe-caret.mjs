// Click→caret hit-test parity: click at known character positions inside
// blocks and compare the outcome: entered-edit + raw caret offset, or
// navigation (hash change) for links/tags.
// Blocks are anchored by uuid (top-level index → blockid attr) so marker
// insertions can't break later probes; the marker is removed by restoring
// the snapshot content via update_block after each probe.
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';
import { FIXTURE_PAGE } from './fixture.mjs';

const side = process.argv[2] || 'lui';
const url = side === 'master' ? MASTER_URL : LUI_URL;
const wait = side === 'master' ? 12000 : 20000;

const { page, ctx } = await launch(side);
const dbg = [];
page.on('console', m => { const t = m.text(); if (t.includes('DBG')) dbg.push(t); });
// master build has no DBG lines; LUI only
const nav = async () => {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
  await page.goto(url + '#/page/PPFixture', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  await page.waitForSelector('.ls-block', { timeout: 15000 });
  await page.waitForTimeout(500);
};
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(wait);
await nav();

// snapshot top-level blocks: uuid + content (restore source for each probe)
const tops = await page.evaluate(async (name) => {
  const api = window.logseq.api;
  const tree = await api.get_page_blocks_tree(name);
  const tops = Array.isArray(tree) ? tree : (tree?.children || []);
  return tops.map(b => ({ uuid: b.uuid || b['block/uuid'], content: b.content || b.title || '' }));
}, FIXTURE_PAGE);
console.log('tops:', tops.length);

// probes: [top-level index, nth rendered char, label]
const probes = [
  [0, 10, 'plain-mid'],
  [0, 30, 'plain-later'],
  [1, 3, 'inside-bold'],
  [1, 15, 'inside-italic'],
  [2, 20, 'inside-code-span'],
  [3, 12, 'inside-page-ref-alpha'],
  [3, 35, 'inside-beta-page-ref'],
  [8, 6, 'inside-highlight'],
  [4, 8, 'inside-tag'],
  [22, 6, 'inside-cjk'],
];

const chr = '§';

const clickPoint = async ({ uuid, charIdx }) => page.evaluate(async ({ uuid, charIdx }) => {
  const blocks = [...document.querySelectorAll('.ls-block')];
  const b = blocks.find(e => e.getAttribute('blockid') === uuid || e.id === 'ls-block-' + uuid);
  if (!b) return { err: 'no block' };
  const r0 = b.getBoundingClientRect();
  if (!(r0.height > 10)) return { err: 'hidden' };
  const measure = () => {
    const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (!n.textContent.trim()) continue;
      // reveal-on-caret delimiters are not part of the rendered character
      // stream — skip them hidden or shown, so charIdx means rendered
      // characters on both read and edit surfaces
      if (n.parentElement?.closest('.ed-delim')) continue;
      if (n.parentElement && n.parentElement.getBoundingClientRect().width === 0) continue;
      nodes.push(n);
    }
    let remaining = charIdx, hit = null, hitOff = 0;
    for (const tn of nodes) {
      if (remaining <= tn.textContent.length) { hit = tn; hitOff = remaining; break; }
      remaining -= tn.textContent.length;
    }
    if (!hit) return { err: 'short' };
    const range = document.createRange();
    range.setStart(hit, Math.max(0, hitOff - 1));
    range.setEnd(hit, hitOff);
    return { hit, r: range.getBoundingClientRect() };
  };
  let m = measure();
  if (m.err) return m;
  let r = m.r;
  if (!r.width || !r.height) return { err: 'empty' };
  if (r.y < 60 || r.y > 740) m.hit.parentElement.scrollIntoView({ block: 'center' });
  // scroll triggers virtualization re-layout: re-measure until the rect is
  // stable across two frames — a stale point lands between blocks and the
  // click targets the list container, never reaching enter_edit
  for (let i = 0; i < 12; i++) {
    await new Promise(res => setTimeout(res, 150));
    const m2 = measure();
    if (m2.err) return m2;
    const r2 = m2.r;
    if (Math.abs(r2.x - r.x) < 0.5 && Math.abs(r2.y - r.y) < 0.5) {
      return { x: r2.x + r2.width / 2, y: r2.y + r2.height / 2 };
    }
    r = r2;
  }
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, warn: 'unstable' };
}, { uuid, charIdx });

const restore = async (uuid, content) => page.evaluate(
  async ([u, c]) => {
    try { await window.logseq.api.update_block(u, c); return 'ok'; }
    catch (e) { return String(e).slice(0, 120); }
  }, [uuid, content]);

const results = [];
for (const [idx, charIdx, name] of probes) {
  const blk = tops[idx];
  if (!blk) { results.push({ name, err: 'no top ' + idx }); continue; }
  const pt = await clickPoint({ uuid: blk.uuid, charIdx });
  if (pt.err) { results.push({ name, err: pt.err }); continue; }
  dbg.length = 0;
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(900);
  // lazy renders can shift layout between mousedown and click, retargeting
  // the gesture onto the list container (a real-app quirk also worth
  // knowing, but it is not what this probe measures). Once the editor is
  // open, re-measure and click again on the settled geometry.
  const st1 = await page.evaluate(() => !!document.querySelector('.block-editor'));
  const pt2 = await clickPoint({ uuid: blk.uuid, charIdx });
  if (!pt2.err && (Math.abs(pt2.x - pt.x) > 0.5 || Math.abs(pt2.y - pt.y) > 0.5 || !st1)) {
    // when the first click missed the block entirely (!st1), the layout has
    // now settled — retry on the re-measured point
    await page.mouse.click(pt2.x, pt2.y);
    await page.waitForTimeout(700);
  }
  const state = await page.evaluate(() => {
    const out = { hash: location.hash.slice(0, 60) };
    const ta = document.querySelector('textarea');
    out.editing = !!ta;
    // master's textarea holds the raw source; its caret x = element x +
    // padding + measured width of text before selectionStart
    if (ta && ta.selectionStart > 0 && ta.value) {
      out.start = ta.selectionStart;
      const cs = getComputedStyle(ta);
      const c2 = document.createElement('canvas').getContext('2d');
      c2.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const pre = ta.value.slice(0, ta.selectionStart).split('\n').pop();
      out.caretX = +(ta.getBoundingClientRect().x + parseFloat(cs.paddingLeft) + c2.measureText(pre).width).toFixed(1);
    }
    // LUI renders an .ed-caret bar at the model caret
    const caret = document.querySelector('.ed-caret');
    if (caret) { const r = caret.getBoundingClientRect(); out.caretX = +r.x.toFixed(1); out.caretY = +r.y.toFixed(1); }
    // and reanchors its hidden input at the model caret — the translate
    // offset (relative to .block-editor) is the model caret's px spot
    const be = document.querySelector('.block-editor');
    if (be && ta) {
      const t = (ta.getAttribute('style') || '').match(/translate\(([-\d.]+)px,([-\d.]+)px\)/);
      if (t) out.sinkX = +(be.getBoundingClientRect().x + parseFloat(t[1])).toFixed(1);
    }
    return out;
  });
  // type a marker char: its index in the raw/edited text = the raw caret
  // offset — directly comparable across implementations
  if (state.editing) {
    await page.keyboard.type(chr);
    await page.waitForTimeout(600);
    const ins = await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      if (ta && ta.value && ta.value.includes('§')) {
        return { idx: ta.value.indexOf('§'), src: ta.value.slice(0, 50) };
      }
      const ed = document.querySelector('.block-editor');
      if (ed) {
        const t = ed.textContent.replace(/​/g, '');
        return { idx: t.indexOf('§'), src: t.slice(0, 50) };
      }
      return { idx: -1 };
    });
    state.insIdx = ins.idx;
    state.insSrc = ins.src;
    // restore the snapshot content — removes the marker regardless of
    // pairing/commit behaviour (marker can't corrupt subsequent probes)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    const cur = await page.evaluate(async (u) => {
      const api = window.logseq.api;
      const b = await api.get_block(u);
      return String(b?.content || b?.title || '');
    }, blk.uuid);
    if (cur !== blk.content) {
      const rr = await restore(blk.uuid, blk.content);
      if (rr !== 'ok') state.restoreErr = rr;
      await page.waitForTimeout(500);
    }
  }
  results.push({ name, x: +pt.x.toFixed(1), ...state, dbg: dbg.filter(l => !l.includes('apply_focus entry')) });
  await nav(); // reset page + exit edit mode
}
console.log(JSON.stringify(results, null, 1));
await ctx.close();
process.exit(0);
