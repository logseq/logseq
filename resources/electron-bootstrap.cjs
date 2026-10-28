const { app } = require('electron');
const path = require('node:path');
const { enableCompileCache, getCompileCacheDir } = require('node:module');
enableCompileCache(path.join(app.getPath('userData'), 'node-compile-cache'));
const cacheDir = getCompileCacheDir();
if (cacheDir) process.env.NODE_COMPILE_CACHE = cacheDir;
require('./electron.js');
