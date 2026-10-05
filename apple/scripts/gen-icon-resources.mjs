#!/usr/bin/env node
// Generates the icon resources the Swift app bundles, from the same
// sources the web build ships — run by apple/build.sh before `swift build`:
//
//   tabler-icons.ttf        <- resources/css/fonts/tabler-icons.ttf (copy)
//   tabler-codepoints.json  <- resources/css/tabler-icons.min.css (.ti-*:before)
//   tabler-ext-codepoints.json <- resources/css/tabler-extension.css (.tie-*)
//   tabler-children.json    <- resources/js/icon-data.js (JSON payload)
//
// tabler-icons-extension.ttf stays committed: it is a TTF conversion of
// resources/css/fonts/tabler-icons-extension.woff2 and no font converter
// is guaranteed on this machine.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const appleDir = resolve(import.meta.dirname, "..");
const repoRoot = resolve(appleDir, "..");
const outDir = resolve(appleDir, "Sources/Logseq/Resources");
mkdirSync(outDir, { recursive: true });

const codepoints = (cssPath, prefix) => {
  const css = readFileSync(cssPath, "utf8");
  const table = {};
  const re = new RegExp(`\\.${prefix}-([a-z0-9-]+)::?before\\s*{\\s*content:\\s*"\\\\([0-9a-fA-F]+)"`, "g");
  let m;
  while ((m = re.exec(css))) table[m[1]] = m[2].toLowerCase();
  return table;
};

copyFileSync(
  resolve(repoRoot, "resources/css/fonts/tabler-icons.ttf"),
  resolve(outDir, "tabler-icons.ttf"),
);

writeFileSync(
  resolve(outDir, "tabler-codepoints.json"),
  JSON.stringify(
    codepoints(resolve(repoRoot, "resources/css/tabler-icons.min.css"), "ti"),
  ),
);
writeFileSync(
  resolve(outDir, "tabler-ext-codepoints.json"),
  JSON.stringify(
    codepoints(resolve(repoRoot, "resources/css/tabler-extension.css"), "tie"),
  ),
);

// icon-data.js is `globalThis.__tablerChildren={...}` — slice the JSON.
const iconData = readFileSync(
  resolve(repoRoot, "resources/js/icon-data.js"),
  "utf8",
);
const marker = "__tablerChildren=";
const eq = iconData.indexOf(marker);
const start = eq < 0 ? -1 : iconData.indexOf("{", eq + marker.length);
const end = iconData.lastIndexOf("}");
if (start < 0 || end <= start)
  throw new Error("no JSON object in resources/js/icon-data.js");
writeFileSync(
  resolve(outDir, "tabler-children.json"),
  iconData.slice(start, end + 1),
);

console.log(`gen-icon-resources: wrote ${outDir}`);
