const pkg = require('./package.json')
const path = require('path')
const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const TerserPlugin = require('terser-webpack-plugin')

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'

  return {
    entry: './src/LSPlugin.user.ts',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'babel-loader'
            },
            {
              loader: 'ts-loader'
            }
          ],
          exclude: /node_modules/,
        }
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
      minimize: isProd,
      minimizer: [
        new TerserPlugin()
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      new webpack.DefinePlugin({
        LIB_VERSION: JSON.stringify(pkg.version)
      })
      // new BundleAnalyzerPlugin()
    ],
    output: {
      library: 'LSPluginEntry',
      libraryTarget: 'umd',
      filename: 'lsplugin.user.js',
      path: path.resolve(__dirname, 'dist')
    },
  }
}