// Generates resources/js/emoji-data.js from @emoji-mart/data's default
// native set (sets/15/native.json). Emits a single
// `globalThis.__emojiData={...}` object literal loaded by index.html
// before main.js, so the 400KB+ emoji dataset stays out of the bundle
// and can be cached independently — same pattern as icon-data.js.
// @emoji-mart/data has no exports map for subpath resolution, so the
// file is located by walking up node_modules like gen-icon-data.mjs.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function findPkgDir() {
  let dir = here;
  for (;;) {
    for (const cand of [
      join(dir, "node_modules", "@emoji-mart", "data"),
      join(dir, "deps", "ui", "node_modules", "@emoji-mart", "data"),
    ]) {
      try {
        readFileSync(join(cand, "package.json"), "utf8");
        return cand;
      } catch {}
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error("@emoji-mart/data not found in any node_modules above");
    dir = parent;
  }
}

const pkgDir = findPkgDir();
const src = join(pkgDir, "sets", "15", "native.json");
const data = JSON.parse(readFileSync(src, "utf8"));
const out = `globalThis.__emojiData=${JSON.stringify(data)};`;
const outDir = join(here, "..", "..", "..", "resources", "js");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "emoji-data.js"), out);
console.log(`emoji-data.js written from ${src} (${out.length} bytes)`);
