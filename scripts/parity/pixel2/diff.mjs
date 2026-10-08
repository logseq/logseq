// pixel-diff two screenshot dirs/files with pixelmatch.
// usage: node scripts/parity/pixel2/diff.mjs <theme> [shotN]  e.g. `light 01`
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from '/Users/devin/parity-tools/node_modules/pngjs/lib/png.js';
import pixelmatch from '/Users/devin/parity-tools/node_modules/pixelmatch/index.js';

const theme = process.argv[2] || 'light';
const only = process.argv[3];
const dir = `/Users/devin/repos/logseq/docs/pixel2-outliner/${theme}`;
const outDir = `${dir}/diff`;
fs.mkdirSync(outDir, { recursive: true });

const pairs = fs.readdirSync(dir).filter(f => f.startsWith('master-') && f.endsWith('.png'))
  .map(f => f.replace('master-', ''))
  .filter(sfx => !only || sfx.startsWith(only));

const rows = [];
for (const sfx of pairs) {
  const a = path.join(dir, `master-${sfx}`);
  const b = path.join(dir, `lui-${sfx}`);
  if (!fs.existsSync(b)) { rows.push([sfx, 'missing lui shot']); continue; }
  const A = PNG.sync.read(fs.readFileSync(a));
  const B = PNG.sync.read(fs.readFileSync(b));
  if (A.width !== B.width || A.height !== B.height) {
    rows.push([sfx, `size mismatch ${A.width}x${A.height} vs ${B.width}x${B.height}`]);
    continue;
  }
  const { width, height } = A;
  const diff = new PNG({ width, height });
  const n = pixelmatch(A.data, B.data, diff.data, width, height, { threshold: 0.15, includeAA: false });
  const pct = (100 * n / (width * height));
  fs.writeFileSync(path.join(outDir, `diff-${sfx}`), PNG.sync.write(diff));

  // region heatmap: divide into 12x8 grid cells, count diff pixels per cell
  const CX = 12, CY = 8;
  const counts = new Uint32Array(CX * CY);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = diff.data[i], g = diff.data[i + 1], b = diff.data[i + 2];
      if (r > 200 && g < 100 && b < 100) { // pixelmatch marks diffs red-ish
        const cx = Math.min(CX - 1, (x / width * CX) | 0);
        const cy = Math.min(CY - 1, (y / height * CY) | 0);
        counts[cy * CX + cx]++;
      }
    }
  }
  const cellW = width / CX, cellH = height / CY;
  const hot = [...counts.entries()].map(([i, c]) => ({ i, c }))
    .filter(e => e.c > 200)
    .sort((p, q) => q.c - p.c).slice(0, 8)
    .map(e => `(${(e.i % CX * cellW).toFixed(0)},${((e.i / CX | 0) * cellH).toFixed(0)})=${e.c}`)
    .join(' ');
  rows.push([sfx, `${pct.toFixed(2)}%  hot:${hot}`]);
}
for (const [s, r] of rows) console.log(`${s.padEnd(22)} ${r}`);
