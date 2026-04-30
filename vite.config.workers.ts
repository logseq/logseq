import { createWorkerBundleConfig } from './vite.config.shared'

export default createWorkerBundleConfig({
  entry: 'target/db-worker.js',
  outDir: 'static/js',
  outputFile: 'db-worker-bundle.js',
})
