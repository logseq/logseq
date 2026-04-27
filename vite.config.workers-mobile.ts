import { createWorkerBundleConfig } from './vite.config.shared'

export default createWorkerBundleConfig({
  entry: 'target/db-worker.js',
  outDir: 'static/mobile/js',
  outputFile: 'db-worker-bundle.js',
})
