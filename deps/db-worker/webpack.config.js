const path = require('path');

// Bundles the Melange-emitted CommonJS tree into the single file the
// cljs node worker loads via require('./db-worker-ocaml.cjs').
// Build order: `dune build` (deps/db-worker) then `webpack -c`.
module.exports = {
  name: 'db-worker-ocaml-node',
  mode: 'production',
  target: 'node',
  entry: './_build/default/js_api/js_api/js_api/entry_worker.js',
  context: __dirname,
  output: {
    path: path.resolve(__dirname, '../../static'),
    filename: 'db-worker-ocaml.cjs',
    library: { type: 'commonjs-module' },
  },
  externals: { 'node:sqlite': 'commonjs node:sqlite' },
  resolve: { extensions: ['.js'] },
};
