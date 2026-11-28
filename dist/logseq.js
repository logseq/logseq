#!/usr/bin/env node
"use strict";

const path = require("path");
const {existsSync} = require("node:fs");

const runtime = existsSync(path.join(__dirname, "logseq-cli.js"))
  ? __dirname : path.resolve(__dirname, "../static");
if (process.argv[2] === "agent" && process.argv[3] === "runner") {
  const staged = path.join(runtime, "bots-runner", "runner-cli.cjs");
  const source = path.resolve(__dirname, "../deps/db-sync/worker/bots/runner-cli.cjs");
  require(existsSync(staged) ? staged : source).main(process.argv.slice(4)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
} else {
  require(path.join(runtime, "logseq-cli.js"));
}
