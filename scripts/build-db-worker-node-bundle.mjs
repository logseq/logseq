#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");
const nccOutDir = path.join(distDir, ".db-worker-node-ncc");
const bundleEntry = path.join(distDir, "db-worker-node.js");
const manifestPath = path.join(distDir, "db-worker-node-assets.json");

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listFilesRecursive(baseDir, dir = baseDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(baseDir, absolute)));
    } else if (entry.isFile()) {
      files.push(path.relative(baseDir, absolute));
    }
  }
  return files.sort();
}

async function removeIfExists(targetPath) {
  if (await exists(targetPath)) {
    await fs.rm(targetPath, { recursive: true, force: true });
  }
}

async function cleanupPreviousBundle() {
  await removeIfExists(bundleEntry);

  if (!(await exists(manifestPath))) {
    return;
  }

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

  await removeIfExists(manifestPath);
}

async function copyBundle() {
  if (!(await exists(nccOutDir))) {
    throw new Error(`missing ncc output directory: ${nccOutDir}`);
  }

  const files = await listFilesRecursive(nccOutDir);
  if (!files.includes("index.js")) {
    throw new Error(`ncc output missing index.js in ${nccOutDir}`);
  }

  await cleanupPreviousBundle();

  const copiedAssets = [];
  for (const relativePath of files) {
    const sourcePath = path.join(nccOutDir, relativePath);
    const destinationPath =
      relativePath === "index.js"
        ? bundleEntry
        : path.join(distDir, relativePath);

    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);

    if (relativePath === "index.js") {
      const stat = await fs.stat(sourcePath);
      await fs.chmod(destinationPath, stat.mode);
    } else {
      copiedAssets.push(relativePath);
    }
  }

  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        assets: copiedAssets,
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

async function main() {
  await copyBundle();
  await removeIfExists(nccOutDir);
}

main().catch((error) => {
  console.error(`[db-worker-node-bundle] ${error.message}`);
  process.exit(1);
});
