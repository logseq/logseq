import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(import.meta.dirname, '..')
const assetRoots = [
  path.join(repoRoot, 'static', 'mobile'),
  path.join(repoRoot, 'ios', 'App', 'App', 'public'),
]

const existingAssetRoots = assetRoots.filter((root) => fs.existsSync(root))

if (existingAssetRoots.length === 0) {
  throw new Error('No iOS web assets found. Run pnpm release-mobile or pnpm sync-ios-release first.')
}

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(fullPath) : fullPath
  })
}

const relativePath = (filePath) => path.relative(repoRoot, filePath)
const files = existingAssetRoots.flatMap(walk)
const woff2Files = files
  .filter((filePath) => filePath.endsWith('.woff2'))
  .map(relativePath)
  .sort()
const cssWoff2References = files
  .filter((filePath) => filePath.endsWith('.css'))
  .flatMap((filePath) => {
    const css = fs.readFileSync(filePath, 'utf8')
    return css.includes('.woff2') ? [relativePath(filePath)] : []
  })
  .sort()

if (woff2Files.length > 0) {
  console.error('iOS web assets must not include .woff2 font files:')
  for (const filePath of woff2Files) {
    console.error(`- ${filePath}`)
  }
  process.exit(1)
}

if (cssWoff2References.length > 0) {
  console.error('iOS web CSS must not reference .woff2 font files:')
  for (const filePath of cssWoff2References) {
    console.error(`- ${filePath}`)
  }
  process.exit(1)
}
