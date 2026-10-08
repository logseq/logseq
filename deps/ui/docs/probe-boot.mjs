import { chromium } from 'playwright';
const CTX = process.env.HOME + '/pw-lui-perf';
const ctx = await chromium.launchPersistentContext(CTX, { viewport: { width: 1440, height: 900 } });
const p = ctx.pages()[0] ?? (await ctx.newPage());
p.on('console', (m) => { const t = m.text(); if (/error|fail|crash/i.test(t)) console.log('[con]', t.slice(0, 160)); });
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto('http://localhost:3013/index.html?rtc-test=true');
for (let i = 0; i < 6; i++) {
  await p.waitForTimeout(5000);
  const s = await p.evaluate(async () => ({
    ready: document.readyState,
    blocks: document.querySelectorAll('.ls-block').length,
    route: await window.logseq?.api?.get_current_route().catch(() => null),
    graph: await window.logseq?.api?.get_current_graph().catch(() => null),
    body: document.body.innerText.slice(0, 200).replace(/\n+/g, ' | '),
  }));
  console.log(i, JSON.stringify(s).slice(0, 300));
  if (s.graph) break;
}
await ctx.close();
