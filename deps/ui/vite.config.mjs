// Bundles the Melange-emitted CommonJS tree into static/js/main.js,
// loaded by resources/index.html as a deferred classic script.
// Build order: `dune build js_app` (in deps/ui), then `vite build`.
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

export default defineConfig({
  define: {
    "globalThis.logseq_revision": JSON.stringify(revision),
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
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: { codeSplitting: false },
    },
  },
});
