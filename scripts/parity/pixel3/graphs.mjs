import { chromium } from '/Users/devin/repos/logseq/node_modules/playwright/index.mjs';
const [url, tag] = [process.argv[2], process.argv[3]];
const ctx = await chromium.launchPersistentContext(`/Users/devin/parity-profiles/${tag}`, { channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 } });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(Number(process.argv[4] || 10000));
const out = await page.evaluate(async () => {
  const api = window.logseq?.api || {};
  const r = { url: location.href };
  for (const k of ['get_current_graph','get_graphs','get_page','get_all_pages']) r[k] = typeof api[k];
  try { r.cur = JSON.stringify(await api.get_current_graph?.())?.slice(0,300); } catch(e){ r.curErr=String(e).slice(0,120); }
  try { r.graphs = JSON.stringify(await api.get_graphs?.())?.slice(0,500); } catch(e){ r.gErr=String(e).slice(0,120); }
  try { r.pages = JSON.stringify(await api.get_all_pages?.())?.slice(0,500); } catch(e){ r.pErr=String(e).slice(0,120); }
  return r;
});
console.log(JSON.stringify(out, null, 1));
await ctx.close();
