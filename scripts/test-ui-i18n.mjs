import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { test } from "node:test";

const fixture = new URL("../deps/ui/src/i18n_validation_fixture.ml", import.meta.url);
const compilerDirs = () => readdirSync(tmpdir()).filter(name => name.startsWith("logseq-i18n-"));
function validate(source) {
  writeFileSync(fixture, source);
  try {
    const result = spawnSync("bb", ["lang:validate-translations"], {
      encoding: "utf8", timeout: 60000,
    });
    assert.ifError(result.error);
    return { status: result.status, output: result.stdout + result.stderr };
  } finally { unlinkSync(fixture); }
}

test("translation validation reads OCaml calls and aliases without treating comments as code", () => {
  const result = validate(`
(* I18n.t "test/missing-in-comment" *)
let example = "I18n.t \\\"test/missing-in-string\\\""
let translated = I18n.t
let label = translated "ui/cancel"
let local = let translated _ = "local" in translated "test/not-a-translation"
let multiline = I18n.tf
  "view.table/total-count" [ "3" ]
`);
  assert.equal(result.status, 0, result.output);
});

test("translation validation rejects missing OCaml keys, including aliases", () => {
  const before = new Set(compilerDirs());
  const result = validate(`
let translated = I18n.t
let label = translated "test/missing-ui-key"
let notification = I18n.tf "test/missing-notification-key" [ "value" ]
`);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Missing OCaml translation keys/);
  assert.match(result.output, /test\/missing-ui-key/);
  assert.match(result.output, /test\/missing-notification-key/);
  assert.deepEqual(compilerDirs().filter(name => !before.has(name)), [],
    "Failed validation must clean its compiler temporary directory");
});

test("translation validation fails on malformed OCaml sources", () => {
  const result = validate("let broken = (\n");
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Cannot parse OCaml/);
});
