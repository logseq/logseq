#!/usr/bin/env node

// static/db-worker-node.js is already the self-contained daemon bundle —
// the Melange output of deps/db-worker/js_api/entry_node.ml built by
// `pnpm db-worker:build`. This script stages it into dist/ for the
// cli-package and desktop-runtime layouts.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");
const daemonEntry = path.join(repoRoot, "static", "db-worker-node.js");
const bundleEntry = path.join(distDir, "db-worker-node.js");
const manifestPath = path.join(distDir, "db-worker-node-assets.json");
const legacyNccOutDir = path.join(distDir, ".db-worker-node-ncc");

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function removeIfExists(targetPath) {
  if (await exists(targetPath)) {
    await fs.rm(targetPath, { recursive: true, force: true });
  }
}

async function cleanupPreviousBundle() {
  // Remove the legacy ncc output directory if it still exists from older builds.
  await removeIfExists(legacyNccOutDir);
  await removeIfExists(bundleEntry);

  if (await exists(manifestPath)) {
    let manifest;
    try {
      manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    } catch (error) {
      throw new Error(`failed to read ${manifestPath}: ${error.message}`);
    }

    const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
    for (const relativePath of assets) {
      if (typeof relativePath !== "string" || relativePath.length === 0) {
        continue;
      }
      const assetPath = path.join(distDir, relativePath);
      await removeIfExists(assetPath);
    }
  }

  await removeIfExists(manifestPath);
}

async function main() {
  if (!(await exists(daemonEntry))) {
    throw new Error(
      `missing db-worker-node bundle: ${daemonEntry}; run \`pnpm db-worker:build\` first`
    );
  }

  await cleanupPreviousBundle();
  await fs.mkdir(distDir, { recursive: true });
  await fs.copyFile(daemonEntry, bundleEntry);

  await fs.writeFile(
    manifestPath,
    `${JSON.stringify({ assets: [] }, null, 2)}\n`,
    "utf8"
  );
}

main().catch((error) => {
  console.error(`[db-worker-node-bundle] ${error.message}`);
  process.exit(1);
});
