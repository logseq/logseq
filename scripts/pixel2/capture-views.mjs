// Pixel2 views capture — all-pages, journals, tag/object pages, properties panels.
// Usage: node scripts/pixel2/capture-views.mjs <master|lui> <outdir>
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';
import fs from 'node:fs';

const [, , TAG, OUT] = process.argv;
const URL_ = TAG === 'master' ? MASTER_URL : LUI_URL;
fs.mkdirSync(OUT, { recursive: true });
const results = [];

const { ctx, page } = await launch(TAG);
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0, 160)));
const sleep = ms => page.waitForTimeout(ms);
const shot = async name => page.screenshot({ path: `${OUT}/${TAG}-${name}.png` });
const step = async (name, fn) => {
  try { await fn(); await shot(name); results.push(`${name}: OK`); console.log(`OK  ${name}`); }
  catch (e) { results.push(`${name}: FAIL ${String(e).slice(0, 140)}`); console.log(`FAIL ${name} ${String(e).slice(0, 140)}`); try { await shot(name + '-state'); } catch {} }
};
const escape = async () => { await page.keyboard.press('Escape'); await sleep(500); };

await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await sleep(TAG === 'master' ? 12000 : 16000);
await page.addStyleTag({ content: '#shadow-connection-error { display: none !important; }' });

// ensure 'Seed notes' data is present (run seed-views.mjs beforehand)
const clickText = async (t, timeout = 5000) => {
  const loc = page.locator(`#left-sidebar :text("${t}"), .left-sidebar-inner :text("${t}"), text="${t}" >> visible=true`).first();
  await loc.click({ timeout });
  await sleep(1800);
};

// ---- 01 all pages ----
await step('01-all-pages', async () => {
  try { await clickText('All pages'); }
  catch { await page.evaluate(() => { location.hash = '#/all-pages'; }); await sleep(2500); }
});

// ---- 02 journals ----
await step('02-journals', async () => {
  try { await clickText('Journals'); }
  catch { await page.evaluate(() => { location.hash = '#/journals'; }); await sleep(2500); }
});

// ---- 03 Book tag/object page (objects table w/ typed columns) ----
const tagUuid = async () => page.evaluate(async () => {
  const api = window.logseq.api;
  const tree = await api.get_page_blocks_tree('Seed notes');
  const b = (tree || []).find(x => (x.title || '') === 'Clean Code');
  if (!b) return null;
  const full = await api.get_block(b.uuid || b['block/uuid']);
  const tags = full?.properties?.tags ?? full?.tags ?? [];
  return tags[0]?.uuid ?? null;
});
await step('03-book-objects', async () => {
  const uuid = await tagUuid();
  if (uuid) { await page.evaluate(u => { location.hash = `#/page/${u}`; }, uuid); await sleep(3500); }
  else await clickText('Book');
});

// ---- 04 select a row -> selection toolbar ----
await step('04-table-select', async () => {
  const row = page.locator('tr, [role="row"], .ls-table-row, [class*=table] [class*=row]').nth(1);
  await row.click({ timeout: 5000 }).catch(() => {});
  await row.hover(); await sleep(600);
  const cb = row.locator('input[type="checkbox"], [role="checkbox"], .row-checkbox, [class*=checkbox], [class*=select]').first();
  await cb.click({ timeout: 5000 }).catch(async () => {
    // fallback: cmd/ctrl-click row to select
    await row.click({ modifiers: ['ControlOrMeta'] }).catch(() => {});
  });
  await sleep(1200);
});

// ---- 05 column header menu ----
await step('05-column-menu', async () => {
  const hdr = page.locator('th, [role="columnheader"], .table-header *').filter({ hasText: 'author' }).first();
  if (await hdr.count()) { await hdr.click({ timeout: 3000 }).catch(() => {}); await sleep(800); }
  const chev = page.locator('th, [role="columnheader"]').filter({ hasText: 'author' }).locator('button, [role="button"]').first();
  if (await chev.count()) { await chev.click({ timeout: 3000 }); await sleep(900); }
});
await escape();

// ---- 06 view switcher: list + gallery ----
await step('06-view-list', async () => {
  const sw = page.locator('button:has-text("Table"), [aria-label*="view" i], .view-switcher button').first();
  if (await sw.count()) { await sw.click({ timeout: 3000 }); await sleep(800);
    const li = page.locator('text="List" >> visible=true').first();
    if (await li.count()) { await li.click({ timeout: 3000 }); await sleep(1500); } }
});
await step('07-view-gallery', async () => {
  const sw = page.locator('button:has-text("List"), button:has-text("Table")').first();
  if (await sw.count()) { await sw.click({ timeout: 3000 }); await sleep(800);
    const ga = page.locator('text="Gallery" >> visible=true').first();
    if (await ga.count()) { await ga.click({ timeout: 3000 }); await sleep(1500); } }
});
await step('08-view-table', async () => {
  const sw = page.locator('button:has-text("Gallery"), button:has-text("List")').first();
  if (await sw.count()) { await sw.click({ timeout: 3000 }); await sleep(800);
    const tb = page.locator('text="Table" >> visible=true').first();
    if (await tb.count()) { await tb.click({ timeout: 3000 }); await sleep(1500); } }
});

// ---- 09 Add property (objects toolbar) ----
await step('09-add-property', async () => {
  const ap = page.locator('button:has-text("Add property")').first();
  const ap2 = page.locator('text="Add property" >> visible=true').first();
  const target = (await ap.count()) ? ap : ap2;
  if (await target.count()) { await target.click({ timeout: 4000 }); await sleep(1200); }
});
await escape();

// ---- 10 book object page (properties panel) ----
await step('10-object-page', async () => {
  const uuid = await page.evaluate(async () => {
    const api = window.logseq.api;
    const tree = await api.get_page_blocks_tree('Seed notes');
    for (const b of tree || []) if ((b.title || '') === 'Clean Code') return b.uuid || b['block/uuid'];
    return null;
  });
  if (uuid) { await page.evaluate(u => { location.hash = `#/page/${u}`; }, uuid); await sleep(3000); }
});

// ---- 11 plain page (Page Alpha properties area) ----
await step('11-page-alpha', async () => {
  const uuid = await page.evaluate(async () => {
    const p = await window.logseq.api.get_page('Page Alpha');
    return p?.uuid ?? null;
  });
  if (uuid) { await page.evaluate(u => { location.hash = `#/page/${u}`; }, uuid); await sleep(2500); }
});

// ---- 12 tooltip on hover ----
await step('12-tooltip', async () => {
  await clickText('Journals').catch(() => {});
  const btn = page.locator(TAG === 'master' ? '.cp__header button' : '.toolbar-dots-btn, header button').first();
  if (await btn.count()) { await btn.hover(); await sleep(1400); }
});
await escape();

// ---- dark theme re-shots ----
await page.evaluate(async () => { try { await window.logseq.api.set_theme_mode('dark'); } catch {} });
await sleep(1200);
await step('20-dark-all-pages', async () => {
  try { await clickText('All pages'); } catch { await page.evaluate(() => { location.hash = '#/all-pages'; }); await sleep(2500); }
});
await step('21-dark-book-objects', async () => {
  const uuid = await tagUuid();
  if (uuid) { await page.evaluate(u => { location.hash = `#/page/${u}`; }, uuid); await sleep(3500); }
});
await step('22-dark-object-page', async () => {
  const uuid = await page.evaluate(async () => {
    const api = window.logseq.api;
    const tree = await api.get_page_blocks_tree('Seed notes');
    for (const b of tree || []) if ((b.title || '') === 'Clean Code') return b.uuid || b['block/uuid'];
    return null;
  });
  if (uuid) { await page.evaluate(u => { location.hash = `#/page/${u}`; }, uuid); await sleep(3000); }
});
await page.evaluate(async () => { try { await window.logseq.api.set_theme_mode('light'); } catch {} });
await sleep(800);

console.log('\n==== RESULTS ====\n' + results.join('\n'));
fs.writeFileSync(`${OUT}/${TAG}-results.txt`, results.join('\n') + '\n');
await ctx.close();
