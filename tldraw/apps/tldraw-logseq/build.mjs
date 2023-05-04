#!/usr/bin/env zx
/* eslint-disable no-undef */
import 'zx/globals'
import fs from 'fs'
import path from 'path'

if (process.platform === 'win32') {
  defaults.shell = "cmd.exe";
  defaults.prefix = "";
}

// Build with [tsup](https://tsup.egoist.sh)
await $`npx tsup`


// Prepare package.json file
const packageJson = fs.readFileSync('package.json', 'utf8')
const glob = JSON.parse(packageJson)
Object.assign(glob, {
  main: './index.js',
  module: './index.mjs',
})

fs.writeFileSync('dist/package.json', JSON.stringify(glob, null, 2))

const dest = path.join(__dirname, '/../../../src/main/frontend/tldraw-logseq.js')

if (fs.existsSync(dest)) fs.unlinkSync(dest)
fs.linkSync(path.join(__dirname, '/dist/index.js'), dest)
