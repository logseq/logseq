// Bundles the Melange-emitted CommonJS tree into the files the
// app loads:
//   --mode node    -> static/db-worker-node.js (the standalone daemon
//                     entry spawned by graph-lifecycle; calls
//                     Db_worker_node.main on load — see js_api/entry_node.ml)
//   --mode electron -> static/electron.js (the Electron main process,
//                     OCaml port of src/electron — see
//                     js_api/entry_electron.ml)
//   --mode browser -> static/js/db-worker.js (the worker script the
//                     UI thread spawns; installs the Comlink surface
//                     on load — see js_api/entry_worker.ml)
// Build order: `dune build js_api` (deps/db-worker — plain `dune build`
// does not run the melange emit) then `vite build --mode ...`.
import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const browserEntry = resolve(
  import.meta.dirname,
  "_build/default/js_api/js_api/js_api/entry_worker.js",
);

const nodeEntry = resolve(
  import.meta.dirname,
  "_build/default/js_api/js_api/js_api/entry_node.js",
);

const electronEntry = resolve(
  import.meta.dirname,
  "_build/default/js_api/js_api/js_api/entry_electron.js",
);

const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
];

// runtime deps of the electron main bundle — resolved from
// static/node_modules at runtime (resources/package.json dependencies
// plus the electron runtime itself).
const electronRuntimeDeps = [
  "@logseq/graph-lifecycle",
  "@fastify/cors",
  "@js-joda/core",
  "@modelcontextprotocol/sdk",
  "abort-controller",
  "command-exists",
  "diff-match-patch",
  "electron-dl",
  "electron-log",
  "electron-updater",
  "electron-window-state",
  "extract-zip",
  "fastify",
  "fs-extra",
  "https-proxy-agent",
  "keytar",
  "mldoc",
  "node-fetch",
  "open",
  "picocolors",
  "remove-accents",
  "sanitize-filename",
  "semver",
  "socks-proxy-agent",
  "string-width",
  "tiny-pinyin",
  "ws",
  "zod",
  "@zvec/bindings-darwin-arm64",
  "@zvec/bindings-darwin-x64",
  "@zvec/bindings-linux-arm64",
  "@zvec/bindings-linux-x64",
  "@zvec/bindings-win32-x64",
  "@zvec/zvec",
];

const nodeExternalsStub = resolve(
  import.meta.dirname,
  "stubs/node-externals.mjs",
);

export default defineConfig(({ mode }) => {
  if (mode === "electron") {
    return {
      build: {
        lib: {
          entry: electronEntry,
          formats: ["cjs"],
          fileName: () => "electron.js",
        },
        outDir: resolve(import.meta.dirname, "../../static"),
        emptyOutDir: false,
        target: "node22",
        minify: false,
        sourcemap: false,
        rollupOptions: {
          // Electron main resolves its npm deps (electron, fastify,
          // keytar, @logseq/graph-lifecycle, ...) from
          // static/node_modules at runtime; the melange output and
          // melange-installed libraries are bundled. Anything not
          // listed here (melange.js/*, datascript_ocaml/*, comlink, ...)
          // is bundled like the node-mode bundle.
          external: (id) =>
            id === "electron" ||
            electronRuntimeDeps.some(
              (dep) => id === dep || id.startsWith(`${dep}/`),
            ) ||
            nodeBuiltins.includes(id),
          output: { exports: "auto", codeSplitting: false },
        },
      },
    };
  }

  if (mode === "node") {
    return {
      build: {
        lib: {
          entry: nodeEntry,
          formats: ["cjs"],
          fileName: () => "db-worker-node.js",
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
        entry: browserEntry,
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
