#!/usr/bin/env node
// The CLJS schema is authoritative; fail before shipping a stale worker mirror.
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

function readVersion(file, pattern) {
  const match = readFileSync(resolve(__dirname, file), "utf8").match(pattern);
  if (!match) throw new Error(`Cannot read schema version from ${file}`);
  return `${Number(match[1])}.${Number(match[2])}`;
}

const frontend = readVersion(
  "../../db/src/logseq/db/frontend/schema.cljs",
  /^\(def version \(parse-schema-version "(\d+)\.(\d+)"\)\)$/m,
);
const worker = readVersion(
  "../lib/db_schema.ml",
  /^let version = \{ sv_major = (\d+); sv_minor = Some (\d+) \}$/m,
);
if (worker !== frontend) {
  throw new Error(
    `Schema version drift: CLJS ${frontend}, OCaml worker ${worker}. Update Db_schema.version.`,
  );
}
console.log(`Schema versions agree: ${frontend}`);
