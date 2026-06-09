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

export default defineConfig({
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
