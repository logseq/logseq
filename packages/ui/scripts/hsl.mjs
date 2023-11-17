#!/env/node

import * as path from 'path'
import * as fs from 'fs'

console.time('[hsl]')

const args = process.argv
const CWD = process.cwd()
const targetFile = path.resolve(CWD, args[2])

if (!fs.existsSync(targetFile))
  throw new Error(`Target file not found! [${targetFile}]`)

const targetFileContent = fs.readFileSync(targetFile)?.toString()

const exportHSLFileContent =
  targetFileContent.replace(/: (.+)%;/g, `: hsl($1%);`)

const exportHSLFilePath = targetFile.replace(/\.css$/, '_hsl.css')

fs.writeFileSync(exportHSLFilePath, exportHSLFileContent)

console.timeEnd('[hsl]')