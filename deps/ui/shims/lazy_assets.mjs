// Lazy static assets — every glob match becomes its own vite chunk,
// fetched on demand instead of bundled into main.js. Kept in a .mjs shim
// (bound via require() inside function bodies in the OCaml sources) so
// import.meta.glob stays statically analyzable by the bundler and the
// node test build never resolves the specifier.

// One chunk per cljs tongue dict; en stays embedded in Dicts_gen.
const dictLoaders = import.meta.glob(
  ["../../../src/resources/dicts/*.edn", "!../../../src/resources/dicts/en.edn"],
  { query: "?raw", import: "default" },
);

// One chunk per codemirror mode file; shared deps (clike/xml/css/...)
// become shared chunks automatically.
const modeLoaders = {};
for (const [path, load] of Object.entries(
  import.meta.glob("@codemirror-modes/*/*.js"),
)) {
  const m = path.match(/\/mode\/[^/]+\/([^/]+)\.js$/);
  if (m) modeLoaders[m[1]] = load;
}

export function loadDictFile(name) {
  const load = dictLoaders[`../../../src/resources/dicts/${name}`];
  if (!load) return Promise.reject(new Error(`unknown i18n dict ${name}`));
  return load();
}

export function loadCmMode(name) {
  const load = modeLoaders[name];
  if (!load) {
    return Promise.reject(new Error(`unknown codemirror mode ${name}`));
  }
  return load();
}
