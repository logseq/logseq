import { chromium } from 'playwright';
const ctx = await chromium.launchPersistentContext(process.env.HOME + '/pw-virt-probe', {
  viewport: { width: 1440, height: 900 },
});
const p = ctx.pages()[0] ?? (await ctx.newPage());
await p.goto('http://localhost:3013/index.html?rtc-test=true&virtualized=true');
await p.waitForFunction(() => window.logseq?.api);
await p.waitForTimeout(8000);
const uuid = await p.evaluate(async () => {
  const pg = await window.logseq.api.get_page('VirtProbe');
  return pg && (pg.uuid || pg['block/uuid']);
});
await p.evaluate((u) => (location.hash = '#/page/' + u), uuid);
await p.waitForTimeout(4000);

// gap = ms until any rendered row is inside the viewport after a jump
const gap = (pos) =>
  p.evaluate((pos) => {
    const sc = document.getElementById('main-content-container');
    return new Promise((done) => {
      sc.scrollTop = pos === 'bottom' ? sc.scrollHeight : 0;
      const t0 = performance.now();
      const probe = () => {
        const vis = [...document.querySelectorAll('.ls-virt-list [data-index]')].some((r) => {
          const b = r.getBoundingClientRect();
          return b.bottom > 0 && b.top < innerHeight && b.height > 0;
        });
        if (vis || performance.now() - t0 > 3000) done(Math.round(performance.now() - t0));
        else requestAnimationFrame(probe);
      };
      requestAnimationFrame(probe);
    });
  }, pos);

const N = 10;
let gaps = [];
for (let i = 0; i < N; i++) {
  gaps.push(await gap('bottom'));
  await p.waitForTimeout(100);
  gaps.push(-(await gap('top'))); // negative = top flick
  await p.waitForTimeout(100);
}
console.log('gap ms (pos=bottom, neg=top):', JSON.stringify(gaps));
await ctx.close();
