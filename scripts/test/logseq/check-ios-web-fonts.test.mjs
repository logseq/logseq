import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  findUnsupportedIOSFontAssets,
} from '../../lib/check-ios-web-fonts.mjs'

test('findUnsupportedIOSFontAssets rejects woff and woff2 files and CSS references', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-ios-fonts-'))
  const assetRoot = path.join(tempDir, 'public')
  const fontDir = path.join(assetRoot, 'css', 'fonts')
  fs.mkdirSync(fontDir, { recursive: true })

  fs.writeFileSync(path.join(fontDir, 'KaTeX_Main-Regular.ttf'), '')
  fs.writeFileSync(path.join(fontDir, 'KaTeX_Main-Regular.woff'), '')
  fs.writeFileSync(path.join(fontDir, 'KaTeX_Main-Regular.woff2'), '')
  fs.writeFileSync(
    path.join(assetRoot, 'css', 'style.css'),
    [
      '@font-face{src:url(fonts/KaTeX_Main-Regular.woff) format("woff")}',
      '@font-face{src:url(fonts/KaTeX_Main-Regular.woff2) format("woff2")}',
      '@font-face{src:url(fonts/KaTeX_Main-Regular.ttf) format("truetype")}',
    ].join('\n'))

  try {
    const result = findUnsupportedIOSFontAssets({
      repoRoot: tempDir,
      assetRoots: [assetRoot],
    })

    assert.deepEqual(result.fontFiles, [
      'public/css/fonts/KaTeX_Main-Regular.woff',
      'public/css/fonts/KaTeX_Main-Regular.woff2',
    ])
    assert.deepEqual(result.cssFiles, [
      'public/css/style.css',
    ])
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('findUnsupportedIOSFontAssets accepts ttf-only assets', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-ios-fonts-'))
  const assetRoot = path.join(tempDir, 'public')
  const fontDir = path.join(assetRoot, 'css', 'fonts')
  fs.mkdirSync(fontDir, { recursive: true })

  fs.writeFileSync(path.join(fontDir, 'KaTeX_Main-Regular.ttf'), '')
  fs.writeFileSync(
    path.join(assetRoot, 'css', 'style.css'),
    '@font-face{src:url(fonts/KaTeX_Main-Regular.ttf) format("truetype")}')

  try {
    const result = findUnsupportedIOSFontAssets({
      repoRoot: tempDir,
      assetRoots: [assetRoot],
    })

    assert.deepEqual(result.fontFiles, [])
    assert.deepEqual(result.cssFiles, [])
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})
