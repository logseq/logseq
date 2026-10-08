// Parity-r3 paired captures: one app through the full surface checklist.
// Usage: node capture.mjs master|lui [light|dark] [width]
// Output: docs/parity-r3-shots/<theme>-<width>/<tag>-<NN>-<name>.png
import fs from 'node:fs';
import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';

const tag = process.argv[2] || 'master';
const theme = process.argv[3] || 'light';
const WIDTH = Number(process.argv[4]) || 1440;
const url = tag === 'master' ? 'http://localhost:3001/' : 'http://localhost:3003/index.html?rtc-test=true';
const OUT = `/Users/devin/repos/logseq-r3/docs/parity-r3-shots/${theme}-${WIDTH}`;
fs.mkdirSync(OUT, { recursive: true });

const ctx = await chromium.launchPersistentContext(`/Users/devin/parity-profiles/${tag}`, {
  channel: 'chrome', headless: true, viewport: { width: WIDTH, height: 900 },
});
// identical theme selection on both: explicit (non-system) theme so the
// settings screen's selected card matches too. Master reads these keys at
// boot; LUI already honored them via the post-load write+reload below.
await ctx.addInitScript(([t]) => {
  localStorage.setItem('theme', JSON.stringify(t));
  localStorage.setItem('system-theme?', 'false');
}, [theme]);
const page = ctx.pages()[0] || (await ctx.newPage());
page.on('pageerror', e => console.log(`PAGEERR[${tag}]:`, String(e).slice(0, 250)));
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

const sleep = ms => page.waitForTimeout(ms);
const shot = async n => page.screenshot({ path: `${OUT}/${tag}-${n}.png` });
const step = async (name, fn) => {
  try { await fn(); await shot(name); console.log(`OK  ${name}`); }
  catch (e) {
    console.log(`FAIL ${name} ${String(e).slice(0, 160)}`);
    try { await shot(name + '-state'); } catch {}
  }
};
const evalApi = (fn, arg) => page.evaluate(fn, arg);
const pageUuid = async name => {
  const p = await evalApi(async n => {
    const r = await window.logseq.api.get_page(n);
    return r && (r.uuid || r['block/uuid']);
  }, name);
  return p;
};
// hash nav (no reload) + give the view time to settle
const go = async hash => { await evalApi(h => { location.hash = h; }, hash); await sleep(2600); };
const scrollTo = y => page.evaluate(y => {
  const els = [...document.querySelectorAll('body *')]
    .filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY))
    .sort((a, b) => b.scrollHeight - a.scrollHeight);
  if (y === 0) { for (const el of els) el.scrollTop = 0; return; }
  for (const el of els) { el.scrollTop = y; if (el.scrollTop !== 0) return; }
  window.scrollTo(0, y);
}, y);
// master dark: DOM-class hack — internal theme state stays light
const applyTheme = async () => {
  if (tag !== 'master') return;
  await page.evaluate(t => {
    const dark = t === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.setAttribute('data-theme', t);
    document.body?.classList.toggle('dark', dark);
  }, theme);
};
const clearOverlays = () => page.evaluate(() => {
  document.querySelectorAll('.ui__dialog-overlay, .cp__cmdk, .cp__cmdk-search').forEach(e => e.remove());
});
const escape = async () => { await page.keyboard.press('Escape'); await sleep(500); };
const clearTyped = async n => { for (let i = 0; i < n; i++) { await page.keyboard.press('Backspace'); await sleep(80); } };

await page.goto(url, { waitUntil: 'domcontentloaded' });
await sleep(tag === 'master' ? 12000 : 18000);
if (tag === 'lui') {
  await page.evaluate(t => {
    localStorage.setItem('theme', `"${t}"`);
    localStorage.setItem('system-theme?', '"false"');
  }, theme);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(14000);
}
await applyTheme();
await sleep(800);

// normalize persisted UI state: left sidebar must start closed
// (step 21 leaves it open in the profile between runs)
{
  const open = await page.evaluate(() => {
    const el = document.querySelector('#left-sidebar, .cp__left-sidebar, .left-sidebar-inner, #left-sidebar-container');
    return !!el && el.getBoundingClientRect().width > 100;
  });
  if (open) {
    const b = page.locator('#left-menu').first();
    if (await b.count()) await b.click(); else await page.mouse.click(25, 24);
    await sleep(1200);
  }
}

const PP = await pageUuid('PPFixture');
const ALPHA = await pageUuid('Alpha');
console.log('uuids', PP, ALPHA);

await step('01-journals', async () => {
  await go('#/');
  await scrollTo(0); await sleep(800);
});
await step('02-page-top', async () => {
  await go('#/page/' + PP);
  await scrollTo(0); await sleep(1000);
});
await step('03-page-mid', async () => {
  await scrollTo(650); await sleep(1200); await scrollTo(650); await sleep(300);
});
await step('04-page-bottom', async () => {
  await page.evaluate(() => {
    const els = [...document.querySelectorAll('body *')]
      .filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
    for (const el of els) el.scrollTop = el.scrollHeight;
  });
  await sleep(1200);
});
await step('05-block-hover', async () => {
  await scrollTo(0); await sleep(600);
  const blk = page.locator('.ls-block[data-blockid], [blockid]').nth(2);
  await blk.hover(); await sleep(900);
});
await step('06-caret', async () => {
  const blk = page.locator('.ls-block[data-blockid] .block-content, [blockid] .block-content').nth(1);
  await blk.click(); await sleep(1200);
});
await step('07-selected', async () => {
  await escape(); await sleep(600);
});
// ---- block ACs on a scratch page ----
await step('08-ac-page', async () => {
  await evalApi(async () => {
    try { await window.logseq.api.delete_page('ACProbe'); } catch {}
    await new Promise(r => setTimeout(r, 800));
    await window.logseq.api.create_page('ACProbe');
  });
  const u = await pageUuid('ACProbe');
  await go('#/page/' + u);
  await sleep(1500);
});
const intoFirstBlock = async () => {
  // click the (empty) first block to get a caret
  const blk = page.locator('.ls-block[data-blockid] .block-content, [blockid] .block-content').first();
  await blk.click(); await sleep(1000);
};
await step('09-slash', async () => {
  await intoFirstBlock();
  await page.keyboard.type('/', { delay: 60 }); await sleep(1200);
  await shot('09-slash-open');
  await escape();
});
await step('10-dbracket', async () => {
  await clearTyped(1);
  await page.keyboard.type('[[', { delay: 60 }); await sleep(1200);
  await shot('10-dbracket-open');
  await escape();
});
await step('11-parens', async () => {
  await clearTyped(2);
  await page.keyboard.type('((', { delay: 60 }); await sleep(1200);
  await shot('11-parens-open');
  await escape();
});
await step('12-at', async () => {
  await clearTyped(2);
  await page.keyboard.type('@', { delay: 60 }); await sleep(1200);
});
await step('13-all-pages', async () => {
  await escape();
  await go('#/all-pages');
  await sleep(1500);
});
await step('14-right-sidebar', async () => {
  await evalApi(async u => { await window.logseq.api.open_in_right_sidebar(u); }, PP).catch(async () => {
    // fallback: shift-click the Alpha link in sidebar
    const l = page.locator('.left-sidebar-inner a', { hasText: 'Alpha' }).first();
    await l.click({ modifiers: ['Shift'] });
  });
  await sleep(1800);
});
await step('15-right-sidebar-close', async () => {
  await page.keyboard.press('Meta+Shift+w').catch(() => {});
  await page.evaluate(() => {
    document.querySelectorAll('.cp__right-sidebar [title*=lose i], .cp__right-sidebar button').forEach(b => {});
  });
  // toggle sidebar closed via header button if still open
  const open = await page.locator('.cp__right-sidebar.open, .cp__right-sidebar-inner').count();
  if (open) {
    const t = page.locator('.toggle-right-sidebar').first();
    if (await t.count()) await t.click();
    await sleep(800);
  }
});
await step('16-cmdk', async () => {
  await page.keyboard.press('Meta+k'); await sleep(1400);
});
await step('17-search', async () => {
  await page.keyboard.type('quixotic', { delay: 40 }); await sleep(1600);
});
await step('18-settings', async () => {
  await escape(); await clearOverlays();
  await go('#/settings');
  await sleep(1500);
});
await step('19-dots-menu', async () => {
  await go('#/page/' + PP);
  await page.mouse.click(WIDTH - 54, 24); await sleep(1000);
});
await step('20-ctx-menu', async () => {
  await escape(); await clearOverlays();
  await scrollTo(0); await sleep(400);
  const bullet = page.locator('.ls-block .bullet, [blockid] .bullet, .bullet-container').first();
  if (await bullet.count()) await bullet.click({ button: 'right', timeout: 5000 });
  await sleep(1200);
});
await step('21-sidebar-open', async () => {
  await escape(); await clearOverlays();
  const b = page.locator('#left-menu');
  if (await b.count()) await b.click(); else await page.mouse.click(25, 24);
  await sleep(1200);
});
console.log('done', tag, theme, WIDTH);
await ctx.close();
