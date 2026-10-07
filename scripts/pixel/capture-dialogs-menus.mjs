// Pixel parity capture — dialogs + menus slice.
// Usage: node scripts/pixel/capture-dialogs-menus.mjs <url> <outdir> <tag>
// tag: 'master' | 'lui'
import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const [, , URL_, OUT, TAG] = process.argv;
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0, 200)));

const sleep = ms => page.waitForTimeout(ms);
const shot = async name => page.screenshot({ path: `${OUT}/${TAG}-${name}.png` });
const step = async (name, fn) => {
  try { await fn(); await shot(name); results.push(`${name}: OK`); console.log(`OK  ${name}`); }
  catch (e) { results.push(`${name}: FAIL ${String(e).slice(0, 140)}`); console.log(`FAIL ${name} ${String(e).slice(0, 140)}`); try { await shot(name + '-state'); } catch {} }
};
const escape = async () => { await page.keyboard.press('Escape'); await sleep(500); };

const SEL = {
  master: {
    dots: '.cp__header button:has(.ls-icon-dots)',
    rightToggle: '.cp__header button:has(.ls-icon-layout-sidebar-right)',
    menuItem: t => page.locator(`[role="menuitem"]:has-text("${t}")`).first(),
    block: () => page.locator('.ls-block .block-content-inner, .block-content').first(),
    title: () => page.locator('.page-title, .journal .title, h1.title').first(),
  },
  lui: {
    dots: '.toolbar-dots-btn',
    rightToggle: '.toggle-right-sidebar',
    menuItem: t => page.locator(`text="${t}" >> visible=true`).first(),
    block: () => page.locator('.ls-block, [class*=block]').first(),
    title: () => page.locator('h1, .page-title, .title').first(),
  },
}[TAG];

const menuItem = async t => {
  const it = SEL.menuItem(t);
  await it.click({ timeout: 4000 });
  await sleep(1200);
};
const dots = async () => { await page.locator(SEL.dots).click(); await sleep(900); };

// ---- boot ----
await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await sleep(TAG === 'master' ? 12000 : 16000);

// ---- seed identical fixture via logseq.api ----
await page.evaluate(async () => {
  const api = window.logseq?.api;
  if (!api) return;
  try { await api.create_page('Parity'); } catch {}
  try { await api.append_block_in_page('Parity', 'First block with [[Alpha]] ref and #tag'); } catch {}
  try { await api.append_block_in_page('Parity', 'Second block — right-click me'); } catch {}
  try { await api.append_block_in_page('Parity', 'Third block with **bold** text'); } catch {}
  try { await api.create_page('Alpha'); } catch {}
  try { await api.append_block_in_page('Alpha', 'Alpha body'); } catch {}
});
await sleep(2500);
// navigate to the fixture page so all subsequent captures share the same content
await page.evaluate(async () => {
  const api = window.logseq?.api;
  try {
    const p = await api.get_page('Parity');
    if (p?.uuid) location.hash = `#/page/${p.uuid}`;
  } catch {}
});
await sleep(3000);
await shot('00-home');

// ---- dots page menu ----
await step('01-dots-menu', () => dots());

// ---- settings tabs ----
await step('02-settings-general', () => menuItem('Settings'));
for (const tab of ['Editor', 'Keymap', 'Advanced', 'Features']) {
  await step(`03-settings-${tab.toLowerCase()}`, async () => {
    let link = page.locator('.settings-menu-link', { hasText: tab }).first();
    if (!(await link.count())) link = page.locator(`text="${tab}" >> visible=true`).first();
    await link.click({ timeout: 4000 });
    await sleep(1000);
  });
}
await escape();

// ---- appearance ----
await step('10-appearance', async () => { await dots(); await menuItem('Appearance'); });
await escape();

// ---- export page ----
await step('11-export-page', async () => { await dots(); await menuItem('Export page'); });
await escape();

// ---- import ----
await step('12-import', async () => { await dots(); await menuItem('Import'); });
await escape();

// ---- plugins ----
await step('13-plugins', async () => { await dots(); await menuItem('Plugins'); });
await escape();

// ---- login ----
await step('14-login', async () => { await dots(); await menuItem('Login'); });
await escape();

// ---- navigate to Parity page ----
await page.evaluate(async () => {
  const api = window.logseq?.api;
  try {
    const p = await api.get_page('Parity');
    if (p?.uuid) location.hash = `#/page/${p.uuid}`;
  } catch {}
});
await sleep(2500);
await shot('15-parity-page');

const titleBox = async () => {
  const bb = await page.evaluate(() => {
    const els = [...document.querySelectorAll('body *')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.x > 0 && r.y < 260 && r.height > 10 && r.width > 0 && e.children.length === 0 &&
        e.textContent?.trim() === 'Parity';
    });
    if (!els.length) return null;
    els.sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize));
    const r = els[0].getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (!bb) throw new Error('page title not found');
  return bb;
};

// ---- page title context menu ----
await step('16-title-ctx', async () => {
  const bb = await titleBox();
  await page.mouse.click(bb.x + Math.min(40, bb.w / 2), bb.y + bb.h / 2, { button: 'right' });
  await sleep(900);
});
await escape();

// ---- delete page confirm ----
await step('17-delete-confirm', async () => { await dots(); await menuItem('Delete page'); });
await escape();

// ---- block context menu (select first, then right-click) ----
await step('18-block-ctx', async () => {
  const blk = page.locator('text="Second block — right-click me"').first();
  await blk.click({ timeout: 4000 });
  await sleep(700);
  await page.keyboard.press('Escape');
  await sleep(700);
  // right-click at a fixed offset inside the text box — element-center
  // clicks land at different heights when the block layout differs
  const rbb = await blk.boundingBox();
  // right-click the block's bullet container — the canonical opener in
  // both apps (master ignores right-clicks on block text). The `text=`
  // locator resolves to different element granularity per DOM, so a
  // text-relative offset would land at different viewport points.
  const bullets = page.locator('.bullet-container');
  const bb = await bullets.nth(1).boundingBox().catch(() => null);
  const cx = bb ? bb.x + bb.width / 2 : rbb.x - 12;
  const cy = bb ? bb.y + bb.height / 2 : rbb.y + 10;
  await page.mouse.click(cx, cy, { button: 'right' });
  await sleep(1000);
});
await escape();

// ---- property dialog (title hover -> Set property) ----
await step('19-set-property', async () => {
  const bb = await titleBox();
  await page.mouse.move(bb.x + bb.w / 2, bb.y + bb.h / 2);
  await sleep(800);
  const btn = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button, a, [role=button]')].filter(e => {
      const r = e.getBoundingClientRect();
      return e.textContent?.trim() === 'Set property' && r.width > 0 && e.offsetParent !== null;
    });
    if (!els.length) return null;
    const r = els[0].getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (!btn) throw new Error('Set property button not found');
  await page.mouse.click(btn.x + btn.w / 2, btn.y + btn.h / 2);
  await sleep(1000);
});
await escape();

// ---- help menu ----
await step('20-help-menu', async () => {
  const btn = page.locator('#help, button:has(.ls-icon-help), [aria-label*="help" i], .toolbar-help-btn, button:has-text("?")').first();
  if (await btn.count()) await btn.click();
  else await page.mouse.click(1255, 776); // bottom-right ? dot
  await sleep(1000);
});
await escape();

// ---- right sidebar ----
await step('21-right-sidebar', async () => {
  await page.locator(SEL.rightToggle).click();
  await sleep(1500);
});

// contents tab if present
await step('22-sidebar-contents', async () => {
  const tab = page.locator('text="Contents" >> visible=true').first();
  if (await tab.count()) { await tab.click(); await sleep(1200); }
});

// help panel
await step('23-sidebar-help', async () => {
  const tab = page.locator('text="Help" >> visible=true').first();
  if (await tab.count()) { await tab.click(); await sleep(1200); }
});
// close right sidebar
await step('24-sidebar-closed', async () => {
  await page.locator(SEL.rightToggle).click();
  await sleep(1000);
});

// ---- recycle ----
await step('25-recycle', async () => { await dots(); await menuItem('Recycle'); });
await escape();

// ---- back to Parity page, then dark theme re-shots ----
await page.evaluate(async () => {
  try { const p = await window.logseq.api.get_page('Parity'); if (p?.uuid) location.hash = `#/page/${p.uuid}`; } catch {}
});
await sleep(2000);
await page.evaluate(async () => { try { await window.logseq.api.set_theme_mode('dark'); } catch {} });
await sleep(1200);
await shot('30-dark-home');
await step('31-dark-dots-menu', () => dots());
await step('32-dark-settings', async () => { await menuItem('Settings'); });
await escape();
await step('33-dark-block-ctx', async () => {
  const blk = page.locator('text="Second block — right-click me"').first();
  await blk.click({ timeout: 4000 });
  await sleep(600);
  await page.keyboard.press('Escape');
  await sleep(600);
  const rbb = await blk.boundingBox();
  // right-click the block's bullet container — the canonical opener in
  // both apps (master ignores right-clicks on block text). The `text=`
  // locator resolves to different element granularity per DOM, so a
  // text-relative offset would land at different viewport points.
  const bullets = page.locator('.bullet-container');
  const bb = await bullets.nth(1).boundingBox().catch(() => null);
  const cx = bb ? bb.x + bb.width / 2 : rbb.x - 12;
  const cy = bb ? bb.y + bb.height / 2 : rbb.y + 10;
  await page.mouse.click(cx, cy, { button: 'right' });
  await sleep(1000);
});
await escape();
await step('34-dark-right-sidebar', async () => {
  await page.locator(SEL.rightToggle).click();
  await sleep(1500);
});
// back to light for the rest of the session
await page.evaluate(async () => { try { await window.logseq.api.set_theme_mode('light'); } catch {} });
await sleep(800);

console.log('\n==== RESULTS ====\n' + results.join('\n'));
fs.writeFileSync(`${OUT}/${TAG}-results.txt`, results.join('\n') + '\n');
await browser.close();
