import { join, dirname, resolve } from 'path'

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')))
}

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: [
    './cljs/*_story.js',
    '../src/**/*.story.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('@storybook/addon-toolbars')
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-webpack5'),
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  features: {
    storyStoreV7: false
  },

  async webpackFinal(config) {
    // module name resolver
    config.resolve.alias = {
      '@/components': resolve(__dirname, '../@/components'),
      '@/lib': resolve(__dirname, '../@/lib')
    }

    // NOTE: Don't use .babelrc for this. Because the parcel bundler share
    // the babel config with storybook webpack from root path.
    const babelLoaderRule = config.module.rules.find(
      (rule) => rule.test.toString() === /\.(mjs|tsx?|jsx?)$/.toString()
    )

    // babelLoaderRule.include?.push(__dirname)
    const babelLoaderPresets = babelLoaderRule?.use[0].options.presets
    babelLoaderPresets.unshift(
      [require.resolve('@babel/preset-env'), {
        'targets': {
          'chrome': 100,
          'safari': 15,
          'firefox': 91
        }
      }]
    )
    babelLoaderPresets.push('@babel/preset-typescript')

    // postcss loader
    config.module.rules.push({
      test: /\.css$/,
      use: [
        {
          loader: 'postcss-loader',
          options: {},
        },
      ],
    })

    return config
  }
}

export default config
