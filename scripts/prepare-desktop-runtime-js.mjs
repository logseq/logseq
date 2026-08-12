#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const staticDir = path.join(repoRoot, "static");
const staticJsDir = path.join(staticDir, "js");
const distDir = path.join(repoRoot, "dist");
const skillSourceDir = path.join(repoRoot, ".agents", "skills", "logseq-cli");
const stagedSkillDir = path.join(staticDir, ".agents", "skills", "logseq-cli");
const cliBundleRelativePath = "cli/_build/default/dist/logseq-cli.js";
const stagedCliRelativePath = "static/logseq-cli.js";
const desktopCliRelativePath = "static/js/logseq-cli.js";
const cliBundlePath = path.join(repoRoot, ...cliBundleRelativePath.split("/"));

const copyPairs = [
  {
    from: path.join(repoRoot, ...stagedCliRelativePath.split("/")),
    to: path.join(repoRoot, ...desktopCliRelativePath.split("/")),
    generatedFrom: cliBundlePath,
    refreshCommand: "pnpm cli:release",
  },
  {
    from: path.join(staticDir, "logseq-cli.js.map"),
    to: path.join(staticJsDir, "logseq-cli.js.map"),
    optional: true,
  },
  {
    from: path.join(distDir, "db-worker-node.js"),
    to: path.join(staticJsDir, "db-worker-node.js"),
    generatedFrom: path.join(staticDir, "db-worker-node.js"),
    refreshCommand: "pnpm db-worker-node:bundle",
  },
  {
    from: path.join(skillSourceDir, "SKILL.md"),
    to: path.join(stagedSkillDir, "SKILL.md"),
  },
];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyOne({ from, to, optional = false }) {
  if (!(await exists(from))) {
    if (optional) return;
    throw new Error(`missing required source file: ${from}`);
  }
  await fs.mkdir(path.dirname(to), { recursive: true });
  if (await exists(to)) {
    const stats = await fs.stat(to);
    await fs.chmod(to, stats.mode | 0o200);
  }
  await fs.copyFile(from, to);
}

async function assertFreshRuntime({ from, generatedFrom, refreshCommand }) {
  if (!generatedFrom || !(await exists(generatedFrom)) || !(await exists(from))) return;

  const [sourceStats, generatedStats] = await Promise.all([
    fs.stat(from),
    fs.stat(generatedFrom),
  ]);

  if (sourceStats.mtimeMs + 1000 < generatedStats.mtimeMs) {
    throw new Error(
      `${from} is older than ${generatedFrom}; run \`${refreshCommand}\` before preparing desktop runtime JS`
    );
  }
}

async function main() {
  await fs.mkdir(staticJsDir, { recursive: true });

  for (const pair of copyPairs) {
    await assertFreshRuntime(pair);
    await copyOne(pair);
  }

  // Keep root staged runtime files available for local CLI E2E and npm packaging.
}

main().catch((error) => {
  console.error(`[prepare-desktop-runtime-js] ${error.message}`);
  process.exit(1);
});
