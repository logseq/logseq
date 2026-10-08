import { launch, MASTER_URL } from './lib.mjs';
const { page } = await launch('master');
await page.goto(MASTER_URL + '#/page/6ac6e19d-837a-4973-b2ce-61a47482fb99', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(15000);
// scroll down in steps to let lazy content mount
for (let i = 0; i < 8; i++) {
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(700);
}
const r = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.ls-block')];
  return { n: rows.length,
    all: rows.map(e => e.textContent.trim().slice(0, 42)) };
});
console.log('n=', r.n);
r.all.forEach((t, i) => console.log(i, t));
process.exit(0);
