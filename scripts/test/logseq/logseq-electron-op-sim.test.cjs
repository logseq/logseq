const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildOperationPlan,
  chooseRunnableOperation,
  parseArgs,
} = require('../../lib/logseq-electron-op-sim.cjs');

test('buildOperationPlan generates requested length and all operation kinds', () => {
  const plan = buildOperationPlan(500);

  assert.equal(plan.length, 500);
  assert.deepEqual(plan.slice(0, 9), [
    'add',
    'copyPaste',
    'copyPasteTreeToEmptyTarget',
    'move',
    'indent',
    'outdent',
    'delete',
    'undo',
    'redo',
  ]);

  const kinds = new Set(plan);
  assert.deepEqual(
    kinds,
    new Set([
      'add',
      'copyPaste',
      'copyPasteTreeToEmptyTarget',
      'move',
      'indent',
      'outdent',
      'delete',
      'undo',
      'redo',
    ]),
  );
});

test('buildOperationPlan rejects invalid total operation count', () => {
  assert.throws(() => buildOperationPlan(0), /positive integer/);
  assert.throws(() => buildOperationPlan(-1), /positive integer/);
  assert.throws(() => buildOperationPlan(12.5), /positive integer/);
  assert.throws(() => buildOperationPlan('500'), /positive integer/);
});

test('chooseRunnableOperation falls back to add when operation preconditions are unmet', () => {
  assert.equal(chooseRunnableOperation('copyPaste', 0), 'add');
  assert.equal(chooseRunnableOperation('copyPasteTreeToEmptyTarget', 0), 'add');
  assert.equal(chooseRunnableOperation('move', 1), 'add');
  assert.equal(chooseRunnableOperation('indent', 1), 'add');
  assert.equal(chooseRunnableOperation('delete', 1), 'add');

  assert.equal(chooseRunnableOperation('move', 2), 'move');
  assert.equal(chooseRunnableOperation('indent', 2), 'indent');
  assert.equal(chooseRunnableOperation('outdent', 1), 'outdent');
  assert.equal(chooseRunnableOperation('delete', 2), 'delete');
  assert.equal(chooseRunnableOperation('undo', 0), 'undo');
  assert.equal(chooseRunnableOperation('redo', 0), 'redo');
});

test('parseArgs defaults to 500 ops on default debug port', () => {
  const args = parseArgs([]);
  assert.equal(args.ops, 500);
  assert.equal(args.port, 9333);
  assert.equal(args.undoRedoDelayMs, 350);
});

test('parseArgs supports overrides', () => {
  const args = parseArgs(['--ops', '750', '--port', '9444', '--undo-redo-delay-ms', '200']);
  assert.equal(args.ops, 750);
  assert.equal(args.port, 9444);
  assert.equal(args.undoRedoDelayMs, 200);
});

test('parseArgs rejects invalid numbers', () => {
  assert.throws(() => parseArgs(['--ops', '0']), /--ops must be a positive integer/);
  assert.throws(() => parseArgs(['--ops', '499']), /--ops must be at least 500/);
  assert.throws(() => parseArgs(['--port', '-1']), /--port must be a positive integer/);
  assert.throws(() => parseArgs(['--undo-redo-delay-ms', '-1']), /--undo-redo-delay-ms must be a non-negative integer/);
});
