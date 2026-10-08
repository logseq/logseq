// Capture paired screenshots of the app-chrome slice.
// Usage: node capture-chrome.mjs master|lui [light|dark]
// Master = app.logseq.com (reference only), LUI = localhost:3003 rtc-test.
import fs from 'node:fs';
import { launch } from './lib.mjs';

const tag = process.argv[2] || 'master';
const theme = process.argv[3] || 'light';
const URL_ = tag === 'master' ? 'https://app.logseq.com/' : 'http://localhost:3003/index.html?rtc-test=true';
const OUT = `/Users/devin/repos/logseq/docs/pixel2-chrome/${theme}`;
fs.mkdirSync(OUT, { recursive: true });

const { ctx, page } = await launch(tag);
page.on('pageerror', e => console.log(`PAGEERR[${tag}]:`, String(e).slice(0, 250)));
await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 25000 : 18000);

// theme: storage + reload (master keeps graph in profile; LUI is
// re-seeded after reload anyway — see seed() below). cljs master reads
// (storage/get :ui/theme) -> key "ui/theme" holding an edn string;
// LUI reads "theme". Write both impls' keys.
await page.evaluate(([t, tag_]) => {
  try {
    localStorage.setItem('ui/theme', `"${t}"`);
    localStorage.setItem('ui/system-theme?', 'false');
    localStorage.setItem('theme', `"${t}"`);
    localStorage.setItem('logseq:theme', t);
    localStorage.setItem('system-theme?', 'false');
  } catch {}
}, [theme, tag]);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 25000 : 18000);

// ---- seed identical fixture on both sides ----
// Pages: Alpha, Beta, Foo/Bar/Baz (namespaced for breadcrumbs).
// Master auto-records create_page targets into Recent; LUI records only
// explicit in-app navigation — so we also navigate Alpha -> Beta -> Baz
// on both sides to produce the same [Baz, Beta, Alpha] recent order.
const seed = async () => {
  const log = await page.evaluate(async () => {
    const api = window.logseq.api; const out = [];
    for (const name of ['Alpha', 'Beta', 'Foo/Bar/Baz']) {
      try {
        const existing = await api.get_page(name).catch(() => null);
        const p = existing || await api.create_page(name);
        out.push(name + ':' + (p?.uuid ? 'ok' : 'no-uuid'));
      } catch (e) { out.push(name + ':FAIL ' + String(e).slice(0, 80)); }
    }
    try {
      const a = await api.get_page('Alpha');
      const tree = await api.get_page_blocks_tree('Alpha');
      if (!(tree || []).some(b => String(b.content || b.title || '').includes('searchable')))
        await api.append_block_in_page(a.uuid || 'Alpha', 'Alpha searchable content block');
      // drop stale fixture blocks from earlier sessions (persistent profile)
      for (const b of tree || [])
        if (!String(b.content || b.title || '').includes('searchable'))
          await api.remove_block(b.uuid).catch(() => {});
    } catch (e) { out.push('blk:' + String(e).slice(0, 60)); }
    return out;
  });
  console.log('SEED:', JSON.stringify(log));
};
await seed();

const gotoPage = async (name) => {
  await page.evaluate(async (n) => {
    const p = await window.logseq.api.get_page(n);
    if (p?.uuid) location.hash = '#/page/' + p.uuid;
  }, name);
  await page.waitForTimeout(1500);
};

// recents order: visit Alpha, Beta, Baz on both
for (const n of ['Alpha', 'Beta', 'Foo/Bar/Baz']) await gotoPage(n);

// favorite Alpha + Beta via the page dots menu on both sides
const openDots = async () => {
  if (tag === 'lui') await page.locator('.toolbar-dots-btn').click({ timeout: 8000 });
  else await page.mouse.click(1223, 24);
  await page.waitForTimeout(1000);
};
const clickMenuItem = async (re) => {
  const item = page.locator('.ui__dropdown-menu-item, [role=menuitem], .lui-menu-item')
    .filter({ hasText: re }).first();
  await item.click({ timeout: 6000 });
  await page.waitForTimeout(1200);
};
for (const n of ['Alpha', 'Beta']) {
  await gotoPage(n);
  await openDots();
  await clickMenuItem(/add to favorites/i).catch(e => console.log(`FAV ${n}:`, String(e).slice(0, 100)));
}
await gotoPage('Alpha');

// Normalize persisted chrome state: recents are recorded differently per
// impl (master also counts create_page; LUI counts only marked in-app
// navs), and the sidebar width persisted from earlier drag sessions.
// Write identical storage per impl's own serialization, then reload.
await page.evaluate(async (tag_) => {
  const api = window.logseq.api;
  const idOf = async (n) => {
    const r = await api.datascript_query(`[:find ?e :where [?e :block/name "${n}"]]`).catch(() => null);
    return r && r[0] && r[0][0];
  };
  const baz = await idOf('baz'), beta = await idOf('beta'), alpha = await idOf('alpha');
  if (baz && beta && alpha) {
    // cljs reads :ui/recent-pages (edn map repo->ids); LUI reads "recent-pages"
    localStorage.setItem('recent-pages', `{"logseq_db_Demo" [${baz} ${beta} ${alpha}]}`);
    localStorage.setItem('ui/recent-pages', `{"logseq_db_Demo" [${baz} ${beta} ${alpha}]}`);
  }
  // cljs persists pr-str ("240.00px" quoted); LUI persists the raw string
  localStorage.setItem('ls-left-sidebar-width',
    tag_ === 'lui' ? '240.00px' : '"240.00px"');
}, tag);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 20000 : 15000);

const shot = n => page.screenshot({ path: `${OUT}/${tag}-${n}.png` });

// Persistent profiles may restore a previous sidebar/modal state — normalize.
const ensureSidebar = async () => {
  const isOpen = await page.evaluate(() => {
    const el = document.querySelector('.left-sidebar-inner');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 50 && r.left >= 0;
  });
  if (!isOpen) {
    await page.locator('#left-menu').click();
    await page.waitForFunction(() => {
      const el = document.querySelector('.left-sidebar-inner');
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 50 && r.left >= 0;
    }, undefined, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(700);
  }
};
const ensureRightClosed = async () => {
  const isOpen = await page.evaluate(() => {
    const r = document.querySelector('.right-sidebar-inner, .cp__right-sidebar');
    return !!r && r.getBoundingClientRect().width > 10;
  });
  if (isOpen) {
    await page.locator('[class*=toggle-right-sideb]').last().click().catch(() => {});
    await page.waitForTimeout(700);
  }
};
const esc = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(800); };
const closeOverlays = async () => {
  for (let i = 0; i < 3; i++) {
    const overlay = await page.evaluate(() =>
      [...document.querySelectorAll('[role=dialog], [class*=palette], [class*=modal-content], [class*=dropdown-menu-content]')]
        .some(e => { const r = e.getBoundingClientRect(); return r.width > 200 && r.height > 150; }));
    if (!overlay) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
  }
};

// ---- states ----
// 01 sidebar open
await ensureSidebar();
await shot('01-sidebar');

// 02 row hover on favorite Alpha
const favRow = page.locator('.favorites a, .favorites .lui-row.item, .favorites .item').filter({ hasText: 'Alpha' }).first();
const favBox = await favRow.boundingBox().catch(() => null);
if (favBox) {
  await page.mouse.move(favBox.x + favBox.width / 2, favBox.y + favBox.height / 2);
  await page.waitForTimeout(900);
}
await shot('02-row-hover');

// 03 context menu on favorite row
if (favBox) {
  await page.mouse.click(favBox.x + favBox.width / 2, favBox.y + favBox.height / 2, { button: 'right' });
  await page.waitForTimeout(1200);
}
await shot('03-ctx-fav');
await esc();

// 04 collapse Favorites section
const favHd = page.locator('.favorites .hd, .favorites [class*=hd]').first();
await favHd.click({ timeout: 5000 }).catch(e => console.log('favhd:', String(e).slice(0, 80)));
await page.waitForTimeout(900);
await shot('04-collapsed');
await favHd.click().catch(() => {});
await page.waitForTimeout(600);

// 05 resize: drag left-sidebar-resizer +60px, then back
const resizer = await page.evaluate(() => {
  const r = document.querySelector('.left-sidebar-resizer, [class*=resizer]');
  return r ? r.getBoundingClientRect().toJSON() : null;
});
if (resizer) {
  await page.mouse.move(resizer.x + resizer.width / 2, resizer.y + 200);
  await page.mouse.down();
  await page.mouse.move(resizer.x + resizer.width / 2 + 60, resizer.y + 200, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(900);
}
// drag endpoints land a few px apart across impls — pin the rendered
// width before comparing the resized chrome look
await page.evaluate(() => {
  document.documentElement.style.setProperty('--ls-left-sidebar-width', '300px');
  const el = document.querySelector('.left-sidebar-inner, #left-sidebar');
  if (el) el.style.width = '300px';
});
await page.waitForTimeout(700);
await shot('05-resized');
if (resizer) {
  const r2 = await page.evaluate(() => {
    const r = document.querySelector('.left-sidebar-resizer, [class*=resizer]');
    return r ? r.getBoundingClientRect().toJSON() : null;
  });
  if (r2) {
    await page.mouse.move(r2.x + r2.width / 2, r2.y + 200);
    await page.mouse.down();
    await page.mouse.move(r2.x + r2.width / 2 - 60, r2.y + 200, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(600);
  }
}

// 06 namespaced page -> breadcrumbs in header
await gotoPage('Foo/Bar/Baz');
await page.waitForTimeout(800);
await shot('06-header-ns');

// 07 right sidebar open
await ensureRightClosed();
const toggle = page.locator('[class*=toggle-right-sideb]').last();
await toggle.click({ timeout: 6000 }).catch(async () => page.mouse.click(1256, 24));
await page.waitForTimeout(1500);
await shot('07-right-sidebar');

// 08 close right sidebar
await page.keyboard.press('Escape').catch(() => {});
await toggle.click({ timeout: 6000 }).catch(async () => page.mouse.click(1256, 24));
await page.waitForTimeout(900);
await shot('08-right-closed');

// 09 cmdk palette
await page.keyboard.press(tag === 'master' ? 'Control+k' : 'Meta+k').catch(() => {});
if (tag === 'master') await page.keyboard.press('Meta+k').catch(() => {});
await page.waitForTimeout(1500);
await shot('09-cmdk');

// 10 search AC: type a query
await page.keyboard.type('Alpha', { delay: 50 });
await page.waitForTimeout(1800);
await shot('10-search-ac');
await esc();

// 11 command results: reopen palette in command mode
await page.keyboard.press('Meta+k').catch(() => {});
await page.keyboard.press('Control+k').catch(() => {});
await page.waitForTimeout(1000);
await page.keyboard.type('>toggle', { delay: 50 });
await page.waitForTimeout(1500);
await shot('11-command');
await closeOverlays();

// 12 graph switcher dropdown
if (tag === 'lui') {
  await page.locator('.cp__graphs-selector').first().click({ timeout: 6000 })
    .catch(e => console.log('gsw:', String(e).slice(0, 80)));
} else {
  await page.locator('.sidebar-graphs').first().click({ timeout: 6000 })
    .catch(async () => page.mouse.click(70, 68));
}
await page.waitForTimeout(1500);
await shot('12-graph-switcher');
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

console.log('done', tag, theme);
await ctx.close();
