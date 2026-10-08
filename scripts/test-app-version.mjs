import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const fixture = mkdtempSync(join(tmpdir(), "logseq-app-version-"));
mkdirSync(join(fixture, "scripts"));
mkdirSync(join(fixture, "resources"));
copyFileSync(new URL("./get-pkg-version.js", import.meta.url), join(fixture, "scripts/get-pkg-version.js"));
writeFileSync(join(fixture, "resources/package.json"), JSON.stringify({ version: "9.8.7" }));
process.on("exit", () => rmSync(fixture, { recursive: true, force: true }));

function releaseVersion(...args) {
  const result = spawnSync(process.execPath, [join(fixture, "scripts/get-pkg-version.js"), ...args], {
    encoding: "utf8",
    cwd: tmpdir(),
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

test("release versions use the app package metadata from any working directory", () => {
  assert.equal(releaseVersion("stable"), "9.8.7");
  assert.equal(releaseVersion("beta"), "9.8.7");
  assert.equal(releaseVersion(), "9.8.7");
});

test("nightly versions append the UTC date to the app package version", () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  assert.equal(releaseVersion("nightly"), `9.8.7-alpha+nightly.${date}`);
  assert.equal(releaseVersion(""), `9.8.7-alpha+nightly.${date}`);
});
