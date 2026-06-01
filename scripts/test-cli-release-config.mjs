import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const readText = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

const readJson = (relativePath) =>
  JSON.parse(readText(relativePath));

const rootPackage = readJson("package.json");
const desktopPackage = readJson("resources/package.json");

const zvecOptionalRuntimeDependencies = [
  "@zvec/bindings-darwin-arm64",
  "@zvec/bindings-linux-arm64",
  "@zvec/bindings-linux-x64",
  "@zvec/bindings-win32-x64",
  "@zvec/zvec",
];

const assertNotContains = (text, needle, label) => {
  assert.equal(
    text.includes(needle),
    false,
    `${label} should not contain ${needle}`,
  );
};

const assertNoShadowRuntime = (text, label) => {
  for (const needle of ["SHADOW_IMPORT", ".shadow-cljs", "cljs-runtime"]) {
    assertNotContains(text, needle, label);
  }
};

const filesUnder = (relativePath) => {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return [];
  }
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    return [relativePath];
  }
  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(relativePath, entry.name);
      return entry.isDirectory() ? filesUnder(entryPath) : [entryPath];
    });
};

const assertFilesDoNotMatch = (relativePaths, pattern, label) => {
  const matches = relativePaths.flatMap((relativePath) => {
    const text = readText(relativePath);
    return pattern.test(text) ? [relativePath] : [];
  });
  assert.deepEqual(matches, [], `${label} should not contain ${pattern}`);
};

const workflow = readText(".github/workflows/deps-cli.yml");
assertNotContains(workflow, "deps/cli", "deps-cli workflow");
assert.match(workflow, /src\/main\/logseq\/cli\/\*\*/, "workflow should watch new CLI sources");
assert.match(workflow, /src\/test\/logseq\/cli\/\*\*/, "workflow should watch new CLI tests");
assert.match(workflow, /clojure -M:cljs release logseq-cli/, "workflow should build new CLI");
assert.match(workflow, /pnpm db-worker-node:release:bundle/, "workflow should build bundled db-worker-node runtime");
assert.match(workflow, /node scripts\/prepare-cli-package\.mjs/, "workflow should prepare publish package");
assert.match(workflow, /working-directory: dist\/cli-package/, "workflow should publish prepared package");

const buildWorkflow = readText(".github/workflows/build.yml");
assert.match(buildWorkflow, /clojure -M:cljs release logseq-cli/, "db graph workflow should build release CLI");
assert.match(buildWorkflow, /pnpm db-worker-node:release:bundle/, "db graph workflow should build release db-worker-node runtime");
assert.match(buildWorkflow, /pnpm --dir dist\/cli-package install --prod/, "db graph workflow should install prepared CLI package dependencies");
assert.match(buildWorkflow, /libsecret-1-0/, "db graph workflow should install keytar's Linux runtime dependency");
assert.match(buildWorkflow, /pnpm --dir dist\/cli-package pack --pack-destination \.\.\//, "db graph workflow should verify the prepared CLI package with pnpm pack");
assertNotContains(buildWorkflow, "create_graph_with_schema_org.cljs ./cli-root/graphs/schema-graph --subset", "db graph workflow");
assert.match(buildWorkflow, /node dist\/cli-package\/dist\/logseq\.js --root-dir scripts\/cli-root/, "db graph workflow should test packaged CLI");
assert.match(buildWorkflow, /node dist\/cli-package\/dist\/logseq\.js --root-dir scripts\/cli-root.+--timeout-ms 3000/, "db graph workflow should use a 3s CLI request timeout for packaged CLI graph commands");
assert.match(buildWorkflow, /--graph schema-graph --timeout-ms 120000/, "db graph workflow should allow the full schema graph validation to finish in CI");
assertNotContains(buildWorkflow, "clojure -M:cljs compile logseq-cli", "db graph workflow");
assertNotContains(buildWorkflow, "pnpm db-worker-node:compile:bundle", "db graph workflow");

assert.equal(
  fs.existsSync(path.join(repoRoot, "deps/cli/package.json")),
  false,
  "old deps/cli package should be removed",
);

const depsEdn = readText("deps.edn");
assertNotContains(depsEdn, 'logseq/cli', "deps.edn");
assertNotContains(depsEdn, '"deps/cli"', "deps.edn");

const bbEdn = readText("bb.edn");
assertNotContains(bbEdn, "legacy cli", "bb.edn");
assertNotContains(bbEdn, "../cli/src", "bb.edn");

const lintTask = readText("scripts/src/logseq/tasks/dev/lint.clj");
assertNotContains(lintTask, '"deps/cli"', "lint task");

const lintDepsTask = readText("scripts/src/logseq/tasks/dev/lint_test_deps.clj");
assertNotContains(lintDepsTask, '"deps/cli"', "lint/test deps task");

for (const dependencyName of zvecOptionalRuntimeDependencies) {
  assert.equal(
    rootPackage.dependencies?.[dependencyName],
    undefined,
    `${dependencyName} should not be a hard root runtime dependency`,
  );
  assert.ok(
    rootPackage.optionalDependencies?.[dependencyName],
    `${dependencyName} should be an optional root runtime dependency`,
  );
  assert.equal(
    desktopPackage.dependencies?.[dependencyName],
    undefined,
    `${dependencyName} should not be a hard desktop runtime dependency`,
  );
  assert.ok(
    desktopPackage.optionalDependencies?.[dependencyName],
    `${dependencyName} should be an optional desktop runtime dependency`,
  );
}

assert.equal(
  fs.existsSync(path.join(repoRoot, "src/main/logseq/cli/common/mcp/server.cljs")),
  false,
  "CLI sources should not include an MCP server",
);

assertFilesDoNotMatch(
  [
    ...filesUnder("src/main/logseq/cli"),
    ...filesUnder("src/test/logseq/cli"),
    "scripts/prepare-cli-package.mjs",
  ],
  /logseq\.cli\.common\.mcp|modelcontextprotocol|zod\/v3|mcp-server/,
  "CLI sources and package preparation",
);

execFileSync(process.execPath, ["scripts/prepare-cli-package.mjs"], {
  cwd: repoRoot,
  stdio: "pipe",
});

const packageRoot = path.join(repoRoot, "dist/cli-package");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);

assert.equal(packageJson.name, "@logseq/cli");
assert.equal(packageJson.bin.logseq, "dist/logseq.js");
assert.equal(packageJson.private, undefined);
assert.equal(packageJson.dependencies?.["@modelcontextprotocol/sdk"], undefined);
assert.equal(packageJson.dependencies?.zod, undefined);
assert.ok(packageJson.dependencies?.["@js-joda/core"], "publish package should include @js-joda/core for release artifacts");
assert.ok(packageJson.dependencies?.keytar, "publish package should include keytar for db-worker-node");
assert.ok(packageJson.dependencies?.["string-width"], "publish package should include string-width for CLI rendering");
for (const dependencyName of zvecOptionalRuntimeDependencies) {
  assert.equal(
    packageJson.dependencies?.[dependencyName],
    undefined,
    `${dependencyName} should not be a hard publish package dependency`,
  );
  assert.ok(
    packageJson.optionalDependencies?.[dependencyName],
    `${dependencyName} should be an optional publish package dependency`,
  );
}
assert.deepEqual(packageJson.pnpm?.onlyBuiltDependencies, [
  "@zvec/zvec",
  "better-sqlite3",
  "keytar",
]);
assert.deepEqual(packageJson.files, [
  "dist/logseq.js",
  "static/logseq-cli.js",
  "static/logseq-cli.js.map",
  "static/js/db-worker-node.js",
  "static/js/db-worker-node-assets.json",
  ".agents/skills/logseq-cli/SKILL.md",
]);

for (const relativePath of packageJson.files) {
  assert.equal(
    fs.existsSync(path.join(packageRoot, relativePath)),
    true,
    `publish package should include ${relativePath}`,
  );
}

assertNoShadowRuntime(readText("static/logseq-cli.js"), "root CLI release artifact");
assertNoShadowRuntime(
  fs.readFileSync(path.join(packageRoot, "static/logseq-cli.js"), "utf8"),
  "publish package CLI release artifact",
);

assertNoShadowRuntime(
  fs.readFileSync(path.join(packageRoot, "static/js/db-worker-node.js"), "utf8"),
  "publish package db-worker-node release artifact",
);
