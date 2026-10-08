// Seed the pixel2-surfaces fixture on one app instance via logseq.api.
// Book tag + typed properties, #Book objects under "Seed notes", plain
// pages. Runs against a persistent profile so it only needs to run once
// per app (re-running is idempotent: skips if 'Seed notes' exists).
// Usage: node scripts/pixel2/seed-views.mjs master|lui
import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const tag = process.argv[2] || 'master';
const url = tag === 'master' ? MASTER_URL : LUI_URL;
const { ctx, page } = await launch(tag);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(tag === 'master' ? 12000 : 20000);

const out = await page.evaluate(async () => {
  const api = window.logseq?.api;
  const log = [];
  if (!api) return ['NO logseq.api'];
  const call = async (name, ...args) => {
    try { return { ok: await api[name](...args) }; }
    catch (e) { log.push(`${name} FAIL ${String(e).slice(0, 120)}`); return { ok: null }; }
  };
  // idempotent: skip if already seeded
  try {
    const p = await api.get_page('Seed notes');
    if (p && (p.uuid || p['block/uuid'])) return ['already seeded'];
  } catch {}

  // --- Book tag with typed properties ---
  const tagProps = [
    { name: 'author', schema: { type: 'default' } },
    { name: 'rating', schema: { type: 'number' } },
    { name: 'published', schema: { type: 'date' } },
    { name: 'finished', schema: { type: 'checkbox' } },
    { name: 'genre', schema: { type: 'default' } },
    { name: 'website', schema: { type: 'url' } },
    { name: 'reading', schema: { type: 'default' } },
  ];
  const t = await call('create_tag', 'Book', { tagProperties: tagProps });
  log.push('tag: ' + JSON.stringify(t.ok && (t.ok.uuid || t.ok['block/uuid'] || t.ok.id)));

  // --- Seed notes page with 6 #Book objects ---
  const books = [
    { title: 'Clean Code', author: 'Robert C. Martin', rating: 5, published: '2008-08-01', finished: true, genre: 'Software', website: 'https://example.com/clean-code', reading: 'done' },
    { title: 'The Pragmatic Programmer', author: 'David Thomas', rating: 4, published: '1999-10-20', finished: true, genre: 'Software', website: 'https://example.com/pragprog', reading: 'done' },
    { title: 'Structure and Interpretation', author: 'Harold Abelson', rating: 5, published: '1985-07-25', finished: false, genre: 'CS', website: 'https://example.com/sicp', reading: 'reading' },
    { title: 'The Design of Everyday Things', author: 'Don Norman', rating: 4, published: '1988-06-01', finished: false, genre: 'Design', website: 'https://example.com/doet', reading: 'todo' },
    { title: 'Godel Escher Bach', author: 'Douglas Hofstadter', rating: 5, published: '1979-01-01', finished: false, genre: 'Philosophy', website: 'https://example.com/geb', reading: 'reading' },
    { title: 'The Mythical Man-Month', author: 'Fred Brooks', rating: 3, published: '1975-01-01', finished: true, genre: 'Software', website: 'https://example.com/mmm', reading: 'done' },
  ];
  const seedPage = await call('create_page', 'Seed notes');
  const seedUuid = seedPage.ok && (seedPage.ok.uuid || seedPage.ok['block/uuid']);
  log.push('seed page: ' + seedUuid);
  for (const b of books) {
    const blk = await call('append_block_in_page', 'Seed notes', b.title);
    const buuid = blk.ok && (blk.ok.uuid || blk.ok['block/uuid']);
    if (!buuid) { log.push('block FAIL ' + b.title); continue; }
    await call('add_block_tag', buuid, 'Book');
    await call('upsert_block_property', buuid, 'author', b.author);
    await call('upsert_block_property', buuid, 'rating', b.rating);
    // 'published' (date type) is rejected by upsert_block_property on
    // master for every value format — it is exercised via the date cell
    // editor during capture instead, identically on both apps.
    await call('upsert_block_property', buuid, 'finished', b.finished);
    await call('upsert_block_property', buuid, 'genre', b.genre);
    await call('upsert_block_property', buuid, 'website', b.website);
    await call('upsert_block_property', buuid, 'reading', b.reading);
    log.push('book ' + b.title + ' ' + buuid);
  }

  // --- plain pages ---
  for (const name of ['Page Alpha', 'Page Beta', 'Notes on testing', 'Ideas backlog', 'Reading list', 'Meeting notes 2026']) {
    const r = await call('create_page', name);
    log.push('page ' + name + ': ' + !!r.ok);
    const pu = r.ok && (r.ok.uuid || r.ok['block/uuid']);
    if (pu) await call('append_block_in_page', name, `Body text for ${name} with [[Page Alpha]] ref.`);
  }

  // --- journals: create a couple of journal pages so the journals list has entries ---
  if (api.create_journal_page) {
    for (const d of ['2026-10-05', '2026-10-06']) {
      try { await api.create_journal_page(d); log.push('journal ' + d); }
      catch (e) { log.push('journal FAIL ' + d + ' ' + String(e).slice(0, 80)); }
    }
  }
  return log;
});
console.log(out.join('\n'));
await page.waitForTimeout(1500);
await ctx.close();
