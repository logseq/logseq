import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const entry = resolve(process.cwd(), "js/js_api/entry_graph_fs.js");
const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
];

export default defineConfig({
  build: {
    ssr: entry,
    emptyOutDir: false,
    minify: true,
    sourcemap: false,
    target: "node22",
    rollupOptions: {
      external: nodeBuiltins,
      output: {
        entryFileNames: "melange-js-api-graph-fs.js",
        exports: "auto",
        format: "cjs",
        codeSplitting: false,
      },
    },
  },
});
