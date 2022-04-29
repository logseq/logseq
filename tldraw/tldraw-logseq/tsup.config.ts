import { defineConfig } from 'tsup'

export default defineConfig({
  target: 'es5',
  platform: 'browser',
  format: ['cjs', 'esm'],
  entry: ['src/index.ts'],
  clean: true
})
 