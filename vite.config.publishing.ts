import { createShadowBridgeConfig } from './vite.config.shared'

export default createShadowBridgeConfig({
  name: 'publishing',
  shadowDir: 'target/publishing',
  externalsEntry: 'target/publishing-externals.js',
  shadowEntry: 'target/publishing/main.js',
  outDir: 'static/js/publishing',
  outputFile: 'publishing-externals.js',
})
