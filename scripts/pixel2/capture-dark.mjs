// Pixel2 dark-theme capture — every surface, dark only, paired master/lui.
// Requires: seed-views.mjs + PPFixture + PdfFixture already seeded on both
// persistent profiles. Sets theme=dark via api + localStorage then reloads.
// Usage: node scripts/pixel2/capture-dark.mjs <master|lui> <outdir>
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';
import fs from 'node:fs';

const [, , TAG, OUT] = process.argv;
const URL_ = TAG === 'master' ? MASTER_URL : LUI_URL;
fs.mkdirSync(OUT, { recursive: true });
const results = [];

const { ctx, page } = await launch(TAG);
const sleep = ms => page.waitForTimeout(ms);
const shot = async name => page.screenshot({ path: `${OUT}/${TAG}-${name}.png` });
const step = async (name, fn) => {
  try { await fn(); await shot(name); results.push(`${name}: OK`); console.log(`OK  ${name}`); }
  catch (e) { results.push(`${name}: FAIL ${String(e).slice(0, 140)}`); console.log(`FAIL ${name} ${String(e).slice(0, 140)}`); try { await shot(name + '-state'); } catch {} }
};
const escape = async () => { await page.keyboard.press('Escape'); await sleep(500); };
const gotoPage = async name => page.evaluate(async n => {
  try { const p = await window.logseq.api.get_page(n); if (p?.uuid || p?.['block/uuid']) location.hash = `#/page/${p.uuid || p['block/uuid']}`; } catch {}
}, name);

await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await sleep(TAG === 'master' ? 12000 : 20000);
await page.addStyleTag({ content: '#shadow-connection-error { display: none !important; }' });

// ---- force dark: write every theme storage key, reload, re-apply ----
await page.evaluate(() => {
  try { localStorage.setItem('ui/theme', '"dark"'); localStorage.setItem('theme', '"dark"'); localStorage.setItem('system-theme?', 'false'); localStorage.setItem('ui/system-theme?', 'false'); } catch {}
});
await page.reload({ waitUntil: 'domcontentloaded' });
await sleep(TAG === 'master' ? 10000 : 16000);
await page.addStyleTag({ content: '#shadow-connection-error { display: none !important; }' });
await page.evaluate(async () => {
  try { await window.logseq.api.set_theme_mode('dark'); } catch {}
  try { await window.logseq.api.set_left_sidebar_visible(true); } catch {}
});
await sleep(1500);

// ---- seed the MenuFixture page ('Parity' collides with the #parity tag) ----
await page.evaluate(async () => {
  const api = window.logseq?.api;
  if (!api) return;
  try {
    const tree = await api.get_page_blocks_tree('MenuFixture');
    if ((tree || []).length >= 3) return;
  } catch {}
  try { await api.create_page('MenuFixture'); } catch {}
  try { await api.append_block_in_page('MenuFixture', 'First block with [[Alpha]] ref and #tag'); } catch {}
  try { await api.append_block_in_page('MenuFixture', 'Second block — right-click me'); } catch {}
  try { await api.append_block_in_page('MenuFixture', 'Third block with **bold** text'); } catch {}
  try { await api.create_page('Alpha'); } catch {}
  try { await api.append_block_in_page('Alpha', 'Alpha body'); } catch {}
});
if (TAG === 'lui') {
  await page.evaluate(async () => {
    const api = window.logseq?.api;
    try {
      const tree = await api.get_page_blocks_tree('MenuFixture');
      if (tree?.length === 3 && tree[0]?.uuid && tree[1]?.title !== '')
        await api.insert_block(tree[0].uuid, '', { sibling: true });
    } catch {}
  });
  await sleep(800);
}
await sleep(1500);

const SEL = {
  master: {
    dots: '.cp__header button:has(.tabler-icon-dots)',
    rightToggle: '.cp__header button:has(.tabler-icon-layout-sidebar-right)',
    blockText: 'text="Second block — right-click me"',
  },
  lui: {
    dots: '.toolbar-dots-btn',
    rightToggle: '.toggle-right-sidebar',
    blockText: 'text="Second block — right-click me"',
  },
}[TAG];
const dots = async () => { await page.locator(SEL.dots).first().click(); await sleep(900); };
const menuItem = async t => {
  const it = page.locator(TAG === 'master' ? `[role="menuitem"]:has-text("${t}")` : `text="${t}" >> visible=true`).first();
  await it.click({ timeout: 4000 }); await sleep(1200);
};
const clickText = async (t, timeout = 5000) => {
  const loc = page.locator(`#left-sidebar :text("${t}"), .left-sidebar-inner :text("${t}"), text="${t}" >> visible=true`).first();
  await loc.click({ timeout }); await sleep(1800);
};

// ---- journal + blocks ----
await step('01-journal', async () => {
  try { await clickText('Journals'); } catch { await page.evaluate(() => { location.hash = '#/'; }); await sleep(2500); }
});
await step('02-blocks-top', async () => {
  await gotoPage('PPFixture'); await sleep(3000);
});
const scrollMain = async y => page.evaluate(yy => {
  const cands = [...document.querySelectorAll('.cp__sidebar-main-content, main, [class*=main-content], [class*=scroll]')]
    .filter(e => e.scrollHeight > e.clientHeight + 50 && e.clientHeight > 300);
  const el = cands.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
  if (el) el.scrollTop = yy; else window.scrollTo(0, yy);
}, y);
await step('03-blocks-mid', async () => { await scrollMain(700); await sleep(800); });
await step('04-blocks-bottom', async () => { await scrollMain(1400); await sleep(800); });
await scrollMain(0); await sleep(500);

// ---- header hover tooltip ----
await step('05-header-tooltip', async () => {
  const btn = page.locator(TAG === 'master' ? '.cp__header button' : 'header button, .toolbar-dots-btn').first();
  if (await btn.count()) { await btn.hover(); await sleep(1400); }
});
await page.mouse.move(640, 400); await sleep(400);

// ---- cmdk ----
await step('06-cmdk-blank', async () => { await page.keyboard.press('Meta+k'); await sleep(1500); });
await step('07-cmdk-query', async () => { await page.keyboard.type('oct'); await sleep(1200); });
await step('08-cmdk-selected', async () => { await page.keyboard.press('ArrowDown'); await sleep(600); });
await escape(); await escape();
// if the palette is still open, click the scrim to dismiss
await page.evaluate(() => {
  const scrim = document.querySelector('.ui__dialog-overlay, [class*=overlay], [class*=scrim]');
  if (scrim) scrim.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await sleep(600);

// ---- page menu ----
await step('09-dots-menu', () => dots());
await escape();

// ---- settings tabs ----
await step('10-settings-general', async () => { await dots(); await menuItem('Settings'); });
for (const tab of ['Editor', 'Keymap', 'Advanced', 'Features']) {
  await step(`11-settings-${tab.toLowerCase()}`, async () => {
    let link = page.locator('.settings-menu-link', { hasText: tab }).first();
    if (!(await link.count())) link = page.locator(`text="${tab}" >> visible=true`).first();
    await link.click({ timeout: 4000 }); await sleep(1000);
  });
}
await escape();

// ---- dialogs via dots menu ----
await step('12-appearance', async () => { await dots(); await menuItem('Appearance'); });
await escape();
await step('13-export-page', async () => { await dots(); await menuItem('Export page'); });
await escape();
await step('14-import', async () => { await dots(); await menuItem('Import'); });
await escape();
await step('15-plugins', async () => { await dots(); await menuItem('Plugins'); });
await escape();
await step('16-login', async () => { await dots(); await menuItem('Login'); });
await escape();

// ---- Parity page: title ctx / block ctx / delete confirm / set property ----
await step('17-parity-page', async () => { await gotoPage('MenuFixture'); await sleep(2500); });
const titleBox = async () => {
  const bb = await page.evaluate(() => {
    const els = [...document.querySelectorAll('body *')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.x > 0 && r.y < 260 && r.height > 10 && r.width > 0 &&
        e.textContent?.trim() === 'MenuFixture';
    });
    if (!els.length) return null;
    els.sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize));
    const r = els[0].getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (!bb) throw new Error('page title not found');
  return bb;
};
await step('18-title-ctx', async () => {
  const bb = await titleBox();
  await page.mouse.click(bb.x + Math.min(40, bb.w / 2), bb.y + bb.h / 2, { button: 'right' });
  await sleep(900);
});
await escape();
await step('19-block-ctx', async () => {
  const blk = page.locator(SEL.blockText).first();
  await blk.click({ timeout: 4000 }); await sleep(600);
  await page.keyboard.press('Escape'); await sleep(600);
  const rbb = await blk.boundingBox();
  const bullets = page.locator('.bullet-container');
  const bb = await bullets.nth(2).boundingBox().catch(() => null);
  const cx = bb ? bb.x + bb.width / 2 : rbb.x - 12;
  const cy = bb ? bb.y + bb.height / 2 : rbb.y + 10;
  await page.mouse.click(cx, cy, { button: 'right' });
  await sleep(1000);
});
await escape();
await step('20-delete-confirm', async () => { await dots(); await menuItem('Delete page'); });
await escape();
await step('21-set-property', async () => {
  const bb = await titleBox();
  await page.mouse.move(bb.x + bb.w / 2, bb.y + bb.h / 2); await sleep(800);
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
await step('22-help-menu', async () => {
  const btn = page.locator('#help, button:has(.ls-icon-help), [aria-label*="help" i], .toolbar-help-btn, button:has-text("?")').first();
  if (await btn.count()) await btn.click(); else await page.mouse.click(1255, 776);
  await sleep(1000);
});
await escape();

// ---- right sidebar ----
await step('23-right-sidebar', async () => { await page.locator(SEL.rightToggle).click(); await sleep(1500); });
await step('24-sidebar-contents', async () => {
  const tab = page.locator('text="Contents" >> visible=true').first();
  if (await tab.count()) { await tab.click(); await sleep(1200); }
});
await step('25-sidebar-help', async () => {
  const tab = page.locator('text="Help" >> visible=true').first();
  if (await tab.count()) { await tab.click(); await sleep(1200); }
});
await step('26-sidebar-closed', async () => { await page.locator(SEL.rightToggle).click(); await sleep(1000); });
await step('27-recycle', async () => { await dots(); await menuItem('Recycle'); });
await escape();

// ---- all pages / journals / objects ----
await step('28-all-pages', async () => {
  try { await clickText('All pages'); } catch { await page.evaluate(() => { location.hash = '#/all-pages'; }); await sleep(2500); }
});
await step('29-journals-view', async () => {
  try { await clickText('Journals'); } catch { await page.evaluate(() => { location.hash = '#/journals'; }); await sleep(2500); }
});
const tagUuid = async () => page.evaluate(async () => {
  const api = window.logseq.api;
  const tree = await api.get_page_blocks_tree('Seed notes');
  const b = (tree || []).find(x => (x.title || '') === 'Clean Code');
  if (!b) return null;
  const full = await api.get_block(b.uuid || b['block/uuid']);
  const tags = full?.properties?.tags ?? full?.tags ?? [];
  return tags[0]?.uuid ?? null;
});
await step('30-book-objects', async () => {
  const uuid = await tagUuid();
  if (uuid) { await page.evaluate(u => { location.hash = `#/page/${u}`; }, uuid); await sleep(3500); }
  else await clickText('Book');
});
await step('31-table-select', async () => {
  const row = page.locator('tr, [role="row"], .ls-table-row, [class*=table] [class*=row]').nth(1);
  await row.click({ timeout: 5000 }).catch(() => {});
  await row.hover(); await sleep(600);
  const cb = row.locator('input[type="checkbox"], [role="checkbox"], .row-checkbox, [class*=checkbox], [class*=select]').first();
  await cb.click({ timeout: 5000 }).catch(async () => {
    await row.click({ modifiers: ['ControlOrMeta'] }).catch(() => {});
  });
  await sleep(1200);
});
await step('32-column-menu', async () => {
  const hdr = page.locator('th, [role="columnheader"], .table-header *').filter({ hasText: 'author' }).first();
  if (await hdr.count()) { await hdr.click({ timeout: 3000 }).catch(() => {}); await sleep(800); }
  const chev = page.locator('th, [role="columnheader"]').filter({ hasText: 'author' }).locator('button, [role="button"]').first();
  if (await chev.count()) { await chev.click({ timeout: 3000 }); await sleep(900); }
});
await escape();
await step('33-add-property', async () => {
  const ap = page.locator('button:has-text("Add property")').first();
  const ap2 = page.locator('text="Add property" >> visible=true').first();
  const target = (await ap.count()) ? ap : ap2;
  if (await target.count()) { await target.click({ timeout: 4000 }); await sleep(1200); }
});
await escape();
await step('34-object-page', async () => {
  const uuid = await page.evaluate(async () => {
    const tree = await window.logseq.api.get_page_blocks_tree('Seed notes');
    for (const b of tree || []) if ((b.title || '') === 'Clean Code') return b.uuid || b['block/uuid'];
    return null;
  });
  if (uuid) { await page.evaluate(u => { location.hash = `#/page/${u}`; }, uuid); await sleep(3000); }
});
await step('35-page-alpha', async () => { await gotoPage('Page Alpha'); await sleep(2500); });

// ---- flashcards ----
await step('36-flashcards', async () => {
  try { await clickText('Flashcards'); } catch { await page.evaluate(() => { location.hash = '#/flashcards'; }); await sleep(2500); }
  await sleep(1500);
});
await step('37-cards-answers', async () => {
  const btn = page.locator('text="Show answers" >> visible=true, .card-answers >> visible=true').first();
  if (await btn.count()) { await btn.click({ timeout: 4000 }); await sleep(1200); }
  else await page.keyboard.press('s').catch(() => {});
  await sleep(800);
});
await escape();
await escape();

// ---- pdf viewer ----
await step('38-pdf-page', async () => { await gotoPage('PdfFixture'); await sleep(3000); });
await step('39-pdf-viewer', async () => {
  const link = page.locator('.asset-ref.is-pdf, .asset-block, [class*=asset] :text("zlib"), :text-is("zlib"), :text("zlib.pdf")').first();
  await link.click({ timeout: 6000 });
  await sleep(5000);
});

console.log('\n==== RESULTS ====\n' + results.join('\n'));
fs.writeFileSync(`${OUT}/${TAG}-results.txt`, results.join('\n') + '\n');
await ctx.close();
