import { chromium } from '/Users/devin/repos/logseq-master/node_modules/playwright/index.mjs';
import { FIXTURE_PAGE, BLOCKS } from './fixture.mjs';
const url = process.argv[2];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);
const res = await page.evaluate(async ({ FIXTURE_PAGE, BLOCKS }) => {
  const api = window.logseq.api;
  const out = [];
  const page = await api.create_page(FIXTURE_PAGE + 'B');
  const pageUuid = page.uuid;
  for (let i = 0; i < BLOCKS.length; i++) {
    try {
      await api.insert_batch_block(pageUuid, [BLOCKS[i]], { sibling: false });
      out.push(i + ' ok');
    } catch (e) { out.push(i + ' FAIL ' + String(e).slice(0, 100)); }
  }
  return out;
}, { FIXTURE_PAGE, BLOCKS });
console.log(res.join('\n'));
await browser.close();
