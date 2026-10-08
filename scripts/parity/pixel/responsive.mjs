// Responsive parity audit — drives one app through the mobile/tablet
// checklist at a given viewport, saving screenshots + a DOM geometry
// report per step.
// Usage: node responsive.mjs <master|lui> <WxH> <outdir>
//   e.g.  node responsive.mjs master 480x800 /tmp/resp/master-480
import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const [, , TAG = 'master', SIZE = '480x800', OUT = `/tmp/resp/${TAG}`] = process.argv;
const [W, H] = SIZE.split('x').map(Number);
const URL_ = TAG === 'master'
  ? 'http://localhost:3001/?rtc-test=true'
  : 'http://localhost:3010/index.html?rtc-test=true';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => { errors.push(String(e).slice(0, 200)); console.log('PAGEERR:', String(e).slice(0, 200)); });
const sleep = ms => page.waitForTimeout(ms);
const shot = n => page.screenshot({ path: `${OUT}/${n}.png` });

// geometry probe — runs in page, returns measurements that let us diff
// layout without relying on pixels alone
const probe = () => page.evaluate(() => {
  const r = s => {
    const el = document.querySelector(s);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      display: cs.display, transform: cs.transform, opacity: cs.opacity,
      zIndex: cs.zIndex, position: cs.position,
    };
  };
  const doc = document.documentElement;
  const header = document.querySelector('.cp__header');
  const hdrKids = header
    ? [...header.children].map(c => ({ cls: c.className?.toString().slice(0, 40), w: +c.getBoundingClientRect().width.toFixed(1) }))
    : [];
  return {
    vw: innerWidth, vh: innerHeight,
    docScrollW: doc.scrollWidth, bodyScrollW: document.body?.scrollWidth,
    layout: document.querySelector('.cp__sidebar-left-layout')?.className,
    layoutRect: r('.cp__sidebar-left-layout'),
    sidebarInner: r('#left-sidebar .left-sidebar-inner, .left-sidebar-inner'),
    shade: r('#left-sidebar > .shade-mask, .cp__sidebar-left-layout > .shade-mask'),
    resizer: r('.left-sidebar-resizer'),
    mainPadLeft: getComputedStyle(document.querySelector('#main-container, #main, .cp__sidebar-main-layout') || doc).paddingLeft,
    mainCls: document.querySelector('.cp__sidebar-main-layout, #main')?.className,
    headerKids: hdrKids,
    headerScrollW: header ? header.scrollWidth : 0,
    searchInputFocused: document.activeElement?.className?.toString().slice(0, 60),
    dialog: r('.ui__dialog, .ui__dialog-content, [role=dialog]'),
    dialogOverlay: r('.ui__dialog-overlay'),
    cmdk: r('#ui__ac, .cmdk, [class*=cmdk], .ui__dialog-content'),
    menu: r('.ui__dropdown-content, .ui__menu-content, [role=menu]'),
    blocks: document.querySelectorAll('.ls-block, .block-content').length,
    editor: r('.ed-input, .CodeMirror, textarea[ref*=block], .block-editor'),
    url: location.hash,
    activeEl: document.activeElement?.tagName + '.' + document.activeElement?.className?.toString().slice(0, 50),
  };
});

const log = [];
const step = async (name, fn) => {
  try { await fn(); } catch (e) { console.log(`FAIL ${name}: ${String(e).slice(0, 140)}`); }
  await sleep(300);
  const m = await probe().catch(e => ({ err: String(e).slice(0, 120) }));
  m._errors = errors.splice(0);
  log.push({ name, m });
  await shot(name);
  console.log(`OK ${name}  sidebar=${m.sidebarInner ? m.sidebarInner.x + ',' + m.sidebarInner.w : '-'} pad=${m.mainPadLeft} docW=${m.docScrollW}`);
};

await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await sleep(TAG === 'master' ? 15000 : 20000);

await step('00-boot', async () => {});

// ---- sidebar overlay ----
await step('01-sidebar-open', async () => {
  const b = page.locator('#left-menu');
  if (await b.count()) await b.click(); else await page.mouse.click(24, 24);
  await sleep(1200);
});
await step('02-sidebar-settled', async () => { await sleep(600); });
// tap a nav item — below sm master closes the sidebar
await step('03-nav-tap-journals', async () => {
  const t = page.locator('.left-sidebar-inner >> text="Journals"').first();
  if (await t.count()) await t.click({ timeout: 4000 }).catch(() => page.mouse.click(60, 200));
  else await page.mouse.click(60, 200);
  await sleep(1200);
});
await step('04-sidebar-reopen', async () => {
  const b = page.locator('#left-menu');
  if (await b.count()) await b.click(); else await page.mouse.click(24, 24);
  await sleep(1200);
});
// dismiss via shade-mask tap (right side)
await step('05-shade-dismiss', async () => {
  await page.mouse.click(W - 20, H / 2);
  await sleep(1000);
});

// ---- cmdk ----
await step('06-cmdk', async () => {
  const s = page.locator('#search-button');
  if (await s.count()) await s.click(); else await page.keyboard.press('Meta+k');
  await sleep(1400);
});
await step('07-cmdk-typed', async () => {
  await page.keyboard.type('oct', { delay: 40 });
  await sleep(1000);
});
await step('08-cmdk-esc', async () => {
  await page.keyboard.press('Escape');
  await sleep(800);
});

// ---- dots menu + settings ----
await step('09-dots-menu', async () => {
  await page.mouse.click(W - 24, 24);
  await sleep(1000);
});
await step('10-settings', async () => {
  const t = page.locator('text="Settings"').first();
  if (await t.count()) await t.click({ timeout: 4000 }).catch(() => {});
  await sleep(1600);
});
await step('11-settings-close', async () => {
  await page.keyboard.press('Escape');
  await sleep(600);
  // some dialogs need the close button
  const c = page.locator('.ui__dialog-close, [aria-label=Close]').first();
  if (await c.count()) await c.click({ timeout: 2000 }).catch(() => {});
  await sleep(800);
});

// ---- all pages ----
await step('12-all-pages', async () => {
  await page.evaluate(() => { location.hash = '#/all-pages'; });
  await sleep(2500);
});
await step('13-back-journal', async () => {
  await page.evaluate(() => { location.hash = '#/'; });
  await sleep(2000);
});

// ---- block editing ----
await step('14-block-click', async () => {
  const blk = page.locator('.ls-block .block-content, .block-content').first();
  if (await blk.count()) await blk.click({ timeout: 4000 }).catch(() => page.mouse.click(W / 2, 120));
  else await page.mouse.click(W / 2, 120);
  await sleep(1500);
});
await step('15-block-typed', async () => {
  await page.keyboard.type('hello', { delay: 40 });
  await sleep(1000);
});
await step('16-edit-esc', async () => {
  await page.keyboard.press('Escape');
  await sleep(800);
});

// ---- help ----
await step('17-help-menu', async () => {
  const h = page.locator('text="?"').last();
  if (await h.count()) await h.click({ timeout: 3000 }).catch(() => page.mouse.click(W - 16, H - 16));
  else await page.mouse.click(W - 16, H - 16);
  await sleep(1000);
});

fs.writeFileSync(`${OUT}/report.json`, JSON.stringify({ tag: TAG, size: SIZE, log }, null, 2));
console.log('report ->', `${OUT}/report.json`);
await browser.close();
