// This script file simply outputs the version in the package.json.
// It is used as a helper by the continuous integration
const process = require('process')
const { version: ver } = require('../resources/package.json')

if (typeof ver !== 'string' || ver.length === 0) {
  throw new Error('Missing app version in resources/package.json')
}

if (process.argv[2] === 'nightly' || process.argv[2] === '') {
  const today = new Date()
  console.log(
    ver + '-alpha+nightly.' + today.toISOString().split('T')[0].replaceAll('-', '')
  )
} else {
  console.log(ver)
}
