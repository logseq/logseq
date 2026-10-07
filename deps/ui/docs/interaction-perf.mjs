// Interaction latency bench for the LUI web UI: per-op stage breakdown.
// For each op it records (a) event->visible-DOM-change ms via an rAF meter,
// (b) __uiPerf stage samples (dispatch/send/flush/apply/virt/focus, patch ops,
// signal rounds/effects) emitted by js_app/main.ml instrumentation,
// (c) __navEvents marks (worker invoke/done + router stages).
//
// Run: node docs/interaction-perf.mjs
// Requires: static app served (node scripts/serve-static.mjs 3013),
//           playwright installed, fixture graph seeded (BenchSmall ~50 blocks
//           with 'bench-x', 'indent-me', 'fold-me' + [[BenchBig]] link;
//           BenchBig ~200 blocks) — see seeding note in interaction-perf.md.
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL_ = 'http://localhost:3013/index.html?rtc-test=true';
const CTX = '/tmp/pw-lui-perf';
const RUNS = Number(process.env.RUNS || 5);
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] || null;
const rnd = (v) => (v == null ? null : +v.toFixed(1));

// ---------- collectors ----------
async function clearBufs(p) {
  await p.evaluate(() => {
    window.__uiPerf = [];
    window.__navEvents = [];
    window.__t0 = null;
    window.__t1 = null;
  });
}
async function collect(p) {
  return p.evaluate(() => ({
    perf: window.__uiPerf || [],
    nav: window.__navEvents || [],
    raf: window.__t1 != null && window.__t1 > 0 ? window.__t1 - window.__t0 : null,
  }));
}
function sumStages(perf) {
  const acc = { dispatch: 0, send: 0, flush: 0, apply: 0, virt: 0, focus: 0, ops: 0, sigRounds: 0, sigEffects: 0, n: 0 };
  for (const s of perf) {
    acc.dispatch += s.dispatch || 0;
    acc.send += s.send || 0;
    acc.flush += s.flush || 0;
    acc.apply += s.apply || 0;
    acc.virt += s.virt || 0;
    acc.focus += s.focus || 0;
    acc.ops += s.ops || 0;
    acc.sigRounds += s.sig_rounds || 0;
    acc.sigEffects += s.sig_effects || 0;
    acc.n++;
  }
  return acc;
}
function invokeSpans(nav) {
  const open = {};
  const spans = [];
  for (const [name, t] of nav) {
    if (name.startsWith('invoke:')) open[name.slice(7)] = t;
    else if (name.startsWith('done:')) {
      const k = name.slice(5);
      if (open[k] != null) { spans.push({ name: k, ms: t - open[k] }); delete open[k]; }
    }
  }
  return spans;
}

async function armMeter(p, event, checkSrc, arg) {
  await p.evaluate(({ event, checkSrc, arg }) => {
    window.__t0 = null;
    window.__t1 = null;
    const check = new Function('arg', `return (${checkSrc})(arg)`);
    const on = (e) => {
      document.removeEventListener(event, on, true);
      window.__t0 = performance.now();
      const loop = () => {
        try { if (check(arg)) { window.__t1 = performance.now(); return; } } catch {}
        if (performance.now() - window.__t0 < 20000) requestAnimationFrame(loop);
        else window.__t1 = -1;
      };
      requestAnimationFrame(loop);
    };
    document.addEventListener(event, on, true);
  }, { event, checkSrc, arg });
}

// ---------- page helpers ----------
async function gotoPage(p, name) {
  const cur = await p.evaluate(() => document.querySelector('.ls-block')?.getAttribute('data-block-title') || '');
  if (cur === name) return;
  await p.keyboard.press('Meta+k');
  await p.waitForTimeout(1200);
  await p.keyboard.type(name, { delay: 20 });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(2500);
  const overlay = '.cp__cmdk__modal';
  for (let i = 0; i < 6 && (await p.locator(overlay).count()) > 0; i++) {
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
  }
}

const titles = (p) =>
  p.evaluate(() => [...document.querySelectorAll('.ls-block')].map(e => e.getAttribute('data-block-title')));

async function clickBlock(p, title) {
  return p.evaluate((title) => {
    const els = [...document.querySelectorAll('.ls-block')].filter(
      (e) => {
        const t0 = e.getAttribute('data-block-title');
        return t0 === title || (t0 || '').startsWith(title) ||
          (e.querySelector('.block-content')?.innerText || '').trim() === title;
      }
    );
    const vis = els.find((e) => e.offsetParent !== null && !e.closest('[data-collapsed="true"]'));
    const el = vis || els[els.length - 1];
    if (!el) return false;
    const t = el.querySelector('.block-content');
    if (!t) return false;
    t.scrollIntoView({ block: 'center' });
    t.click();
    return true;
  }, title);
}

// editor-focused click target: 'bench-x' is the scratch block
async function enterEdit(p, title = 'bench-x') {
  for (let i = 0; i < 3; i++) {
    if (await clickBlock(p, title)) break;
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(600);
}

async function resetIndent(p) {
  const level = await p.evaluate(() => {
    const els = [...document.querySelectorAll('.ls-block')].filter(
      (e) => e.getAttribute('data-block-title') === 'indent-me');
    return Number(els[0]?.getAttribute('level') || 0);
  });
  for (let i = 0; i < level; i++) {
    await enterEdit(p, 'indent-me');
    await p.keyboard.press('Shift+Tab');
    await p.waitForTimeout(900);
  }
}

// ---------- ops ----------
const OPS = [
  {
    name: 'click-to-edit',
    event: 'click',
    check: `arg => !!document.querySelector('.editor-wrapper textarea')`,
    do: async (p) => { await clickBlock(p, 'bench-x'); },
    settle: 900,
    after: async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(300); },
  },
  {
    name: 'type-char',
    event: 'keydown',
    check: `arg => (document.querySelector('.editor-wrapper textarea')?.value.length || 0) > arg.len`,
    argFn: async (p) => ({ len: await p.evaluate(() => document.querySelector('.editor-wrapper textarea')?.value.length || 0) }),
    before: async (p) => { await enterEdit(p, 'bench-x'); },
    do: async (p) => { await p.keyboard.press('x'); },
    settle: 700,
    after: async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(300); },
  },
  {
    name: 'enter-new-block',
    event: 'keydown',
    check: `arg => document.querySelectorAll('.ls-block').length > arg.blocks0`,
    argFn: async (p) => ({ blocks0: await p.evaluate(() => document.querySelectorAll('.ls-block').length) }),
    before: async (p) => { await enterEdit(p, 'bench-x'); },
    do: async (p) => { await p.keyboard.press('Enter'); },
    settle: 1500,
    after: async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(300); },
  },
  {
    name: 'escape-editor',
    event: 'keydown',
    check: `arg => !document.querySelector('.editor-wrapper textarea')`,
    before: async (p) => { await enterEdit(p, 'bench-x'); },
    do: async (p) => { await p.keyboard.press('Escape'); },
    settle: 800,
  },
  {
    name: 'indent-tab',
    event: 'keydown',
    check: `arg => Number([...document.querySelectorAll('.ls-block')].find(e => e.getAttribute('data-block-title') === 'indent-me')?.getAttribute('level') || 0) > arg.lv`,
    argFn: async (p) => ({ lv: await p.evaluate(() => Number([...document.querySelectorAll('.ls-block')].find(e => e.getAttribute('data-block-title') === 'indent-me')?.getAttribute('level') || 0)) }),
    before: async (p) => { await resetIndent(p); await enterEdit(p, 'indent-me'); },
    do: async (p) => { await p.keyboard.press('Tab'); },
    settle: 1400,
    after: async (p) => { await p.keyboard.press('Escape'); await resetIndent(p); },
  },
  {
    name: 'outdent-shift-tab',
    event: 'keydown',
    before: async (p) => { await resetIndent(p); await enterEdit(p, 'indent-me'); await p.keyboard.press('Tab'); await p.waitForTimeout(1200); },
    do: async (p) => { await p.keyboard.press('Shift+Tab'); },
    settle: 1400,
    after: async (p) => { await p.keyboard.press('Escape'); await resetIndent(p); },
  },
  {
    name: 'fold-toggle',
    event: 'keydown',
    check: `arg => document.querySelector('[data-block-title="fold-me"]')?.getAttribute('data-collapsed') === 'true'`,
    before: async (p) => { await clickBlock(p, 'fold-me'); await p.waitForTimeout(700); },
    do: async (p) => { await p.keyboard.press('Meta+;'); },
    settle: 1200,
    after: async (p) => {
      const c = await p.evaluate(() => document.querySelector('[data-block-title="fold-me"]')?.getAttribute('data-collapsed'));
      if (c === 'true') { await clickBlock(p, 'fold-me'); await p.waitForTimeout(500); await p.keyboard.press('Meta+;'); await p.waitForTimeout(700); }
    },
  },
  {
    name: 'nav-page-ref',
    event: 'click',
    check: `arg => document.querySelector('.ls-block')?.getAttribute('data-block-title') === 'BenchBig'`,
    do: async (p) => { await p.locator('.ls-block a', { hasText: 'BenchBig' }).first().click(); await p.mouse.move(700, 60); },
    settle: 2500,
    after: async (p) => { await gotoPage(p, 'BenchSmall'); },
  },
  {
    name: 'sidebar-toggle',
    event: 'click',
    check: `arg => !document.querySelector('.cp__sidebar-left-layout') || document.querySelector('.cp__sidebar-left-layout')?.offsetParent === null`,
    do: async (p) => { await p.locator('#left-menu').click(); },
    settle: 1200,
    after: async (p) => {
      const v = await p.evaluate(() => document.querySelector('.cp__sidebar-left-layout')?.offsetParent !== null);
      if (!v) { await p.locator('#left-menu').click(); await p.waitForTimeout(800); }
    },
  },
  {
    name: 'cmdk-open',
    event: 'keydown',
    check: `arg => !!document.querySelector('.cp__cmdk-search-input')`,
    do: async (p) => { await p.keyboard.press('Meta+k'); },
    settle: 900,
    after: async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(500); },
  },
  {
    name: 'cmdk-query',
    event: 'input',
    check: `arg => document.querySelectorAll('[data-cmdk-item]').length > 0`,
    before: async (p) => { await p.keyboard.press('Meta+k'); await p.waitForTimeout(900); },
    do: async (p) => { await p.keyboard.type('big', { delay: 20 }); },
    settle: 1400,
    after: async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(500); },
  },
  {
    name: 'cmdk-pick',
    event: 'keydown',
    check: `arg => !document.querySelector('.cp__cmdk-search-input')`,
    before: async (p) => { await p.keyboard.press('Meta+k'); await p.waitForTimeout(900); await p.keyboard.type('BenchBig', { delay: 20 }); await p.waitForTimeout(1200); },
    do: async (p) => { await p.keyboard.press('Enter'); },
    settle: 2500,
    after: async (p) => { await gotoPage(p, 'BenchSmall'); },
  },
  {
    name: 'ctx-menu',
    event: 'contextmenu',
    check: `arg => document.querySelectorAll('.lui-popup-portal [role=menu], .lui-popup-portal .menu, [role=menu]').length > 0`,
    before: async (p) => {
      await p.evaluate(() => {
        const el = [...document.querySelectorAll('.ls-block')].find(
          (e) => (e.getAttribute('data-block-title') || '').startsWith('bench-x'));
        el?.scrollIntoView({ block: 'center' });
      });
    },
    do: async (p) => {
      const el = p.locator('.ls-block[data-block-title^="bench-x"] .bullet-container').first();
      const box = await el.boundingBox();
      if (box) {
        await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
      }
    },
    settle: 1200,
    after: async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(400); },
  },
  {
    name: 'set-property-dialog',
    event: 'click',
    check: `arg => document.querySelectorAll('[role=dialog], .cp__overlays [class*=dialog], .lui-popup-portal > *').length > 0`,
    before: async (p) => {
      const el = p.locator('.ls-block[data-block-title^="bench-x"] .bullet-container').first();
      const box = await el.boundingBox();
      if (box) {
        await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
      }
      await p.waitForTimeout(900);
    },
    do: async (p) => { const btn = p.locator('text=Set property').first(); if (await btn.count()) await btn.click(); },
    settle: 1500,
    after: async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(500); },
  },
  {
    name: 'scroll-big-page',
    event: 'wheel',
    check: `arg => document.scrollingElement.scrollTop > arg.y0 + 2000`,
    argFn: async (p) => ({ y0: await p.evaluate(() => document.scrollingElement.scrollTop) }),
    before: async (p) => { await gotoPage(p, 'BenchBig'); await p.waitForTimeout(1000); },
    do: async (p) => { for (let i = 0; i < 30; i++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(16); } },
    settle: 800,
    after: async (p) => { await gotoPage(p, 'BenchSmall'); },
  },
];

// ---------- fixture seed ----------
async function ensureFixtures(p) {
  const t = await titles(p);
  const need = ['bench-x', 'indent-me', 'fold-me'];
  for (const n of need) {
    if (!t.includes(n)) {
      await p.evaluate((n) => window.logseq.api.append_block_in_page('BenchSmall', n, {}), n);
      await p.waitForTimeout(600);
    }
  }
  // fold-me must have a child
  const fid = await p.evaluate(() => {
    const el = [...document.querySelectorAll('.ls-block')].find(e => e.getAttribute('data-block-title') === 'fold-me');
    return el?.getAttribute('haschild') === 'true' ? null : el?.getAttribute('blockid');
  });
  if (fid) {
    await p.evaluate((id) => window.logseq.api.append_block_in_page(id, 'fold child', {}), fid);
    await p.waitForTimeout(800);
  }
}

// ---------- driver ----------
const ctx = await chromium.launchPersistentContext(CTX, { viewport: { width: 1440, height: 900 } });
const p = ctx.pages()[0] ?? (await ctx.newPage());
p.setDefaultTimeout(20000);
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto(URL_);
await p.waitForTimeout(10000);
await gotoPage(p, 'BenchSmall');
await ensureFixtures(p);
console.log('blocks on BenchSmall:', await p.evaluate(() => document.querySelectorAll('.ls-block').length));

const results = {};
for (const op of OPS) {
  results[op.name] = { runs: [] };
  for (let i = 0; i < RUNS; i++) {
    try {
      await gotoPage(p, op.name === 'scroll-big-page' ? 'BenchSmall' : 'BenchSmall');
      if (op.before) await op.before(p);
      await clearBufs(p);
      const arg = op.argFn ? await op.argFn(p) : {};
      if (!op.skipCheck) await armMeter(p, op.event, op.check || `arg => (window.__uiPerf?.length || 0) > 0`, arg);
      await op.do(p);
      await p.waitForTimeout(op.settle || 900);
      const c = await collect(p);
      results[op.name].runs.push({
        raf: rnd(c.raf),
        stages: sumStages(c.perf),
        invokes: invokeSpans(c.nav),
        navMarks: c.nav.filter(([n]) => !n.startsWith('invoke:') && !n.startsWith('done:')),
        sampleCount: c.perf.length,
      });
      if (op.after) await op.after(p);
    } catch (e) {
      console.log(`[${op.name}] run ${i} failed:`, String(e).slice(0, 160));
      if (op.after) await op.after(p).catch(() => {});
      await gotoPage(p, 'BenchSmall').catch(() => {});
    }
  }
  const rs = results[op.name].runs;
  const tot = (r) => r.stages.dispatch + r.stages.send + r.stages.flush + r.stages.apply + r.stages.virt + r.stages.focus;
  results[op.name].median = {
    raf: rnd(med(rs.map((r) => r.raf))),
    total_ocaml: rnd(med(rs.map(tot))),
    flush: rnd(med(rs.map((r) => r.stages.flush))),
    apply: rnd(med(rs.map((r) => r.stages.apply))),
    ops: med(rs.map((r) => r.stages.ops)),
    sigEffects: med(rs.map((r) => r.stages.sigEffects)),
    samples: med(rs.map((r) => r.sampleCount)),
    workerMs: rnd(med(rs.map((r) => r.invokes.reduce((a, s) => a + s.ms, 0)))),
  };
  console.log(op.name.padEnd(20), JSON.stringify(results[op.name].median));
}

fs.writeFileSync('/tmp/interaction-perf.json', JSON.stringify(results, null, 1));
console.log('wrote /tmp/interaction-perf.json');
await ctx.close();
