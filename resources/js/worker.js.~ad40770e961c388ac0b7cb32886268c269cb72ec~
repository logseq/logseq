importScripts(
  // Batched optimization
  "./lightning-fs.min.js?v=0.0.2.3",
  "./isomorphic-git/1.7.4/index.umd.min.js",
  "./isomorphic-git/1.7.4/http-web-index.umd.js",
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

function basicAuth (username, token) {
  return "Basic " + btoa(username + ":" + token);
}

const fsName = 'logseq';
const createFS = () => new LightningFS(fsName);
let fs = createFS();
let pfs = fs.promises;

if (detect() === 'Worker') {
  const portal = new MagicPortal(self);
  portal.set('git', git);
  portal.set('fs', fs);
  portal.set('pfs', pfs);
  portal.set('gitHttp', GitHttp);
  portal.set('workerThread', {
    setConfig: function (dir, path, value) {
      return git.setConfig ({
        fs,
        dir,
        path,
        value
      });
    },
    clone: function (dir, url, corsProxy, depth, branch, username, token) {
      return git.clone ({
        fs,
        dir,
        http: GitHttp,
        url,
        corsProxy,
        ref: branch,
        singleBranch: true,
        depth,
        headers: {
          "Authorization": basicAuth(username, token)
        }
      });
    },
    fetch: function (dir, url, corsProxy, depth, branch, username, token) {
      return git.fetch ({
        fs,
        dir,
        http: GitHttp,
        url,
        corsProxy,
        ref: branch,
        singleBranch: true,
        depth,
        headers: {
          "Authorization": basicAuth(username, token)
        }
      });
    },
    pull: function (dir, corsProxy, branch, username, token) {
      return git.pull ({
        fs,
        dir,
        http: GitHttp,
        corsProxy,
        ref: branch,
        singleBranch: true,
        // fast: true,
        headers: {
          "Authorization": basicAuth(username, token)
        }
      });
    },
    push: function (dir, corsProxy, branch, force, username, token) {
      return git.push ({
        fs,
        dir,
        http: GitHttp,
        ref: branch,
        corsProxy,
        remote: "origin",
        force,
        headers: {
          "Authorization": basicAuth(username, token)
        }
      });
    },
    merge: function (dir, branch) {
      return git.merge ({
        fs,
        dir,
        ours: branch,
        theirs: "remotes/origin/" + branch,
        // fastForwardOnly: true
      });
    },
    checkout: function (dir, branch) {
      return git.checkout ({
        fs,
        dir,
        ref: branch,
      });
    },
    log: function (dir, branch, depth) {
      return git.log ({
        fs,
        dir,
        ref: branch,
        depth,
        singleBranch: true
      })
    },
    add: function (dir, file) {
      return git.add ({
        fs,
        dir,
        filepath: file
      });
    },
    remove: function (dir, file) {
      return git.remove ({
        fs,
        dir,
        filepath: file
      });
    },
    commit: function (dir, message, name, email, parent) {
      if (parent) {
        return git.commit ({
          fs,
          dir,
          message,
          author: {name: name,
                   email: email},
          parent: parent
        });
      } else {
        return git.commit ({
          fs,
          dir,
          message,
          author: {name: name,
                   email: email}
        });
      }
    },
    readCommit: function (dir, oid) {
      return git.readCommit ({
        fs,
        dir,
        oid
      });
    },
    readBlob: function (dir, oid, path) {
      return git.readBlob ({
        fs,
        dir,
        oid,
        path
      });
    },
    writeRef: function (dir, branch, oid) {
      return git.writeRef ({
        fs,
        dir,
        ref: "refs/heads/" + branch,
        value: oid,
        force: true
      });
    },
    resolveRef: function (dir, ref) {
      return git.resolveRef ({
        fs,
        dir,
        ref
      });
    },
    listFiles: function (dir, branch) {
      return git.listFiles ({
        fs,
        dir,
        ref: branch
      });
    },
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
    },
    getFileStateChanges: async function (commitHash1, commitHash2, dir) {
      return git.walk({
        fs,
        dir,
        trees: [git.TREE({ ref: commitHash1 }), git.TREE({ ref: commitHash2 })],
        map: async function(filepath, [A, B]) {
          var type = 'equal';
          if (A === null) {
            type = "add";
          }

          if (B === null) {
            type = "remove";
          }

          // ignore directories
          if (filepath === '.') {
            return
          }
          if ((A !== null && (await A.type()) === 'tree')
              ||
              (B !== null && (await B.type()) === 'tree')) {
            return
          }

          // generate ids
          const Aoid = A !== null && await A.oid();
          const Boid = B !== null && await B.oid();

          if (type === "equal") {
            // determine modification type
            if (Aoid !== Boid) {
              type = 'modify'
            }
            if (Aoid === undefined) {
              type = 'add'
            }
            if (Boid === undefined) {
              type = 'remove'
            }
          }

          if (Aoid === undefined && Boid === undefined) {
            console.log('Something weird happened:')
            console.log(A)
            console.log(B)
          }

          return {
            path: `/${filepath}`,
            type: type,
          }
        },
      })
    },
    statusMatrix: async function (dir) {
      return git.statusMatrix({ fs, dir });
    },
    statusMatrixChanged: async function (dir) {
      return (await git.statusMatrix({ fs, dir }))
        .filter(([_, head, workDir, stage]) => !(head == 1 && workDir == 1 && stage == 1));
    },
    getChangedFiles: async function (dir) {
      try {
        const FILE = 0, HEAD = 1, WORKDIR = 2;

        let filenames = (await git.statusMatrix({ fs, dir }))
            .filter(row => row[HEAD] !== row[WORKDIR])
            .map(row => row[FILE]);

        return filenames;
      } catch (err) {
        console.error(err);
        return [];
      }
    }
  });
  // self.addEventListener("message", ({ data }) => console.log(data));
}
