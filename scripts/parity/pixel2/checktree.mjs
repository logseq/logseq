import { launch, LUI_URL } from './lib.mjs';
const { page } = await launch('lui');
await page.goto(LUI_URL + '#/page/07d1c0b9-466b-47af-9461-e3627831d8d8', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(3000);
  const r = await page.evaluate(async () => {
    const t = await window.logseq.api.get_page_blocks_tree('PPFixture').catch(() => []);
    const dom = document.querySelectorAll('.ls-block').length;
    return { tree: (Array.isArray(t) ? t : []).length, dom, dark: document.documentElement.classList.contains('dark') };
  });
  console.log(i, JSON.stringify(r));
  if (r.dom > 5) break;
}
process.exit(0);
