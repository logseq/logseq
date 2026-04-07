const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseArgs,
  isRetryableAgentBrowserError,
  buildCleanupTodayPageProgram,
} = require('../../sync-open-chrome-tab-simulate.cjs');

test('isRetryableAgentBrowserError treats transient CDP navigation closures as retryable', () => {
  const navigationClosed = new Error(
    'CDP error (Runtime.evaluate): Inspected target navigated or closed'
  );
  const contextDestroyed = new Error(
    'CDP error (Runtime.evaluate): Execution context was destroyed.'
  );
  const responseChannelClosed = new Error('CDP response channel closed');
  const pageStillLoading = new Error(
    'Operation timed out. The page may still be loading or the element may not exist.'
  );

  assert.equal(isRetryableAgentBrowserError(navigationClosed), true);
  assert.equal(isRetryableAgentBrowserError(contextDestroyed), true);
  assert.equal(isRetryableAgentBrowserError(responseChannelClosed), true);
  assert.equal(isRetryableAgentBrowserError(pageStillLoading), true);
  assert.equal(
    isRetryableAgentBrowserError(new Error('Evaluation error: Failed to create client root block')),
    false
  );
});

test('parseArgs defaults keep today-journal cleanup enabled', () => {
  const args = parseArgs([]);
  assert.equal(args.simulationPage, undefined);
  assert.equal(args.opProfile, 'fast');
  assert.equal(args.opTimeoutMs, 1000);
  assert.equal(args.cleanupTodayPage, true);
});

test('cleanup program targets today journal APIs', () => {
  const program = buildCleanupTodayPageProgram();
  assert.match(program, /get_today_page/);
  assert.doesNotMatch(program, /testing journal/i);
});
