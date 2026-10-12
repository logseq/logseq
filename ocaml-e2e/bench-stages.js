// Micro-benchmark of fixture stages, mirroring ocaml-e2e/lib/fixtures.ml.
// Usage: node bench-stages.js [slow_mo] [iterations]
const { chromium } = require('playwright');

const SLOW_MO = Number(process.argv[2] ?? 100);
const ITERS = Number(process.argv[3] ?? 3);
const PORT = process.env.E2E_PORT || 3002;
const URL_ = `http://localhost:${PORT}?rtc-test=true`;

const t = () => performance.now();
const results = {};
function mark(name, ms) { (results[name] ??= []).push(ms); }

async function once(i) {
  let t0 = t();
  const browser = await chromium.launch({ headless: true, slowMo: SLOW_MO });
  mark('01_browser_launch', t() - t0);

  t0 = t();
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const ctx = page.context();
  await ctx.addInitScript("localStorage.setItem('preferred-language','\"en\"');localStorage.setItem('developer-mode','\"true\"');");
  await ctx.grantPermissions(['clipboard-write', 'clipboard-read']);
  mark('02_new_page+init', t() - t0);

  t0 = t();
  await page.goto(URL_);
  await page.waitForSelector('#search-button', { timeout: 60000 });
  mark('03_open_app(nav+#search-button)', t() - t0);

  t0 = t();
  await page.evaluate("localStorage.setItem('preferred-language','\"en\"');localStorage.setItem('developer-mode','\"true\"');");
  await page.waitForSelector("[data-testid='block editor'], [datatestid='block editor']", { state: 'hidden' });
  await page.waitForSelector('.selection-action-bar', { state: 'hidden' });
  await page.waitForSelector('#search-button');
  mark('04_developer_mode+normal_mode', t() - t0);

  t0 = t();
  await page.reload();
  await page.waitForSelector("[data-testid='page title']");
  for (let k = 0; k < 20; k++) {
    const ready = await page.evaluate("(() => document.documentElement.lang === 'en' && localStorage.getItem('preferred-language') === '\"en\"' && localStorage.getItem('developer-mode') === '\"true\"')()");
    if (ready) break;
    await page.waitForTimeout(250);
  }
  mark('05_refresh_test_env', t() - t0);

  // new_logseq_page (fixture :each): maybe close right sidebar, strip virtualized param, create page via cmdk
  t0 = t();
  const rightOpen = await page.locator('.cp__right-sidebar.open').isVisible();
  if (rightOpen) {
    await page.click('.toggle-right-sidebar');
    await page.waitForSelector('.cp__right-sidebar.open', { state: 'hidden' });
  }
  await page.evaluate("(() => { const url = new URL(location.href); url.searchParams.delete('virtualized'); history.replaceState(null, '', url.pathname + url.search + url.hash); })()");
  // create_page: search -> 'Create page called X'
  const pname = `bench-${Date.now()}-${i}`;
  const open = await page.locator('.cp__cmdk-search-input').isVisible();
  if (!open) {
    await page.keyboard.press('ControlOrMeta+k');
    await page.waitForSelector('.cp__cmdk-search-input', { timeout: 15000 });
  }
  await page.fill('.cp__cmdk-search-input', '');
  await page.fill('.cp__cmdk-search-input', pname);
  await page.waitForTimeout(400);
  const item = page.locator('.search-results > div', { hasText: `Create page called '${pname}'` }).first();
  await item.waitFor();
  await item.click();
  await page.waitForSelector('.editor-wrapper textarea');
  mark('06_new_logseq_page', t() - t0);

  // validate_graph (fixture :each): esc x2, search "(Dev) Validate current graph", toast wait
  t0 = t();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  const cmdkVisible = await page.locator('.cp__cmdk-search-input').isVisible();
  if (!cmdkVisible) {
    await page.keyboard.press('ControlOrMeta+k');
    await page.waitForSelector('.cp__cmdk-search-input', { timeout: 15000 });
  }
  await page.fill('.cp__cmdk-search-input', '');
  await page.fill('.cp__cmdk-search-input', '(Dev) Validate current graph');
  await page.waitForTimeout(400);
  const res = page.getByTestId('(Dev) Validate current graph').first();
  for (let k = 0; k < 5 && !(await res.isVisible()); k++) {
    await page.fill('.cp__cmdk-search-input', '');
    await page.fill('.cp__cmdk-search-input', '(Dev) Validate current graph');
    await page.waitForTimeout(400);
  }
  await res.click();
  await page.waitForSelector(".ui__toast:has-text('Your graph is valid')", { timeout: 30000 });
  mark('07_validate_graph', t() - t0);

  t0 = t();
  await browser.close();
  mark('08_browser_close', t() - t0);
}

(async () => {
  for (let i = 0; i < ITERS; i++) {
    try { await once(i); }
    catch (e) { console.error(`iter ${i} failed:`, e.message); }
  }
  console.log(`\nslow_mo=${SLOW_MO} iters=${ITERS}`);
  for (const [k, v] of Object.entries(results)) {
    const avg = v.reduce((a, b) => a + b, 0) / v.length;
    console.log(`${k}  avg=${(avg / 1000).toFixed(2)}s  n=${v.length}  [${v.map(x => (x / 1000).toFixed(1)).join(', ')}]`);
  }
})();
