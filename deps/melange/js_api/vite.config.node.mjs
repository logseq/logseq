import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const entry = resolve(process.cwd(), "js/js_api/entry_node.js");
const emptyShim = resolve(process.cwd(), "shims/empty.js");

const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
];

const nodeRuntimeDeps = [
  "@zvec/zvec",
  "keytar",
  "ws",
];

export default defineConfig({
  resolve: {
    alias: [
      { find: "@sqlite.org/sqlite-wasm", replacement: emptyShim },
      { find: "comlink", replacement: emptyShim },
    ],
  },
  ssr: {
    noExternal: ["transit-js"],
  },
  build: {
    ssr: entry,
    emptyOutDir: false,
    minify: true,
    sourcemap: false,
    target: "node22",
    rollupOptions: {
      external: [
        ...nodeBuiltins,
        ...nodeRuntimeDeps,
      ],
      output: {
        entryFileNames: "melange-js-api-node.js",
        exports: "auto",
        format: "cjs",
        codeSplitting: false,
      },
    },
    commonjsOptions: {
      include: [/\/js\//, /node_modules\/transit-js/],
    },
  },
});
