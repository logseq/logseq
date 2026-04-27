import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const bridgeTargets = [
  {
    dir: 'target/app',
    externals: 'target/app-externals.js',
  },
  {
    dir: 'target/mobile',
    externals: 'target/mobile-externals.js',
  },
  {
    dir: 'target/publishing',
    externals: 'target/publishing-externals.js',
  },
]

for (const bridgeTarget of bridgeTargets) {
  const shadowDir = path.resolve(bridgeTarget.dir)
  const externalsEntry = path.resolve(bridgeTarget.externals)

  mkdirSync(shadowDir, { recursive: true })

  for (const entryFile of ['main.js', 'code-editor.js']) {
    const entryPath = path.join(shadowDir, entryFile)
    if (!existsSync(entryPath)) {
      writeFileSync(entryPath, '')
    }
  }

  if (!existsSync(externalsEntry)) {
    writeFileSync(externalsEntry, 'export {}\n')
  }
}
