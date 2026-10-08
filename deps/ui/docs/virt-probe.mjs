// Virt-list reproduction probe: seeds a large page, navigates to it
// repeatedly (navigate + refetch race), and measures blank bodies plus
// white gaps during fast scroll flicks.
//
// Usage: node deps/ui/docs/virt-probe.mjs [--seed-only] [--flicks N]
// Requires: static app served (node scripts/serve-static.mjs 3013).
import { chromium } from 'playwright';
import fs from 'node:fs';

const CTX = process.env.HOME + '/pw-virt-probe';
const URL_ = 'http://localhost:3013/index.html?rtc-test=true&virtualized=true';
const PAGE = 'VirtProbe';
const N_BLOCKS = 1000;
const OUT = '/tmp/virt-probe';
fs.mkdirSync(OUT, { recursive: true });

const seedOnly = process.argv.includes('--seed-only');
const fi = process.argv.indexOf('--flicks');
const flicks = fi >= 0 ? Number(process.argv[fi + 1]) : 12;

const ctx = await chromium.launchPersistentContext(CTX, {
  viewport: { width: 1440, height: 900 },
});
const p = ctx.pages()[0] ?? (await ctx.newPage());
p.setDefaultTimeout(60000);
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
p.on('console', (m) => {
  const t = m.text();
  if (/error|fail|crash|Invalid|Melange/i.test(t))
    console.log('[con]', t.slice(0, 200));
});

await p.goto(URL_);
await p.waitForFunction(() => window.logseq?.api, { timeout: 60000 });
await p.waitForTimeout(8000);
console.log('graph:', await p.evaluate(() => window.logseq.api.get_current_graph()));

// --- seed VirtProbe with N_BLOCKS top-level blocks (idempotent) ---
const count = await p.evaluate(async (title) => {
  const pg = await window.logseq.api.get_page(title);
  if (!pg) return 0;
  location.hash = '#/page/' + (pg.uuid || pg['block/uuid']);
  await new Promise((r) => setTimeout(r, 1500));
  return document.querySelectorAll('.ls-block').length;
}, PAGE);
console.log('existing blocks:', count);
if (count < N_BLOCKS) {
  for (let i = count; i < N_BLOCKS; i++) {
    await p.evaluate(
      ([pg, t]) => window.logseq.api.append_block_in_page(pg, t, {}),
      [PAGE, `probe block ${i} — the quick brown fox jumps over the lazy dog`]
    );
    if (i % 200 === 0) console.log('seeded', i);
  }
  await p.waitForTimeout(3000);
}
if (seedOnly) {
  console.log('seeded; exiting');
  await ctx.close();
  process.exit(0);
}

const virtStats = () =>
  p.evaluate(() => {
    const sc = document.getElementById('main-content-container');
    const rows = [...document.querySelectorAll('.ls-virt-list [data-index]')];
    const spacer = document.querySelector('.ls-virt-list > div');
    const visible = rows.filter((r) => {
      const b = r.getBoundingClientRect();
      return b.bottom > 0 && b.top < innerHeight && b.height > 0;
    });
    return {
      rows: rows.length,
      visible: visible.length,
      spacerH: spacer ? Math.round(parseFloat(getComputedStyle(spacer).height)) : -1,
      scrollH: sc ? Math.round(sc.scrollHeight) : -1,
      scrollTop: sc ? Math.round(sc.scrollTop) : -1,
      blocks: document.querySelectorAll('.ls-block').length,
    };
  });

// --- 1) navigate round-trips: journals <-> page, count blank states ---
const uuid = await p.evaluate(async (t) => {
  const pg = await window.logseq.api.get_page(t);
  return pg && (pg.uuid || pg['block/uuid']);
}, PAGE);
console.log('page uuid:', uuid);

let blanks = 0;
const N_NAV = 8;
for (let i = 0; i < N_NAV; i++) {
  // away (journals) then back — each cycle remounts the virt list
  await p.evaluate(() => (location.hash = '#/'));
  await p.waitForTimeout(1500);
  await p.evaluate((u) => (location.hash = '#/page/' + u), uuid);
  // sample for up to 6s: blank = 0 visible rows while blocks exist
  let blankSeen = false;
  let stats = null;
  for (let t = 0; t < 12; t++) {
    await p.waitForTimeout(500);
    stats = await virtStats();
    if (stats.visible === 0 && stats.blocks === 0) blankSeen = true;
    if (stats.visible > 0) break;
  }
  if (stats.visible === 0) {
    blanks++;
    await p.screenshot({ path: `${OUT}/blank-nav-${i}.png` });
  }
  console.log(
    `nav ${i}: rows=${stats.rows} vis=${stats.visible} spacerH=${stats.spacerH} blocks=${stats.blocks}` +
      (blankSeen ? ' <== BLANK' : '')
  );
}

// --- 2) fast flicks bottom/top; count frames with no visible row ---
await p.evaluate((u) => (location.hash = '#/page/' + u), uuid);
await p.waitForTimeout(3000);

const flickGap = () =>
  p.evaluate(() => {
    const sc = document.getElementById('main-content-container');
    return new Promise((done) => {
      sc.scrollTop = sc.scrollHeight; // jump to bottom
      const t0 = performance.now();
      const probe = () => {
        const rows = [...document.querySelectorAll('.ls-virt-list [data-index]')];
        const vis = rows.some((r) => {
          const b = r.getBoundingClientRect();
          return b.bottom > 0 && b.top < innerHeight && b.height > 0;
        });
        if (vis || performance.now() - t0 > 2000) done(performance.now() - t0);
        else requestAnimationFrame(probe);
      };
      requestAnimationFrame(probe);
    });
  });

let gapFrames = [];
for (let i = 0; i < flicks; i++) {
  const ms = await flickGap();
  gapFrames.push(Math.round(ms));
  // flick back to top
  await p.evaluate(() => {
    const sc = document.getElementById('main-content-container');
    sc.scrollTop = 0;
  });
  await p.waitForTimeout(120);
}
console.log('flick-to-bottom gap ms:', JSON.stringify(gapFrames));

const stats = await virtStats();
console.log('final:', JSON.stringify(stats), 'nav blanks:', blanks);
await ctx.close();
