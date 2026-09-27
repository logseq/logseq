// Bundles the Melange-emitted CommonJS tree into the files the
// app loads:
//   --mode node    -> static/db-worker-ocaml.cjs (the daemon/library
//                     bundle) + static/db-worker-node.js (thin
//                     entrypoint that invokes the bundle's main())
//   --mode browser -> static/js/db-worker.js (the worker script the
//                     UI thread spawns; installs the Comlink surface
//                     on load — see js_api/entry_worker.ml)
// Build order: `dune build js_api` (deps/db-worker — plain `dune build`
// does not run the melange emit) then `vite build --mode ...`.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
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

// Match shadow's build-metadata-hook and cli/vite.config.mjs: the
// daemon's /healthz revision must equal the caller's baked revision or
// graph-lifecycle retires the worker as outdated.
function gitRevision() {
  try {
    return execFileSync("git", ["describe", "--long", "--always", "--dirty"], {
      cwd: resolve(import.meta.dirname, "../.."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "dev";
  }
}

const buildTime = process.env.LOGSEQ_BUILD_TIME ?? new Date().toISOString();
const revision = process.env.LOGSEQ_REVISION ?? gitRevision();

// The bundle sets its own env defaults before the body runs so
// common-version's runtime env lookup reports the build metadata.
// Guarded: the browser worker has no process global.
const metadataIntro = `typeof process!=="undefined"&&(process.env.LOGSEQ_BUILD_REVISION??=${JSON.stringify(
  revision,
)},process.env.LOGSEQ_BUILD_TIME??=${JSON.stringify(buildTime)});`;

export default defineConfig(({ mode }) => {
  if (mode === "node") {
    const outDir = resolve(import.meta.dirname, "../../static");
    return {
      plugins: [
        {
          name: "emit-db-worker-node-entry",
          // The CLI and Electron spawn `node db-worker-node.js`; the
          // artifact is a thin CommonJS entry that runs the OCaml
          // bundle's main() export.
          closeBundle() {
            writeFileSync(
              resolve(outDir, "db-worker-node.js"),
              '"use strict";\nrequire("./db-worker-ocaml.cjs").main();\n',
            );
          },
        },
      ],
      build: {
        lib: {
          entry,
          formats: ["cjs"],
          fileName: () => "db-worker-ocaml.cjs",
        },
        outDir,
        emptyOutDir: false,
        target: "node22",
        minify: true,
        sourcemap: false,
        rollupOptions: {
          // node:sqlite stays a runtime require; keytar is resolved
          // lazily by runtime/melange/secret_store.ml at runtime.
          external: (id) => id === "keytar" || nodeBuiltins.includes(id),
          output: {
            exports: "auto",
            codeSplitting: false,
            intro: metadataIntro,
          },
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
          intro: `var __db_worker_import_meta_url__ = self.location.href;${metadataIntro}`,
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
