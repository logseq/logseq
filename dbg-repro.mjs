// Repro loop for new-page-reference blanking flake.
// Same steps as the e2e test: open app, create page, new block, fill [[name]], esc, watch wraps.
import { chromium } from 'playwright';

const URL = 'http://localhost:3002/?rtc-test=true';
const ITERS = parseInt(process.argv[2] || '10', 10);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });

let fails = 0;
for (let i = 1; i <= ITERS; i++) {
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(m.text()));
  try {
    await page.goto(URL);
    await page.waitForSelector('.ls-page-blocks', { timeout: 20000 });
    // create a fresh page via cmdk search
    const name = `dbg-repro-${Date.now()}-${i}`;
    await page.keyboard.press('Escape');
    await page.keyboard.press('Meta+k').catch(() => {});
    await page.waitForTimeout(300);
    // fall back: use the search input whatever its selector
    const searchInput = page.locator('.ls-search input, #search, input[placeholder*="Search"], .cp__cmdk input').first();
    if (await searchInput.count()) {
      await searchInput.fill(name);
      await page.waitForTimeout(600);
      const create = page.locator(`.search-results > div:has-text("Create page called '${name}'")`).first();
      if (await create.count()) await create.click();
      else await page.keyboard.press('Enter');
    }
    await page.waitForSelector('.editor-wrapper textarea', { timeout: 10000 });
    // new-block "" : enter on the open editor
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.editor-wrapper textarea', { timeout: 5000 });
    const title = `ref-${Date.now()}-${i}`;
    const editor = page.locator('.editor-wrapper textarea');
    await editor.fill(`[[${title}]]`);
    // capture block element then esc
    const block = page.locator('.editor-wrapper').locator('xpath=ancestor::*[contains(@class,"ls-block")][1]');
    await page.keyboard.press('Escape');
    // sample wraps per rAF-ish for ~600ms
    let blankAt = -1;
    for (let t = 0; t < 40; t++) {
      const texts = await page.locator('.ls-block .block-title-wrap').evaluateAll(
        (els) => els.map((e) => e.textContent || ''));
      if (i === 1 && t === 0) console.log('initial wraps:', JSON.stringify(texts));
      if (texts.length && texts.some((x) => x === '') && texts.some((x) => x !== '')) {
        // only flag when a previously non-empty wrap went blank
      }
      const hasBlank = texts.some((x) => x === '');
      const hasTitle = texts.some((x) => x.includes(`[[${title}]]`) || x === title || x.includes(title));
      if (hasTitle === false && t > 3) { blankAt = t; break; }
      await page.waitForTimeout(16);
    }
    const final = await page.locator('.ls-block .block-title-wrap').evaluateAll(
      (els) => els.map((e) => e.textContent || ''));
    const tag = (blankAt >= 0 || !final.some((x) => x.includes(title))) ? 'FAIL' : 'ok';
    if (tag === 'FAIL') fails++;
    console.log(`run ${i}: ${tag} final=${JSON.stringify(final)}`);
    if (tag === 'FAIL') {
      console.log(logs.filter((l) => /OVERRIDE|COMMIT|SPLICE|DECODE|PRUNE|CLEAR|ROW-BLANK|PUSH-ITEMS|PAGE-LOADED/.test(l)).join('\n'));
      await page.screenshot({ path: `dbg-repro-${i}.png` });
    }
  } catch (e) {
    console.log(`run ${i}: ERROR ${e.message.split('\n')[0]}`);
  }
  await page.close();
}
console.log(`done: ${fails}/${ITERS} fails`);
await browser.close();
