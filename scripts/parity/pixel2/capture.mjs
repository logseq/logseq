// Round-2 paired captures for the outliner/blocks/editor slice.
// Usage: node capture.mjs master|lui [light|dark]
import fs from 'node:fs';
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const tag = process.argv[2] || 'master';
const theme = process.argv[3] || 'light';
const url = (tag === 'master' ? MASTER_URL : LUI_URL);
const OUT = `/Users/devin/repos/logseq/docs/pixel2-outliner/${theme}`;
fs.mkdirSync(OUT, { recursive: true });
const { ctx, page } = await launch(tag);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 20000);
if (tag === 'lui') {
  await page.evaluate((t) => {
    try {
      localStorage.setItem('theme', `"${t}"`);
      localStorage.setItem('system-theme?', '"false"');
    } catch {}
  }, theme === 'dark' ? 'dark' : 'light');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(15000);
}
// NB: DOM-class dark only — master-internal theme state stays light,
// so code editors keep their light palette (documented harness artifact).
// Must be re-applied after EVERY page.reload on master.
const applyTheme = async () => {
  if (tag !== 'master') return;
  await page.evaluate((t) => {
    try { localStorage.setItem('logseq:theme', t); } catch {}
    const dark = t === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.setAttribute('data-theme', t);
    document.body?.classList.toggle('dark', dark);
  }, theme);
};
await applyTheme();
await page.waitForTimeout(theme === 'dark' ? 1200 : 800);
const pageUrl = url + '#/page/' + await page.evaluate(async () => {
  const p = await window.logseq?.api?.get_page?.('PPFixture');
  return p?.uuid || 'ppfixture';
});
console.log('nav', pageUrl);
await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
await page.waitForSelector('.ui-fenced-code-editor .CodeMirror', { timeout: 15000 }).catch(() => {});
await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
await page.waitForTimeout(800);
const shot = n => page.screenshot({ path: `${OUT}/${tag}-${n}.png` });

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

await scrollTo(0);
await page.waitForTimeout(1500);
await shot('01-top');

await scrollTo(700);
await page.waitForTimeout(1200);
await scrollTo(700);
await page.waitForTimeout(250);
await shot('02-mid');

// bottom: anchor on last block
await page.evaluate(() => {
  const els = [...document.querySelectorAll('body *')]
    .filter(e => e.scrollHeight > e.clientHeight + 50
      && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY))
    .sort((a, b) => b.scrollHeight - a.scrollHeight);
  const sc = els[0] || document.scrollingElement || document.body;
  const blocks = [...sc.querySelectorAll('.ls-block')];
  const last = blocks[blocks.length - 1];
  if (last) {
    const off = last.getBoundingClientRect().bottom - sc.getBoundingClientRect().top + sc.scrollTop;
    sc.scrollTop = off + 64 - sc.clientHeight;
  }
});
await page.waitForTimeout(1200);
await shot('03-bottom');

// block hover affordance: hover middle of "Tags #parity" row
await scrollTo(0);
await page.waitForTimeout(800);
const hoverBlk = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.ls-block')].filter(e =>
    (e.querySelector('.block-title-wrap') || e).textContent.includes('Tags #parity'));
  if (!els.length) return null;
  const r = els[0].getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (hoverBlk) {
  await page.mouse.move(hoverBlk.x + 200, hoverBlk.y + hoverBlk.h / 2);
  await page.waitForTimeout(1000);
  await shot('04-block-hover');
}
// fold chevron hover on "Nested level 0"
const probe = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(e =>
    e.children.length === 0 && e.textContent.trim() === 'Nested level 0');
  if (!els.length) return null;
  const r = els[0].getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (probe) {
  await page.mouse.move(probe.x - 14, probe.y + probe.h / 2);
  await page.waitForTimeout(1200);
  await shot('05-fold-hover');
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
  await shot('06-editing');
  const st = await page.evaluate(() => ({
    active: document.activeElement && document.activeElement.tagName,
    sel: String(getSelection()).slice(0, 40),
  }));
  console.log('EDIT STATE:', JSON.stringify(st));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  await shot('07-after-escape');
}

// block context menu: right-click the bullet of "Inline `code snippet`" block
const ctxBlk = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.ls-block')].filter(e =>
    (e.querySelector('.block-title-wrap') || e).textContent.includes('code snippet'));
  if (!els.length) return null;
  const r = els[0].getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (ctxBlk) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
  await page.mouse.click(ctxBlk.x - 14, ctxBlk.y + ctxBlk.h / 2);
  await page.waitForTimeout(1200);
  await shot('08-ctx-menu');
  const menu = await page.evaluate(() =>
    [...document.querySelectorAll('[role=menuitem], [role=menu] *')]
      .map(e => e.textContent.trim().slice(0, 40)).filter(Boolean).slice(0, 30));
  console.log('CTXMENU:', JSON.stringify(menu));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
}

// AC popups: append a temp block, select-all+clear to empty edit line, type triggers
const tmpUuid = await page.evaluate(async () => {
  const p = await window.logseq.api.get_page('PPFixture');
  const b = await window.logseq.api.append_block_in_page(p.uuid || 'PPFixture', 'ACPROBE', { sibling: false });
  return b?.uuid || b?.['block/uuid'] || null;
});
await page.waitForTimeout(1000);
if (tmpUuid) {
  // LUI doesn't re-render the outliner after an api append — reload
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(tag === 'master' ? 8000 : 12000);
  await applyTheme();
  await page.waitForTimeout(800);
  await page.evaluate((u) => {
    document.querySelector(`.ls-block[data-blockid="${u}"], .ls-block[blockid="${u}"]`)?.scrollIntoView({ block: 'center' });
  }, tmpUuid);
  await page.waitForTimeout(500);
  const tmpRect = await page.evaluate((u) => {
    const el = document.querySelector(`.ls-block[data-blockid="${u}"], .ls-block[blockid="${u}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + 60, y: r.y + r.height / 2 };
  }, tmpUuid);
  if (tmpRect) {
    await page.mouse.click(tmpRect.x, tmpRect.y);
    await page.waitForTimeout(1200);
    // empty the line once, inside edit mode — char-by-char Backspace (NOT
    // Meta+a: if the click didn't enter edit mode, cmd+a in read mode
    // selects EVERY block and Backspace wipes the page on LUI)
    await page.keyboard.press('End');
    for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
    await page.waitForTimeout(400);
    for (const [name, trig] of [['09-slash', '/'], ['10-at', '@'], ['11-dbracket', '[['], ['12-parens', '((']]) {
      await page.keyboard.type(trig, { delay: 60 });
      await page.waitForTimeout(1300);
      await shot(name);
      const ac = await page.evaluate(() =>
        [...document.querySelectorAll('[role=menu] *, [role=listbox] *, [role=dialog] *')]
          .map(e => e.textContent.trim().slice(0, 30)).filter(Boolean).slice(0, 12));
      console.log('AC', name, JSON.stringify(ac));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await page.keyboard.press('End');
      for (let i = 0; i < trig.length; i++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(400);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  await page.evaluate((u) => window.logseq.api.remove_block(u).catch(() => {}), tmpUuid);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(tag === 'master' ? 8000 : 12000);
  await applyTheme();
  await page.waitForTimeout(800);
}

// collapsed state: fold "Collapsible parent" via its chevron
await scrollTo(0);
await page.waitForTimeout(600);
const colp = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(e =>
    e.children.length === 0 && e.textContent.trim() === 'Collapsible parent');
  if (!els.length) return null;
  const r = els[0].getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (colp) {
  await page.mouse.move(colp.x - 14, colp.y + colp.h / 2);
  await page.waitForTimeout(600);
  await page.mouse.click(colp.x - 14, colp.y + colp.h / 2);
  await page.waitForTimeout(1000);
  await shot('13-collapsed');
  await page.mouse.click(colp.x - 14, colp.y + colp.h / 2);
  await page.waitForTimeout(800);
}

// linked references: Alpha page should list the fixture block ref
const alphaUrl = url + '#/page/' + await page.evaluate(async () => {
  const p = await window.logseq?.api?.get_page?.('Alpha');
  return p?.uuid || 'Alpha';
});
await page.goto(alphaUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
await page.evaluate(() => {
  const els = [...document.querySelectorAll('body *')]
    .filter(e => e.scrollHeight > e.clientHeight + 50
      && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
  for (const el of els) el.scrollTop = el.scrollHeight;
});
await page.waitForTimeout(1200);
await shot('14-linked-refs');

console.log('done', tag, theme);
await ctx.close();
