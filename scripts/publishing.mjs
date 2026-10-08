#!/usr/bin/env node
import { resolve } from "node:path";
import { createRequire } from "node:module";
import transit from "transit-js";

const [staticDir, graphDir, outputDir, ...flags] = process.argv.slice(2);
if (!staticDir || !graphDir || !outputDir || flags.some(flag => flag !== "--dev")) {
  console.error("Usage: node scripts/publishing.mjs STATIC-DIR GRAPH-DIR OUT-DIR [--dev]");
  process.exitCode = 1;
} else {
  try {
    const require = createRequire(import.meta.url);
    const publisher = require("../deps/db-worker/_build/default/js_api/js_api/lib/publishing_cli.js");
    const args = [staticDir, graphDir, outputDir].map(path => resolve(process.env.ORIGINAL_PWD ?? ".", path));
    args.push(flags.includes("--dev"));
    await new Promise((resolve, reject) => publisher.run_transit(
      transit.writer("json").write(args), resolve, message => reject(new Error(message))));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
