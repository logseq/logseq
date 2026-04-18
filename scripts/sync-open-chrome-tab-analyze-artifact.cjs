#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

function usage() {
  return [
    'Usage: node scripts/sync-open-chrome-tab-analyze-artifact.cjs --artifact <path>',
    '',
    'Options:',
    '  --artifact <path>   Path to artifact.json from sync-open-chrome-tab-simulate',
    '  --pretty            Pretty-print JSON output',
    '  -h, --help          Show this message',
  ].join('\n');
}

function parseArgs(argv) {
  const result = {
    artifactPath: null,
    pretty: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }
    if (arg === '--pretty') {
      result.pretty = true;
      continue;
    }
    if (arg === '--artifact') {
      const next = argv[i + 1];
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--artifact must be a non-empty path');
      }
      result.artifactPath = next;
      i += 1;
      continue;
    }
    throw new Error('Unknown argument: ' + arg);
  }

  if (!result.help && !result.artifactPath) {
    throw new Error('--artifact is required');
  }

  return result;
}

function pickFirstMismatchClient(clients) {
  for (const client of clients) {
    if (client && client.mismatch && typeof client.mismatch === 'object') {
      return client;
    }
  }
  return null;
}

function pickFirstTxRejectedClient(clients) {
  for (const client of clients) {
    if (client && client.txRejected && typeof client.txRejected === 'object') {
      return client;
    }
  }
  return null;
}

function compareRequestedPlans(clients) {
  const withPlan = clients.filter((client) => Array.isArray(client?.requestedPlan) && client.requestedPlan.length > 0);
  if (withPlan.length < 2) {
    return { comparable: false, reason: 'not enough clients with requestedPlan' };
  }

  const base = withPlan[0];
  const minLen = withPlan.reduce((acc, client) => Math.min(acc, client.requestedPlan.length), Infinity);
  for (let i = 0; i < minLen; i += 1) {
    const baseOp = base.requestedPlan[i];
    for (let j = 1; j < withPlan.length; j += 1) {
      const other = withPlan[j];
      if (other.requestedPlan[i] !== baseOp) {
        return {
          comparable: true,
          firstDiffIndex: i,
          baseClient: base.instanceIndex,
          baseOp,
          otherClient: other.instanceIndex,
          otherOp: other.requestedPlan[i],
        };
      }
    }
  }

  return {
    comparable: true,
    firstDiffIndex: null,
    message: 'requestedPlan prefix is identical across clients',
  };
}

function summarizeClient(client) {
  return {
    session: client?.session || null,
    instanceIndex: client?.instanceIndex ?? null,
    ok: Boolean(client?.ok),
    cancelled: client?.cancelled === true,
    cancelledReason: client?.cancelledReason || null,
    failureType: client?.failureType || null,
    mismatch: client?.mismatch || null,
    txRejected: client?.txRejected || null,
    errorCount: Number(client?.errorCount || 0),
    requestedOps: Number(client?.requestedOps || 0),
    executedOps: Number(client?.executedOps || 0),
    lastOps: Array.isArray(client?.opLogTail) ? client.opLogTail.slice(-20) : [],
    errors: Array.isArray(client?.errors) ? client.errors.slice(-20) : [],
  };
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error('\n' + usage());
    process.exit(1);
    return;
  }

  if (args.help) {
    console.log(usage());
    return;
  }

  const artifactPath = path.resolve(args.artifactPath);
  const content = await fs.readFile(artifactPath, 'utf8');
  const artifact = JSON.parse(content);

  const clients = Array.isArray(artifact?.clients) ? artifact.clients : [];
  const firstMismatch = pickFirstMismatchClient(clients);
  const firstTxRejected = pickFirstTxRejectedClient(clients);
  const cancelledPeers = clients
    .filter((client) =>
      client?.cancelledReason === 'cancelled_due_to_peer_checksum_mismatch' ||
      client?.cancelledReason === 'cancelled_due_to_peer_tx_rejected'
    )
    .map((client) => ({
      instanceIndex: client.instanceIndex,
      session: client.session,
      peerInstanceIndex: client.peerInstanceIndex ?? null,
      cancelledReason: client.cancelledReason || null,
    }));

  const report = {
    artifactPath,
    runId: artifact?.runId || null,
    createdAt: artifact?.createdAt || null,
    summary: artifact?.summary || {},
    failFast: artifact?.failFast || {},
    mismatchCount: Number(artifact?.mismatchCount || 0),
    txRejectedCount: Number(artifact?.txRejectedCount || 0),
    firstMismatch: firstMismatch ? summarizeClient(firstMismatch) : null,
    firstTxRejected: firstTxRejected ? summarizeClient(firstTxRejected) : null,
    cancelledPeers,
    requestedPlanComparison: compareRequestedPlans(clients),
    clients: clients.map(summarizeClient),
  };

  if (args.pretty) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(JSON.stringify(report));
  }
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
