// Supplemental PPFixture blocks + CardsTest page for round-2 coverage.
// Usage: node seed-extra.mjs master|lui
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const tag = process.argv[2] || 'master';
const url = tag === 'master' ? MASTER_URL : LUI_URL;
const { ctx, page } = await launch(tag);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 20000);

const api = {
  get: n => page.evaluate(n => window.logseq.api.get_page(n), n),
  create: n => page.evaluate(n => window.logseq.api.create_page(n), n),
  append: (p, c) => page.evaluate(
    ([p, c]) => window.logseq.api.append_block_in_page(p, c, { sibling: false }), [p, c]),
  tree: n => page.evaluate(n => window.logseq.api.get_page_blocks_tree(n), n),
};

const EXTRA = [
  'DOING Clocked task',
  ':LOGBOOK:\nCLOCK: [2026-10-07 Wed 09:00]--[2026-10-07 Wed 10:30] =>  01:30\n:END:',
  'SCHEDULED: <2026-10-10 Sat> Task with schedule',
  'DEADLINE: <2026-10-12 Mon> Task with deadline',
  '{{embed [[Alpha]]}}',
];

const p = await api.get('PPFixture');
const puuid = p?.uuid || 'PPFixture';
const t0 = await api.tree(puuid);
const tops = Array.isArray(t0) ? t0 : (t0?.children || []);
const existing = new Set(tops.map(n => (n.content || n['block/content'] || '').slice(0, 20)));
for (const c of EXTRA) {
  if (existing.has(c.slice(0, 20))) { console.log('skip dup', c.slice(0, 30)); continue; }
  const r = await api.append(puuid, c);
  console.log('added', (r?.uuid || '').slice(0, 8), c.slice(0, 40));
  await page.waitForTimeout(120);
}

// CardsTest page: one card-tagged block with an answer child
const cp = await api.get('CardsTest');
if (!cp) {
  await api.create('CardsTest');
  await page.waitForTimeout(1200);
  const cp2 = await api.get('CardsTest');
  const cpu = cp2?.uuid || 'CardsTest';
  const t1 = await api.tree(cpu);
  const tops1 = Array.isArray(t1) ? t1 : (t1?.children || []);
  for (const n of tops1) {
    const u = n.uuid || n['block/uuid'];
    if (u) await page.evaluate(u => window.logseq.api.remove_block(u), u).catch(() => {});
  }
  const qb = await api.append(cpu, 'What is the capital of France? #card');
  const qu = qb?.uuid || qb?.['block/uuid'];
  if (qu) {
    await page.evaluate(
      ([qu]) => window.logseq.api.insert_block(qu, 'Paris', { sibling: false }), [qu]);
  }
  await api.append(cpu, 'Second question without answer #card');
}
console.log('done', tag);
await ctx.close();
