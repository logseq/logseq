const path = require('path')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  entry: './src/LSPlugin.user.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    // new BundleAnalyzerPlugin()
  ],
  output: {
    library: "LSPluginEntry",
    libraryTarget: "umd",
    filename: 'lsplugin.user.js',
    path: path.resolve(__dirname, 'dist')
  },
}