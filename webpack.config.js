const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: "development",
  entry: './target/index.js',
  output: {
    path: path.resolve(__dirname, 'static/js/libs'),
    filename: 'bundle.js',
    clean: true,
    chunkLoading: false,
  },
  module: {
    rules: [
      {
        // docs: https://webpack.js.org/configuration/module/#resolvefullyspecified
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        }
      }
    ]
  },
  plugins: [
    // fix "process is not defined" error:
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
};
