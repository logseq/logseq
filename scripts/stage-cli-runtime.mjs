#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot =
  process.env.LOGSEQ_STAGE_CLI_RUNTIME_REPO_ROOT ?? path.resolve(__dirname, "..");

const bundleRelativePath = "cli/_build/default/dist/logseq-cli.js";
const stagedRelativePath = "static/logseq-cli.js";
const bundlePath = path.join(repoRoot, ...bundleRelativePath.split("/"));
const bundleMapPath = `${bundlePath}.map`;
const stagedPath = path.join(repoRoot, ...stagedRelativePath.split("/"));
const stagedMapPath = `${stagedPath}.map`;
const shadowRuntimeMarkers = ["SHADOW_IMPORT", ".shadow-cljs", "cljs-runtime"];

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function fail(message) {
  throw new Error(message);
}

function assertBundleExists() {
  if (!fs.existsSync(bundlePath)) {
    fail(
      `Missing CLI bundle ${relative(bundlePath)}; run \`pnpm --dir cli bundle\` before staging the CLI runtime`,
    );
  }
}

function assertNoShadowRuntime(content) {
  for (const marker of shadowRuntimeMarkers) {
    if (content.includes(marker)) {
      fail(`${relative(bundlePath)} contains old Shadow runtime marker: ${marker}`);
    }
  }
}

function copyReadable(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination)) {
    fs.chmodSync(destination, fs.statSync(destination).mode | 0o200);
  }
  fs.copyFileSync(source, destination);
  const sourceMode = fs.statSync(source).mode & 0o777;
  fs.chmodSync(destination, sourceMode | 0o444);
}

function main() {
  assertBundleExists();
  const content = fs.readFileSync(bundlePath, "utf8");
  assertNoShadowRuntime(content);

  copyReadable(bundlePath, stagedPath);

  if (fs.existsSync(bundleMapPath)) {
    copyReadable(bundleMapPath, stagedMapPath);
  } else {
    fs.rmSync(stagedMapPath, { force: true });
  }

  console.log(`Staged ${relative(bundlePath)} to ${relative(stagedPath)}`);
}

try {
  main();
} catch (error) {
  console.error(`[stage-cli-runtime] ${error.message}`);
  process.exit(1);
}
