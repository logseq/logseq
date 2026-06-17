import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const entry = resolve(process.cwd(), "js/lib/js_api/entry_node.js");

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
      external: [
        ...nodeBuiltins,
        "@sqlite.org/sqlite-wasm",
        "@zvec/zvec",
        "comlink",
        "keytar",
        "ws",
      ],
      output: {
        entryFileNames: "melange-js-api-node.js",
        exports: "auto",
        format: "cjs",
        codeSplitting: false,
      },
    },
    commonjsOptions: {
      include: [/\/js\//],
    },
  },
});
