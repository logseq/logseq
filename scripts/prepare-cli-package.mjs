import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repoRoot, "dist", "cli-package");
const rootPackage = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
);

const requiredFiles = [
  "dist/logseq.js",
  "static/logseq-cli.js",
  "static/logseq-cli.js.map",
  ".agents/skills/logseq-cli/SKILL.md",
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
  "@zvec/zvec",
  "better-sqlite3",
  "fs-extra",
  "jszip",
  "mldoc",
  "picocolors",
  "ws",
];

const dependencyVersion = (name) =>
  rootPackage.dependencies?.[name] ?? rootPackage.devDependencies?.[name];

const dependencies = Object.fromEntries(
  dependencyNames.map((name) => {
    const version = dependencyVersion(name);
    if (!version) {
      throw new Error(`Missing CLI runtime dependency in package.json: ${name}`);
    }
    return [name, version];
  }),
);

assertReleaseEntrypoint(
  fs.readFileSync(path.join(repoRoot, "static", "logseq-cli.js"), "utf8"),
);

fs.rmSync(packageRoot, { recursive: true, force: true });

for (const relativePath of requiredFiles) {
  const source = path.join(repoRoot, relativePath);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing CLI package input: ${relativePath}`);
  }
  const destination = path.join(packageRoot, relativePath);
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
  files: requiredFiles,
  dependencies,
};

fs.writeFileSync(
  path.join(packageRoot, "package.json"),
  `${JSON.stringify(packageJson, null, 2)}\n`,
);

console.log(`Prepared ${packageJson.name}@${packageJson.version} in ${packageRoot}`);
