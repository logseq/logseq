import { createShadowBridgeConfig } from './vite.config.shared'

export default createShadowBridgeConfig({
  name: 'mobile',
  shadowDir: 'target/mobile',
  externalsEntry: 'target/mobile-externals.js',
  shadowEntry: 'target/mobile/main.js',
  outDir: 'static/mobile/js',
  outputFile: 'main.js',
})
