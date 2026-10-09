import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { build } from "vite";

const root = resolve(import.meta.dirname, "..");
const runtime = resolve(root, "_build/default/js_api/js_api/runtime/melange");

for (const [name, configFile] of [
  ["browser worker", resolve(root, "vite.config.mjs")],
  ["Web publishing", resolve(root, "../ui/vite.config.mjs")],
]) {
  test(`${name} has no Node vector backend and needs no process global`, async () => {
    const directory = mkdtempSync(resolve(tmpdir(), "browser-vector-"));
    try {
      const entry = resolve(directory, "entry.mjs");
      writeFileSync(entry, `
import vector from ${JSON.stringify(resolve(runtime, "vector_index.js"))};
import embedding from ${JSON.stringify(resolve(runtime, "embedding.js"))};
import effect from ${JSON.stringify(resolve(runtime, "db_worker_effect.js"))};
export function capabilities() {
  let index;
  effect.on_any(vector.open_index("/unused", 384), value => { index = value; }, error => { throw error; });
  return { enabled: embedding.enabled(), model: embedding.model_id(), index };
}
`);
      const result = await build({
        configFile, mode: "browser", logLevel: "error",
        plugins: [{ name: "reject-browser-zvec", enforce: "pre", resolveId(id) {
          assert(!id.startsWith("@zvec/"), `${name} attempted to load ${id}`);
          return null;
        } }],
        build: { write: false, sourcemap: false, minify: false,
          lib: { entry, formats: ["iife"], name: "VectorCapabilities" },
          rollupOptions: { output: { codeSplitting: false } } },
      });
      // Inline configuration appends IIFE to the UI config's ESM formats.
      const chunk = [result].flat().at(-1).output.find(item => item.type === "chunk");
      assert(!Object.keys(chunk.modules).some(id => id.includes("@zvec/")));
      const context = { self: { location: { href: "https://example.test/db-worker.js" } }, console };
      runInNewContext(chunk.code, context);
      const capabilities = context.VectorCapabilities.capabilities();
      assert.equal(capabilities.enabled, false);
      assert.equal(capabilities.model, undefined);
      assert.equal(capabilities.index, undefined);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}

test("Node retains a lazy external zvec backend", async () => {
  const result = await build({
    configFile: resolve(root, "vite.config.mjs"), mode: "node", logLevel: "error",
    build: { write: false, minify: false,
      lib: { entry: resolve(runtime, "vector_index.js"), formats: ["cjs"] } },
  });
  const chunk = [result].flat().flatMap(result => result.output).find(item => item.type === "chunk");
  assert.match(chunk.code, /require\(["']@zvec\/zvec["']\)/);
  assert(!Object.keys(chunk.modules).some(id => id.includes("@zvec/")));
  assert(!Object.keys(chunk.modules).some(id => id.endsWith("vector_index_browser.js")));
  const require = createRequire(import.meta.url);
  const requests = [];
  const module = { exports: {} };
  runInNewContext(chunk.code, {
    module, exports: module.exports, process, console, URL, URLSearchParams,
    require(id) { requests.push(id); return require(id); },
  });
  assert(!requests.some(id => id.startsWith("@zvec/")), "loading the Node backend must not initialize zvec");
});
