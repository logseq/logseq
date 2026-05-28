import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repoRoot, "dist", "cli-package");
const rootPackage = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
);

const packageFiles = [
  "dist/logseq.js",
  "static/logseq-cli.js",
  "static/logseq-cli.js.map",
  "static/js/db-worker-node.js",
  "static/js/db-worker-node-assets.json",
  ".agents/skills/logseq-cli/SKILL.md",
];

const copyEntries = [
  ["dist/logseq.js", "dist/logseq.js"],
  ["static/logseq-cli.js", "static/logseq-cli.js"],
  ["static/logseq-cli.js.map", "static/logseq-cli.js.map"],
  ["dist/db-worker-node.js", "static/js/db-worker-node.js"],
  ["dist/db-worker-node-assets.json", "static/js/db-worker-node-assets.json"],
  [".agents/skills/logseq-cli/SKILL.md", ".agents/skills/logseq-cli/SKILL.md"],
];

const assertReleaseEntrypoint = (content) => {
  for (const needle of ["SHADOW_IMPORT", ".shadow-cljs", "cljs-runtime"]) {
    if (content.includes(needle)) {
      throw new Error(
        `static/logseq-cli.js still references Shadow runtime output: ${needle}`,
      );
    }
  }
};

const dependencyNames = [
  "@js-joda/core",
  "@zvec/bindings-darwin-arm64",
  "@zvec/bindings-linux-arm64",
  "@zvec/bindings-linux-x64",
  "@zvec/bindings-win32-x64",
  "@zvec/zvec",
  "better-sqlite3",
  "fs-extra",
  "jszip",
  "keytar",
  "mldoc",
  "picocolors",
  "string-width",
  "ws",
];

const onlyBuiltDependencies = rootPackage.pnpm.onlyBuiltDependencies.filter(
  (name) => dependencyNames.includes(name),
);

const dependencyVersion = (name) =>
  rootPackage.dependencies?.[name] ??
  rootPackage.optionalDependencies?.[name] ??
  rootPackage.devDependencies?.[name];

const dependencyEntries = dependencyNames.map((name) => {
  const version = dependencyVersion(name);
  if (!version) {
    throw new Error(`Missing CLI runtime dependency in package.json: ${name}`);
  }
  return [name, version];
});

const optionalDependencyNames = new Set(
  Object.keys(rootPackage.optionalDependencies ?? {}),
);

const dependencies = Object.fromEntries(
  dependencyEntries.filter(([name]) => !optionalDependencyNames.has(name)),
);

const optionalDependencies = Object.fromEntries(
  dependencyEntries.filter(([name]) => optionalDependencyNames.has(name)),
);

assertReleaseEntrypoint(
  fs.readFileSync(path.join(repoRoot, "static", "logseq-cli.js"), "utf8"),
);

fs.rmSync(packageRoot, { recursive: true, force: true });

for (const [sourcePath, packagePath] of copyEntries) {
  const source = path.join(repoRoot, sourcePath);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing CLI package input: ${sourcePath}`);
  }
  const destination = path.join(packageRoot, packagePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

const packageJson = {
  name: "@logseq/cli",
  version: process.env.CLI_PACKAGE_VERSION ?? rootPackage.version,
  packageManager: rootPackage.packageManager,
  description: "Logseq CLI",
  bin: {
    logseq: "dist/logseq.js",
  },
  engines: rootPackage.engines,
  license: "MIT",
  repository: {
    type: "git",
    url: "git+https://github.com/logseq/logseq.git",
    directory: ".",
  },
  keywords: [
    "logseq",
    "knowledge graph",
    "note taking",
    "clojurescript",
  ],
  files: packageFiles,
  dependencies,
  optionalDependencies,
  pnpm: {
    onlyBuiltDependencies,
  },
};

fs.writeFileSync(
  path.join(packageRoot, "package.json"),
  `${JSON.stringify(packageJson, null, 2)}\n`,
);

console.log(`Prepared ${packageJson.name}@${packageJson.version} in ${packageRoot}`);
