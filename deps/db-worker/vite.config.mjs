// Bundles the Melange-emitted CommonJS tree into the two files the
// cljs workers load:
//   --mode node    -> static/db-worker-ocaml.cjs   (require'd by db-worker-node)
//   --mode browser -> static/js/db-worker-ocaml.js (importScripts'd by db-worker,
//                     exposes globalThis.LogseqDbWorker)
// Build order: `dune build` (deps/db-worker) then `vite build --mode ...`.
import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const entry = resolve(
  import.meta.dirname,
  "_build/default/js_api/js_api/js_api/entry_worker.js",
);

const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
];

const nodeExternalsStub = resolve(
  import.meta.dirname,
  "stubs/node-externals.mjs",
);

export default defineConfig(({ mode }) => {
  if (mode === "node") {
    return {
      build: {
        lib: {
          entry,
          formats: ["cjs"],
          fileName: () => "db-worker-ocaml.cjs",
        },
        outDir: resolve(import.meta.dirname, "../../static"),
        emptyOutDir: false,
        target: "node22",
        minify: true,
        sourcemap: false,
        rollupOptions: {
          // node:sqlite stays a runtime require; keytar is resolved
          // lazily by runtime/melange/secret_store.ml at runtime.
          external: (id) => id === "keytar" || nodeBuiltins.includes(id),
          output: { exports: "auto", codeSplitting: false },
        },
      },
    };
  }

  return {
    build: {
      lib: {
        entry,
        formats: ["iife"],
        name: "LogseqDbWorker",
        fileName: () => "db-worker-ocaml.js",
      },
      outDir: resolve(import.meta.dirname, "../../static/js"),
      emptyOutDir: false,
      minify: true,
      sourcemap: false,
      rollupOptions: {
        output: { codeSplitting: false },
      },
    },
    resolve: {
      alias: [
        // Node-only modules are only reached under Node runtime
        // detection (see runtime/melange/sqlite.ml is_node); stub them
        // out so the shared melange modules bundle for browser.
        { find: /^node:sqlite$/, replacement: nodeExternalsStub },
        { find: /^fs$/, replacement: nodeExternalsStub },
        { find: /^node:fs$/, replacement: nodeExternalsStub },
        { find: /^keytar$/, replacement: nodeExternalsStub },
      ],
    },
  };
});
