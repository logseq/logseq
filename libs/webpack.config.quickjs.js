const path = require('path')
const webpack = require('webpack')

module.exports = (env = {}) => {
  if (!env.plugin || !env.output) {
    throw new Error(
      'QuickJS build requires --env plugin=<entry> --env output=<module.mjs>'
    )
  }
  const sdk = path.resolve(__dirname, 'src/LSPlugin.quickjs.ts')
  const output = path.resolve(env.output)
  return {
    mode: 'production',
    target: 'es2020',
    context: __dirname,
    entry: [sdk, path.resolve(env.plugin), './src/LSPlugin.quickjs-entry.ts'],
    experiments: { outputModule: true },
    devtool: false,
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            compiler: path.resolve(__dirname, 'quickjs-typescript.cjs'),
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            transpileOnly: true,
            compilerOptions: { rootDir: undefined, declaration: false },
          },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: { '@logseq/libs$': sdk },
    },
    optimization: { splitChunks: false, runtimeChunk: false },
    plugins: [new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
    output: {
      path: path.dirname(output),
      filename: path.basename(output),
      library: { type: 'module' },
      module: true,
      chunkLoading: false,
      publicPath: '',
    },
  }
}
