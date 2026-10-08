// Shared harness: persistent-context launcher for parity scripts.
import { chromium } from '/Users/devin/repos/logseq-master/node_modules/playwright/index.mjs';
export const MASTER_URL = 'http://localhost:3001/';
export const LUI_URL = 'http://localhost:3003/index.html?rtc-test=true';
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
  // static assets change frequently during parity work — bypass the
  // persistent profile's disk cache so rebuilt bundles/CSS are served
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  return { ctx, page };
}
