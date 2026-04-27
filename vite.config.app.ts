import { createShadowBridgeConfig } from './vite.config.shared'

export default createShadowBridgeConfig({
  name: 'app',
  shadowDir: 'target/app',
  externalsEntry: 'target/app-externals.js',
  shadowEntry: 'target/app/main.js',
  outDir: 'static/js',
  outputFile: 'main.js',
})
