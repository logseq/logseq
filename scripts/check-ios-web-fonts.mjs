import path from 'node:path'

import { findUnsupportedIOSFontAssets } from './lib/check-ios-web-fonts.mjs'

const repoRoot = path.resolve(import.meta.dirname, '..')
const assetRoots = [
  path.join(repoRoot, 'static', 'mobile'),
  path.join(repoRoot, 'ios', 'App', 'App', 'public'),
]

const result = findUnsupportedIOSFontAssets({ repoRoot, assetRoots })

if (result.roots.length === 0) {
  throw new Error('No iOS web assets found. Run pnpm release-mobile or pnpm sync-ios-release first.')
}

if (result.fontFiles.length > 0) {
  console.error('iOS web assets must not include .woff or .woff2 font files:')
  for (const filePath of result.fontFiles) {
    console.error(`- ${filePath}`)
  }
  process.exit(1)
}

if (result.cssFiles.length > 0) {
  console.error('iOS web CSS must not reference .woff or .woff2 font files:')
  for (const filePath of result.cssFiles) {
    console.error(`- ${filePath}`)
  }
  process.exit(1)
}
