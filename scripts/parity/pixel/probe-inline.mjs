import { launch, MASTER_URL, LUI_URL } from './lib.mjs';

const probe = () => {
  const ac = document.querySelector('.asset-container');
  const wrap = ac.closest('.block-title-wrap');
  const inline = wrap.parentElement;
  const kids = [...inline.childNodes].map(n => ({
    type: n.nodeType,
    txt: n.nodeType === 3 ? JSON.stringify(n.textContent.slice(0, 30)) : (n.tagName + '.' + String(n.className || '').slice(0, 40)),
    rect: n.nodeType === 1 ? (() => { const r = n.getBoundingClientRect(); return [r.x | 0, r.y | 0, r.width | 0, r.height | 0]; })() : null,
  }));
  return {
    inlineCls: String(inline.className), inlineDisp: getComputedStyle(inline).display, ws: getComputedStyle(inline).whiteSpace, kids,
    wrapNodes: [...wrap.childNodes].map(n => ({
      type: n.nodeType,
      txt: n.nodeType === 3 ? JSON.stringify(n.textContent.slice(0, 30)) : (n.tagName + '.' + String(n.className || '').slice(0, 40)),
    })),
  };
};

for (const [tag, url] of [['master', MASTER_URL], ['lui', LUI_URL]]) {
  const { page } = await launch(tag);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(tag === 'master' ? 12000 : 20000);
  await page.goto(url + '#/page/PPFixture', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  console.log('=== ' + tag);
  console.log(JSON.stringify(await page.evaluate(probe), null, 1));
}
process.exit(0);
