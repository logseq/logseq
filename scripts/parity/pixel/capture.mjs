// Capture paired screenshots of the PixelParity page.
// Usage: node capture.mjs master|lui [light|dark]
import fs from 'node:fs';
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const tag = process.argv[2] || 'master';
const theme = process.argv[3] || 'light';
const url = (tag === 'master' ? MASTER_URL : LUI_URL);
const OUT = `/Users/devin/repos/logseq/docs/pixel-blocks/${theme}`;
fs.mkdirSync(OUT, { recursive: true });
const { ctx, page } = await launch(tag);
// persistent profile may restore an arbitrary page (or about:blank) —
// navigate to the app origin first so localStorage writes land on it
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 20000);
if (tag === 'lui') {
  // LUI reads `theme` (JSON-quoted) at boot; a signal re-applies it on
  // render so class hacks get reverted — set storage and reload. The
  // profile persists localStorage across runs, so the light path must
  // explicitly reset it too.
  await page.evaluate((t) => {
    try {
      localStorage.setItem('theme', `"${t}"`);
      localStorage.setItem('system-theme?', '"false"');
    } catch {}
  }, theme === 'dark' ? 'dark' : 'light');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(15000);
} else if (theme === 'dark') {
    await page.evaluate(() => {
      try { localStorage.setItem('logseq:theme', 'dark'); } catch {}
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body?.classList.add('dark');
    });
    await page.waitForTimeout(1200);
}
// name routes can resolve to a stale Recycle twin on LUI (delete_page
// recycles rather than removes); the live page's uuid route is exact
const pageUrl = url + '#/page/' + await page.evaluate(async () => {
  const p = await window.logseq?.api?.get_page?.('PPFixture');
  return p?.uuid || 'ppfixture';
});
console.log('nav', pageUrl);
await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
// LUI mounts CodeMirror async; wait for it (or give up) so its reflow
// doesn't shift content between the scroll and the screenshot
await page.waitForSelector('.ui-fenced-code-editor .CodeMirror', { timeout: 15000 }).catch(() => {});
await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
await page.waitForTimeout(800);
const shot = n => page.screenshot({ path: `${OUT}/${tag}-${n}.png` });

// the page scrolls inside .cp__sidebar-main-content (master) /
// .lui-scroll (lui), not the window
const scrollTo = y => page.evaluate((y) => {
  const els = [...document.querySelectorAll('body *')]
    .filter(e => e.scrollHeight > e.clientHeight + 50
      && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY))
    .sort((a, b) => b.scrollHeight - a.scrollHeight);
  if (y === 0) {
    for (const el of els) el.scrollTop = 0;
    return 'all';
  }
  for (const el of els) {
    el.scrollTop = y;
    if (el.scrollTop !== 0) return el.className.slice(0, 40);
  }
  window.scrollTo(0, y);
  return 'window';
}, y);

// settle scroll at top
await scrollTo(0);
await page.waitForTimeout(1500);
await shot('01-top');

// scroll to mid (jump by 700px)
await scrollTo(700);
await page.waitForTimeout(1200);
await scrollTo(700); // re-apply: async mounts (CodeMirror) reflow content after scroll
await page.waitForTimeout(250);
console.log('DBG', tag, JSON.stringify(await page.evaluate(() => {
  const sc = [...document.querySelectorAll('body *')]
    .filter(e => e.scrollHeight > e.clientHeight + 50
      && ['auto','scroll'].includes(getComputedStyle(e).overflowY))
    .sort((a,b) => b.scrollHeight - a.scrollHeight)[0];
  const cjk = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.startsWith('中文混排'));
  return { st: sc.scrollTop, sh: sc.scrollHeight, scTop: Math.round(sc.getBoundingClientRect().top), cjkY: cjk ? Math.round(cjk.getBoundingClientRect().y) : -1 };
})));
await shot('02-mid');
// bottom: anchor on the last block so dead-space differences between the
// two scroll containers don't shift the compared region
await page.evaluate(() => {
  const els = [...document.querySelectorAll('body *')]
    .filter(e => e.scrollHeight > e.clientHeight + 50
      && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY))
    .sort((a, b) => b.scrollHeight - a.scrollHeight);
  const sc = els[0];
  const blocks = [...sc.querySelectorAll('.ls-block')];
  const last = blocks[blocks.length - 1];
  const off = last.getBoundingClientRect().bottom - sc.getBoundingClientRect().top + sc.scrollTop;
  sc.scrollTop = off + 64 - sc.clientHeight;
});
await page.waitForTimeout(1200);
await shot('03-bottom');

// back to top; hover the bullet of "Nested level 0" for fold arrow
await scrollTo(0);
await page.waitForTimeout(800);
const probe = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(e =>
    e.children.length === 0 && e.textContent.trim() === 'Nested level 0');
  if (!els.length) return null;
  const r = els[0].getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (probe) {
  // hover left gutter near the bullet (~28px left of text start)
  await page.mouse.move(probe.x - 14, probe.y + probe.h / 2);
  await page.waitForTimeout(1200);
  await shot('04-fold-hover');
}

// click into the "Plain text block" to enter editing
const plain = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(e =>
    e.children.length === 0 && e.textContent.trim().startsWith('Plain text block'));
  if (!els.length) return null;
  const r = els[0].getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
if (plain) {
  await page.mouse.click(plain.x, plain.y);
  await page.waitForTimeout(1500);
  await shot('05-editing');
  const st = await page.evaluate(() => ({
    active: document.activeElement && document.activeElement.tagName,
    sel: String(getSelection()).slice(0, 40),
  }));
  console.log('EDIT STATE:', JSON.stringify(st));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  await shot('06-after-escape');
}
console.log('done', tag, theme);
await ctx.close();
