// pixel-diff r3 shot pairs with pixelmatch.
// usage: node diff.mjs [theme-width ...]   e.g. `node diff.mjs light-1440 dark-1440`
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from '/Users/devin/parity-tools/node_modules/pngjs/lib/png.js';
import pixelmatch from '/Users/devin/parity-tools/node_modules/pixelmatch/index.js';

const BASE = '/Users/devin/repos/logseq-r3/docs/parity-r3-shots';
const sets = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.readdirSync(BASE).filter(d => fs.statSync(path.join(BASE, d)).isDirectory());

for (const set of sets) {
  const dir = path.join(BASE, set);
  const outDir = path.join(dir, 'diff');
  fs.mkdirSync(outDir, { recursive: true });
  const pairs = fs.readdirSync(dir).filter(f => f.startsWith('master-') && f.endsWith('.png'))
    .map(f => f.replace('master-', ''));
  console.log(`\n=== ${set}`);
  for (const sfx of pairs.sort()) {
    const a = path.join(dir, `master-${sfx}`);
    const b = path.join(dir, `lui-${sfx}`);
    if (!fs.existsSync(b)) { console.log(`${sfx.padEnd(24)} missing lui shot`); continue; }
    const A = PNG.sync.read(fs.readFileSync(a));
    const B = PNG.sync.read(fs.readFileSync(b));
    if (A.width !== B.width || A.height !== B.height) {
      console.log(`${sfx.padEnd(24)} SIZE MISMATCH ${A.width}x${A.height} vs ${B.width}x${B.height}`);
      continue;
    }
    const { width, height } = A;
    const diff = new PNG({ width, height });
    const n = pixelmatch(A.data, B.data, diff.data, width, height, { threshold: 0.15, includeAA: false });
    const pct = 100 * n / (width * height);
    fs.writeFileSync(path.join(outDir, `diff-${sfx}`), PNG.sync.write(diff));
    const CX = 12, CY = 8;
    const counts = new Uint32Array(CX * CY);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (diff.data[i] > 200 && diff.data[i + 1] < 100 && diff.data[i + 2] < 100) {
        counts[Math.min(CY - 1, (y / height * CY) | 0) * CX + Math.min(CX - 1, (x / width * CX) | 0)]++;
      }
    }
    const cellW = width / CX, cellH = height / CY;
    const hot = [...counts.entries()].map(([i, c]) => ({ i, c }))
      .filter(e => e.c > 200).sort((p, q) => q.c - p.c).slice(0, 6)
      .map(e => `(${(e.i % CX * cellW).toFixed(0)},${((e.i / CX | 0) * cellH).toFixed(0)})=${e.c}`).join(' ');
    console.log(`${sfx.padEnd(24)} ${pct.toFixed(2)}%${n > 0 ? '  hot:' + hot : ''}`);
  }
}
