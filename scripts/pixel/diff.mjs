// Pair master/lui screenshots and compute pixelmatch diffs.
// Usage: node scripts/pixel/diff.mjs <shotsdir>
import { PNG } from '/Users/devin/pixel-tools/node_modules/pngjs/lib/png.js';
import pixelmatch from '/Users/devin/pixel-tools/node_modules/pixelmatch/index.js';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] || 'docs/pixel-dialogs-menus';
const files = fs.readdirSync(dir).filter(f => f.startsWith('master-') && f.endsWith('.png') && !f.includes('-state'));
const rows = [];
for (const f of files.sort()) {
  const stem = f.slice(7, -4); // after 'master-', before '.png'
  const mf = path.join(dir, f);
  const lf = path.join(dir, `lui-${stem}.png`);
  if (!fs.existsSync(lf)) { rows.push({ stem, diff: null, note: 'no lui shot' }); continue; }
  const a = PNG.sync.read(fs.readFileSync(mf));
  const b = PNG.sync.read(fs.readFileSync(lf));
  if (a.width !== b.width || a.height !== b.height) { rows.push({ stem, diff: null, note: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` }); continue; }
  const out = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, b.data, out.data, a.width, a.height, { threshold: 0.12, includeAA: false });
  const pct = (n / (a.width * a.height) * 100);
  fs.writeFileSync(path.join(dir, `diff-${stem}.png`), PNG.sync.write(out));
  rows.push({ stem, diff: pct, pixels: n });
}
rows.sort((x, y) => (y.diff ?? -1) - (x.diff ?? -1));
for (const r of rows) {
  console.log(`${r.diff == null ? '  n/a' : r.diff.toFixed(2).padStart(6)}%  ${r.stem}${r.note ? '  (' + r.note + ')' : ''}`);
}
fs.writeFileSync(path.join(dir, 'diff-results.json'), JSON.stringify(rows, null, 1));
