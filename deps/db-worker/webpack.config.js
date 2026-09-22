const path = require('path');
const webpack = require('webpack');

// Bundles the Melange-emitted CommonJS tree into the single file the
// cljs node worker loads via require('./db-worker-ocaml.cjs').
// Build order: `dune build` (deps/db-worker) then `webpack -c`.
var NodeConfig = {
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
  externals: { 'node:sqlite': 'commonjs node:sqlite', keytar: 'commonjs keytar' },
  resolve: { extensions: ['.js'] },
};

// Browser worker bundle loaded by frontend.worker.db-worker via
// importScripts('db-worker-ocaml.js'); sqlite-wasm oo1 OPFS pools
// provide storage (see runtime/melange/sqlite.ml).
var BrowserConfig = {
  name: 'db-worker-ocaml-browser',
  mode: 'production',
  target: 'webworker',
  entry: './_build/default/js_api/js_api/js_api/entry_worker.js',
  context: __dirname,
  output: {
    path: path.resolve(__dirname, '../../static/js'),
    filename: 'db-worker-ocaml.js',
    library: { name: 'LogseqDbWorker', type: 'var' },
  },
  resolve: { extensions: ['.js'] },
  plugins: [
    // node-only modules are only reached under Node runtime
    // detection (see runtime/melange/sqlite.ml is_node); stub them
    // out so the shared melange modules bundle for browser.
    new webpack.IgnorePlugin({
      resourceRegExp: /^(node:sqlite|fs|keytar)$/,
    }),
  ],
};

module.exports = [NodeConfig, BrowserConfig];
