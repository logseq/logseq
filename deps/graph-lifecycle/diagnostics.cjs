'use strict';

function contextualError(error, context) {
  const details = { ...context, code: error.code, errcode: error.errcode };
  return Object.assign(new Error(`${error.message} ${JSON.stringify(details)}`, { cause: error }), details);
}

function sqliteOperation(file, phase, action) {
  try { return action(); }
  catch (error) { throw contextualError(error, { phase, dbPath: file }); }
}

module.exports = { contextualError, sqliteOperation };
