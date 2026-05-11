import fs from 'node:fs'
import path from 'node:path'

const unsupportedFontFilePattern = /\.(?:woff2|woff)$/
const unsupportedCssFontPattern = /\.woff2?["')]|\bformat\(["']woff2?["']\)/

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(fullPath) : fullPath
  })
}

const relativePath = (repoRoot, filePath) =>
  path.relative(repoRoot, filePath).split(path.sep).join('/')

export const existingAssetRoots = (assetRoots) =>
  assetRoots.filter((root) => fs.existsSync(root))

export const findUnsupportedIOSFontAssets = ({ repoRoot, assetRoots }) => {
  const roots = existingAssetRoots(assetRoots)
  const files = roots.flatMap(walk)

  return {
    fontFiles: files
      .filter((filePath) => unsupportedFontFilePattern.test(filePath))
      .map((filePath) => relativePath(repoRoot, filePath))
      .sort(),
    cssFiles: files
      .filter((filePath) => filePath.endsWith('.css'))
      .flatMap((filePath) => {
        const css = fs.readFileSync(filePath, 'utf8')
        return unsupportedCssFontPattern.test(css)
          ? [relativePath(repoRoot, filePath)]
          : []
      })
      .sort(),
    roots,
  }
}
