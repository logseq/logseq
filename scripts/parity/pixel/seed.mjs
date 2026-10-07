// Seed the PixelParity fixture page on one app instance via logseq.api.
// Nested structures go through insert_batch_block; blocks that master's
// batch path rejects (inline #tag / [#A] refs) fall back to append_block_in_page.
// Usage: node seed.mjs <url> <waitMs>
import { chromium } from '/Users/devin/repos/logseq-master/node_modules/playwright/index.mjs';
import { FIXTURE_PAGE, BLOCKS, PROPS } from './fixture.mjs';

const [, , URL_, WAIT = '15000'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0, 300)));
await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(Number(WAIT));

const out = await page.evaluate(
  async ({ FIXTURE_PAGE, BLOCKS, PROPS }) => {
    const api = window.logseq.api;
    const log = [];
    try {
      const existing = await api.get_page(FIXTURE_PAGE);
      if (existing && api.delete_page) {
        await api.delete_page(FIXTURE_PAGE);
        log.push('deleted stale page');
      }
    } catch (e) { log.push('pre-clean: ' + String(e).slice(0, 120)); }
    const page = await api.create_page(FIXTURE_PAGE);
    const pageUuid = page && (page.uuid || page['block/uuid'] || page.id);
    log.push('page uuid: ' + pageUuid);
    for (let i = 0; i < BLOCKS.length; i++) {
      const b = BLOCKS[i];
      const label = (b.content || '').slice(0, 32).replace(/\n/g, ' ');
      try {
        await api.insert_batch_block(pageUuid, [b], { sibling: false });
        log.push(`${i} batch   ${label}`);
      } catch (e) {
        try {
          await api.append_block_in_page(pageUuid, b.content, { sibling: false });
          log.push(`${i} append  ${label} (batch: ${String(e).slice(0, 60)})`);
        } catch (e2) {
          log.push(`${i} FAIL    ${label} :: ${String(e2).slice(0, 90)}`);
        }
      }
      await new Promise(r => setTimeout(r, 250));
    }
    try {
      const tree = await api.get_page_blocks_tree(FIXTURE_PAGE);
      const flat = [];
      const walk = ns => (ns || []).forEach(n => { flat.push(n); walk(n.children || n['block/children']); });
      walk(tree);
      const target = flat.find(b => String(b.content || b.title || b['block/title'] || '').includes('Block with properties'));
      if (target) {
        for (const [k, v] of PROPS) {
          await api.upsert_block_property(target.uuid || target['block/uuid'], k, v);
          await new Promise(r => setTimeout(r, 400));
        }
        log.push('props ok');
      } else log.push('props target NOT FOUND');
      log.push('tree blocks: ' + flat.length);
    } catch (e) { log.push('tree FAIL: ' + String(e).slice(0, 200)); }
    return log;
  },
  { FIXTURE_PAGE, BLOCKS, PROPS },
);
console.log(out.join('\n'));
await page.waitForTimeout(1500);
await browser.close();
