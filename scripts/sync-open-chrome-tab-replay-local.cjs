#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

function usage() {
  return [
    'Usage: node scripts/sync-open-chrome-tab-replay-local.cjs --artifact <path> [options]',
    '',
    'Options:',
    '  --artifact <path>  Path to artifact.json produced by sync-open-chrome-tab-simulate',
    '  --client <n>       Replay one client instance index only',
    '  --round <n>        Replay one round only',
    '  --pretty           Pretty-print JSON output',
    '  -h, --help         Show this message',
  ].join('\n');
}

function parsePositiveInteger(value, flagName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flagName} must be a positive integer`);
  }
  return parsed;
}

function parseArgs(argv) {
  const result = {
    artifact: null,
    client: null,
    round: null,
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
    const next = argv[i + 1];
    if (arg === '--artifact') {
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--artifact must be a non-empty path');
      }
      result.artifact = next;
      i += 1;
      continue;
    }
    if (arg === '--client') {
      result.client = parsePositiveInteger(next, '--client');
      i += 1;
      continue;
    }
    if (arg === '--round') {
      result.round = parsePositiveInteger(next, '--round');
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!result.help && !result.artifact) {
    throw new Error('--artifact is required');
  }

  return result;
}

function main() {
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

  const artifactPath = path.resolve(args.artifact);
  const dbDir = path.resolve(__dirname, '..', 'deps', 'db');
  const scriptPath = 'script/replay_sync_artifact.cljs';

  const commandArgs = [
    '-s',
    'nbb-logseq',
    '-cp',
    'src:script:../db-sync/src',
    scriptPath,
    '--artifact',
    artifactPath,
  ];
  if (args.client) {
    commandArgs.push('--client', String(args.client));
  }
  if (args.round) {
    commandArgs.push('--round', String(args.round));
  }
  if (args.pretty) {
    commandArgs.push('--pretty');
  }

  const result = spawnSync('yarn', commandArgs, {
    cwd: dbDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    const detail = stderr || stdout;
    throw new Error(
      `Replay command failed (exit ${result.status ?? 'unknown'}): yarn ${commandArgs.join(' ')}` +
        (detail ? `\n${detail}` : '')
    );
  }

  const output = result.stdout || '';
  process.stdout.write(output);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.stack || String(error));
    process.exit(1);
  }
}

module.exports = {
  parseArgs,
};
