import { launch, LUI_URL } from './lib.mjs';
const { page } = await launch('lui');
await page.goto(LUI_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(20000);
const r = await page.evaluate(async () => {
  const out = {};
  out.hasApi = !!window.logseq?.api;
  const p = await window.logseq.api.get_page('PPFixture').catch(e => ({ err: String(e) }));
  out.page = p && (p.uuid || JSON.stringify(p).slice(0, 80));
  try {
    const b = await window.logseq.api.append_block_in_page(out.page || 'PPFixture', 'ACPROBE', { sibling: false });
    out.appended = b && (b.uuid || JSON.stringify(b).slice(0, 120));
    const u = out.appended;
    await new Promise(r => setTimeout(r, 1500));
    out.domHit = !!document.querySelector(`.ls-block[blockid="${u}"]`);
    const el = document.querySelector(`.ls-block[blockid="${u}"]`);
    if (el) { const rr = el.getBoundingClientRect(); out.rect = [rr.x, rr.y, rr.width, rr.height]; }
    if (u) await window.logseq.api.remove_block(u).catch(e => (out.rm = String(e)));
  } catch (e) { out.appendErr = String(e); }
  return out;
});
console.log(JSON.stringify(r, null, 1));
process.exit(0);
