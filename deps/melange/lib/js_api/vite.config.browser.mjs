import { resolve } from "node:path";
import { defineConfig } from "vite";

const entry = resolve(process.cwd(), "js/lib/js_api/entry_browser.js");
const emptyShim = resolve(process.cwd(), "shims/empty.js");
const processShim = resolve(process.cwd(), "shims/process.js");

export default defineConfig({
  resolve: {
    alias: [
      { find: /^node:.+$/, replacement: emptyShim },
      { find: "fs", replacement: emptyShim },
      { find: "keytar", replacement: emptyShim },
      { find: "path", replacement: emptyShim },
      { find: "process", replacement: processShim },
      { find: "ws", replacement: emptyShim },
      { find: "@zvec/zvec", replacement: emptyShim },
    ],
  },
  build: {
    lib: {
      entry,
      formats: ["cjs"],
      fileName: () => "melange-js-api-browser.js",
    },
    emptyOutDir: false,
    minify: true,
    sourcemap: false,
    target: "es2022",
    rollupOptions: {
      external: ["@sqlite.org/sqlite-wasm", "comlink"],
      output: {
        exports: "auto",
        codeSplitting: false,
      },
    },
    commonjsOptions: {
      include: [/\/js\//],
    },
  },
});
