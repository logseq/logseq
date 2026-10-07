// Sidebar+nav parity capture v2 — drives one app through the full checklist.
// Usage: node capture.mjs <url> <outdir> <tag>
import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const [, , URL_ = 'http://localhost:3001/', OUT = '/tmp/parity/master', TAG = 'master'] = process.argv;
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0, 300)));

const shot = async name => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
};
const step = async (name, fn) => {
  try { await fn(); await shot(name); results.push(`${name}: OK`); console.log(`OK  ${name}`); }
  catch (e) { results.push(`${name}: FAIL ${String(e).slice(0, 160)}`); console.log(`FAIL ${name} ${String(e).slice(0, 160)}`); try { await shot(name + '-state'); } catch {} }
};
const sleep = ms => page.waitForTimeout(ms);
const side = sel => page.locator(`.left-sidebar-inner ${sel}`).first();
const txt = t => page.locator(`text="${t}"`).first();
const sideTxt = t => page.locator(`.left-sidebar-inner >> text="${t}"`).first();
const dotsMenu = async () => { await page.mouse.click(1386, 24); await sleep(900); };
const escape = async () => { await page.keyboard.press('Escape'); await sleep(400); };

const sidebarOpen = async () => !!(await page.locator('.cp__sidebar-left-layout.is-open, MAIN.is-left-sidebar-open .left-sidebar-inner').count());
const ensureSidebar = async want => {
  const open = await sidebarOpen();
  if (open !== want) {
    const b = page.locator('#left-menu');
    if (await b.count()) await b.click(); else await page.mouse.click(25, 24);
    await sleep(900);
  }
};
const createPage = async name => {
  const s = page.locator('#search-button');
  if (await s.count()) await s.click(); else await page.keyboard.press('Meta+k');
  await sleep(1000);
  await page.keyboard.type(name, { delay: 30 });
  await sleep(900);
  await page.keyboard.press('Enter');
  await sleep(2500);
};
const gotoPage = async name => {
  const s = page.locator('#search-button');
  if (await s.count()) await s.click(); else await page.keyboard.press('Meta+k');
  await sleep(900);
  await page.keyboard.type(name, { delay: 30 });
  await sleep(800);
  await page.keyboard.press('Enter');
  await sleep(2500);
};

await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await sleep(TAG === 'master' ? 12000 : 20000);
await shot('00-boot');

await step('01-sidebar-closed', () => ensureSidebar(false));
await step('02-sidebar-open', () => ensureSidebar(true));

// ---------- seed ----------
await step('03-seed-alpha', () => createPage('Alpha'));
await step('04-seed-beta', () => createPage('Beta'));
await step('05-seed-namespaced', () => createPage('Foo/Bar/Baz'));

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

// ---------- favorites add (currently on Baz page) ----------
await step('09-dots-menu', () => dotsMenu());
await step('10-fav-added', async () => {
  await txt('Add to Favorites').click(); await sleep(1200);
  await ensureSidebar(true);
});

// ---------- recents ----------
await step('11-recent-hover', async () => {
  const item = page.locator('.left-sidebar-inner .recent .sidebar-content-group-inner a.link-item').first();
  await item.hover(); await sleep(700);
});
await step('12-recent-ctx', async () => {
  const item = page.locator('.left-sidebar-inner .recent .sidebar-content-group-inner a.link-item').first();
  await item.click({ button: 'right' }); await sleep(1000);
});
await step('13-ctx-open-in-sidebar', async () => {
  // menu should show "Open in sidebar"; capture then dismiss
  await escape();
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
  await sideTxt('Demo').click(); await sleep(1200);
});
await step('17-all-graphs', async () => {
  await txt('All graphs').click(); await sleep(2500);
});

// ---------- back to graph via switcher ----------
await step('18-back-to-demo', async () => {
  const demo = txt('Demo');
  if (await demo.count()) { await demo.click(); await sleep(3000); }
});

// ---------- breadcrumbs ----------
await step('19-breadcrumb-page', () => gotoPage('Baz'));
await step('20-breadcrumb-segment-foo', async () => {
  await page.locator('.breadcrumb a, .breadcrumb [class*=segment], nav a', { hasText: 'Foo' }).first().click();
  await sleep(2000);
});
await step('21-breadcrumb-library', async () => {
  await page.locator('.breadcrumb a, .breadcrumb [class*=segment], nav a', { hasText: 'Library' }).first().click();
  await sleep(2000);
});

// ---------- back / forward ----------
await step('22-nav-back', async () => { await page.goBack(); await sleep(2000); });
await step('23-nav-back2', async () => { await page.goBack(); await sleep(2000); });
await step('24-nav-forward', async () => { await page.goForward(); await sleep(2000); });

// ---------- journals (all-n list) ----------
await step('25-journals-list', async () => {
  await ensureSidebar(true);
  await sideTxt('Journals').click(); await sleep(3000);
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
  await sideTxt('Pages').click(); await sleep(3000);
});
await step('29-all-pages-search', async () => {
  // click into a row maybe; just capture state
});

// ---------- favorite Beta then reorder ----------
await step('30-fav-beta', async () => {
  await gotoPage('Beta');
  await dotsMenu();
  await txt('Add to Favorites').click(); await sleep(1500);
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
  await txt('Settings').click(); await sleep(2500);
});
await escape();

// ---------- theme ----------
await step('35-dots-appearance', async () => { await dotsMenu(); });
await step('36-dark-theme', async () => {
  await txt('Appearance').click(); await sleep(1800);
});
await step('37-light-theme', async () => {
  await dotsMenu();
  await txt('Appearance').click(); await sleep(1800);
});

// ---------- login/sync ----------
await step('38-login-entry', async () => { await dotsMenu(); });
await escape();

// ---------- fav remove via ctx ----------
await step('39-fav-ctx', async () => {
  await ensureSidebar(true);
  const fav = page.locator('.left-sidebar-inner .favorites .sidebar-content-group-inner a.link-item').first();
  await fav.click({ button: 'right' }); await sleep(1000);
});
await step('40-fav-removed', async () => {
  const rm = page.locator('text=Unfavorite').first();
  if (await rm.count()) await rm.click(); else await escape();
  await sleep(1200);
});

// ---------- page item ctx on favorite ----------
await step('41-fav-ctx-menu', async () => {
  await ensureSidebar(true);
  const fav = page.locator('.left-sidebar-inner .favorites .sidebar-content-group-inner a.link-item').first();
  if (await fav.count()) { await fav.click({ button: 'right' }); await sleep(1000); }
});
await escape();

await step('42-sidebar-closed-end', () => ensureSidebar(false));

console.log('\n==== RESULTS ====\n' + results.join('\n'));
fs.writeFileSync(`${OUT}/results.txt`, results.join('\n') + '\n');
await browser.close();
