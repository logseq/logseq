// Post-fix verification: viewport coverage during a fast scroll sweep
// (white-gap detector), frame jank, blank-state nav, journals paging.
// Numeric coverage = fraction of scroll viewport covered by rendered
// [data-index] rows, sampled immediately after each jump (no settle).
import { chromium } from 'playwright';
import fs from 'node:fs';

const CTX = process.env.HOME + '/pw-virt-probe';
const URL_ = 'http://localhost:3013/index.html?rtc-test=true&virtualized=true';
const OUT = '/tmp/virt-verify';
fs.mkdirSync(OUT, { recursive: true });

const ctx = await chromium.launchPersistentContext(CTX, {
  viewport: { width: 1440, height: 900 },
});
const p = ctx.pages()[0] ?? (await ctx.newPage());
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));

await p.goto(URL_);
await p.waitForFunction(() => window.logseq?.api);
await p.waitForTimeout(8000);
const uuid = await p.evaluate(async () => {
  const pg = await window.logseq.api.get_page('VirtProbe');
  return pg && (pg.uuid || pg['block/uuid']);
});
await p.evaluate((u) => (location.hash = '#/page/' + u), uuid);
await p.waitForTimeout(4000);

// coverage in-page: fraction of scroller viewport height covered by rows
const sweep = () =>
  p.evaluate(async () => {
    const sc = document.getElementById('main-content-container');
    const rows = () =>
      [...document.querySelectorAll('.ls-virt-list [data-index]')];
    const vTop = () => sc.getBoundingClientRect().top;
    const vH = () => sc.getBoundingClientRect().height;
    const coverage = () => {
      const t = vTop();
      const b = t + vH();
      let cov = 0;
      for (const r of rows()) {
        const rb = r.getBoundingClientRect();
        cov += Math.max(0, Math.min(rb.bottom, b) - Math.max(rb.top, t));
      }
      return cov / vH();
    };
    const results = [];
    const stepPx = 600; // fast wheel/trackpad delta per frame
    const dir = sc.scrollTop < sc.scrollHeight / 2 ? 1 : -1;
    for (let i = 0; i < 40; i++) {
      const target =
        dir === 1 ? i * stepPx : sc.scrollHeight - sc.clientHeight - i * stepPx;
      if (dir === 1 && target > sc.scrollHeight - sc.clientHeight) break;
      if (dir === -1 && target < 0) break;
      sc.scrollTop = target;
      await new Promise((r) => requestAnimationFrame(r));
      results.push({ i, pos: Math.round(sc.scrollTop), cov: +coverage().toFixed(3) });
    }
    return results;
  });

// jank: frame deltas while sweeping
const jank = () =>
  p.evaluate(async () => {
    const sc = document.getElementById('main-content-container');
    const deltas = [];
    let last = performance.now();
    const probe = () => {
      const now = performance.now();
      deltas.push(now - last);
      last = now;
      requestAnimationFrame(probe);
    };
    const h = requestAnimationFrame(probe);
    for (let i = 0; i <= 30; i++) {
      sc.scrollTop = (sc.scrollHeight - sc.clientHeight) * (i / 30);
      await new Promise((r) => setTimeout(r, 33));
    }
    cancelAnimationFrame(h);
    deltas.shift();
    return deltas;
  });

// --- blank check on nav ---
await p.evaluate((u) => (location.hash = '#/'), uuid);
await p.waitForTimeout(1500);
await p.evaluate((u) => (location.hash = '#/page/' + u), uuid);
await p.waitForTimeout(3000);
const first = await p.evaluate(() => ({
  rows: document.querySelectorAll('.ls-virt-list [data-index]').length,
  spacer: document.querySelector('.ls-virt-list > div')?.style.height,
}));
console.log('after nav:', JSON.stringify(first));

// --- down sweep coverage (jump-scroll, no settle = transient gaps) ---
let res = await sweep();
let minCov = Math.min(...res.map((r) => r.cov));
console.log(
  'sweep down: min coverage',
  minCov,
  'gaps(<0.9):',
  JSON.stringify(res.filter((r) => r.cov < 0.9))
);
await p.screenshot({ path: `${OUT}/sweep-bottom.png` });
// settle check at bottom
await p.waitForTimeout(500);
const bottomCov = await p.evaluate(() => {
  const sc = document.getElementById('main-content-container');
  const t = sc.getBoundingClientRect().top;
  const b = t + sc.getBoundingClientRect().height;
  let cov = 0;
  for (const r of document.querySelectorAll('.ls-virt-list [data-index]')) {
    const rb = r.getBoundingClientRect();
    cov += Math.max(0, Math.min(rb.bottom, b) - Math.max(rb.top, t));
  }
  return +(cov / sc.getBoundingClientRect().height).toFixed(3);
});
console.log('settled bottom coverage:', bottomCov);

// --- up sweep ---
res = await sweep();
minCov = Math.min(...res.map((r) => r.cov));
console.log(
  'sweep up: min coverage',
  minCov,
  'gaps(<0.9):',
  JSON.stringify(res.filter((r) => r.cov < 0.9))
);

// --- jank ---
const deltas = await jank();
const over60 = deltas.filter((d) => d > 60);
console.log(
  'frames:',
  deltas.length,
  'avg:',
  +(deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(1),
  'ms, >60ms:',
  over60.length,
  JSON.stringify(over60.map(Math.round))
);
await p.screenshot({ path: `${OUT}/sweep-top.png` });

// --- journals pagination ---
await p.evaluate(() => (location.hash = '#/'));
await p.waitForTimeout(3000);
const jourRows = async () =>
  p.evaluate(() => document.querySelectorAll('.ls-virt-list [data-index]').length);
const before = await jourRows();
for (let i = 0; i < 4; i++) {
  await p.evaluate(() => {
    const sc = document.getElementById('main-content-container');
    sc.scrollTop = sc.scrollHeight;
  });
  await p.waitForTimeout(1200);
}
const after = await jourRows();
const total = await p.evaluate(
  () => document.querySelector('.ls-virt-list > div')?.style.height
);
console.log(
  'journals: rows before/after scroll-to-bottom:',
  before,
  '->',
  after,
  'spacerH:',
  total
);
await p.screenshot({ path: `${OUT}/journals-bottom.png` });
await ctx.close();
