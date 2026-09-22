// Bundles the Melange-emitted CommonJS tree into the two files the
// app loads:
//   --mode node    -> static/db-worker-ocaml.cjs   (require'd by db-worker-node)
//   --mode browser -> static/js/db-worker.js (the worker script the
//                     UI thread spawns; installs the Comlink surface
//                     on load — see js_api/entry_worker.ml)
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
    // Relative base: sqlite-wasm resolves its vfs worker URL off
    // self.location.href, so assets land next to db-worker.js and the
    // same URLs work under the app's origin and under Capacitor's
    // scheme on mobile.
    base: "./",
    build: {
      lib: {
        entry,
        formats: ["iife"],
        name: "LogseqDbWorker",
        fileName: () => "db-worker.js",
      },
      outDir: resolve(import.meta.dirname, "../../static/js"),
      emptyOutDir: false,
      minify: true,
      sourcemap: false,
      rollupOptions: {
        // Classic-worker IIFE has no import.meta; sqlite-wasm resolves
        // its vfs worker + wasm URLs relative to it. Polyfill per
        // rolldown's non-ESM output format docs: define rewrites the
        // references, intro binds the worker script URL.
        transform: {
          define: {
            "import.meta.url": "__db_worker_import_meta_url__",
          },
        },
        output: {
          codeSplitting: false,
          intro: "var __db_worker_import_meta_url__ = self.location.href;",
        },
      },
    },
    plugins: [
      {
        name: "worker-url-base",
        // With base './' the URL rewriter emits
        // `document.currentScript || document.baseURI` as the base;
        // neither exists in a worker scope — substitute the worker
        // script URL bound by the intro.
        renderChunk: (code) =>
          code
            .replaceAll("document.currentScript", "undefined")
            .replaceAll("document.baseURI", "__db_worker_import_meta_url__"),
      },
    ],
    resolve: {
      alias: [
        // Node-only modules are only reached under Node runtime
        // detection (see runtime/melange/sqlite.ml is_node); stub all
        // node builtins out so the shared melange modules bundle for
        // browser.
        {
          find: new RegExp(
            `^(node:)?(${builtinModules.join("|")})$`,
          ),
          replacement: nodeExternalsStub,
        },
        { find: /^keytar$/, replacement: nodeExternalsStub },
      ],
    },
  };
});
