import { chromium } from 'playwright';
const ctx = await chromium.launchPersistentContext(process.env.HOME + '/pw-virt-probe', {
  viewport: { width: 1440, height: 900 },
});
const p = ctx.pages()[0] ?? (await ctx.newPage());
p.on('console', (m) => { if (/virt on_end|virt splice|load_more|fresh|route=/.test(m.text())) console.log('[con]', m.text()); });
await p.goto('http://localhost:3013/index.html?rtc-test=true&virtualized=true');
await p.waitForFunction(() => window.logseq?.api);
await p.waitForTimeout(8000);
await p.evaluate(() => (location.hash = '#/'));
await p.waitForTimeout(4000);
const stats = () =>
  p.evaluate(() => {
    const sc = document.getElementById('main-content-container');
    const rows = [...document.querySelectorAll('.ls-virt-list [data-index]')];
    return {
      rows: rows.length,
      spacerH: document.querySelector('.ls-virt-list > div')?.style.height,
      scrollH: sc?.scrollHeight,
      lastIdx: rows.length ? rows[rows.length - 1].dataset.index : null,
    };
  });
console.log('initial:', JSON.stringify(await stats()));
for (let i = 0; i < 8; i++) {
  await p.evaluate(() => {
    const sc = document.getElementById('main-content-container');
    sc.scrollTop = sc.scrollHeight;
  });
  await p.waitForTimeout(1500);
  console.log('after bottom', i, JSON.stringify(await stats()));
}
await p.screenshot({ path: '/tmp/virt-verify/journals.png' });
await ctx.close();
