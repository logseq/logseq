#!/usr/bin/env zx
/* eslint-disable no-undef */
import 'zx/globals'
import fs from 'fs'

// Build with [tsup](https://tsup.egoist.sh)
await $`tsup`

// Prepare package.json file
const packageJson = fs.readFileSync('package.json', 'utf8')
const glob = JSON.parse(packageJson)
Object.assign(glob, {
  main: './index.js',
  module: './index.mjs'
})

fs.writeFileSync('dist/package.json', JSON.stringify(glob, null, 2))
