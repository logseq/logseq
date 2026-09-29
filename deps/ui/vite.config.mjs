// Bundles the Melange-emitted CommonJS tree into static/js/main.js,
// loaded by resources/index.html as a deferred classic script.
// Build order: `dune build js_app` (in deps/ui), then `vite build`.
// Modes:
//   vite build                      -> dev bundle: readable, full sourcemaps,
//                                    logseq_dev=true (cljs dev? equivalent)
//   vite build --mode production    -> release bundle: minified, hidden
//     (npm run build:production)      sourcemap, logseq_dev=false
// vite defaults env.mode to "production" for every build, so the flag is
// detected on argv, not through ConfigEnv.mode.
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const entry = resolve(
  import.meta.dirname,
  "_build/default/js_app/js_app/js_app/main.js",
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
    resolve: {
      alias: [
        {
          // Stdlib.Printf -> mini interpreter (shims/printf.js), so the
          // full camlinternalFormat runtime stays out of the bundle.
          // Matches "melange/printf.js" and relative "./printf.js"
          // specifiers; nothing else in the tree is named printf.js.
          find: /^(.*\/)?printf\.js$/,
          replacement: resolve(import.meta.dirname, "shims/printf.js"),
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
        formats: ["iife"],
        name: "LogseqUI",
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
        output: { codeSplitting: false },
      },
    },
  };
});
