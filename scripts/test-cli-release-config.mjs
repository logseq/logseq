import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import os from "node:os";
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

const assertRootScriptDoesNotBuildShadowCli = (scriptName, command) => {
  assert.ok(command, `package.json should define ${scriptName}`);
  assert.doesNotMatch(
    command,
    /clojure -[MA]:cljs (?:watch|compile|release)[^"]*\blogseq-cli\b/,
    `${scriptName} should not build the old Shadow CLI`,
  );
};

const assertCliReleaseCommand = (command, label) => {
  assert.match(command, /pnpm --dir cli bundle/, `${label} should bundle cli/`);
  assert.match(
    command,
    /node \.\/scripts\/stage-cli-runtime\.mjs/,
    `${label} should stage the cli/ bundle`,
  );
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
assert.match(workflow, /cli\/\*\*/, "workflow should watch cli/ sources");
assert.match(workflow, /pnpm cli:release/, "workflow should build new CLI");
assertNotContains(workflow, "clojure -M:cljs release logseq-cli", "deps-cli workflow");
assert.match(workflow, /pnpm db-worker-node:release:bundle/, "workflow should build bundled db-worker-node runtime");
assert.match(workflow, /node scripts\/prepare-cli-package\.mjs/, "workflow should prepare publish package");
assert.match(workflow, /working-directory: dist\/cli-package/, "workflow should publish prepared package");

const buildWorkflow = readText(".github/workflows/build.yml");
assert.match(buildWorkflow, /pnpm cli:release/, "db graph workflow should build release CLI");
assertNotContains(buildWorkflow, "clojure -M:cljs release logseq-cli", "db graph workflow");
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

const desktopReleaseWorkflow = readText(".github/workflows/build-desktop-release.yml");
assert.match(
  desktopReleaseWorkflow,
  /OCAML_VERSION: '5\.4\.0'/,
  "desktop release workflow should define the OCaml version used by cli/",
);
assert.match(
  desktopReleaseWorkflow,
  /uses: ocaml\/setup-ocaml@v3/,
  "desktop release workflow should set up OCaml before building cli/",
);
assert.match(
  desktopReleaseWorkflow,
  /working-directory: cli\s+run: opam install \. --deps-only --with-test --yes/,
  "desktop release workflow should install cli/ OCaml deps",
);
assert.match(
  desktopReleaseWorkflow,
  /pnpm --dir cli install --frozen-lockfile/,
  "desktop release workflow should install cli/ pnpm deps",
);
assert.match(
  desktopReleaseWorkflow,
  /opam exec -- pnpm cli:release/,
  "desktop release workflow should build and stage the OCaml CLI",
);
assert.ok(
  desktopReleaseWorkflow.indexOf("opam exec -- pnpm cli:release") <
    desktopReleaseWorkflow.indexOf("pnpm desktop:prepare-runtime-js"),
  "desktop release workflow should stage the CLI before preparing desktop runtime scripts",
);
assertNotContains(
  desktopReleaseWorkflow,
  "clojure -M:cljs release logseq-cli",
  "desktop release workflow",
);

const shadowCljs = readText("shadow-cljs.edn");
assertNotContains(shadowCljs, ":logseq-cli", "shadow-cljs.edn");

assertCliReleaseCommand(rootPackage.scripts?.["cli:release"], "cli:release");
for (const [scriptName, command] of Object.entries(rootPackage.scripts ?? {})) {
  assertRootScriptDoesNotBuildShadowCli(scriptName, command);
}

const stageScriptPath = path.join(repoRoot, "scripts", "stage-cli-runtime.mjs");
assert.equal(
  fs.existsSync(stageScriptPath),
  true,
  "scripts/stage-cli-runtime.mjs should exist",
);
const stageScript = readText("scripts/stage-cli-runtime.mjs");
assert.match(
  stageScript,
  /cli[\\/]_build[\\/]default[\\/]dist[\\/]logseq-cli\.js/,
  "stage script should read cli/_build/default/dist/logseq-cli.js",
);
assert.match(
  stageScript,
  /static[\\/]logseq-cli\.js/,
  "stage script should write static/logseq-cli.js",
);
for (const needle of ["SHADOW_IMPORT", ".shadow-cljs", "cljs-runtime"]) {
  assert.match(
    stageScript,
    new RegExp(needle.replace(".", "\\.")),
    `stage script should reject ${needle}`,
  );
}

const runStageCliRuntime = (fixtureRoot) =>
  execFileSync(process.execPath, ["scripts/stage-cli-runtime.mjs"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      LOGSEQ_STAGE_CLI_RUNTIME_REPO_ROOT: fixtureRoot,
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const makeStageFixture = () =>
  mkdtempSync(path.join(os.tmpdir(), "logseq-stage-cli-"));

{
  const fixtureRoot = makeStageFixture();
  assert.throws(
    () => runStageCliRuntime(fixtureRoot),
    /cli\/_build\/default\/dist\/logseq-cli\.js/,
    "stage script should fail when the cli/ bundle is missing",
  );
}

{
  const fixtureRoot = makeStageFixture();
  const sourcePath = path.join(
    fixtureRoot,
    "cli",
    "_build",
    "default",
    "dist",
    "logseq-cli.js",
  );
  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  fs.writeFileSync(sourcePath, "console.log('SHADOW_IMPORT');\n");
  assert.throws(
    () => runStageCliRuntime(fixtureRoot),
    /SHADOW_IMPORT/,
    "stage script should reject Shadow runtime markers",
  );
}

{
  const fixtureRoot = makeStageFixture();
  const sourcePath = path.join(
    fixtureRoot,
    "cli",
    "_build",
    "default",
    "dist",
    "logseq-cli.js",
  );
  const stagedPath = path.join(fixtureRoot, "static", "logseq-cli.js");
  const staleMapPath = path.join(fixtureRoot, "static", "logseq-cli.js.map");
  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  fs.mkdirSync(path.dirname(staleMapPath), { recursive: true });
  fs.writeFileSync(sourcePath, "console.log('new cli');\n");
  fs.writeFileSync(staleMapPath, "{}\n");
  const output = runStageCliRuntime(fixtureRoot);
  assert.equal(
    fs.readFileSync(stagedPath, "utf8"),
    "console.log('new cli');\n",
  );
  assert.equal(
    fs.existsSync(staleMapPath),
    false,
    "stage script should remove stale root sourcemap",
  );
  assert.match(output, /cli\/_build\/default\/dist\/logseq-cli\.js/);
  assert.match(output, /static\/logseq-cli\.js/);
}

{
  const fixtureRoot = makeStageFixture();
  const sourcePath = path.join(
    fixtureRoot,
    "cli",
    "_build",
    "default",
    "dist",
    "logseq-cli.js",
  );
  const stagedPath = path.join(fixtureRoot, "static", "logseq-cli.js");
  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  fs.mkdirSync(path.dirname(stagedPath), { recursive: true });
  fs.writeFileSync(sourcePath, "console.log('first');\n");
  fs.writeFileSync(stagedPath, "console.log('old');\n");
  fs.chmodSync(stagedPath, 0o444);
  runStageCliRuntime(fixtureRoot);
  assert.equal(
    fs.readFileSync(stagedPath, "utf8"),
    "console.log('first');\n",
    "stage script should overwrite an existing read-only staged file",
  );
}

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

const prepareCliPackageScript = readText("scripts/prepare-cli-package.mjs");
assert.match(
  prepareCliPackageScript,
  /static[\\/]logseq-cli\.js/,
  "package preparation should package the staged CLI",
);
assert.match(
  prepareCliPackageScript,
  /cli[\\/]_build[\\/]default[\\/]dist[\\/]logseq-cli\.js/,
  "package preparation should compare the staged CLI against the cli/ bundle",
);
for (const needle of ["SHADOW_IMPORT", ".shadow-cljs", "cljs-runtime"]) {
  assert.match(
    prepareCliPackageScript,
    new RegExp(needle.replace(".", "\\.")),
    `package preparation should reject ${needle}`,
  );
}

const prepareDesktopRuntimeScript = readText(
  "scripts/prepare-desktop-runtime-js.mjs",
);
assert.match(
  prepareDesktopRuntimeScript,
  /static[\\/]logseq-cli\.js/,
  "desktop runtime preparation should read the staged CLI",
);
assert.match(
  prepareDesktopRuntimeScript,
  /static[\\/]js[\\/]logseq-cli\.js/,
  "desktop runtime preparation should write static/js/logseq-cli.js",
);
assert.match(
  prepareDesktopRuntimeScript,
  /cli[\\/]_build[\\/]default[\\/]dist[\\/]logseq-cli\.js/,
  "desktop runtime preparation should compare the staged CLI against the cli/ bundle",
);
assertNotContains(
  prepareDesktopRuntimeScript,
  'fs.rm(path.join(staticDir, "logseq-cli.js")',
  "desktop runtime preparation should keep root staged CLI available",
);
assertNotContains(
  prepareDesktopRuntimeScript,
  'fs.rm(path.join(staticDir, "db-worker-node.js")',
  "desktop runtime preparation should keep root staged db-worker-node available",
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
