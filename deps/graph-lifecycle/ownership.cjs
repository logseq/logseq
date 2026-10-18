'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

function runtimeRoot() {
  const home = os.userInfo().homedir;
  switch (process.platform) {
    case 'darwin': return path.join(home, 'Library', 'Application Support', 'Logseq', 'runtime-locks');
    case 'win32': return path.join(home, 'AppData', 'Local', 'Logseq', 'runtime-locks');
    default: return path.join(home, '.local', 'state', 'Logseq', 'runtime-locks');
  }
}
function ownershipPath(ctx) {
  let canonical;
  try { canonical = fs.realpathSync(ctx.graphDir); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    canonical = path.join(fs.realpathSync(path.dirname(ctx.graphDir)), path.basename(ctx.graphDir));
  }
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  return path.join(runtimeRoot(), hash, 'lock.sqlite');
}
function acquireOwnership(ctx) {
  const { DatabaseSync } = require('node:sqlite');
  const file = ownershipPath(ctx);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  try { db.exec('BEGIN IMMEDIATE'); }
  catch (error) {
    db.close();
    if (error.errcode === 5) throw Object.assign(new Error(`Graph ownership is locked: ${ctx.graphDir}`, { cause: error }), { code: 'repo-locked' });
    throw error;
  }
  // Neither the connection nor SQL is exposed to graph data callers.
  let released = false;
  return Object.freeze({
    assert() {
      if (released || !db.isOpen || !db.isTransaction)
        throw Object.assign(new Error('Graph ownership transaction was lost'), { code: 'repo-locked' });
    },
    release() {
      if (released) return;
      released = true;
      try { if (db.isOpen && db.isTransaction) db.exec('ROLLBACK'); }
      finally { if (db.isOpen) db.close(); }
    },
  });
}
module.exports = { ownershipPath, acquireOwnership };
