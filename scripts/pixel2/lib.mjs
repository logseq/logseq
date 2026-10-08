// Shared harness: persistent-context launcher for pixel2 scripts.
import { chromium } from '/Users/devin/parity-lab/node_modules/playwright/index.mjs';
// Master reference: deployed cljs app (app.logseq.com) by default; set
// MASTER_URL to a local shadow-cljs dev server when one is running.
export const MASTER_URL = process.env.MASTER_URL || 'https://app.logseq.com/';
export const LUI_URL = process.env.LUI_URL || 'http://localhost:3010/index.html?rtc-test=true';
export const PROFILES = {
  master: '/Users/devin/parity-profiles/master',
  lui: '/Users/devin/parity-profiles/lui',
};
export async function launch(tag, extra = {}) {
  const ctx = await chromium.launchPersistentContext(PROFILES[tag], {
    channel: 'chrome', headless: true,
    viewport: { width: 1280, height: 800 }, ...extra,
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on('pageerror', e => console.log(`PAGEERR[${tag}]:`, String(e).slice(0, 250)));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  return { ctx, page };
}
