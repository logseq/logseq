// Benchmark: LUI Logseq web UI vs Out web app — daily outliner ops.
// 5 runs per op, median reported. Same machine, same fixture sizes:
//   BenchSmall ~50 blocks (contains [[BenchBig]] link), BenchBig ~200 blocks.
//
// Run: node deps/ui/docs/perf-vs-out.mjs
// Requires: Out served at :8777 (python3 -m http.server 8777 in out/),
//           LUI static app served at :3013 (cd clj-e2e && bb serve --port 3013),
//           playwright + chromium installed.
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const OUT_URL = 'http://localhost:8777/app/web/index.html';
const LUI_URL = 'http://localhost:3013/index.html?rtc-test=true';
const OUT_CTX = '/tmp/pw-out';
const LUI_CTX = '/tmp/pw-lui2';
const RUNS = 5;

const APPS = {
  out: {
    name: 'Out',
    url: OUT_URL,
    ctxDir: OUT_CTX,
    rowSel: '.out-row',
    editorSel: '.out-editor',
    contentSel: '.out-dtext',
    linkSel: '.out-dline span.out-page-ref',
    bulletSel: '.out-bullet',
    paletteInputSel: '.out-palette-input',
    paletteItemSel: '.out-menu-item',
    bootWait: 4000,
  },
  lui: {
    name: 'LUI',
    url: LUI_URL,
    ctxDir: LUI_CTX,
    rowSel: '.ls-block',
    editorSel: '.editor-wrapper textarea',
    contentSel: '.block-content',
    linkSel: '.ls-block a.page-ref, .ls-block a.relative',
    bulletSel: 'a.block-control',
    paletteInputSel: '.cp__cmdk-search-input',
    paletteItemSel: '[data-cmdk-item]',
    bootWait: 9000,
  },
};

const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const fmt = (v) => (v == null ? '  -  ' : v.toFixed(0).padStart(6));

// ---------- generic rAF meter ----------
// Arms a one-shot listener for `event`; on first hit, stamps t0 and polls
// check(arg, pre) every rAF until true, stamping t1. pre is computed at
// arm time by preFn(arg).
async function armMeter(p, event, preSrc, checkSrc, arg) {
  await p.evaluate(
    ({ event, preSrc, checkSrc, arg }) => {
      window.__t0 = null;
      window.__t1 = null;
      const pre = new Function('arg', `return (${preSrc})(arg)`)(arg);
      const check = new Function('arg', 'pre', `return (${checkSrc})(arg, pre)`);
      const on = () => {
        document.removeEventListener(event, on, true);
        window.__t0 = performance.now();
        const loop = () => {
          try {
            if (check(arg, pre)) {
              window.__t1 = performance.now();
              return;
            }
          } catch {}
          if (performance.now() - window.__t0 < 30000) requestAnimationFrame(loop);
          else window.__t1 = -1;
        };
        requestAnimationFrame(loop);
      };
      document.addEventListener(event, on, true);
    },
    { event, preSrc, checkSrc, arg }
  );
}
async function readMeter(p, timeout = 30000) {
  try {
    await p.waitForFunction(() => window.__t1 !== null, null, { timeout });
  } catch {
    return null;
  }
  const r = await p.evaluate(() => (window.__t1 < 0 ? null : window.__t1 - window.__t0));
  return r;
}

// ---------- navigation helpers ----------
async function gotoPage(p, app, name) {
  // cmdk to a page by name (LUI and Out both have Cmd-K palettes)
  await p.keyboard.press('Meta+k');
  await p.waitForTimeout(app === APPS.out ? 700 : 1000);
  await p.keyboard.type(name, { delay: 15 });
  await p.waitForTimeout(app === APPS.out ? 700 : 1200);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(2500);
  // make sure the palette fully closed before continuing
  const overlay = app === APPS.out ? '.out-palette' : '.cp__cmdk__modal';
  for (let i = 0; i < 6 && (await p.locator(overlay).count()) > 0; i++) {
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
  }
}


// click the .block-content/.out-dtext of a titled block, choosing a visible
// (non-collapsed-branch, non-virtualized) instance
async function clickBlock(p, app, title) {
  const ok = await p.evaluate(
    ({ title, rowSel, isOut }) => {
      const els = [...document.querySelectorAll(rowSel)].filter(
        (e) =>
          (e.getAttribute('data-block-title') === title) ||
          ((e.querySelector('.out-dtext')?.innerText || '').trim() === title)
      );
      const vis = els.find(
        (e) => e.offsetParent !== null && !e.closest('[data-collapsed="true"]')
      );
      const el = vis || els[els.length - 1];
      if (!el) return false;
      const t = el.querySelector('.block-content, .out-dtext');
      if (!t) return false;
      t.scrollIntoView({ block: 'center' });
      t.click();
      return true;
    },
    { title, rowSel: app.rowSel, isOut: app === APPS.out }
  );
  return ok;
}

// ---------- benches ----------
async function benchColdLoad(app) {
  const samples = [];
  for (let i = 0; i < RUNS; i++) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-cold-'));
    // copy persistent profile so the seeded graph is present
    fs.cpSync(app.ctxDir, dir, { recursive: true });
    for (const n of fs.readdirSync(dir)) if (n.startsWith('Singleton')) fs.rmSync(path.join(dir, n), { force: true });
    const ctx = await chromium.launchPersistentContext(dir, {});
    const p = ctx.pages()[0] ?? (await ctx.newPage());
    const t0 = Date.now();
    await p.goto(app.url);
    try {
      await p.locator(app.rowSel).first().waitFor({ state: 'attached', timeout: 60000 });
      samples.push(Date.now() - t0);
    } catch {
      samples.push(null);
    }
    await ctx.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
  return samples;
}

async function benchNav(p, app, linkText, expectText) {
  // click [[link]] -> first row containing expectText rendered
  const samples = [];
  for (let i = 0; i < RUNS; i++) {
    await armMeter(
      p,
      'click',
      `arg => null`,
      `arg => document.querySelectorAll(arg.rowSel).length > arg.min`,
      { rowSel: app.rowSel, min: 150 }
    );
    const link = p.locator(`${app.linkSel}:has-text("${linkText}")`).first();
    if (!(await link.count())) return samples;
    await link.click();
    samples.push(await readMeter(p));
    await p.waitForTimeout(600);
    // navigate back
    await gotoPage(p, app, linkText === 'BenchBig' ? 'BenchSmall' : 'BenchBig');
  }
  return samples;
}

async function benchTyping(p, app) {
  // focus scratch block editor, append a char, measure keydown->DOM update
  const samples = [];
  const scratch = app === APPS.out ? '.out-add' : null;
  for (let i = 0; i < RUNS; i++) {
    if (scratch) {
      await p.locator(scratch).last().click();
      await p.locator('.out-editor').first().waitFor({ state: 'attached' }).catch(() => {});
      await p.waitForTimeout(200);
    } else {
      // LUI: click the scratch block 'bench-x' content
      await clickBlock(p, app, 'bench-x');
      await p.locator('.editor-wrapper textarea').first().waitFor({ state: 'attached' });
      await p.keyboard.press('End');
    }
    await p.locator(app.editorSel).first().waitFor({ state: 'attached' }).catch(() => {});
    await armMeter(
      p,
      'keydown',
      `arg => { const el = document.querySelector(arg.sel); return !!(el && (el.value ?? el.textContent).includes('z')); }`,
      `(arg, pre) => { const el = document.querySelector(arg.sel); return !pre && !!(el && (el.value ?? el.textContent).includes('z')); }`,
      { sel: app.editorSel }
    );
    await p.keyboard.press('z');
    samples.push(await readMeter(p));
    await p.keyboard.press('Backspace');
    await p.waitForTimeout(300);
    if (scratch) await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
  }
  return samples;
}

async function benchEnter(p, app) {
  const samples = [];
  for (let i = 0; i < RUNS; i++) {
    // ensure editing on the scratch block
    if (app === APPS.out) {
      await p.locator('.out-add').last().click();
      await p.locator('.out-editor').first().waitFor({ state: 'attached' });
      await p.keyboard.type('enter-bench', { delay: 10 });
      await p.waitForTimeout(300);
    } else {
      await clickBlock(p, app, 'bench-x');
      await p.locator('.editor-wrapper textarea').first().waitFor({ state: 'attached' });
      await p.keyboard.press('End');
    }
    await armMeter(
      p,
      'keydown',
      `arg => document.activeElement`,
      `(arg, pre) => { const el = document.activeElement; return el && el !== pre && (el.value !== undefined || el.classList.contains('out-editor')); }`,
      null
    );
    await p.keyboard.press('Enter');
    samples.push(await readMeter(p));
    await p.waitForTimeout(300);
    // remove the freshly created empty block (Backspace on empty block deletes it)
    await p.keyboard.press('Backspace');
    await p.waitForTimeout(300);
    if (app === APPS.out) await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
  }
  return samples;
}

async function indentRowSel(app, title) {
  if (app === APPS.out) {
    return `[...document.querySelectorAll('.out-row')].find(e => { const first = e.querySelector(':scope > .out-lines')?.children[0]; if (!first) return false; const t = ((first.querySelector('.out-dtext')?.innerText) ?? (first.querySelector('.out-editor')?.textContent) ?? '').trim(); return t === '${title}'; })`;
  }
  return `document.querySelector('.ls-block[data-block-title="${title}"]')`;
}

async function benchIndent(p, app, title) {
  // Tab then Shift-Tab on target block while editing; measure depth change
  const samples = { indent: [], outdent: [] };
  const metric =
    app === APPS.out
      ? `(el) => el.style.paddingInline`
      : `(el) => el.getAttribute('level')`;
  const snap = async () =>
    p.evaluate(
      ({ sel, editorSel, metricSrc }) => {
        const m = new Function('el', `return (${metricSrc})(el)`);
        const el = document.querySelector(editorSel)?.closest(sel);
        return el ? m(el) : null;
      },
      { sel: app.rowSel, editorSel: app.editorSel, metricSrc: metric }
    );
  for (let i = 0; i < RUNS; i++) {
    await clickBlock(p, app, title);
    await p.locator(app.editorSel).first().waitFor({ state: 'attached', timeout: 15000 });
    await p.waitForTimeout(300);
    const preIndent = await snap();
    await armMeter(
      p,
      'keydown',
      `arg => arg.pre`,
      `arg => { const el = document.querySelector(arg.editorSel)?.closest(arg.sel); return el && (${metric})(el) !== pre; }`,
      { sel: app.rowSel, editorSel: app.editorSel, pre: preIndent }
    );
    await p.keyboard.press('Tab');
    samples.indent.push(await readMeter(p));
    await p.waitForTimeout(400);
    const preOut = await snap();
    await armMeter(
      p,
      'keydown',
      `arg => arg.pre`,
      `arg => { const el = document.querySelector(arg.editorSel)?.closest(arg.sel); return el && (${metric})(el) !== pre; }`,
      { sel: app.rowSel, editorSel: app.editorSel, pre: preOut }
    );
    await p.keyboard.press('Shift+Tab');
    samples.outdent.push(await readMeter(p));
    await p.waitForTimeout(400);
    if (app === APPS.out) await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
  }
  return samples;
}

async function benchCollapse(p, app) {
  // expand the first childed row if needed, then measure chevron click ->
  // children hidden (row count drops); expand again to restore
  const samples = [];
  const findExpanded = ({ sel }) =>
    [...document.querySelectorAll(sel)].find(
      (e) =>
        (e.getAttribute('haschild') === 'true' &&
          e.getAttribute('data-block-title') &&
          e.getAttribute('data-collapsed') !== 'true') ||
        e.querySelector(':scope > .out-bullet.out-kids:not(.out-collapsed)')
    );
  const findAny = ({ sel }) =>
    [...document.querySelectorAll(sel)].find(
      (e) =>
        (e.getAttribute('haschild') === 'true' &&
          e.getAttribute('data-block-title')) ||
        e.querySelector(':scope > .out-bullet.out-kids')
    );
  const clickEl = (elExpr) =>
    p.evaluate(
      ({ sel, bullet, elSrc }) => {
        const find = new Function('arg', `return (${elSrc})(arg)`);
        const el = find({ sel });
        el?.querySelector(bullet)?.click();
      },
      { sel: app.rowSel, bullet: app.bulletSel, elSrc: elExpr }
    );
  for (let i = 0; i < RUNS; i++) {
    // ensure some childed row is expanded
    let hasExpanded = await p.evaluate(
      ({ sel, elSrc }) => !!new Function('arg', `return (${elSrc})(arg)`)({ sel }),
      { sel: app.rowSel, elSrc: findExpanded.toString() }
    );
    if (!hasExpanded) {
      await clickEl(findAny.toString());
      await p.waitForTimeout(500);
    }
    await armMeter(
      p,
      'click',
      `arg => document.querySelectorAll(arg.sel).length`,
      `arg => document.querySelectorAll(arg.sel).length < pre`,
      { sel: app.rowSel }
    );
    await clickEl(findExpanded.toString());
    samples.push(await readMeter(p));
    await p.waitForTimeout(400);
    await clickEl(findAny.toString()); // re-expand (unmeasured)
    await p.waitForTimeout(400);
  }
  return samples;
}

async function benchPalette(p, app) {
  // Cmd-K -> palette input visible; then type query -> first result item
  const open = [];
  const query = [];
  for (let i = 0; i < RUNS; i++) {
    await armMeter(
      p,
      'keydown',
      `arg => null`,
      `arg => { const el = document.querySelector(arg.sel); return el && el.offsetParent !== null; }`,
      { sel: app.paletteInputSel }
    );
    await p.keyboard.press('Meta+k');
    open.push(await readMeter(p));
    await p.waitForTimeout(300);
    await armMeter(
      p,
      'keydown',
      `arg => null`,
      `arg => [...document.querySelectorAll(arg.sel)].some(e => (e.innerText||'').toLowerCase().includes('bench'))`,
      { sel: app.paletteItemSel }
    );
    await p.keyboard.press('b');
    query.push(await readMeter(p));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
    const overlay = app === APPS.out ? '.out-palette' : '.cp__cmdk__modal';
    for (let i = 0; i < 4 && (await p.locator(overlay).count()) > 0; i++) {
      await p.keyboard.press('Escape');
      await p.waitForTimeout(300);
    }
  }
  return { open, query };
}

async function benchScroll(p, app) {
  // smooth-step scroll to bottom of the 200-block page; longtask stats
  const times = [];
  const longs = [];
  const tbts = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await p.evaluate(async () => {
      let long = 0;
      let tbt = 0;
      const obs = new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          long++;
          tbt += e.duration - 50;
        }
      });
      obs.observe({ entryTypes: ['longtask'] });
      let el = document.scrollingElement;
      if (el.scrollHeight <= innerHeight + 10) {
        el = [...document.querySelectorAll('*')]
          .filter((e) => e.clientHeight > 200 && e.scrollHeight > e.clientHeight + 100)
          .sort((a, b) => b.scrollHeight - a.scrollHeight)[0] || el;
      }
      el.scrollTop = 0;
      await new Promise((r) => requestAnimationFrame(r));
      const t0 = performance.now();
      let frames = 0;
      while (el.scrollTop < el.scrollHeight - innerHeight - 10 && performance.now() - t0 < 30000) {
        el.scrollTop += 250;
        await new Promise((r) => requestAnimationFrame(r));
        frames++;
      }
      await new Promise((r) => setTimeout(r, 200));
      obs.disconnect();
      return { ms: performance.now() - t0, long, tbt, frames };
    });
    times.push(r.ms);
    longs.push(r.long);
    tbts.push(r.tbt);
    await p.evaluate(() => (document.scrollingElement.scrollTop = 0));
    await p.waitForTimeout(400);
  }
  return { times, longs, tbts };
}

// ---------- driver ----------
async function runApp(app, results) {
  const ctx = await chromium.launchPersistentContext(app.ctxDir, {});
  const p = ctx.pages()[0] ?? (await ctx.newPage());
  p.setDefaultTimeout(30000);
  p.on('pageerror', (e) => console.log(`[${app.name}] PE:`, String(e).slice(0, 150)));
  await p.goto(app.url);
  await p.waitForTimeout(app.bootWait);

  // --- typing/enter benches run on BenchSmall (50 blocks)
  await gotoPage(p, app, 'BenchSmall');
  // ensure scratch block 'bench-x' exists on BenchSmall for LUI typing test
  const fixtureTitles = ['bench-x', 'indent-me'];
  const body0 = await p.evaluate(() => document.body.innerText);
  const missing = fixtureTitles.filter((t) => !body0.includes(t));
  if (app === APPS.lui && missing.length) {
    await p.evaluate((lines) => {
      const dt = new DataTransfer();
      dt.setData('text/plain', lines.join('\n'));
      document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
    }, missing);
    await p.waitForTimeout(1500);
  } else if (missing.length) {
    for (const t of missing) {
      await p.locator('.out-add').last().click();
      await p.locator('.out-editor').first().waitFor({ state: 'attached' }).catch(() => {});
      await p.keyboard.type(t, { delay: 40 });
      await p.keyboard.press('Escape');
      await p.waitForTimeout(400);
    }
  }
  results[app.name].typing = await benchTyping(p, app);
  results[app.name].enter = await benchEnter(p, app);
  results[app.name].indent = await benchIndent(p, app, 'indent-me');
  results[app.name].collapse = await benchCollapse(p, app);
  results[app.name].palette = await benchPalette(p, app);
  results[app.name].nav = await benchNav(p, app, 'BenchBig', 'big 1');
  // scroll on BenchBig (200 blocks)
  await gotoPage(p, app, 'BenchBig');
  await p.evaluate(() => (document.scrollingElement.scrollTop = 0));
  await p.waitForTimeout(500);
  results[app.name].scroll = await benchScroll(p, app);
  await ctx.close();
}

const results = { Out: {}, LUI: {} };
if (process.env.BENCH_COLD !== '0') {
  console.log('== cold load ==');
  results.Out.cold = await benchColdLoad(APPS.out);
  results.LUI.cold = await benchColdLoad(APPS.lui);
console.log('out cold', results.Out.cold.map((x) => x && x.toFixed(0)).join(','));
console.log('lui cold', results.LUI.cold.map((x) => x && x.toFixed(0)).join(','));
}

for (const app of [APPS.out, APPS.lui]) {
  console.log(`== ${app.name} ops ==`);
  await runApp(app, results);
  console.log(app.name, JSON.stringify(
    Object.fromEntries(
      Object.entries(results[app.name]).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.map((x) => x && Math.round(x)) : v,
      ])
    )
  ));
}

// ---------- report ----------
const rows = [
  ['Cold load → first block', 'cold'],
  ['Nav [[link]] click → first row', 'nav'],
  ['Typing keydown → DOM update', 'typing'],
  ['Enter → new block editable', 'enter'],
  ['Indent (Tab)', 'indent.indent'],
  ['Outdent (Shift-Tab)', 'indent.outdent'],
  ['Collapse (chevron click)', 'collapse'],
  ['Palette open (Cmd-K)', 'palette.open'],
  ['Palette query → first results', 'palette.query'],
  ['Scroll 200-block page (ms)', 'scroll.times'],
  ['Scroll long tasks (count)', 'scroll.longs'],
  ['Scroll total blocking (ms)', 'scroll.tbts'],
];
const get = (o, path) => path.split('.').reduce((a, k) => a?.[k], o);
let md = '| Metric | Out (median) | LUI (median) |\n|---|---:|---:|\n';
for (const [label, key] of rows) {
  const a = get(results.Out, key);
  const b = get(results.LUI, key);
  md += `| ${label} | ${fmt(med(a ?? [null]))} | ${fmt(med(b ?? [null]))} |\n`;
}
console.log('\n' + md);
fs.writeFileSync('/tmp/perf-results.json', JSON.stringify(results, null, 2));
fs.writeFileSync('/tmp/perf-table.md', md);
