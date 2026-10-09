// Bundles the Melange-emitted ESM tree into static/js/main.js (+ lazy
// chunks for i18n dicts and CodeMirror modes), loaded by
// resources/index.html as a module script.
// Build order: `dune build js_api` (in deps/db-worker),
// `dune build js_app` (in deps/ui), then `vite build`.
// Modes:
//   vite build                      -> dev bundle: readable, full sourcemaps,
//                                    logseq_dev=true (cljs dev? equivalent)
//   vite build --mode production    -> release bundle: minified, hidden
//     (npm run build:production)      sourcemap, logseq_dev=false
// vite defaults env.mode to "production" for every build, so the flag is
// detected on argv, not through ConfigEnv.mode.
import { execSync } from "node:child_process";
import { builtinModules, createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { defineConfig } from "vite";
import { browserVectorBackend } from "../db-worker/browser-platform.mjs";

const entry = resolve(
  import.meta.dirname,
  "_build/default/js_app/js_app/js_app/main.js",
);

// Resolve codemirror the same way the emitted tree's require() calls do,
// so the lazy mode chunks register onto the same CodeMirror instance.
const cmModeDir = join(
  dirname(
    createRequire(import.meta.url).resolve("codemirror/package.json", {
      paths: [import.meta.dirname],
    }),
  ),
  "mode",
);

let revision = "";
try {
  revision = execSync("git rev-parse --short=9 HEAD", {
    cwd: import.meta.dirname,
  })
    .toString()
    .trim();
} catch {}

function cliMode() {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--mode");
  if (idx !== -1) return args[idx + 1];
  const inline = args.find((arg) => arg.startsWith("--mode="));
  return inline ? inline.slice("--mode=".length) : undefined;
}

export default defineConfig(() => {
  const production = cliMode() === "production";
  return {
    plugins: [browserVectorBackend()],
    resolve: {
      alias: [
        { find: new RegExp(`^(node:)?(${builtinModules.join("|")})$`),
          replacement: resolve(import.meta.dirname, "../db-worker/stubs/node-externals.mjs") },
        { find: "lui-shims/publishing-db",
          replacement: resolve(import.meta.dirname, "shims/publishing_db.mjs") },
        {
          // Stdlib.Printf -> mini interpreter (shims/printf.js), so the
          // full camlinternalFormat runtime stays out of the bundle.
          // Matches "melange/printf.js" and relative "./printf.js"
          // specifiers; nothing else in the tree is named printf.js.
          find: /^(.*\/)?printf\.js$/,
          replacement: resolve(import.meta.dirname, "shims/printf.js"),
        },
        {
          // Lazy dict/codemirror-mode chunk loaders (shims/lazy_assets.mjs).
          find: "lui-shims/lazy-assets",
          replacement: resolve(import.meta.dirname, "shims/lazy_assets.mjs"),
        },
        {
          // import.meta.glob target for CodeMirror modes.
          find: /^@codemirror-modes/,
          replacement: cmModeDir,
        },
      ],
    },
    define: {
      "globalThis.logseq_revision": JSON.stringify(revision),
      // cljs config/dev? = dev-release? || goog.DEBUG — true in dev
      // bundles, false in release.
      logseq_dev: production ? "false" : "true",
      // @tanstack/virtual-core's esm build reads process.env.NODE_ENV;
      // browsers have no process, so substitute a literal.
      "process.env.NODE_ENV": '"production"',
    },
    build: {
      lib: {
        entry,
        formats: ["es"],
        fileName: () => "main.js",
      },
      outDir: resolve(import.meta.dirname, "../../static/js"),
      emptyOutDir: false,
      minify: production,
      // cljs release emitted main.js.map next to the bundle and the
      // deploy pipeline stripped it before shipping; "hidden" keeps the
      // map on disk for symbolication without a sourceMappingURL comment
      // in the shipped file.
      sourcemap: production ? "hidden" : true,
      rollupOptions: {
        output: { chunkFileNames: "chunks/[name]-[hash].js" },
      },
    },
  };
});
