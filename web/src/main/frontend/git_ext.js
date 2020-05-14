// move to cljs
// copied from https://github.com/kpj/GitViz/blob/83dfc65624f5dae41ffb9e8a97d2ee61512c1365/src/git-handler.js
export var getFileStateChanges = async function (commitHash1, commitHash2, dir) {
  return git.walk({
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
}
