#!/usr/bin/env node

import { promises as fs } from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");
const shadowEntry = path.join(repoRoot, "static", "db-worker-node.js");
const bundleEntry = path.join(distDir, "db-worker-node.js");
const manifestPath = path.join(distDir, "db-worker-node-assets.json");
const legacyNccOutDir = path.join(distDir, ".db-worker-node-ncc");
const builtinModuleSet = new Set([
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
]);
const externalModuleSet = new Set([
  "keytar",
  "ws",
]);

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
  if (!(await exists(shadowEntry))) {
    throw new Error(`missing shadow entry: ${shadowEntry}`);
  }

  await cleanupPreviousBundle();
  await fs.mkdir(distDir, { recursive: true });
  const filesBefore = await listFilesRecursive(distDir);

  await build({
    configFile: false,
    logLevel: "error",
    build: {
      codeSplitting: false,
      minify: "terser",
      target: "node22",
      sourcemap: false,
      write: true,
      emptyOutDir: false,
      outDir: distDir,
      lib: {
        entry: shadowEntry,
        formats: ["cjs"],
        fileName: () => "db-worker-node.js",
      },
      rollupOptions: {
        external: (id) =>
          id.endsWith(".node") ||
          id.startsWith("node:") ||
          builtinModuleSet.has(id) ||
          externalModuleSet.has(id),
        output: {
          format: "cjs",
          exports: "auto",
          entryFileNames: "db-worker-node.js",
          chunkFileNames: "db-worker-node.js",
        },
      },
    },
  });

  if (!(await exists(bundleEntry))) {
    throw new Error(`vite bundle missing output file: ${bundleEntry}`);
  }

  const bundleContents = await fs.readFile(bundleEntry, "utf8");
  if (bundleContents.includes("node_modules/.pnpm/keytar")) {
    throw new Error(
      "vite bundle contains a pnpm keytar native path; keytar must stay external"
    );
  }
  if (bundleContents.includes("ws does not work in the browser")) {
    throw new Error(
      "vite bundle contains the ws browser stub; ws must stay external"
    );
  }

  let filesAfter = await listFilesRecursive(distDir);
  if (filesAfter.includes("index.html") && !filesBefore.includes("index.html")) {
    await removeIfExists(path.join(distDir, "index.html"));
    filesAfter = await listFilesRecursive(distDir);
  }

  const extraJsFiles = filesAfter.filter(
    (relativePath) =>
      relativePath.endsWith(".js") &&
      relativePath !== "db-worker-node.js" &&
      !filesBefore.includes(relativePath)
  );
  if (extraJsFiles.length > 0) {
    throw new Error(
      `vite bundle produced unexpected JS outputs: ${extraJsFiles.join(", ")}`
    );
  }

  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        assets: [],
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

main().catch((error) => {
  console.error(`[db-worker-node-bundle] ${error.message}`);
  process.exit(1);
});
