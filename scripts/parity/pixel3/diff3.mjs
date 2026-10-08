// 3-way pixel diff: master vs lui (same size), lui vs gpui (gpui crop via
// auto-offset scan to skip native titlebar). usage: node diff3.mjs <theme> [shotN]
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from '/Users/devin/parity-tools/node_modules/pngjs/lib/png.js';
import pixelmatch from '/Users/devin/parity-tools/node_modules/pixelmatch/index.js';

const theme = process.argv[2] || 'light';
const only = process.argv[3];
const dir = `/Users/devin/parity-work/shots/${theme}`;
const outDir = `${dir}/diff`;
fs.mkdirSync(outDir, { recursive: true });

const crop = (p, x0, y0, w, h) => {
  const q = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++)
    p.data.copy(q.data, y * w * 4, ((y0 + y) * p.width + x0) * 4, ((y0 + y) * p.width + x0 + w) * 4);
  return q;
};
const score = (a, b) => {
  const { width, height } = a;
  const tmp = new PNG({ width, height });
  return pixelmatch(a.data, b.data, tmp.data, width, height, { threshold: 0.15, includeAA: false });
};
const run = (aP, bP, name, offSearch) => {
  if (!fs.existsSync(aP) || !fs.existsSync(bP)) return `${name}: missing`;
  let A = PNG.sync.read(fs.readFileSync(aP));
  let B = PNG.sync.read(fs.readFileSync(bP));
  let off = 0;
  if (offSearch) {
    // find crop offset in B minimizing diff on first 500 rows
    let best = 1e18;
    const h = Math.min(500, B.height - 40, A.height);
    const Ah = crop(A, 0, 0, A.width, h);
    for (let o = 0; o <= Math.min(60, B.height - h); o += 2) {
      const n = score(Ah, crop(B, 0, o, B.width, h));
      if (n < best) { best = n; off = o; }
    }
  }
  const H = Math.min(A.height, B.height - off);
  A = crop(A, 0, 0, A.width, H);
  B = crop(B, 0, off, B.width, H);
  const d = new PNG({ width: A.width, height: H });
  const n = pixelmatch(A.data, B.data, d.data, A.width, H, { threshold: 0.15, includeAA: false });
  const pct = (100 * n / (A.width * H));
  fs.writeFileSync(path.join(outDir, `${name}.png`), PNG.sync.write(d));
  return `${name}: ${pct.toFixed(2)}% (n=${n}${off ? ` off=${off}` : ''})`;
};

const sfxs = fs.readdirSync(dir).filter(f => f.startsWith('master-') && f.endsWith('.png'))
  .map(f => f.replace('master-', '').replace('.png', ''))
  .filter(s => !only || s.startsWith(only));
for (const s of sfxs) {
  console.log(run(`${dir}/master-${s}.png`, `${dir}/lui-${s}.png`, `m-l-${s}`));
  console.log(run(`${dir}/lui-${s}.png`, `${dir}/gpui-${s}.png`, `l-g-${s}`, true));
}
