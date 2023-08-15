const path = require('path');

module.exports = {
  entry: './src/index.js',
  target: ['webworker', 'es6'],
  mode: 'production',
  output: {
    filename: 'persist-db-worker.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  devtool: 'source-map',
};
