import { execFileSync } from "node:child_process";
import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const entry = resolve(
  process.cwd(),
  "bin/logseq_cli_melange/bin/main.js",
);

const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
];

const gitCwd = process.env.DUNE_SOURCEROOT ?? process.cwd();

function gitOutput(args) {
  try {
    return execFileSync("git", args, {
      cwd: gitCwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function gitRevision() {
  const commit = gitOutput(["rev-parse", "--short", "HEAD"]);
  if (!commit) {
    return "dev";
  }

  const clean = gitOutput(["diff-index", "--quiet", "HEAD", "--"]) === "";
  return `${commit}${clean ? "" : "-dirty"}`;
}

const buildTime = process.env.LOGSEQ_BUILD_TIME ?? new Date().toISOString();
const revision = process.env.LOGSEQ_REVISION ?? gitRevision();

export default defineConfig({
  define: {
    LOGSEQ_CLI_BUILD_TIME: JSON.stringify(buildTime),
    LOGSEQ_CLI_REVISION: JSON.stringify(revision),
  },
  build: {
    lib: {
      entry,
      formats: ["cjs"],
      fileName: () => "logseq-cli.js",
    },
    emptyOutDir: false,
    minify: true,
    sourcemap: false,
    target: "node22",
    rollupOptions: {
      external: nodeBuiltins,
      output: {
        exports: "auto",
        codeSplitting: false,
      },
    },
    commonjsOptions: {
      include: [
        /\/bin\/logseq_cli_melange\//,
      ],
    },
  },
});
