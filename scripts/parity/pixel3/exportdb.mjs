import fs from 'node:fs';
import { launch, MASTER_URL } from './lib3.mjs';
const { ctx, page } = await launch('master');
await page.goto(MASTER_URL + '#/page/ppfixture', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);
const b64 = await page.evaluate(async () => {
  window.__db = null;
  window.showSaveFilePicker = async () => ({
    createWritable: async () => ({
      write: async (d) => { window.__db = d; },
      close: async () => {},
    }),
  });
  try { await window.logseq.api.download_graph_db(); } catch (e) { return 'ERR ' + e; }
  await new Promise(r => setTimeout(r, 3000));
  const d = window.__db;
  if (!d) return 'NULL';
  let buf;
  if (d instanceof ArrayBuffer) buf = new Uint8Array(d);
  else if (d instanceof Blob) buf = new Uint8Array(await d.arrayBuffer());
  else if (d instanceof Uint8Array) buf = d;
  else if (d && d.buffer) buf = new Uint8Array(d.buffer);
  else return 'TYPE ' + typeof d + ' ' + (d && d.constructor && d.constructor.name);
  let s = '';
  for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode(...buf.subarray(i, i + 8192));
  return btoa(s);
});
if (b64.startsWith('ERR') || b64 === 'NULL' || b64.startsWith('TYPE')) { console.log(b64); }
else {
  fs.writeFileSync('/Users/devin/parity-work/db.sqlite', Buffer.from(b64, 'base64'));
  console.log('saved', fs.statSync('/Users/devin/parity-work/db.sqlite').size, 'bytes');
}
await ctx.close();
