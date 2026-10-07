// Edit-mode vs read-mode non-editor-region pixel parity.
// Screenshot the page, click into a block, screenshot again, mask the
// editing element (+caret) out of both images, pixelmatch the rest.
// Usage: node probe-editparity.mjs [lui|master] [blockIdx]
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';
import { FIXTURE_PAGE } from './fixture.mjs';
import { PNG } from '/Users/devin/parity-tools/node_modules/pngjs/lib/png.js';
import pixelmatch from '/Users/devin/parity-tools/node_modules/pixelmatch/index.js';
import fs from 'node:fs';

const tag = process.argv[2] || 'lui';
const blockIdx = Number(process.argv[3] ?? 1);
const OUT = `/tmp/editparity-${tag}-${blockIdx}`;
fs.mkdirSync(OUT, { recursive: true });

const { ctx, page } = await launch(tag);
const url = tag === 'master' ? MASTER_URL : LUI_URL;
const wait = tag === 'master' ? 12000 : 20000;
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(wait);
await page.keyboard.press('Escape').catch(() => {});
await page.goto(url + '#/page/' + FIXTURE_PAGE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
await page.waitForSelector('.ls-block', { timeout: 15000 });
await page.waitForTimeout(500);

const blocks = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.ls-block[blockid]')).map((b) => ({
    uuid: b.getAttribute('blockid'),
    rect: (() => { const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })(),
  })));
const blk = blocks[blockIdx];
console.log('block', blockIdx, blk.uuid, JSON.stringify(blk.rect));
// bring the block inside the viewport (page can be taller than 800px)
await page.evaluate((u) => {
  document.querySelector(`.ls-block[blockid="${u}"]`)
    ?.scrollIntoView({ block: 'center' });
}, blk.uuid);
await page.waitForTimeout(400);

// wait for geometric settle like probe-caret does
async function settle() {
  let last = null;
  for (let i = 0; i < 12; i++) {
    const r = await page.evaluate((u) => {
      const b = document.querySelector(`.ls-block[blockid="${u}"]`);
      const t = b?.querySelector('.block-title-wrap.lui-text, .block-title-wrap');
      const rr = (t || b)?.getBoundingClientRect();
      return rr ? { x: rr.x, y: rr.y, h: rr.height } : null;
    }, blk.uuid);
    if (last && r && Math.abs(r.x - last.x) < 0.5 && Math.abs(r.y - last.y) < 0.5 && Math.abs(r.h - last.h) < 0.5) return;
    last = r;
    await page.waitForTimeout(150);
  }
}
await settle();

const readShot = `${OUT}/read.png`;
await page.screenshot({ path: readShot });

// click into the block's rendered text (not a link/delim zone)
const pt = await page.evaluate((u) => {
  const b = document.querySelector(`.ls-block[blockid="${u}"]`);
  const t = b?.querySelector('.block-title-wrap.lui-text, .block-title-wrap, .block-content-inner, .inline') || b;
  if (!t) return null;
  const walker = document.createTreeWalker(t, NodeFilter.SHOW_TEXT);
  let n, first = null;
  while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue;
    if (n.parentElement?.closest('.ed-delim')) continue;
    if (n.parentElement?.closest('a,button')) continue;
    first = n; break;
  }
  if (!first) return null;
  const r = document.createRange();
  const off = Math.min(4, first.textContent.length - 1);
  r.setStart(first, off); r.setEnd(first, off);
  const c = r.getClientRects()[0];
  return c ? { x: c.x + Math.min(2, c.width / 2), y: c.y + c.height / 2 } : null;
}, blk.uuid);
console.log('click at', JSON.stringify(pt));
await page.mouse.click(pt.x, pt.y);
await page.waitForTimeout(900);

const ed = await page.evaluate((u) => {
  // the editing element: LUI emits .block-editor; master's textarea sits in
  // the block body — mask the whole editing block's title region either way
  const e = document.querySelector('.block-editor') ||
    document.querySelector(`.ls-block[blockid="${u}"] textarea`)?.closest('.block-body') ||
    document.querySelector('textarea');
  if (!e) return null;
  const r = e.getBoundingClientRect();
  const cls = new Set();
  e.querySelectorAll('*').forEach((x) => x.classList.forEach((c) => cls.add(c)));
  return { rect: { x: r.x, y: r.y, w: r.width, h: r.height }, cls: e.className, classes: [...cls].filter((c) => c.includes('caret') || c.includes('cursor') || c.includes('sel')) };
}, blk.uuid);
console.log('editor', JSON.stringify(ed));

if (!ed) { console.log(JSON.stringify({ err: 'no-editor' })); await ctx.close(); process.exit(0); }

// hide any caret/selection overlay so blink doesn't flake the diff, then reshoot
await page.evaluate(() => {
  const s = document.createElement('style');
  s.textContent = '.ed-caret, .ed-caret-overlay, [class*="caret"] { visibility: hidden !important; }';
  document.head.appendChild(s);
});
await page.waitForTimeout(120);
const editShot = `${OUT}/edit.png`;
await page.screenshot({ path: editShot });

// diff: mask the editor rect (inflated 2px) out of BOTH images
const a = PNG.sync.read(fs.readFileSync(readShot));
const b = PNG.sync.read(fs.readFileSync(editShot));
const mask = ed ? ed.rect : null;
const pad = 2;
for (let y = 0; y < a.height; y++)
  for (let x = 0; x < a.width; x++) {
    const inside = mask && x >= mask.x - pad && x <= mask.x + mask.w + pad && y >= mask.y - pad && y <= mask.y + mask.h + pad;
    if (inside) {
      const i = (y * a.width + x) * 4;
      a.data[i] = a.data[i + 1] = a.data[i + 2] = 0; a.data[i + 3] = 255;
      b.data[i] = b.data[i + 1] = b.data[i + 2] = 0; b.data[i + 3] = 255;
    }
  }
const diffImg = new PNG({ width: a.width, height: a.height });
const diffPx = pixelmatch(a.data, b.data, diffImg.data, a.width, a.height, { threshold: 0.1 });
fs.writeFileSync(`${OUT}/diff.png`, PNG.sync.write(diffImg));
const pct = ((diffPx / (a.width * a.height)) * 100).toFixed(3);
console.log(JSON.stringify({ diffPx, pct, mask }, null, 1));
await ctx.close();
