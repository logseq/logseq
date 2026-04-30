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

const copyPairs = [
  {
    from: path.join(staticDir, "logseq-cli.js"),
    to: path.join(staticJsDir, "logseq-cli.js"),
  },
  {
    from: path.join(staticDir, "logseq-cli.js.map"),
    to: path.join(staticJsDir, "logseq-cli.js.map"),
    optional: true,
  },
  {
    from: path.join(distDir, "db-worker-node.js"),
    to: path.join(staticJsDir, "db-worker-node.js"),
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
  await fs.copyFile(from, to);
}

async function main() {
  await fs.mkdir(staticJsDir, { recursive: true });

  for (const pair of copyPairs) {
    await copyOne(pair);
  }

  // Keep release app runtime files only in static/js.
  await fs.rm(path.join(staticDir, "logseq-cli.js"), { force: true });
  await fs.rm(path.join(staticDir, "logseq-cli.js.map"), { force: true });
  await fs.rm(path.join(staticDir, "db-worker-node.js"), { force: true });
  await fs.rm(path.join(staticDir, "db-worker-node.js.map"), { force: true });
}

main().catch((error) => {
  console.error(`[prepare-desktop-runtime-js] ${error.message}`);
  process.exit(1);
});
