// Run after `opam exec -- dune build test` from deps/ui:
// node test/editor_allocation_test.cjs
// Bound actual materialization during rich-text edits independently of CPU speed.
const assert = require('node:assert/strict');
const path = require('node:path');
const output = path.join(__dirname, '../_build/default/test/ui_test');
const allocation = require(path.join(output, 'node_modules/melange.js/caml_bytes.js'));
const Model = require(path.join(output, 'src/editor/edit_model.js'));
const Runs = require(path.join(output, 'src/editor/edit_runs.js'));

for (const lines of [100, 500]) {
  const source = Array.from({length: lines}, (_, i) =>
    `Line ${i} **bold** [[Page ${i}]] #topic https://example.com/${i} \`code\``).join('\n');
  const model = Model.create(undefined, source);
  const original = allocation.bytes_of_string;
  let materialized = 0;
  allocation.bytes_of_string = text => {
    materialized += text.length;
    return original(text);
  };
  let edited;
  try {
    edited = Model.insert_text(model, 'x');
  } finally {
    allocation.bytes_of_string = original;
  }
  assert.equal(edited.source, 'x' + source);
  assert.equal(Runs.recompose(edited.runs), edited.source);
  assert.ok(materialized <= edited.source.length * 12,
    `${lines} rich lines materialized ${materialized} units for ${edited.source.length} source units`);
  console.log(`${lines} rich lines: ${materialized} materialized units`);
}

for (const source of ['中文 **粗体** [[页😀]] #标签', '**a *b* c**', '`[[literal]]`', '$$中文😀$$']) {
  assert.equal(Runs.recompose(Runs.runs(source)), source);
}
console.log('Rich-text allocation and source coverage checks passed');
