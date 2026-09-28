#!/usr/bin/env node
// Writes `git describe` output into cli/dist/git-revision so that the
// @bundle dune rule can declare it as a dependency. The rule's deps do not
// cover git state, so without this an unchanged sources rebuild restores a
// stale artifact whose baked-in revision no longer matches HEAD — and
// graph-lifecycle then retires live workers as "outdated".
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outFile = path.join(repoRoot, "cli", "dist", "git-revision");

let revision = "dev";
try {
  revision = execFileSync(
    "git",
    ["describe", "--long", "--always", "--dirty"],
    { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ).trim();
} catch {
  // not a git checkout (e.g. packaged tarball) — keep "dev"
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
if (!fs.existsSync(outFile) || fs.readFileSync(outFile, "utf8") !== `${revision}\n`) {
  fs.writeFileSync(outFile, `${revision}\n`);
}
