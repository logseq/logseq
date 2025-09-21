// This script file simply outputs the version in the package.json.
// It is used as a helper by the continuous integration
const path = require('path')
const process = require('process')
const fs = require('fs')

const content = fs.readFileSync(
  path.join(__dirname, '../src/main/frontend/version.cljs')
)
const pattern = /\(defonce version "(.*?)"\)/g

const match = pattern.exec(content)
let ver = '0.0.1'
if (match) {
  ver = match[1]
} else {
  console.error('Could not find version in version.cljs')
  process.exit(1)
}

if (process.argv[2] === 'nightly' || process.argv[2] === '') {
  const today = new Date()
  console.log(
    ver + '-alpha+nightly.' + today.toISOString().split('T')[0].replaceAll('-', '')
  )
} else {
  console.log(ver)
}
