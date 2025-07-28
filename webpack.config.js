const path = require('path');
const webpack = require('webpack');

var config = {
  mode: "development",
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
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

var AppConfig = Object.assign({}, config, {
  name: "app",
  entry: {
    main : "./target/main.js",
    workers : "./target/workers.js",
  },

  output: {
    path: path.resolve(__dirname, 'static/js'),
    filename: '[name]-bundle.js',
    clean: false,
    chunkLoading: false,
  },
});

var MobileConfig = Object.assign({}, config, {
  name: "mobile",
  entry: {
    main : "./target/mobile.js",
    workers : "./target/workers.js",
  },

  output: {
    path: path.resolve(__dirname, 'static/mobile/js'),
    filename: '[name]-bundle.js',
    clean: false,
    chunkLoading: false,
  },
});

module.exports = [
  AppConfig, MobileConfig,
];
