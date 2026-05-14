importScripts(
  // Batched optimization
  "./lightning-fs.min.js",
  // Fixed a bug
  "./magic_portal.js"
);

const detect = () => {
  if (typeof window !== 'undefined' && !self.skipWaiting) {
    return 'window'
  } else if (typeof self !== 'undefined' && !self.skipWaiting) {
    return 'Worker'
  } else if (typeof self !== 'undefined' && self.skipWaiting) {
    return 'ServiceWorker'
  }
};

const fsName = 'logseq';
const createFS = () => new LightningFS(fsName);
let fs = createFS();
let pfs = fs.promises;

if (detect() === 'Worker') {
  const portal = new MagicPortal(self);
  portal.set('fs', fs);
  portal.set('pfs', pfs);

  portal.set('workerThread', {
    rimraf: async function (path) {
      // try {
      //   // First assume path is itself a file
      //   await pfs.unlink(path)
      //   // if that worked we're done
      //   return
      // } catch (err) {
      //   // Otherwise, path must be a directory
      //   if (err.code !== 'EISDIR') throw err
      // }
      // Knowing path is a directory,
      // first, assume everything inside path is a file.
      let files = await pfs.readdir(path);
      for (let file of files) {
        let child = path + '/' + file
        try {
          await pfs.unlink(child)
        } catch (err) {
          if (err.code !== 'EISDIR') throw err
        }
      }
      // Assume what's left are directories and recurse.
      let dirs = await pfs.readdir(path)
      for (let dir of dirs) {
        let child = path + '/' + dir
        await rimraf(child, pfs)
      }
      // Finally, delete the empty directory
      await pfs.rmdir(path)
    }
  });
}
