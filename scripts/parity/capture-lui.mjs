// LUI-adapted sidebar+nav parity capture.
// Workarounds vs capture.mjs:
//  - seeding via window.logseq.api (cmdk input is unfocusable; editor can't take keys)
//  - page navigation via location.hash (api create_page can't make namespaced pages)
//  - clearOverlays() removes stuck ui__dialog-overlay layers before clicks
// Usage: node capture-lui.mjs <url> <outdir>
import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const [, , URL_ = 'http://localhost:3010/index.html?rtc-test=true', OUT = '/tmp/parity/lui'] = process.argv;
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0, 250)));

const shot = async name => { await page.screenshot({ path: `${OUT}/${name}.png` }); };
const step = async (name, fn) => {
  try { await fn(); await shot(name); results.push(`${name}: OK`); console.log(`OK  ${name}`); }
  catch (e) { results.push(`${name}: FAIL ${String(e).slice(0, 160)}`); console.log(`FAIL ${name} ${String(e).slice(0, 160)}`); try { await shot(name + '-state'); } catch {} }
};
const sleep = ms => page.waitForTimeout(ms);
const sideTxt = t => page.locator(`.left-sidebar-inner >> text="${t}"`).first();
const txt = t => page.locator(`text="${t}"`).first();
const dotsMenu = async () => { await page.mouse.click(1386, 24); await sleep(900); };
const escape = async () => { await page.keyboard.press('Escape'); await sleep(400); };
const clearOverlays = () => page.evaluate(() => {
  const n = document.querySelectorAll('.ui__dialog-overlay').length;
  document.querySelectorAll('.ui__dialog-overlay, .cp__cmdk, .cp__cmdk-search').forEach(e => e.remove());
  return n;
});

const sidebarOpen = async () => !!(await page.locator('.cp__sidebar-left-layout.is-open, MAIN.is-left-sidebar-open .left-sidebar-inner').count());
const ensureSidebar = async want => {
  const open = await sidebarOpen();
  if (open !== want) {
    const b = page.locator('#left-menu');
    if (await b.count()) await b.click(); else await page.mouse.click(25, 24);
    await sleep(900);
  }
};
const api = (fn, arg) => page.evaluate(fn, arg);
const createPage = async name => {
  const u = await api(async n => {
    const r = await window.logseq.api.create_page(n);
    return r && r.uuid;
  }, name);
  if (!u) throw new Error('create_page returned null: ' + name);
  return u;
};
const gotoUuid = uuid => api(u => { location.hash = '#/page/' + u; }, uuid).then(() => sleep(2500));
const gotoPage = async name => {
  const uuid = await api(async n => {
    const pg = await window.logseq.api.get_page(n);
    return pg && pg.uuid;
  }, name);
  if (!uuid) throw new Error('get_page null: ' + name);
  await gotoUuid(uuid);
};

await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await sleep(20000);
await shot('00-boot');

await step('01-sidebar-closed', () => ensureSidebar(false));
await step('02-sidebar-open', () => ensureSidebar(true));

// ---------- seed via api ----------
await step('03-seed-alpha', async () => {
  const u = await createPage('Alpha');
  await api(async () => { await window.logseq.api.append_block_in_page('Oct 6th, 2026', 'See [[Alpha]] and [[Beta]]'); }).catch(e => console.log('blk warn', String(e).slice(0, 80)));
});
await step('04-seed-beta', () => createPage('Beta'));
await step('05-seed-namespaced', async () => {
  // documented failure path: namespaced create_page
  try { await createPage('Foo/Bar/Baz'); }
  catch (e) { results.push('note: namespaced create_page fails: ' + String(e).slice(0, 80)); }
  await createPage('Foo');
  await createPage('Library');
});

// ---------- sections collapse/expand ----------
await step('06-recent-collapsed', async () => {
  await ensureSidebar(true);
  await sideTxt('Recent').click(); await sleep(700);
});
await step('07-favorites-collapsed', async () => {
  await sideTxt('Favorites').click(); await sleep(700);
});
await step('08-sections-reexpanded', async () => {
  await sideTxt('Recent').click(); await sleep(500);
  await sideTxt('Favorites').click(); await sleep(700);
});

// ---------- favorites add via dots menu on Alpha ----------
await step('09-dots-menu', async () => {
  await gotoPage('Alpha');
  await dotsMenu();
});
await step('10-fav-added', async () => {
  await txt('Add to Favorites').click({ timeout: 6000 }); await sleep(1200);
  await ensureSidebar(true);
});

// ---------- recents ----------
await step('11-recent-hover', async () => {
  const item = page.locator('.left-sidebar-inner .recent .sidebar-content-group-inner a.link-item').first();
  await item.hover({ timeout: 8000 }); await sleep(700);
});
await step('12-recent-ctx', async () => {
  const item = page.locator('.left-sidebar-inner .recent .sidebar-content-group-inner a.link-item').first();
  await item.click({ button: 'right', timeout: 8000 }); await sleep(1000);
});
await step('13-ctx-open-in-sidebar', async () => {
  await escape();
  await clearOverlays();
});

// ---------- resize ----------
await step('14-sidebar-resized', async () => {
  const layout = await page.locator('.cp__sidebar-left-layout, .left-sidebar-inner').first().boundingBox();
  const edge = layout ? layout.width : 245;
  await page.mouse.move(edge, 450);
  await page.mouse.down();
  await page.mouse.move(edge + 140, 450, { steps: 10 });
  await page.mouse.up();
  await sleep(1000);
});
await step('15-sidebar-resized-back', async () => {
  const layout = await page.locator('.cp__sidebar-left-layout, .left-sidebar-inner').first().boundingBox();
  const edge = layout ? layout.width : 385;
  await page.mouse.move(edge - 2, 450);
  await page.mouse.down();
  await page.mouse.move(245, 450, { steps: 10 });
  await page.mouse.up();
  await sleep(1000);
});

// ---------- graph switcher ----------
await step('16-graph-switcher', async () => {
  await ensureSidebar(true);
  await sideTxt('Demo').click({ timeout: 8000 }); await sleep(1200);
});
await step('17-all-graphs', async () => {
  await txt('All graphs').click({ timeout: 8000 }); await sleep(2500);
});
await step('18-back-to-demo', async () => {
  const demo = txt('Demo');
  if (await demo.count()) { await demo.click(); await sleep(3000); }
});

// ---------- breadcrumbs via page-ref click ----------
await step('19-breadcrumb-page', async () => {
  // journal block has 'See [[Alpha]] and [[Beta]]'; go home first then click ref
  await api(() => { location.hash = '#/'; });
  await sleep(2500);
  const link = page.locator('a', { hasText: 'Alpha' }).first();
  await link.click({ timeout: 8000 });
  await sleep(2000);
});
await step('20-breadcrumb-segment-foo', async () => {
  const seg = page.locator('.breadcrumb a, .breadcrumb [class*=segment], nav a').filter({ hasText: 'Foo' }).first();
  await seg.click({ timeout: 6000 });
  await sleep(2000);
});
await step('21-breadcrumb-library', async () => {
  const seg = page.locator('.breadcrumb a, .breadcrumb [class*=segment], nav a').filter({ hasText: 'Library' }).first();
  await seg.click({ timeout: 6000 });
  await sleep(2000);
});

// ---------- back / forward ----------
await step('22-nav-back', async () => { await page.goBack(); await sleep(2000); });
await step('23-nav-back2', async () => { await page.goBack(); await sleep(2000); });
await step('24-nav-forward', async () => { await page.goForward(); await sleep(2000); });

// ---------- journals nav ----------
await step('25-journals-list', async () => {
  await ensureSidebar(true);
  await sideTxt('Journals').click({ timeout: 8000 }); await sleep(3000);
});
await step('26-journal-day-prev', async () => {
  await page.keyboard.press('g');
  await page.keyboard.press('p');
  await sleep(2000);
});
await step('27-journal-day-next', async () => {
  await page.keyboard.press('g');
  await page.keyboard.press('n');
  await sleep(2000);
});

// ---------- all pages ----------
await step('28-all-pages', async () => {
  await ensureSidebar(true);
  await sideTxt('Pages').click({ timeout: 8000 }); await sleep(3000);
});
await step('29-all-pages-search', async () => { /* capture state */ });

// ---------- favorite Beta + reorder ----------
await step('30-fav-beta', async () => {
  await gotoPage('Beta');
  await dotsMenu();
  await txt('Add to Favorites').click({ timeout: 6000 }); await sleep(1500);
});
await step('31-fav-list', async () => { await ensureSidebar(true); });
await step('32-fav-reorder', async () => {
  const favs = page.locator('.left-sidebar-inner .favorites .sidebar-content-group-inner a.link-item');
  const n = await favs.count();
  if (n < 2) throw new Error(`only ${n} favorites`);
  const b0 = await favs.nth(0).boundingBox();
  const b1 = await favs.nth(1).boundingBox();
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height + 10, { steps: 12 });
  await page.mouse.up();
  await sleep(1500);
});

// ---------- help ----------
await step('33-help-menu', async () => {
  await page.mouse.click(1386, 868); await sleep(1200);
});
await escape();

// ---------- settings ----------
await step('34-settings', async () => {
  await dotsMenu();
  await txt('Settings').click({ timeout: 6000 }); await sleep(2500);
});
await escape();
await clearOverlays();

// ---------- theme via api + UI ----------
await step('35-dots-appearance', async () => { await dotsMenu(); });
await step('36-dark-theme', async () => {
  const m = page.locator('text="Appearance"').first();
  if (await m.count()) { await m.click(); await sleep(1800); }
  else { await api(() => window.logseq.api.set_theme_mode('dark')); await sleep(1800); }
});
await step('37-light-theme', async () => {
  await api(() => window.logseq.api.set_theme_mode('light')).catch(() => {});
  await sleep(1800);
});

// ---------- login/sync ----------
await step('38-login-entry', async () => { await dotsMenu(); });
await escape();
await clearOverlays();

// ---------- fav remove via ctx ----------
await step('39-fav-ctx', async () => {
  await ensureSidebar(true);
  const fav = page.locator('.left-sidebar-inner .favorites .sidebar-content-group-inner a.link-item').first();
  await fav.click({ button: 'right', timeout: 8000 }); await sleep(1000);
});
await step('40-fav-removed', async () => {
  const rm = page.locator('text=Unfavorite').first();
  if (await rm.count()) await rm.click(); else await escape();
  await sleep(1200);
});

await step('41-fav-ctx-menu', async () => {
  await ensureSidebar(true);
  const fav = page.locator('.left-sidebar-inner .favorites .sidebar-content-group-inner a.link-item').first();
  if (await fav.count()) { await fav.click({ button: 'right' }); await sleep(1000); }
});
await escape();
await clearOverlays();

await step('42-sidebar-closed-end', () => ensureSidebar(false));

// ---------- extra: cmdk bug evidence ----------
await step('43-cmdk-open', async () => {
  const s = page.locator('#search-button');
  if (await s.count()) await s.click();
  await sleep(1200);
});
await step('44-cmdk-type', async () => {
  const inp = page.locator('.cp__cmdk-search-input');
  await inp.click({ timeout: 5000 });
  await page.keyboard.type('Beta', { delay: 50 });
  await sleep(1200);
});
await step('45-cmdk-enter-stuck', async () => {
  await page.keyboard.press('Enter');
  await sleep(1500);
});
await step('46-cmdk-esc-stuck', async () => {
  await page.keyboard.press('Escape');
  await sleep(1000);
});

console.log('\n==== RESULTS ====\n' + results.join('\n'));
fs.writeFileSync(`${OUT}/results.txt`, results.join('\n') + '\n');
await browser.close();
