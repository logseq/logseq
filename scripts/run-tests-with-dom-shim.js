#!/usr/bin/env node

require("./test-dom-shim");

const requiredNamespaceRegex = "^(?!(logseq.sync\\.|logseq.agents\\.)).*";

const argv = process.argv.slice(2);
const filteredArgs = [];

for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (arg === "-r" || arg === "--namespace-regex") {
    if (i + 1 < argv.length) {
      i += 1;
    }
    continue;
  }
  filteredArgs.push(arg);
}

process.argv = [
  process.argv[0],
  process.argv[1],
  ...filteredArgs,
  "-r",
  requiredNamespaceRegex,
];

require("../static/tests.js");
