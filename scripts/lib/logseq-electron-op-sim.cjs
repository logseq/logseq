'use strict';

const OPERATION_ORDER = Object.freeze([
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

function buildOperationPlan(totalOps) {
  if (!Number.isInteger(totalOps) || totalOps <= 0) {
    throw new Error('totalOps must be a positive integer');
  }

  const plan = [];
  for (let i = 0; i < totalOps; i += 1) {
    plan.push(OPERATION_ORDER[i % OPERATION_ORDER.length]);
  }
  return plan;
}

function chooseRunnableOperation(requestedOperation, managedCount) {
  switch (requestedOperation) {
    case 'copyPaste':
    case 'copyPasteTreeToEmptyTarget':
      return managedCount >= 1 ? requestedOperation : 'add';
    case 'move':
    case 'indent':
    case 'delete':
      return managedCount >= 2 ? requestedOperation : 'add';
    case 'outdent':
    case 'add':
    case 'undo':
    case 'redo':
      return requestedOperation;
    default:
      throw new Error(`Unsupported operation kind: ${requestedOperation}`);
  }
}

function parsePositiveInteger(value, flagName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flagName} must be a positive integer`);
  }
  return parsed;
}

function parseNonNegativeInteger(value, flagName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flagName} must be a non-negative integer`);
  }
  return parsed;
}

function parseArgs(argv) {
  const result = {
    ops: 200,
    port: 9333,
    undoRedoDelayMs: 350,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      return { ...result, help: true };
    }

    const next = argv[i + 1];
    if (arg === '--ops') {
      result.ops = parsePositiveInteger(next, '--ops');
      i += 1;
      continue;
    }

    if (arg === '--port') {
      result.port = parsePositiveInteger(next, '--port');
      i += 1;
      continue;
    }

    if (arg === '--undo-redo-delay-ms') {
      result.undoRedoDelayMs = parseNonNegativeInteger(next, '--undo-redo-delay-ms');
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (result.ops < 200) {
    throw new Error('--ops must be at least 200');
  }

  return result;
}

module.exports = {
  OPERATION_ORDER,
  buildOperationPlan,
  chooseRunnableOperation,
  parseArgs,
};
