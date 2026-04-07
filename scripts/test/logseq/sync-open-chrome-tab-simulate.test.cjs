const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseArgs,
  isRetryableAgentBrowserError,
  buildCleanupTodayPageProgram,
  classifySimulationFailure,
  buildRejectedResultEntry,
  extractChecksumMismatchDetailsFromError,
  extractTxRejectedDetailsFromError,
  buildRunArtifact,
  createSeededRng,
  shuffleOperationPlan,
  extractReplayContext,
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

test('classifySimulationFailure detects checksum mismatch failures', () => {
  const mismatchError = new Error(
    'Evaluation error: Error: checksum mismatch rtc-log detected: {"type":":rtc.log/checksum-mismatch"}'
  );
  const timeoutError = new Error('Operation timed out. The page may still be loading');

  assert.equal(classifySimulationFailure(mismatchError), 'checksum_mismatch');
  assert.equal(classifySimulationFailure(timeoutError), 'other');
});

test('classifySimulationFailure detects tx-rejected failures', () => {
  const txRejectedError = new Error(
    'Evaluation error: Error: tx rejected rtc-log detected: {"type":":rtc.log/tx-rejected","reason":"db transact failed"}'
  );

  assert.equal(classifySimulationFailure(txRejectedError), 'tx_rejected');
});

test('buildRejectedResultEntry marks peer as cancelled after checksum mismatch fail-fast', () => {
  const failFastState = {
    sourceIndex: 0,
    reasonType: 'checksum_mismatch',
  };

  const peer = buildRejectedResultEntry(
    'logseq-op-sim-2',
    1,
    new Error('Command timed out'),
    failFastState
  );
  assert.equal(peer.cancelled, true);
  assert.equal(peer.cancelledReason, 'cancelled_due_to_peer_checksum_mismatch');
  assert.equal(peer.peerInstanceIndex, 1);

  const source = buildRejectedResultEntry(
    'logseq-op-sim-1',
    0,
    new Error('checksum mismatch rtc-log detected'),
    failFastState
  );
  assert.equal(source.cancelled, undefined);
  assert.equal(source.failureType, 'checksum_mismatch');
});

test('buildRejectedResultEntry marks peer as cancelled after tx-rejected fail-fast', () => {
  const failFastState = {
    sourceIndex: 1,
    reasonType: 'tx_rejected',
  };

  const peer = buildRejectedResultEntry(
    'logseq-op-sim-1',
    0,
    new Error('Command timed out'),
    failFastState
  );
  assert.equal(peer.cancelled, true);
  assert.equal(peer.cancelledReason, 'cancelled_due_to_peer_tx_rejected');
  assert.equal(peer.peerInstanceIndex, 2);

  const source = buildRejectedResultEntry(
    'logseq-op-sim-2',
    1,
    new Error('tx rejected rtc-log detected'),
    failFastState
  );
  assert.equal(source.cancelled, undefined);
  assert.equal(source.failureType, 'tx_rejected');
});

test('extractChecksumMismatchDetailsFromError parses rtc-log payload JSON', () => {
  const errorText =
    'Evaluation error: Error: checksum mismatch rtc-log detected: {"type":":rtc.log/checksum-mismatch","messageType":"tx/batch/ok","localTx":10,"remoteTx":10,"localChecksum":"aa","remoteChecksum":"bb"}';
  const parsed = extractChecksumMismatchDetailsFromError(errorText);
  assert.deepEqual(parsed, {
    type: ':rtc.log/checksum-mismatch',
    messageType: 'tx/batch/ok',
    localTx: 10,
    remoteTx: 10,
    localChecksum: 'aa',
    remoteChecksum: 'bb',
  });
});

test('extractTxRejectedDetailsFromError parses rtc-log payload JSON', () => {
  const errorText =
    'Evaluation error: Error: tx rejected rtc-log detected: {"type":":rtc.log/tx-rejected","messageType":"tx/reject","reason":"db transact failed","remoteTx":3}';
  const parsed = extractTxRejectedDetailsFromError(errorText);
  assert.deepEqual(parsed, {
    type: ':rtc.log/tx-rejected',
    messageType: 'tx/reject',
    reason: 'db transact failed',
    remoteTx: 3,
  });
});

test('buildRunArtifact includes mismatch diagnostics and per-client summaries', () => {
  const output = {
    ok: false,
    instances: 2,
    successCount: 0,
    failureCount: 2,
    results: [
      {
        session: 'logseq-op-sim-1',
        instanceIndex: 1,
        ok: false,
        error:
          'Evaluation error: Error: checksum mismatch rtc-log detected: {"type":":rtc.log/checksum-mismatch","localChecksum":"aa","remoteChecksum":"bb"}',
      },
      {
        session: 'logseq-op-sim-2',
        instanceIndex: 2,
        ok: false,
        cancelled: true,
        cancelledReason: 'cancelled_due_to_peer_tx_rejected',
        error:
          'Evaluation error: Error: tx rejected rtc-log detected: {"type":":rtc.log/tx-rejected","reason":"db transact failed","remoteTx":12}',
      },
    ],
  };

  const artifact = buildRunArtifact({
    output,
    args: { ops: 100, instances: 2 },
    runContext: { runId: 'run-1', runPrefix: 'op-sim-run-1-' },
    failFastState: { sourceIndex: 0, reasonType: 'checksum_mismatch' },
  });

  assert.equal(artifact.runId, 'run-1');
  assert.equal(artifact.failFast.reasonType, 'checksum_mismatch');
  assert.equal(artifact.mismatchCount, 1);
  assert.equal(artifact.txRejectedCount, 1);
  assert.equal(artifact.clients.length, 2);
  assert.equal(artifact.clients[0].mismatch?.remoteChecksum, 'bb');
  assert.equal(artifact.clients[1].txRejected?.reason, 'db transact failed');
});

test('parseArgs accepts seed for deterministic simulation', () => {
  const args = parseArgs(['--seed', 'abc123']);
  assert.equal(args.seed, 'abc123');
});

test('createSeededRng produces deterministic sequence for same seed', () => {
  const a = createSeededRng('same-seed');
  const b = createSeededRng('same-seed');
  const seqA = [a(), a(), a(), a(), a()];
  const seqB = [b(), b(), b(), b(), b()];
  assert.deepEqual(seqA, seqB);
});

test('shuffleOperationPlan is deterministic with seeded rng', () => {
  const plan = ['a', 'b', 'c', 'd', 'e', 'f'];
  const shuffledA = shuffleOperationPlan(plan, createSeededRng('seed-1'));
  const shuffledB = shuffleOperationPlan(plan, createSeededRng('seed-1'));
  const shuffledC = shuffleOperationPlan(plan, createSeededRng('seed-2'));

  assert.deepEqual(shuffledA, shuffledB);
  assert.notDeepEqual(shuffledA, shuffledC);
});

test('parseArgs accepts replay artifact path', () => {
  const args = parseArgs(['--replay', 'tmp/db-sync-repro/run-1/artifact.json']);
  assert.equal(args.replay, 'tmp/db-sync-repro/run-1/artifact.json');
});

test('extractReplayContext returns args override and fixed client plans', () => {
  const artifact = {
    args: { ops: 100, instances: 2, seed: 'abc' },
    clients: [
      { instanceIndex: 1, requestedPlan: ['add', 'move'] },
      { instanceIndex: 2, requestedPlan: ['add', 'delete'] },
    ],
  };
  const replay = extractReplayContext(artifact);
  assert.equal(replay.argsOverride.seed, 'abc');
  assert.deepEqual(replay.fixedPlansByInstance.get(1), ['add', 'move']);
  assert.deepEqual(replay.fixedPlansByInstance.get(2), ['add', 'delete']);
});
