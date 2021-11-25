// This script file simply outputs the version in the package.json.
// It is used as a helper by the continuous integration
const path = require('path')
const process = require('process')

const ver = require(path.join(__dirname, '../package.json')).version

if (process.argv[2] === 'nightly') {
  const today = new Date()
  console.log(
    ver + '+nightly.' + today.toISOString().split('T')[0].replaceAll('-', '')
  )
} else {
  console.log(ver)
}
