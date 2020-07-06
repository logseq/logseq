// copied from https://github.com/wmhilton/wills-wonderful-service-worker/blob/dd31f3d63331bf1e70c1c2b6440ce6ec9e826df8/src/rimraf.js
// Because isaacs "rimraf" is too Node-specific

// It's elegant in it's naivety
export var rimraf = async function (path, fs) {
  // try {
  //   // First assume path is itself a file
  //   await fs.unlink(path)
  //   // if that worked we're done
  //   return
  // } catch (err) {
  //   // Otherwise, path must be a directory
  //   if (err.code !== 'EISDIR') throw err
  // }
  // Knowing path is a directory,
  // first, assume everything inside path is a file.
  let files = await fs.readdir(path)
  for (let file of files) {
    let child = path + '/' + file
    try {
      await fs.unlink(child)
    } catch (err) {
      console.log(err.code);
      if (err.code !== 'EISDIR') throw err
    }
  }
  // Assume what's left are directories and recurse.
  let dirs = await fs.readdir(path)
  for (let dir of dirs) {
    let child = path + '/' + dir
    await rimraf(child, fs)
  }
  // Finally, delete the empty directory
  await fs.rmdir(path)
}
