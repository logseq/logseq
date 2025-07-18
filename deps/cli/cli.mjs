#!/usr/bin/env node

import { loadFile, addClassPath } from '@logseq/nbb-logseq'
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = fileURLToPath(dirname(import.meta.url));
addClassPath(resolve(__dirname, 'src'));
const { main } = await loadFile(resolve(__dirname, 'src/logseq/cli.cljs'));

// Expects to be called as node X.js ...
const args = process.argv.slice(2)
main.apply(null, args);