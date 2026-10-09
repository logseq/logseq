// ES-module worker entry for the browser db-worker bundle.
//
// The worker runs as {type: "module"}: mobile Safari workers overflow
// their small call stack compiling a single multi-MB classic script
// (RangeError before the first statement executes), so the bundle is
// emitted as ES chunks parsed independently.
//
// This entry replaces resources/js/worker.js, which bootstrapped the
// same globals through importScripts — unavailable in module workers.
// It installs lightning-fs self.fs/self.pfs (used by
// runtime/melange/asset_store.ml) and registers the MagicPortal
// endpoints the UI thread calls, then runs the Melange entry which
// installs the Comlink surface.

import "./global_shim.mjs";
import LightningFS from "@isomorphic-git/lightning-fs";
import MagicPortal from "../../../resources/js/magic_portal.js";

const fs = new LightningFS("logseq");
const pfs = fs.promises;

self.fs = fs;
self.pfs = pfs;

const portal = new MagicPortal(self);
portal.set("fs", fs);
portal.set("pfs", pfs);

const rimraf = async (path) => {
  // Knowing path is a directory, first assume everything inside
  // path is a file.
  const files = await pfs.readdir(path);
  for (const file of files) {
    const child = `${path}/${file}`;
    try {
      await pfs.unlink(child);
    } catch (err) {
      if (err.code !== "EISDIR") throw err;
    }
  }
  // Assume what's left are directories and recurse.
  const dirs = await pfs.readdir(path);
  for (const dir of dirs) {
    await rimraf(`${path}/${dir}`);
  }
  // Finally, delete the empty directory.
  await pfs.rmdir(path);
};

portal.set("workerThread", { rimraf });

// side-effect import: installs the worker surface
import "../_build/default/js_api/js_api/js_api/entry_worker.js";
