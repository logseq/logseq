// Node-ref caret positioning parity: for the [[Alpha]] block, walk
// ArrowLeft/Right across the pill and record the raw caret offset
// (via a § marker read back from the editing surface), then delete it.
// Both sides must agree — master's textarea is raw markdown, LUI is
// rich text whose [[ ]] reveal only inside the ref.
// Usage: node probe-ref-caret.mjs master|lui
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const tag = process.argv[2];
const url = tag === 'master' ? MASTER_URL : LUI_URL;
const { page, ctx } = await launch(tag);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 20000);
const pu = await page.evaluate(async () => (await window.logseq.api.get_page('PPFixture'))?.uuid);
const nav = async () => {
  await page.goto(url + '#/page/' + pu, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
};
await nav();

const BLK = 'Page ref [[Alpha]] and another [[Beta Page]] inline.';
const blkUuid = await page.evaluate(async (t) => {
  const tree = await window.logseq.api.get_page_blocks_tree('PPFixture');
  const b = tree.find(x => (x.content || x['block/content'] || '').includes('Alpha'));
  return b?.uuid || b?.['block/uuid'];
});
console.log('blk', blkUuid);

const blockPt = async () => page.evaluate(() => {
  const el = [...document.querySelectorAll('.ls-block')].find(b => b.textContent.includes('Alpha'));
  const t = [...el.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.includes('Page ref'));
  const r = t.getBoundingClientRect();
  return { x: r.x + 4, y: r.y + r.height / 2 };
});

const readCaret = async () => {
  await page.keyboard.type('§');
  await page.waitForTimeout(400);
  const idx = await page.evaluate(() => {
    const ta = document.querySelector('textarea.uniline-block');
    if (ta && ta.value) return { idx: ta.value.indexOf('§'), src: ta.value.slice(0, 60) };
    const ed = document.querySelector('.block-editor');
    if (ed) {
      const t = ed.textContent.replace(/​/g, '');
      return { idx: t.indexOf('§'), src: t.slice(0, 60) };
    }
    return { idx: -2 };
  });
  // remove the marker: Escape then select-all-delete the § via undo
  await page.keyboard.press(tag === 'master' ? 'Escape' : 'Escape');
  await page.waitForTimeout(300);
  const cur = await page.evaluate(async (u) => {
    const b = await window.logseq.api.get_block(u);
    return String(b?.content || b?.title || '');
  }, blkUuid);
  if (cur !== BLK) {
    await page.evaluate(async ([u, c]) => window.logseq.api.update_block(u, c), [blkUuid, BLK]);
    await page.waitForTimeout(400);
  }
  return idx;
};

const results = [];
for (const n of [6, 7, 8, 9, 10, 11, 15, 16, 17, 18, 19, 29, 30, 31, 32, 33, 42, 43, 44]) {
  const pt = await blockPt();
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(1200);
  const editing = await page.evaluate(() => document.activeElement?.tagName);
  if (editing !== 'TEXTAREA') { results.push({ n, err: 'no edit' }); await nav(); continue; }
  await page.keyboard.press('Home');
  await page.waitForTimeout(200);
  for (let i = 0; i < n; i++) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const r = await readCaret();
  results.push({ left: n, ...r });
  await nav();
}
console.log(JSON.stringify(results));
await ctx.close();
