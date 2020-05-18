// move to cljs
// copied from https://github.com/kpj/GitViz/blob/83dfc65624f5dae41ffb9e8a97d2ee61512c1365/src/git-handler.js
export var getFileStateChanges = async function (commitHash1, commitHash2, dir) {
  return git.walkBeta1({
    trees: [
      git.TREE({ dir: dir, ref: commitHash1 }),
      git.TREE({ dir: dir, ref: commitHash2 })
    ],
    map: async function ([A, B]) {
      // ignore directories
      if (A.fullpath === '.') {
        return
      }
      await A.populateStat()
      if (A.type === 'tree') {
        return
      }
      await B.populateStat()
      if (B.type === 'tree') {
        return
      }

      // generate ids
      await A.populateHash()
      await B.populateHash()

      // determine modification type
      let type = 'equal'
      if (A.oid !== B.oid) {
        type = 'modify'
      }
      if (A.oid === undefined) {
        type = 'add'
      }
      if (B.oid === undefined) {
        type = 'remove'
      }
      if (A.oid === undefined && B.oid === undefined) {
        console.log('Something weird happened:')
        console.log(A)
        console.log(B)
      }

      return {
        path: `/${A.fullpath}`,
        type: type
      }
    }
  })
};

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
