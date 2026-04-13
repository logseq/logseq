#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_URL = 'http://localhost:3001/#/';
const DEFAULT_SESSION_NAME = 'logseq-op-sim';
const DEFAULT_CHROME_PROFILE = 'auto';
const DEFAULT_INSTANCES = 1;
const DEFAULT_OPS = 50;
const DEFAULT_OP_PROFILE = 'fast';
const DEFAULT_OP_TIMEOUT_MS = 1000;
const DEFAULT_ROUNDS = 1;
const DEFAULT_UNDO_REDO_DELAY_MS = 350;
const DEFAULT_HEADED = true;
const DEFAULT_AUTO_CONNECT = false;
const DEFAULT_RESET_SESSION = true;
const DEFAULT_TARGET_GRAPH = 'db1';
const DEFAULT_E2E_PASSWORD = '12345';
const DEFAULT_SWITCH_GRAPH_TIMEOUT_MS = 100000;
const DEFAULT_CHROME_LAUNCH_ARGS = [
  '--new-window',
  '--no-first-run',
  '--no-default-browser-check',
];
const RENDERER_READY_TIMEOUT_MS = 30000;
const RENDERER_READY_POLL_DELAY_MS = 250;
const FALLBACK_PAGE_NAME = 'op-sim-scratch';
const DEFAULT_VERIFY_CHECKSUM = true;
const DEFAULT_CLEANUP_TODAY_PAGE = true;
const DEFAULT_CAPTURE_REPLAY = true;
const DEFAULT_SYNC_SETTLE_TIMEOUT_MS = 3000;
const AGENT_BROWSER_ACTION_TIMEOUT_MS = 1000000;
const PROCESS_TIMEOUT_MS = 1000000;
const AGENT_BROWSER_RETRY_COUNT = 2;
const BOOTSTRAP_EVAL_TIMEOUT_MS = 150000;
const RENDERER_EVAL_BASE_TIMEOUT_MS = 30000;
const DEFAULT_ARTIFACT_BASE_DIR = path.join('tmp', 'db-sync-repro');
const FULL_PROFILE_OPERATION_ORDER = Object.freeze([
  'add',
  'save',
  'inlineTag',
  'emptyInlineTag',
  'pageReference',
  'blockReference',
  'propertySet',
  'batchSetProperty',
  'propertyValueDelete',
  'copyPaste',
  'copyPasteTreeToEmptyTarget',
  'templateApply',
  'move',
  'moveUpDown',
  'indent',
  'outdent',
  'delete',
  'propertyRemove',
  'undo',
  'redo',
]);
const FAST_PROFILE_OPERATION_ORDER = Object.freeze([
  'add',
  'save',
  'inlineTag',
  'emptyInlineTag',
  'pageReference',
  'blockReference',
  'propertySet',
  'batchSetProperty',
  'move',
  'delete',
  'indent',
  'outdent',
  'moveUpDown',
  'templateApply',
  'propertyValueDelete',
  'add',
  'move',
]);
const ALL_OUTLINER_OP_COVERAGE_OPS = Object.freeze([
  'save-block',
  'insert-blocks',
  'apply-template',
  'delete-blocks',
  'move-blocks',
  'move-blocks-up-down',
  'indent-outdent-blocks',
  'upsert-property',
  'set-block-property',
  'remove-block-property',
  'delete-property-value',
  'batch-delete-property-value',
  'create-property-text-block',
  'collapse-expand-block-property',
  'batch-set-property',
  'batch-remove-property',
  'class-add-property',
  'class-remove-property',
  'upsert-closed-value',
  'delete-closed-value',
  'add-existing-values-to-closed-values',
  'batch-import-edn',
  'transact',
  'create-page',
  'rename-page',
  'delete-page',
  'recycle-delete-permanently',
  'toggle-reaction',
  'restore-recycled',
]);

function usage() {
  return [
    'Usage: node scripts/sync-open-chrome-tab-simulate.cjs [options]',
    '',
    'Options:',
    `  --url <url>                 URL to open (default: ${DEFAULT_URL})`,
    `  --session <name>            agent-browser session name (default: ${DEFAULT_SESSION_NAME})`,
    `  --instances <n>             Number of concurrent browser instances (default: ${DEFAULT_INSTANCES})`,
    `  --graph <name>              Graph name to switch/download before ops (default: ${DEFAULT_TARGET_GRAPH})`,
    `  --e2e-password <text>       Password for E2EE modal if prompted (default: ${DEFAULT_E2E_PASSWORD})`,
    '  --profile <name|path|auto|none> Chrome profile to reuse login state (default: auto)',
    '                              auto = prefer Default, then logseq.com',
    '                              none = do not pass --profile to agent-browser (isolated profile)',
    '                              profile labels are mapped to Chrome profile names',
    '  --executable-path <path>    Chrome executable path (default: auto-detect system Chrome)',
    '  --auto-connect              Enable auto-connect to an already running Chrome instance',
    '  --no-auto-connect           Disable auto-connect to a running Chrome instance',
    '  --no-reset-session          Do not close the target agent-browser session before starting',
    `  --switch-timeout-ms <n>     Timeout for graph switch/download bootstrap (default: ${DEFAULT_SWITCH_GRAPH_TIMEOUT_MS})`,
    `  --ops <n>                   Total operations across all instances per round (must be >= 1, default: ${DEFAULT_OPS})`,
    `  --op-profile <name>         Operation profile: fast|full (default: ${DEFAULT_OP_PROFILE})`,
    `  --op-timeout-ms <n>         Timeout per operation in renderer (default: ${DEFAULT_OP_TIMEOUT_MS})`,
    '  --seed <text|number>        Deterministic seed for operation ordering/jitter',
    '  --replay <artifact.json>    Replay a prior captured artifact run',
    `  --rounds <n>                Number of operation rounds per instance (default: ${DEFAULT_ROUNDS})`,
    `  --undo-redo-delay-ms <n>    Wait time after undo/redo command (default: ${DEFAULT_UNDO_REDO_DELAY_MS})`,
    `  --sync-settle-timeout-ms <n> Timeout waiting for local/remote tx to settle before checksum verify (default: ${DEFAULT_SYNC_SETTLE_TIMEOUT_MS})`,
    '  --verify-checksum           Run dev checksum diagnostics after each round (default: enabled)',
    '  --no-verify-checksum        Skip post-round checksum diagnostics',
    '  --capture-replay            Capture initial DB + per-op tx stream for local replay (default: enabled)',
    '  --no-capture-replay         Skip replay capture payloads',
    '  --cleanup-today-page        Delete today page after simulation (default: enabled)',
    '  --no-cleanup-today-page     Keep today page unchanged after simulation',
    '  --headless                  Run agent-browser in headless mode',
    '  --print-only                Print parsed args only, do not run simulation',
    '  -h, --help                  Show this message',
  ].join('\n');
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
    url: DEFAULT_URL,
    session: DEFAULT_SESSION_NAME,
    instances: DEFAULT_INSTANCES,
    graph: DEFAULT_TARGET_GRAPH,
    e2ePassword: DEFAULT_E2E_PASSWORD,
    profile: DEFAULT_CHROME_PROFILE,
    executablePath: null,
    autoConnect: DEFAULT_AUTO_CONNECT,
    resetSession: DEFAULT_RESET_SESSION,
    switchTimeoutMs: DEFAULT_SWITCH_GRAPH_TIMEOUT_MS,
    ops: DEFAULT_OPS,
    opProfile: DEFAULT_OP_PROFILE,
    opTimeoutMs: DEFAULT_OP_TIMEOUT_MS,
    seed: null,
    replay: null,
    rounds: DEFAULT_ROUNDS,
    undoRedoDelayMs: DEFAULT_UNDO_REDO_DELAY_MS,
    syncSettleTimeoutMs: DEFAULT_SYNC_SETTLE_TIMEOUT_MS,
    verifyChecksum: DEFAULT_VERIFY_CHECKSUM,
    captureReplay: DEFAULT_CAPTURE_REPLAY,
    cleanupTodayPage: DEFAULT_CLEANUP_TODAY_PAGE,
    headed: DEFAULT_HEADED,
    printOnly: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      return { ...result, help: true };
    }

    if (arg === '--print-only') {
      result.printOnly = true;
      continue;
    }

    if (arg === '--headless') {
      result.headed = false;
      continue;
    }

    if (arg === '--verify-checksum') {
      result.verifyChecksum = true;
      continue;
    }

    if (arg === '--no-verify-checksum') {
      result.verifyChecksum = false;
      continue;
    }

    if (arg === '--cleanup-today-page') {
      result.cleanupTodayPage = true;
      continue;
    }

    if (arg === '--no-cleanup-today-page') {
      result.cleanupTodayPage = false;
      continue;
    }

    if (arg === '--capture-replay') {
      result.captureReplay = true;
      continue;
    }

    if (arg === '--no-capture-replay') {
      result.captureReplay = false;
      continue;
    }

    if (arg === '--no-auto-connect') {
      result.autoConnect = false;
      continue;
    }

    if (arg === '--auto-connect') {
      result.autoConnect = true;
      continue;
    }

    if (arg === '--no-reset-session') {
      result.resetSession = false;
      continue;
    }

    const next = argv[i + 1];

    if (arg === '--url') {
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--url must be a non-empty string');
      }
      result.url = next;
      i += 1;
      continue;
    }

    if (arg === '--session') {
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--session must be a non-empty string');
      }
      result.session = next;
      i += 1;
      continue;
    }

    if (arg === '--graph') {
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--graph must be a non-empty string');
      }
      result.graph = next;
      i += 1;
      continue;
    }

    if (arg === '--e2e-password') {
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--e2e-password must be a non-empty string');
      }
      result.e2ePassword = next;
      i += 1;
      continue;
    }

    if (arg === '--instances') {
      result.instances = parsePositiveInteger(next, '--instances');
      i += 1;
      continue;
    }

    if (arg === '--profile') {
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--profile must be a non-empty string');
      }
      result.profile = next;
      i += 1;
      continue;
    }

    if (arg === '--executable-path') {
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--executable-path must be a non-empty string');
      }
      result.executablePath = next;
      i += 1;
      continue;
    }

    if (arg === '--ops') {
      result.ops = parsePositiveInteger(next, '--ops');
      i += 1;
      continue;
    }

    if (arg === '--op-profile') {
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--op-profile must be a non-empty string');
      }
      const normalized = next.toLowerCase();
      if (normalized !== 'fast' && normalized !== 'full') {
        throw new Error('--op-profile must be one of: fast, full');
      }
      result.opProfile = normalized;
      i += 1;
      continue;
    }

    if (arg === '--op-timeout-ms') {
      result.opTimeoutMs = parsePositiveInteger(next, '--op-timeout-ms');
      i += 1;
      continue;
    }

    if (arg === '--seed') {
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--seed must be a non-empty string');
      }
      result.seed = next;
      i += 1;
      continue;
    }

    if (arg === '--replay') {
      if (typeof next !== 'string' || next.length === 0) {
        throw new Error('--replay must be a non-empty path');
      }
      result.replay = next;
      i += 1;
      continue;
    }

    if (arg === '--rounds') {
      result.rounds = parsePositiveInteger(next, '--rounds');
      i += 1;
      continue;
    }

    if (arg === '--undo-redo-delay-ms') {
      result.undoRedoDelayMs = parseNonNegativeInteger(next, '--undo-redo-delay-ms');
      i += 1;
      continue;
    }

    if (arg === '--sync-settle-timeout-ms') {
      result.syncSettleTimeoutMs = parsePositiveInteger(next, '--sync-settle-timeout-ms');
      i += 1;
      continue;
    }

    if (arg === '--switch-timeout-ms') {
      result.switchTimeoutMs = parsePositiveInteger(next, '--switch-timeout-ms');
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (result.ops < 1) {
    throw new Error('--ops must be at least 1');
  }
  if (result.rounds < 1) {
    throw new Error('--rounds must be at least 1');
  }

  return result;
}

function spawnAndCapture(cmd, args, options = {}) {
  const {
    input,
    timeoutMs = PROCESS_TIMEOUT_MS,
    env = process.env,
  } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (payload) => {
      stdout += payload.toString();
    });

    child.stderr.on('data', (payload) => {
      stderr += payload.toString();
    });

    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.once('exit', (code) => {
      clearTimeout(timer);

      if (timedOut) {
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${cmd} ${args.join(' ')}`));
        return;
      }

      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }

      const detail = stderr.trim() || stdout.trim();
      reject(
        new Error(
          `Command failed: ${cmd} ${args.join(' ')} (exit ${code})` +
            (detail ? `\n${detail}` : '')
        )
      );
    });

    if (typeof input === 'string') {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

function parseJsonOutput(output) {
  const text = output.trim();
  if (!text) {
    throw new Error('Expected JSON output from agent-browser but got empty output');
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const lastLine = lines[lines.length - 1];
    try {
      return JSON.parse(lastLine);
    } catch (error) {
      throw new Error('Failed to parse JSON output from agent-browser: ' + String(error.message || error));
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashSeed(input) {
  const text = String(input ?? '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRng(seedInput) {
  let state = hashSeed(seedInput);
  if (state === 0) {
    state = 0x9e3779b9;
  }
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let payload = state;
    payload = Math.imul(payload ^ (payload >>> 15), payload | 1);
    payload ^= payload + Math.imul(payload ^ (payload >>> 7), payload | 61);
    return ((payload ^ (payload >>> 14)) >>> 0) / 4294967296;
  };
}

function deriveSeed(baseSeed, ...parts) {
  return hashSeed([String(baseSeed ?? ''), ...parts.map((it) => String(it))].join('::'));
}

function sanitizeForFilename(value) {
  return String(value || 'default').replace(/[^a-zA-Z0-9._-]+/g, '-');
}

async function pathExists(targetPath) {
  try {
    await fsPromises.access(targetPath);
    return true;
  } catch (_error) {
    return false;
  }
}

async function copyIfExists(sourcePath, destPath) {
  if (!(await pathExists(sourcePath))) return false;
  await fsPromises.mkdir(path.dirname(destPath), { recursive: true });
  await fsPromises.cp(sourcePath, destPath, {
    force: true,
    recursive: true,
  });
  return true;
}

async function detectChromeUserDataRoot() {
  const home = os.homedir();
  const candidates = [];
  if (process.platform === 'darwin') {
    candidates.push(path.join(home, 'Library', 'Application Support', 'Google', 'Chrome'));
  } else if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      candidates.push(path.join(localAppData, 'Google', 'Chrome', 'User Data'));
    }
  } else {
    candidates.push(path.join(home, '.config', 'google-chrome'));
    candidates.push(path.join(home, '.config', 'chromium'));
  }

  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate;
  }
  return null;
}

async function createIsolatedChromeUserDataDir(sourceProfileName, instanceIndex) {
  const sourceRoot = await detectChromeUserDataRoot();
  if (!sourceRoot) {
    throw new Error('Cannot find Chrome user data root to clone auth profile');
  }

  const sourceProfileDir = path.join(sourceRoot, sourceProfileName);
  if (!(await pathExists(sourceProfileDir))) {
    throw new Error(`Cannot find Chrome profile directory to clone: ${sourceProfileDir}`);
  }

  const targetRoot = path.join(
    os.tmpdir(),
    `logseq-op-sim-user-data-${sanitizeForFilename(sourceProfileName)}-${instanceIndex}`
  );
  const targetDefaultProfileDir = path.join(targetRoot, 'Default');
  await fsPromises.rm(targetRoot, { recursive: true, force: true });
  await fsPromises.mkdir(targetDefaultProfileDir, { recursive: true });

  await copyIfExists(path.join(sourceRoot, 'Local State'), path.join(targetRoot, 'Local State'));

  const entries = [
    'Network',
    'Cookies',
    'Local Storage',
    'Session Storage',
    'IndexedDB',
    'WebStorage',
    'Preferences',
    'Secure Preferences',
  ];
  for (const entry of entries) {
    await copyIfExists(
      path.join(sourceProfileDir, entry),
      path.join(targetDefaultProfileDir, entry)
    );
  }

  return targetRoot;
}

function buildChromeLaunchArgs(url) {
  return [
    `--app=${url}`,
    ...DEFAULT_CHROME_LAUNCH_ARGS,
  ];
}

function isRetryableAgentBrowserError(error) {
  const message = String(error?.message || error || '');
  return (
    /daemon may be busy or unresponsive/i.test(message) ||
    /resource temporarily unavailable/i.test(message) ||
    /os error 35/i.test(message) ||
    /EAGAIN/i.test(message) ||
    /inspected target navigated or closed/i.test(message) ||
    /execution context was destroyed/i.test(message) ||
    /cannot find context with specified id/i.test(message) ||
    /target closed/i.test(message) ||
    /session closed/i.test(message) ||
    /cdp command timed out/i.test(message) ||
    /cdp response channel closed/i.test(message) ||
    /operation timed out\. the page may still be loading/i.test(message)
  );
}

async function listChromeProfiles() {
  try {
    const { stdout } = await spawnAndCapture('agent-browser', ['profiles']);
    const lines = stdout.split(/\r?\n/);
    const profiles = [];

    for (const line of lines) {
      const match = line.match(/^\s+(.+?)\s+\((.+?)\)\s*$/);
      if (!match) continue;
      profiles.push({
        profile: match[1].trim(),
        label: match[2].trim(),
      });
    }

    return profiles;
  } catch (_error) {
    return [];
  }
}

async function detectChromeProfile() {
  const profiles = await listChromeProfiles();
  if (profiles.length > 0) {

    const defaultProfile = profiles.find((item) => item.profile === 'Default');
    if (defaultProfile) return defaultProfile.profile;

    return profiles[0].profile;
  }

  return 'Default';
}

async function detectChromeExecutablePath() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    `${process.env.HOME || ''}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await fsPromises.access(candidate, fs.constants.X_OK);
      return candidate;
    } catch (_error) {
      // keep trying
    }
  }

  return null;
}

function expandHome(inputPath) {
  if (typeof inputPath !== 'string') return inputPath;
  if (!inputPath.startsWith('~')) return inputPath;
  return path.join(os.homedir(), inputPath.slice(1));
}

function looksLikePath(value) {
  return value.includes('/') || value.includes('\\') || value.startsWith('~') || value.startsWith('.');
}

async function resolveProfileArgument(profile) {
  if (!profile) return null;

  if (looksLikePath(profile)) {
    return expandHome(profile);
  }

  let profileName = profile;
  const profiles = await listChromeProfiles();
  if (profiles.length > 0) {
    const byLabel = profiles.find((item) => item.label.toLowerCase() === profile.toLowerCase());
    if (byLabel) {
      profileName = byLabel.profile;
    }
  }

  return profileName;
}

async function runAgentBrowser(session, commandArgs, options = {}) {
  const {
    retries = AGENT_BROWSER_RETRY_COUNT,
    ...commandOptions
  } = options;

  const env = {
    ...process.env,
    AGENT_BROWSER_DEFAULT_TIMEOUT: String(AGENT_BROWSER_ACTION_TIMEOUT_MS),
  };

  const globalFlags = ['--session', session];
  if (commandOptions.headed) {
    globalFlags.push('--headed');
  }
  if (commandOptions.autoConnect) {
    globalFlags.push('--auto-connect');
  }
  if (commandOptions.profile) {
    globalFlags.push('--profile', commandOptions.profile);
  }
  if (commandOptions.state) {
    globalFlags.push('--state', commandOptions.state);
  }
  if (Array.isArray(commandOptions.launchArgs) && commandOptions.launchArgs.length > 0) {
    globalFlags.push('--args', commandOptions.launchArgs.join(','));
  }
  if (commandOptions.executablePath) {
    globalFlags.push('--executable-path', commandOptions.executablePath);
  }

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { stdout, stderr } = await spawnAndCapture(
        'agent-browser',
        [...globalFlags, ...commandArgs, '--json'],
        {
          ...commandOptions,
          env,
        }
      );

      const parsed = parseJsonOutput(stdout);
      if (!parsed || parsed.success !== true) {
        const fallback =
          String(parsed?.error || '').trim() ||
          stderr.trim() ||
          stdout.trim();
        throw new Error('agent-browser command failed: ' + (fallback || 'unknown error'));
      }
      return parsed;
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isRetryableAgentBrowserError(error)) {
        throw error;
      }
      await sleep((attempt + 1) * 250);
    }
  }

  throw lastError || new Error('agent-browser command failed');
}

function urlMatchesTarget(candidate, targetUrl) {
  if (typeof candidate !== 'string' || typeof targetUrl !== 'string') return false;
  if (candidate === targetUrl) return true;
  if (candidate.startsWith(targetUrl)) return true;
  try {
    const candidateUrl = new URL(candidate);
    const target = new URL(targetUrl);
    return (
      candidateUrl.origin === target.origin &&
      candidateUrl.pathname === target.pathname
    );
  } catch (_error) {
    return false;
  }
}

async function ensureActiveTabOnTargetUrl(session, targetUrl, runOptions) {
  const currentUrlResult = await runAgentBrowser(session, ['get', 'url'], runOptions);
  const currentUrl = currentUrlResult?.data?.url;
  if (urlMatchesTarget(currentUrl, targetUrl)) {
    return;
  }

  const tabList = await runAgentBrowser(session, ['tab', 'list'], runOptions);
  const tabs = Array.isArray(tabList?.data?.tabs) ? tabList.data.tabs : [];
  const matchedTab = tabs.find((tab) => urlMatchesTarget(tab?.url, targetUrl));
  if (matchedTab && Number.isInteger(matchedTab.index)) {
    await runAgentBrowser(session, ['tab', String(matchedTab.index)], runOptions);
    return;
  }

  const created = await runAgentBrowser(session, ['tab', 'new', targetUrl], runOptions);
  const createdIndex = created?.data?.index;
  if (Number.isInteger(createdIndex)) {
    await runAgentBrowser(session, ['tab', String(createdIndex)], runOptions);
  }
}

function buildRendererProgram(config) {
  return `(() => (async () => {
    const config = ${JSON.stringify(config)};
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const createSeededRng = (seedInput) => {
      const text = String(seedInput ?? '');
      let hash = 2166136261;
      for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      let state = hash >>> 0;
      if (state === 0) state = 0x9e3779b9;
      return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let payload = state;
        payload = Math.imul(payload ^ (payload >>> 15), payload | 1);
        payload ^= payload + Math.imul(payload ^ (payload >>> 7), payload | 61);
        return ((payload ^ (payload >>> 14)) >>> 0) / 4294967296;
      };
    };
    const nextRandom = createSeededRng(config.seed);
    const randomItem = (items) => items[Math.floor(nextRandom() * items.length)];
    const shuffle = (items) => {
      const arr = Array.isArray(items) ? [...items] : [];
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(nextRandom() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    };
    const describeError = (error) => String(error?.message || error);
    const asPageName = (pageLike) => {
      if (typeof pageLike === 'string' && pageLike.length > 0) return pageLike;
      if (!pageLike || typeof pageLike !== 'object') return null;
      if (typeof pageLike.name === 'string' && pageLike.name.length > 0) return pageLike.name;
      if (typeof pageLike.originalName === 'string' && pageLike.originalName.length > 0) return pageLike.originalName;
      if (typeof pageLike.title === 'string' && pageLike.title.length > 0) return pageLike.title;
      return null;
    };
    const expectedOutlinerOps = ${JSON.stringify(ALL_OUTLINER_OP_COVERAGE_OPS)};

    const waitForEditorReady = async () => {
      const deadline = Date.now() + config.readyTimeoutMs;
      let lastError = null;

      while (Date.now() < deadline) {
        try {
          if (
            globalThis.logseq?.api &&
            typeof logseq.api.get_current_block === 'function' &&
            (
              typeof logseq.api.get_current_page === 'function' ||
              typeof logseq.api.get_today_page === 'function'
            ) &&
            typeof logseq.api.append_block_in_page === 'function'
          ) {
            return;
          }
        } catch (error) {
          lastError = error;
        }

        await sleep(config.readyPollDelayMs);
      }

      if (lastError) {
        throw new Error('Logseq editor readiness timed out: ' + describeError(lastError));
      }
      throw new Error('Logseq editor readiness timed out: logseq.api is unavailable');
    };

    const runPrefix =
      typeof config.runPrefix === 'string' && config.runPrefix.length > 0
        ? config.runPrefix
        : config.markerPrefix;
    const checksumWarningToken = 'db-sync/checksum-mismatch';
    const txRejectedWarningToken = 'db-sync/tx-rejected';
    const missingEntityWarningToken = 'nothing found for entity id';
    const applyRemoteTxWarningToken = 'frontend.worker.sync.handle-message/apply-remote-tx';
    const numericEntityIdWarningToken = 'non-transact outliner ops contain numeric entity ids';
    const checksumWarningTokenLower = checksumWarningToken.toLowerCase();
    const txRejectedWarningTokenLower = txRejectedWarningToken.toLowerCase();
    const missingEntityWarningTokenLower = missingEntityWarningToken.toLowerCase();
    const applyRemoteTxWarningTokenLower = applyRemoteTxWarningToken.toLowerCase();
    const numericEntityIdWarningTokenLower = numericEntityIdWarningToken.toLowerCase();
    const fatalWarningStateKey = '__logseqOpFatalWarnings';
    const fatalWarningPatchKey = '__logseqOpFatalWarningPatchInstalled';
    const consoleCaptureStateKey = '__logseqOpConsoleCaptureStore';
    const wsCaptureStateKey = '__logseqOpWsCaptureStore';
    const wsCapturePatchKey = '__logseqOpWsCapturePatchInstalled';
    const MAX_DIAGNOSTIC_EVENTS = 3000;
    const runStartedAtMs = Date.now();

    const chooseRunnableOperation = (requestedOperation, operableCount) => {
      if (
        requestedOperation === 'move' ||
        requestedOperation === 'delete' ||
        requestedOperation === 'indent' ||
        requestedOperation === 'moveUpDown'
      ) {
        return operableCount >= 2 ? requestedOperation : 'add';
      }
      if (
        requestedOperation === 'propertySet' ||
        requestedOperation === 'batchSetProperty' ||
        requestedOperation === 'propertyRemove' ||
        requestedOperation === 'propertyValueDelete'
      ) {
        return operableCount >= 1 ? requestedOperation : 'add';
      }
      if (
        requestedOperation === 'inlineTag' ||
        requestedOperation === 'emptyInlineTag' ||
        requestedOperation === 'pageReference' ||
        requestedOperation === 'blockReference' ||
        requestedOperation === 'templateApply'
      ) {
        return operableCount >= 1 ? requestedOperation : 'add';
      }
      if (
        requestedOperation === 'copyPaste' ||
        requestedOperation === 'copyPasteTreeToEmptyTarget'
      ) {
        return operableCount >= 1 ? requestedOperation : 'add';
      }
      return requestedOperation;
    };

    const stringifyConsoleArg = (value) => {
      if (typeof value === 'string') return value;
      try {
        return JSON.stringify(value);
      } catch (_error) {
        return String(value);
      }
    };

    const pushBounded = (target, value, max = MAX_DIAGNOSTIC_EVENTS) => {
      if (!Array.isArray(target)) return;
      target.push(value);
      if (target.length > max) {
        target.splice(0, target.length - max);
      }
    };

    const consoleCaptureStore =
      window[consoleCaptureStateKey] && typeof window[consoleCaptureStateKey] === 'object'
        ? window[consoleCaptureStateKey]
        : {};
    window[consoleCaptureStateKey] = consoleCaptureStore;
    const consoleCaptureEntry = Array.isArray(consoleCaptureStore[config.markerPrefix])
      ? consoleCaptureStore[config.markerPrefix]
      : [];
    consoleCaptureStore[config.markerPrefix] = consoleCaptureEntry;

    const wsCaptureStore =
      window[wsCaptureStateKey] && typeof window[wsCaptureStateKey] === 'object'
        ? window[wsCaptureStateKey]
        : {};
    window[wsCaptureStateKey] = wsCaptureStore;
    const wsCaptureEntry =
      wsCaptureStore[config.markerPrefix] && typeof wsCaptureStore[config.markerPrefix] === 'object'
        ? wsCaptureStore[config.markerPrefix]
        : { outbound: [], inbound: [], installed: false, installReason: null };
    wsCaptureStore[config.markerPrefix] = wsCaptureEntry;

    const installFatalWarningTrap = () => {
      const warningList = Array.isArray(window[fatalWarningStateKey])
        ? window[fatalWarningStateKey]
        : [];
      window[fatalWarningStateKey] = warningList;
      if (window[fatalWarningPatchKey]) return;
      window[fatalWarningPatchKey] = true;

      const trapMethod = (method) => {
        const original = console[method];
        if (typeof original !== 'function') return;
        console[method] = (...args) => {
          try {
            const text = args.map(stringifyConsoleArg).join(' ');
            pushBounded(consoleCaptureEntry, {
              level: method,
              text,
              createdAt: Date.now(),
            });
            const textLower = text.toLowerCase();
            if (
              textLower.includes(checksumWarningTokenLower) ||
              textLower.includes(txRejectedWarningTokenLower) ||
              textLower.includes(numericEntityIdWarningTokenLower) ||
              (
                textLower.includes(missingEntityWarningTokenLower) &&
                textLower.includes(applyRemoteTxWarningTokenLower)
              )
            ) {
              const kind = textLower.includes(checksumWarningTokenLower)
                ? 'checksum_mismatch'
                : (
                  textLower.includes(txRejectedWarningTokenLower)
                    ? 'tx_rejected'
                    : (
                      textLower.includes(numericEntityIdWarningTokenLower)
                        ? 'numeric_entity_id_in_non_transact_op'
                        : 'missing_entity_id'
                    )
                );
              warningList.push({
                kind,
                level: method,
                text,
                createdAt: Date.now(),
              });
            }
          } catch (_error) {
            // noop
          }
          return original.apply(console, args);
        };
      };

      trapMethod('warn');
      trapMethod('error');
      trapMethod('log');
    };

    const toWsText = (value) => {
      if (typeof value === 'string') return value.slice(0, 4000);
      if (value instanceof ArrayBuffer) {
        return '[ArrayBuffer byteLength=' + value.byteLength + ']';
      }
      if (typeof Blob !== 'undefined' && value instanceof Blob) {
        return '[Blob size=' + value.size + ']';
      }
      try {
        return JSON.stringify(value).slice(0, 4000);
      } catch (_error) {
        return String(value).slice(0, 4000);
      }
    };

    const installWsCapture = () => {
      try {
        if (!globalThis.WebSocket) {
          wsCaptureEntry.installed = false;
          wsCaptureEntry.installReason = 'WebSocket unavailable';
          return;
        }

        if (window[wsCapturePatchKey] !== true) {
          const OriginalWebSocket = window.WebSocket;
          const originalSend = OriginalWebSocket.prototype.send;

          OriginalWebSocket.prototype.send = function patchedSend(payload) {
            try {
              pushBounded(wsCaptureEntry.outbound, {
                createdAt: Date.now(),
                url: typeof this?.url === 'string' ? this.url : null,
                readyState: Number.isInteger(this?.readyState) ? this.readyState : null,
                payload: toWsText(payload),
              });
            } catch (_error) {
              // noop
            }
            return originalSend.call(this, payload);
          };

          window.WebSocket = function LogseqWsCapture(...args) {
            const ws = new OriginalWebSocket(...args);
            try {
              ws.addEventListener('message', (event) => {
                try {
                  pushBounded(wsCaptureEntry.inbound, {
                    createdAt: Date.now(),
                    url: typeof ws?.url === 'string' ? ws.url : null,
                    readyState: Number.isInteger(ws?.readyState) ? ws.readyState : null,
                    payload: toWsText(event?.data),
                  });
                } catch (_error) {
                  // noop
                }
              });
            } catch (_error) {
              // noop
            }
            return ws;
          };
          window.WebSocket.prototype = OriginalWebSocket.prototype;
          Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
          for (const key of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) {
            window.WebSocket[key] = OriginalWebSocket[key];
          }

          window[wsCapturePatchKey] = true;
        }

        wsCaptureEntry.installed = true;
        wsCaptureEntry.installReason = null;
      } catch (error) {
        wsCaptureEntry.installed = false;
        wsCaptureEntry.installReason = describeError(error);
      }
    };

    const latestFatalWarning = () => {
      const warningList = Array.isArray(window[fatalWarningStateKey])
        ? window[fatalWarningStateKey]
        : [];
      return warningList.length > 0 ? warningList[warningList.length - 1] : null;
    };

    const parseCreatedAtMs = (value) => {
      if (value == null) return null;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (value instanceof Date) {
        const ms = value.getTime();
        return Number.isFinite(ms) ? ms : null;
      }
      const ms = new Date(value).getTime();
      return Number.isFinite(ms) ? ms : null;
    };

    const getRtcLogList = () => {
      try {
        if (!globalThis.logseq?.api?.get_state_from_store) return [];
        const logs = logseq.api.get_state_from_store(['rtc/logs']);
        if (Array.isArray(logs) && logs.length > 0) return logs;
        const latest = logseq.api.get_state_from_store(['rtc/log']);
        return latest && typeof latest === 'object' ? [latest] : [];
      } catch (_error) {
        return [];
      }
    };

    const latestChecksumMismatchRtcLog = () => {
      try {
        const logs = getRtcLogList();
        for (let i = logs.length - 1; i >= 0; i -= 1) {
          const entry = logs[i];
          if (!entry || typeof entry !== 'object') continue;
          const createdAtMs = parseCreatedAtMs(entry['created-at'] || entry.createdAt);
          if (Number.isFinite(createdAtMs) && createdAtMs < runStartedAtMs) continue;

          const type = String(entry.type || '').toLowerCase();
          const localChecksum = String(
            entry['local-checksum'] || entry.localChecksum || entry.local_checksum || ''
          );
          const remoteChecksum = String(
            entry['remote-checksum'] || entry.remoteChecksum || entry.remote_checksum || ''
          );
          const hasMismatchType = type.includes('checksum-mismatch');
          const hasDifferentChecksums =
            localChecksum.length > 0 &&
            remoteChecksum.length > 0 &&
            localChecksum !== remoteChecksum;

          if (!hasMismatchType && !hasDifferentChecksums) continue;
          return {
            type: entry.type || null,
            messageType: entry['message-type'] || entry.messageType || null,
            localTx: entry['local-tx'] || entry.localTx || null,
            remoteTx: entry['remote-tx'] || entry.remoteTx || null,
            localChecksum,
            remoteChecksum,
            createdAt: entry['created-at'] || entry.createdAt || null,
            raw: entry,
          };
        }
        return null;
      } catch (_error) {
        return null;
      }
    };

    const latestTxRejectedRtcLog = () => {
      try {
        const logs = getRtcLogList();
        for (let i = logs.length - 1; i >= 0; i -= 1) {
          const entry = logs[i];
          if (!entry || typeof entry !== 'object') continue;
          const createdAtMs = parseCreatedAtMs(entry['created-at'] || entry.createdAt);
          if (Number.isFinite(createdAtMs) && createdAtMs < runStartedAtMs) continue;

          const type = String(entry.type || '').toLowerCase();
          if (!type.includes('tx-rejected')) continue;
          return {
            type: entry.type || null,
            messageType: entry['message-type'] || entry.messageType || null,
            reason: entry.reason || null,
            remoteTx: entry['t'] || entry.t || null,
            createdAt: entry['created-at'] || entry.createdAt || null,
            raw: entry,
          };
        }
        return null;
      } catch (_error) {
        return null;
      }
    };

    const failIfFatalSignalSeen = () => {
      const txRejectedRtcLog = latestTxRejectedRtcLog();
      if (txRejectedRtcLog) {
        throw new Error('tx rejected rtc-log detected: ' + JSON.stringify(txRejectedRtcLog));
      }
      const warning = latestFatalWarning();
      if (!warning) return;
      const details = String(warning.text || '').slice(0, 500);
      if (warning.kind === 'tx_rejected') {
        throw new Error('tx-rejected warning detected: ' + details);
      }
      if (warning.kind === 'missing_entity_id') {
        throw new Error('missing-entity-id warning detected: ' + details);
      }
      if (warning.kind === 'numeric_entity_id_in_non_transact_op') {
        throw new Error('numeric-entity-id-in-non-transact-op warning detected: ' + details);
      }
      // checksum mismatch is recorded for diagnostics but is non-fatal in simulation.
    };

    const clearFatalSignalState = () => {
      try {
        const warningList = Array.isArray(window[fatalWarningStateKey])
          ? window[fatalWarningStateKey]
          : null;
        if (warningList) {
          warningList.length = 0;
        }
      } catch (_error) {
        // noop
      }

      try {
        if (Array.isArray(consoleCaptureEntry)) {
          consoleCaptureEntry.length = 0;
        }
      } catch (_error) {
        // noop
      }

      try {
        if (Array.isArray(wsCaptureEntry?.outbound)) {
          wsCaptureEntry.outbound.length = 0;
        }
        if (Array.isArray(wsCaptureEntry?.inbound)) {
          wsCaptureEntry.inbound.length = 0;
        }
      } catch (_error) {
        // noop
      }

      try {
        if (globalThis.logseq?.api?.set_state_from_store) {
          logseq.api.set_state_from_store(['rtc/log'], null);
          logseq.api.set_state_from_store(['rtc/logs'], []);
        }
      } catch (_error) {
        // noop
      }
    };

    const withTimeout = async (promise, timeoutMs, label) => {
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        return promise;
      }
      let timer = null;
      try {
        return await Promise.race([
          promise,
          new Promise((_, reject) => {
            timer = setTimeout(() => {
              reject(new Error(label + ' timed out after ' + timeoutMs + 'ms'));
            }, timeoutMs);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    };

    const flattenBlocks = (nodes, acc = []) => {
      if (!Array.isArray(nodes)) return acc;
      for (const node of nodes) {
        if (!node) continue;
        acc.push(node);
        if (Array.isArray(node.children) && node.children.length > 0) {
          flattenBlocks(node.children, acc);
        }
      }
      return acc;
    };

    const isClientBlock = (block) =>
      typeof block?.content === 'string' && block.content.startsWith(config.markerPrefix);

    const isOperableBlock = (block) =>
      typeof block?.content === 'string' && block.content.startsWith(runPrefix);

    const isClientRootBlock = (block) =>
      typeof block?.content === 'string' && block.content === (config.markerPrefix + ' client-root');

    let operationPageName = null;

    const listPageBlocks = async () => {
      if (
        typeof operationPageName === 'string' &&
        operationPageName.length > 0 &&
        typeof logseq.api.get_page_blocks_tree === 'function'
      ) {
        const tree = await logseq.api.get_page_blocks_tree(operationPageName);
        return flattenBlocks(tree, []);
      }
      const tree = await logseq.api.get_current_page_blocks_tree();
      return flattenBlocks(tree, []);
    };

    const listOperableBlocks = async () => {
      const flattened = await listPageBlocks();
      return flattened.filter(isOperableBlock);
    };

    const listManagedBlocks = async () => {
      const operableBlocks = await listOperableBlocks();
      return operableBlocks.filter(isClientBlock);
    };

    const ensureClientRootBlock = async (anchorBlock) => {
      const existing = (await listOperableBlocks()).find(isClientRootBlock);
      if (existing?.uuid) return existing;
      const inserted = await logseq.api.insert_block(anchorBlock.uuid, config.markerPrefix + ' client-root', {
        sibling: true,
        before: false,
        focus: false,
      });

      if (!inserted?.uuid) {
        throw new Error('Failed to create client root block');
      }
      return inserted;
    };

    const pickIndentCandidate = async (blocks) => {
      for (const candidate of shuffle(blocks)) {
        const prev = await logseq.api.get_previous_sibling_block(candidate.uuid);
        if (prev?.uuid) return candidate;
      }
      return null;
    };

    const pickOutdentCandidate = async (blocks) => {
      for (const candidate of shuffle(blocks)) {
        const full = await logseq.api.get_block(candidate.uuid, { includeChildren: false });
        const parentId = full?.parent?.id;
        const pageId = full?.page?.id;
        if (parentId && pageId && parentId !== pageId) {
          return candidate;
        }
      }
      return null;
    };

    const getPreviousSiblingUuid = async (uuid) => {
      const prev = await logseq.api.get_previous_sibling_block(uuid);
      return prev?.uuid || null;
    };

    const getNextSiblingUuid = async (uuid) => {
      const next = await logseq.api.get_next_sibling_block(uuid);
      return next?.uuid || null;
    };

    const pickMoveUpDownCandidate = async (blocks, up) => {
      for (const candidate of shuffle(blocks)) {
        if (!candidate?.uuid || isClientRootBlock(candidate)) continue;
        const siblingUuid = up
          ? await getPreviousSiblingUuid(candidate.uuid)
          : await getNextSiblingUuid(candidate.uuid);
        if (siblingUuid) {
          return { candidate, siblingUuid };
        }
      }
      return null;
    };

    const ensureMoveUpDownCandidate = async (blocks, anchorBlock, opIndex, up) => {
      const existing = await pickMoveUpDownCandidate(blocks, up);
      if (existing?.candidate?.uuid) return existing;

      const baseTarget = blocks.length > 0 ? randomItem(blocks) : anchorBlock;
      const first = await logseq.api.insert_block(baseTarget.uuid, config.markerPrefix + ' move-up-down-a-' + opIndex, {
        sibling: true,
        before: false,
        focus: false,
      });
      if (!first?.uuid) {
        throw new Error('Failed to create move-up-down first block');
      }

      const second = await logseq.api.insert_block(first.uuid, config.markerPrefix + ' move-up-down-b-' + opIndex, {
        sibling: true,
        before: false,
        focus: false,
      });
      if (!second?.uuid) {
        throw new Error('Failed to create move-up-down second block');
      }

      if (up) {
        return { candidate: second, siblingUuid: first.uuid };
      }
      return { candidate: first, siblingUuid: second.uuid };
    };

    const ensureIndentCandidate = async (blocks, anchorBlock, opIndex) => {
      const existing = await pickIndentCandidate(blocks);
      if (existing?.uuid) return existing;

      const baseTarget = blocks.length > 0 ? randomItem(blocks) : anchorBlock;
      const base = await logseq.api.insert_block(baseTarget.uuid, config.markerPrefix + ' indent-base-' + opIndex, {
        sibling: true,
        before: false,
        focus: false,
      });
      if (!base?.uuid) {
        throw new Error('Failed to create indent base block');
      }

      const candidate = await logseq.api.insert_block(base.uuid, config.markerPrefix + ' indent-candidate-' + opIndex, {
        sibling: true,
        before: false,
        focus: false,
      });
      if (!candidate?.uuid) {
        throw new Error('Failed to create indent candidate block');
      }
      return candidate;
    };

    const runIndent = async (candidate) => {
      const prevUuid = await getPreviousSiblingUuid(candidate.uuid);
      if (!prevUuid) {
        throw new Error('No previous sibling for indent candidate');
      }
      await logseq.api.move_block(candidate.uuid, prevUuid, {
        before: false,
        children: true,
      });
    };

    const ensureOutdentCandidate = async (blocks, anchorBlock, opIndex) => {
      const existing = await pickOutdentCandidate(blocks);
      if (existing?.uuid) return existing;

      const candidate = await ensureIndentCandidate(blocks, anchorBlock, opIndex);
      await runIndent(candidate);
      return candidate;
    };

    const runOutdent = async (candidate) => {
      const full = await logseq.api.get_block(candidate.uuid, { includeChildren: false });
      const parentId = full?.parent?.id;
      const pageId = full?.page?.id;
      if (!parentId || !pageId || parentId === pageId) {
        throw new Error('Outdent candidate is not nested');
      }
      const parent = await logseq.api.get_block(parentId, { includeChildren: false });
      if (!parent?.uuid) {
        throw new Error('Cannot resolve parent block for outdent');
      }
      await logseq.api.move_block(candidate.uuid, parent.uuid, {
        before: false,
        children: false,
      });
    };

    const requireFunctionAtPath = (pathText, label) => {
      const parts = String(pathText || '')
        .split('.')
        .filter((part) => part.length > 0);
      let value = globalThis;
      for (const part of parts) {
        value = value ? value[part] : undefined;
      }
      if (typeof value !== 'function') {
        throw new Error(label + ' is unavailable at path: ' + pathText);
      }
      return value;
    };

    const ensureCljsInterop = () => {
      if (!globalThis.cljs?.core) {
        throw new Error('cljs.core is unavailable; cannot run full outliner-op coverage');
      }
      if (!globalThis.frontend?.db?.transact?.apply_outliner_ops) {
        throw new Error('frontend.db.transact.apply_outliner_ops is unavailable');
      }
      if (!globalThis.frontend?.db?.conn?.get_db) {
        throw new Error('frontend.db.conn.get_db is unavailable');
      }
      return globalThis.cljs.core;
    };

    let cljsInterop = null;
    const getCljsInterop = () => {
      if (cljsInterop) return cljsInterop;
      const cljsCore = ensureCljsInterop();
      const kw = (name) => cljsCore.keyword(String(name));
      const keywordizeOpts = cljsCore.PersistentArrayMap.fromArray(
        [kw('keywordize-keys'), true],
        true
      );
      cljsInterop = { cljsCore, kw, keywordizeOpts };
      return cljsInterop;
    };

    const waitForOutlinerInteropReady = async () => {
      const deadline = Date.now() + Math.max(
        Number(config.readyTimeoutMs || 0),
        45000
      );
      let lastError = null;
      while (Date.now() < deadline) {
        try {
          getCljsInterop();
          return;
        } catch (error) {
          lastError = error;
        }
        await sleep(Math.max(50, Number(config.readyPollDelayMs || 0) || 250));
      }
      throw new Error(
        'Outliner interop readiness timed out: ' +
          describeError(lastError || new Error('unknown reason'))
      );
    };

    const applyRawOutlinerOp = async (opName, args, txMetaOutlinerOp = opName) => {
      const { cljsCore, kw, keywordizeOpts } = getCljsInterop();
      const toClj = (value) => cljsCore.js__GT_clj(value, keywordizeOpts);
      const conn = frontend.db.conn.get_db(false);
      const cljArgs = toClj(args);
      const opVec = cljsCore.PersistentVector.fromArray([kw(opName), cljArgs], true);
      const opsVec = cljsCore.PersistentVector.fromArray([opVec], true);
      const txMeta = cljsCore.PersistentArrayMap.fromArray(
        [kw('outliner-op'), kw(txMetaOutlinerOp)],
        true
      );
      return frontend.db.transact.apply_outliner_ops(conn, opsVec, txMeta);
    };

    const queryEidByUuid = async (uuidText) => {
      const eid = await logseq.api.datascript_query(
        '[:find ?e . :in $ ?uuid :where [?e :block/uuid ?uuid]]',
        JSON.stringify(String(uuidText))
      );
      return Number.isInteger(eid) ? eid : null;
    };

    const queryEidByIdent = async (identKeywordText) => {
      const eid = await logseq.api.datascript_query(
        '[:find ?e . :in $ ?ident :where [?e :db/ident ?ident]]',
        String(identKeywordText)
      );
      return Number.isInteger(eid) ? eid : null;
    };

    const getEntityUuid = (entity) =>
      entity?.uuid || entity?.['block/uuid'] || entity?.block?.uuid || null;

    const runAllOutlinerOpsCoveragePass = async (anchorBlock) => {
      const opResults = [];
      const failures = [];
      const coveragePrefix = config.markerPrefix + ' outliner-op-coverage ';
      const coverageStepTimeoutMs = Math.max(
        45000,
        Number(config.opTimeoutMs || 0) * 20
      );

      const runStep = async (opName, action) => {
        const startedAt = Date.now();
        try {
          const detail = await withTimeout(
            Promise.resolve().then(action),
            coverageStepTimeoutMs,
            'outliner-op coverage step ' + opName
          );
          opResults.push({
            op: opName,
            ok: true,
            detail: detail || null,
            durationMs: Date.now() - startedAt,
          });
        } catch (error) {
          const message = describeError(error);
          opResults.push({
            op: opName,
            ok: false,
            error: message,
            durationMs: Date.now() - startedAt,
          });
          failures.push({ op: opName, error: message });
        }
      };

      const insertCoverageBlock = async (suffix, target = anchorBlock, opts = {}) =>
        logseq.api.insert_block(
          target.uuid,
          coveragePrefix + suffix,
          {
            sibling: opts.sibling ?? true,
            before: opts.before ?? false,
            focus: false,
          }
        );

      const blockA = await insertCoverageBlock('block-a');
      const blockB = await insertCoverageBlock('block-b');
      const blockC = await insertCoverageBlock('block-c');
      const blockAUuid = getEntityUuid(blockA);
      const blockBUuid = getEntityUuid(blockB);
      const blockCUuid = getEntityUuid(blockC);

      if (!blockAUuid || !blockBUuid || !blockCUuid) {
        throw new Error('Failed to create coverage blocks with UUIDs');
      }

      const blockAEid = await queryEidByUuid(blockAUuid);
      const blockBEid = await queryEidByUuid(blockBUuid);
      const blockCEid = await queryEidByUuid(blockCUuid);
      if (!Number.isInteger(blockAEid) || !Number.isInteger(blockBEid) || !Number.isInteger(blockCEid)) {
        throw new Error('Failed to resolve coverage block entity ids');
      }

      const propertyName = (config.markerPrefix + 'cov-prop-' + Date.now())
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-');
      const tagName = (config.markerPrefix + 'cov-tag-' + Date.now())
        .replace(/[^a-zA-Z0-9_-]+/g, '-');
      const pageBaseName = (config.markerPrefix + 'cov-page-' + Date.now())
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-');

      const propertyEntity = await logseq.api.upsert_property(
        propertyName,
        { type: 'default', cardinality: 'many' },
        {}
      );
      const propertyUuid = getEntityUuid(propertyEntity) || getEntityUuid(await logseq.api.get_property(propertyName));
      if (!propertyUuid) {
        throw new Error('Failed to resolve coverage property uuid');
      }
      const propertyEid = await queryEidByUuid(propertyUuid);
      if (!Number.isInteger(propertyEid)) {
        throw new Error('Failed to resolve coverage property entity id');
      }

      const tagEntity = await logseq.api.create_tag(tagName, {});
      const tagUuid = getEntityUuid(tagEntity);
      if (!tagUuid) {
        throw new Error('Failed to resolve coverage tag uuid');
      }
      const tagEid = await queryEidByUuid(tagUuid);
      if (!Number.isInteger(tagEid)) {
        throw new Error('Failed to resolve coverage tag entity id');
      }

      const blockTagsEid = await queryEidByIdent(':block/tags');
      if (!Number.isInteger(blockTagsEid)) {
        throw new Error('Failed to resolve :block/tags entity id');
      }

      const templateRoot = await insertCoverageBlock('template-root');
      const templateRootUuid = getEntityUuid(templateRoot);
      if (!templateRootUuid) {
        throw new Error('Failed to create template root block');
      }
      const templateChild = await logseq.api.insert_block(
        templateRootUuid,
        coveragePrefix + 'template-child',
        { sibling: false, before: false, focus: false }
      );
      if (!getEntityUuid(templateChild)) {
        throw new Error('Failed to create template child block');
      }
      const templateRootEid = await queryEidByUuid(templateRootUuid);
      if (!Number.isInteger(templateRootEid)) {
        throw new Error('Failed to resolve template root entity id');
      }

      const restoreRecycled = requireFunctionAtPath(
        'frontend.handler.page.restore_recycled_BANG_',
        'restore recycled handler'
      );
      const deleteRecycledPermanently = requireFunctionAtPath(
        'frontend.handler.page.delete_recycled_permanently_BANG_',
        'recycle delete permanently handler'
      );

      await runStep('save-block', async () => {
        await applyRawOutlinerOp('save-block', [
          {
            'block/uuid': blockAUuid,
            'block/title': coveragePrefix + 'save-block',
          },
          {},
        ]);
      });

      await runStep('insert-blocks', async () => {
        await logseq.api.insert_block(blockAUuid, coveragePrefix + 'insert-blocks', {
          sibling: true,
          before: false,
          focus: false,
        });
      });

      await runStep('apply-template', async () => {
        await applyRawOutlinerOp('apply-template', [
          templateRootEid,
          blockBEid,
          { sibling: true },
        ]);
      });

      await runStep('move-blocks', async () => {
        await applyRawOutlinerOp('move-blocks', [
          [blockAEid],
          blockBEid,
          { sibling: true },
        ]);
      });

      await runStep('move-blocks-up-down', async () => {
        await applyRawOutlinerOp('move-blocks-up-down', [[blockBEid], true]);
      });

      await runStep('indent-outdent-blocks', async () => {
        await applyRawOutlinerOp('indent-outdent-blocks', [[blockCEid], true, {}]);
      });

      await runStep('delete-blocks', async () => {
        await logseq.api.remove_block(blockCUuid);
      });

      await runStep('upsert-property', async () => {
        await logseq.api.upsert_property(
          propertyName,
          { type: 'default', cardinality: 'many' },
          { properties: { description: coveragePrefix + 'upsert-property' } }
        );
      });

      await runStep('set-block-property', async () => {
        await logseq.api.upsert_block_property(blockAUuid, propertyName, coveragePrefix + 'set-block-property', {});
      });

      await runStep('batch-set-property', async () => {
        await applyRawOutlinerOp('batch-set-property', [
          [blockAEid, blockBEid],
          propertyEid,
          coveragePrefix + 'batch-set-property',
          {},
        ]);
      });

      await runStep('batch-remove-property', async () => {
        await applyRawOutlinerOp('batch-remove-property', [
          [blockAEid, blockBEid],
          propertyEid,
        ]);
      });

      await runStep('remove-block-property', async () => {
        await logseq.api.remove_block_property(blockAUuid, propertyName);
      });

      await runStep('delete-property-value', async () => {
        await logseq.api.add_block_tag(blockAUuid, tagUuid);
        await logseq.api.remove_block_tag(blockAUuid, tagUuid);
      });

      await runStep('batch-delete-property-value', async () => {
        await logseq.api.add_block_tag(blockAUuid, tagUuid);
        await logseq.api.add_block_tag(blockBUuid, tagUuid);
        await applyRawOutlinerOp('batch-delete-property-value', [
          [blockAEid, blockBEid],
          blockTagsEid,
          tagEid,
        ]);
      });

      await runStep('create-property-text-block', async () => {
        await applyRawOutlinerOp('create-property-text-block', [
          blockAEid,
          propertyEid,
          coveragePrefix + 'property-text-value',
          {},
        ]);
      });

      await runStep('collapse-expand-block-property', async () => {
        await applyRawOutlinerOp('collapse-expand-block-property', [
          blockAEid,
          propertyEid,
          true,
        ]);
        await applyRawOutlinerOp('collapse-expand-block-property', [
          blockAEid,
          propertyEid,
          false,
        ]);
      });

      const closedValueText = coveragePrefix + 'closed-choice';
      await runStep('upsert-closed-value', async () => {
        await applyRawOutlinerOp('upsert-closed-value', [
          propertyEid,
          { value: closedValueText },
        ]);
      });

      await runStep('delete-closed-value', async () => {
        const valueBlockEid = await logseq.api.datascript_query(
          '[:find ?e . :in $ ?property-id ?value :where [?e :block/closed-value-property ?property-id] (or [?e :block/title ?value] [?e :logseq.property/value ?value])]',
          String(propertyEid),
          JSON.stringify(closedValueText)
        );
        if (!Number.isInteger(valueBlockEid)) {
          throw new Error('Failed to find closed value block eid for delete-closed-value');
        }
        await applyRawOutlinerOp('delete-closed-value', [propertyEid, valueBlockEid]);
      });

      await runStep('add-existing-values-to-closed-values', async () => {
        await applyRawOutlinerOp('add-existing-values-to-closed-values', [
          propertyEid,
          [blockBUuid],
        ]);
      });

      await runStep('class-add-property', async () => {
        await logseq.api.add_tag_property(tagUuid, propertyName);
      });

      await runStep('class-remove-property', async () => {
        await logseq.api.remove_tag_property(tagUuid, propertyName);
      });

      await runStep('toggle-reaction', async () => {
        await applyRawOutlinerOp('toggle-reaction', [blockAUuid, 'thumbsup', null]);
      });

      await runStep('transact', async () => {
        await applyRawOutlinerOp('transact', [
          [
            {
              'db/id': blockAEid,
              'block/title': coveragePrefix + 'transact-title',
            },
          ],
          null,
        ]);
      });

      let coveragePageUuid = null;
      await runStep('create-page', async () => {
        const page = await logseq.api.create_page(pageBaseName, null, { redirect: false });
        coveragePageUuid = getEntityUuid(page) || getEntityUuid(await logseq.api.get_page(pageBaseName));
        if (!coveragePageUuid) {
          throw new Error('Failed to create coverage page');
        }
      });

      const renamedPageName = pageBaseName + '-renamed';
      await runStep('rename-page', async () => {
        if (!coveragePageUuid) {
          throw new Error('Coverage page UUID missing before rename-page');
        }
        await logseq.api.rename_page(coveragePageUuid, renamedPageName);
      });

      await runStep('delete-page', async () => {
        await logseq.api.delete_page(renamedPageName);
      });

      await runStep('batch-import-edn', async () => {
        // Use a minimal payload to exercise the outliner-op path without running
        // a full export/import cycle that can reopen sqlite resources.
        const result = await applyRawOutlinerOp('batch-import-edn', [{}, {}]);
        return {
          returnedError: result?.error || null,
        };
      });

      await runStep('recycle-delete-permanently', async () => {
        const recyclePageName = pageBaseName + '-perm-delete';
        const page = await logseq.api.create_page(recyclePageName, null, { redirect: false });
        const pageUuid = getEntityUuid(page) || getEntityUuid(await logseq.api.get_page(recyclePageName));
        if (!pageUuid) {
          throw new Error('Failed to create recycle-delete-permanently page');
        }
        await logseq.api.delete_page(recyclePageName);
        await deleteRecycledPermanently(pageUuid);
      });

      await runStep('restore-recycled', async () => {
        const recyclePageName = pageBaseName + '-restore';
        const page = await logseq.api.create_page(recyclePageName, null, { redirect: false });
        const pageUuid = getEntityUuid(page) || getEntityUuid(await logseq.api.get_page(recyclePageName));
        if (!pageUuid) {
          throw new Error('Failed to create restore-recycled page');
        }
        await logseq.api.delete_page(recyclePageName);
        await restoreRecycled(pageUuid);
      });

      const coveredOps = Array.from(new Set(opResults.map((entry) => entry.op)));
      const missingOps = expectedOutlinerOps.filter((op) => !coveredOps.includes(op));
      const unexpectedOps = coveredOps.filter((op) => !expectedOutlinerOps.includes(op));
      for (const op of missingOps) {
        failures.push({ op, error: 'op coverage missing from runAllOutlinerOpsCoveragePass' });
      }
      for (const op of unexpectedOps) {
        failures.push({ op, error: 'unexpected op recorded during coverage pass' });
      }

      const summary = {
        ok: failures.length === 0,
        total: opResults.length,
        passed: opResults.length - failures.length,
        failed: failures.length,
        stepTimeoutMs: coverageStepTimeoutMs,
        expectedOps: expectedOutlinerOps,
        coveredOps,
        missingOps,
        unexpectedOps,
        failedOps: failures,
        sample: opResults.slice(0, 50),
      };

      if (failures.length > 0) {
        throw new Error(
          'Full outliner-op coverage failed: ' + JSON.stringify(summary.failedOps.slice(0, 5))
        );
      }

      return summary;
    };

    const pickRandomGroup = (blocks, minSize = 1, maxSize = 3) => {
      const pool = shuffle(blocks);
      const lower = Math.max(1, Math.min(minSize, pool.length));
      const upper = Math.max(lower, Math.min(maxSize, pool.length));
      const size = lower + Math.floor(nextRandom() * (upper - lower + 1));
      return pool.slice(0, size);
    };

    const toBatchTree = (block) => ({
      content: typeof block?.content === 'string' ? block.content : '',
      children: Array.isArray(block?.children) ? block.children.map(toBatchTree) : [],
    });

    const getAnchor = async () => {
      const deadline = Date.now() + config.readyTimeoutMs;
      let lastError = null;

      while (Date.now() < deadline) {
        try {
          if (typeof logseq.api.get_today_page === 'function') {
            const todayPage = await logseq.api.get_today_page();
            const todayPageName = asPageName(todayPage);
            if (todayPageName) {
              operationPageName = todayPageName;
              const seeded = await logseq.api.append_block_in_page(
                todayPageName,
                config.markerPrefix + ' anchor',
                {}
              );
              if (seeded?.uuid) return seeded;
            }
          }

          if (typeof logseq.api.get_current_page === 'function') {
            const currentPage = await logseq.api.get_current_page();
            const currentPageName = asPageName(currentPage);
            if (currentPageName) {
              operationPageName = currentPageName;
              const seeded = await logseq.api.append_block_in_page(
                currentPageName,
                config.markerPrefix + ' anchor',
                {}
              );
              if (seeded?.uuid) return seeded;
            }
          }

          const currentBlock = await logseq.api.get_current_block();
          if (currentBlock && currentBlock.uuid) {
            return currentBlock;
          }

          {
            operationPageName = config.fallbackPageName;
            const seeded = await logseq.api.append_block_in_page(
              config.fallbackPageName,
              config.markerPrefix + ' anchor',
              {}
            );
            if (seeded?.uuid) return seeded;
          }
        } catch (error) {
          lastError = error;
        }

        await sleep(config.readyPollDelayMs);
      }

      if (lastError) {
        throw new Error('Unable to resolve anchor block: ' + describeError(lastError));
      }
      throw new Error('Unable to resolve anchor block: open a graph and page, then retry');
    };

    const parseRtcTxText = (text) => {
      if (typeof text !== 'string' || text.length === 0) return null;
      const localMatch = text.match(/:local-tx\\s+(-?\\d+)/);
      const remoteMatch = text.match(/:remote-tx\\s+(-?\\d+)/);
      if (!localMatch || !remoteMatch) return null;
      return {
        localTx: Number.parseInt(localMatch[1], 10),
        remoteTx: Number.parseInt(remoteMatch[1], 10),
      };
    };

    const readRtcTx = () => {
      const node = document.querySelector('[data-testid="rtc-tx"]');
      if (!node) return null;
      return parseRtcTxText((node.textContent || '').trim());
    };

    const waitForRtcSettle = async () => {
      const deadline = Date.now() + config.syncSettleTimeoutMs;
      let stableHits = 0;
      let last = null;
      while (Date.now() < deadline) {
        const current = readRtcTx();
        if (current && Number.isFinite(current.localTx) && Number.isFinite(current.remoteTx)) {
          last = current;
          if (current.localTx === current.remoteTx) {
            stableHits += 1;
            if (stableHits >= 3) return { ok: true, ...current };
          } else {
            stableHits = 0;
          }
        }
        await sleep(250);
      }
      return { ok: false, ...(last || {}), reason: 'rtc-tx did not settle before timeout' };
    };

    const extractNotificationTexts = () =>
      Array.from(
        document.querySelectorAll('.ui__notifications-content .text-sm.leading-5.font-medium.whitespace-pre-line')
      )
        .map((el) => (el.textContent || '').trim())
        .filter(Boolean);

    const parseChecksumNotification = (text) => {
      if (typeof text !== 'string' || !text.includes('Checksum recomputed.')) return null;
      const match = text.match(
        /Recomputed:\\s*([0-9a-fA-F]{16})\\s*,\\s*local:\\s*([^,]+)\\s*,\\s*remote:\\s*([^,\\.]+)/
      );
      if (!match) {
        return {
          raw: text,
          parsed: false,
          reason: 'notification did not match expected checksum format',
        };
      }
      const normalize = (value) => {
        const trimmed = String(value || '').trim();
        if (trimmed === '<nil>') return null;
        return trimmed;
      };
      const recomputed = normalize(match[1]);
      const local = normalize(match[2]);
      const remote = normalize(match[3]);
      const localMatches = recomputed === local;
      const remoteMatches = recomputed === remote;
      const localRemoteMatch = local === remote;
      return {
        raw: text,
        parsed: true,
        recomputed,
        local,
        remote,
        localMatches,
        remoteMatches,
        localRemoteMatch,
        matched: localMatches && remoteMatches && localRemoteMatch,
      };
    };

    const runChecksumDiagnostics = async () => {
      const settle = await waitForRtcSettle();
      if (!settle.ok) {
        return {
          ok: false,
          settle,
          reason: settle.reason || 'sync did not settle',
        };
      }

      const before = new Set(extractNotificationTexts());
      const commandCandidates = ['dev/recompute-checksum', ':dev/recompute-checksum'];
      let invoked = null;
      let invokeError = null;

      for (const command of commandCandidates) {
        try {
          await logseq.api.invoke_external_command(command);
          invoked = command;
          invokeError = null;
          break;
        } catch (error) {
          invokeError = error;
        }
      }

      if (!invoked) {
        return {
          ok: false,
          settle,
          reason: 'failed to invoke checksum command',
          error: describeError(invokeError),
        };
      }

      const deadline = Date.now() + Math.max(10000, config.readyTimeoutMs);
      let seen = null;
      while (Date.now() < deadline) {
        const current = extractNotificationTexts();
        for (const text of current) {
          if (before.has(text)) continue;
          const parsed = parseChecksumNotification(text);
          if (parsed) {
            return {
              ok: Boolean(parsed.matched),
              settle,
              invoked,
              ...parsed,
            };
          }
          seen = text;
        }
        await sleep(250);
      }

      return {
        ok: false,
        settle,
        invoked,
        reason: 'checksum notification not found before timeout',
        seen,
      };
    };

    const replayCaptureEnabled = config.captureReplay !== false;
    const replayCaptureStoreKey = '__logseqOpReplayCaptureStore';
    const replayAttrByNormalizedName = {
      uuid: ':block/uuid',
      title: ':block/title',
      name: ':block/name',
      parent: ':block/parent',
      page: ':block/page',
      order: ':block/order',
    };
    const replayCaptureState = {
      installed: false,
      installReason: null,
      enabled: false,
      currentOpIndex: null,
      txLog: [],
    };
    const replayCaptureStoreRoot =
      window[replayCaptureStoreKey] && typeof window[replayCaptureStoreKey] === 'object'
        ? window[replayCaptureStoreKey]
        : {};
    window[replayCaptureStoreKey] = replayCaptureStoreRoot;
    const replayCaptureStoreEntry =
      replayCaptureStoreRoot[config.markerPrefix] &&
      typeof replayCaptureStoreRoot[config.markerPrefix] === 'object'
        ? replayCaptureStoreRoot[config.markerPrefix]
        : {};
    replayCaptureStoreEntry.markerPrefix = config.markerPrefix;
    replayCaptureStoreEntry.updatedAt = Date.now();
    replayCaptureStoreEntry.initialDb = null;
    replayCaptureStoreEntry.opLog = [];
    replayCaptureStoreEntry.txCapture = {
      enabled: replayCaptureEnabled,
      installed: false,
      installReason: null,
      totalTx: 0,
      txLog: [],
    };
    replayCaptureStoreRoot[config.markerPrefix] = replayCaptureStoreEntry;

    const readAny = (value, keys) => {
      if (!value || typeof value !== 'object') return undefined;
      for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          return value[key];
        }
      }
      return undefined;
    };

    const normalizeReplayAttr = (value) => {
      if (typeof value !== 'string') return null;
      const text = value.trim();
      if (!text) return null;
      if (text.startsWith(':')) {
        return text;
      }
      if (text.includes('/')) {
        return ':' + text;
      }
      return replayAttrByNormalizedName[text] || null;
    };

    const normalizeReplayDatom = (datom) => {
      if (!datom || typeof datom !== 'object') return null;
      const eRaw = readAny(datom, ['e', ':e']);
      const aRaw = readAny(datom, ['a', ':a']);
      const vRaw = readAny(datom, ['v', ':v']);
      const addedRaw = readAny(datom, ['added', ':added']);
      const e = Number(eRaw);
      if (!Number.isInteger(e)) return null;
      const attr = normalizeReplayAttr(typeof aRaw === 'string' ? aRaw : String(aRaw || ''));
      if (!attr) return null;
      let v = vRaw;
      if (attr === ':block/uuid' && typeof vRaw === 'string') {
        v = vRaw;
      } else if ((attr === ':block/parent' || attr === ':block/page') && Number.isFinite(Number(vRaw))) {
        v = Number(vRaw);
      }
      return {
        e,
        a: attr,
        v,
        added: addedRaw !== false,
      };
    };

    const installReplayTxCapture = () => {
      if (!replayCaptureEnabled) {
        replayCaptureState.installReason = 'disabled by config';
        replayCaptureStoreEntry.txCapture.installReason = replayCaptureState.installReason;
        return;
      }
      const core = window.LSPluginCore;
      if (!core || typeof core.hookDb !== 'function') {
        replayCaptureState.installReason = 'LSPluginCore.hookDb unavailable';
        replayCaptureStoreEntry.txCapture.installReason = replayCaptureState.installReason;
        return;
      }
      const sinkKey = '__logseqOpReplayCaptureSinks';
      const patchInstalledKey = '__logseqOpReplayCapturePatchInstalled';
      const sinks = Array.isArray(window[sinkKey]) ? window[sinkKey] : [];
      window[sinkKey] = sinks;

      const sink = (type, payload) => {
        try {
          if (replayCaptureState.enabled && String(type || '') === 'changed' && payload && typeof payload === 'object') {
            const rawDatoms = readAny(payload, ['txData', ':tx-data', 'tx-data', 'tx_data']);
            const datoms = Array.isArray(rawDatoms)
              ? rawDatoms.map(normalizeReplayDatom).filter(Boolean)
              : [];
            if (datoms.length > 0) {
              const entry = {
                capturedAt: Date.now(),
                opIndex: Number.isInteger(replayCaptureState.currentOpIndex)
                  ? replayCaptureState.currentOpIndex
                  : null,
                datoms,
              };
              replayCaptureState.txLog.push(entry);
              replayCaptureStoreEntry.txCapture.txLog.push(entry);
              replayCaptureStoreEntry.txCapture.totalTx = replayCaptureStoreEntry.txCapture.txLog.length;
              replayCaptureStoreEntry.updatedAt = Date.now();
            }
          }
        } catch (_error) {
          // keep capture best-effort
        }
      };
      sinks.push(sink);

      if (window[patchInstalledKey] !== true) {
        const original = core.hookDb.bind(core);
        core.hookDb = (type, payload, pluginId) => {
          try {
            const listeners = Array.isArray(window[sinkKey]) ? window[sinkKey] : [];
            for (const listener of listeners) {
              if (typeof listener === 'function') {
                listener(type, payload);
              }
            }
          } catch (_error) {
            // keep hook best-effort
          }
          return original(type, payload, pluginId);
        };
        window[patchInstalledKey] = true;
      }

      replayCaptureState.installed = true;
      replayCaptureState.enabled = true;
      replayCaptureState.installReason = null;
      replayCaptureStoreEntry.txCapture.installed = true;
      replayCaptureStoreEntry.txCapture.enabled = true;
      replayCaptureStoreEntry.txCapture.installReason = null;
      replayCaptureStoreEntry.updatedAt = Date.now();
    };

    const flattenAnyObjects = (value, acc = []) => {
      if (Array.isArray(value)) {
        for (const item of value) flattenAnyObjects(item, acc);
        return acc;
      }
      if (value && typeof value === 'object') {
        acc.push(value);
      }
      return acc;
    };

    const normalizeSnapshotBlock = (block) => {
      if (!block || typeof block !== 'object') return null;
      const id = Number(readAny(block, ['id', 'db/id', ':db/id']));
      const uuid = readAny(block, ['uuid', 'block/uuid', ':block/uuid']);
      if (!Number.isInteger(id) || typeof uuid !== 'string' || uuid.length === 0) return null;
      const parent = readAny(block, ['parent', 'block/parent', ':block/parent']);
      const page = readAny(block, ['page', 'block/page', ':block/page']);
      const parentId = Number(readAny(parent, ['id', 'db/id', ':db/id']));
      const pageId = Number(readAny(page, ['id', 'db/id', ':db/id']));
      const title = readAny(block, ['title', 'block/title', ':block/title']);
      const name = readAny(block, ['name', 'block/name', ':block/name']);
      const order = readAny(block, ['order', 'block/order', ':block/order']);
      return {
        id,
        uuid,
        parentId: Number.isInteger(parentId) ? parentId : null,
        pageId: Number.isInteger(pageId) ? pageId : null,
        title: typeof title === 'string' ? title : null,
        name: typeof name === 'string' ? name : null,
        order: typeof order === 'string' ? order : null,
      };
    };

    const captureInitialDbSnapshot = async () => {
      if (!replayCaptureEnabled) {
        return {
          ok: false,
          reason: 'disabled by config',
          blockCount: 0,
          blocks: [],
        };
      }
      if (typeof logseq.api.datascript_query !== 'function') {
        return {
          ok: false,
          reason: 'datascript_query API unavailable',
          blockCount: 0,
          blocks: [],
        };
      }

      try {
        const query = '[:find (pull ?b [:db/id :block/uuid :block/title :block/name :block/order {:block/parent [:db/id :block/uuid]} {:block/page [:db/id :block/uuid]}]) :where [?b :block/uuid]]';
        const raw = await logseq.api.datascript_query(query);
        const objects = flattenAnyObjects(raw, []);
        const blocks = objects
          .map(normalizeSnapshotBlock)
          .filter(Boolean);
        const dedup = new Map();
        for (const block of blocks) {
          dedup.set(block.id, block);
        }
        const normalized = Array.from(dedup.values())
          .sort((a, b) => a.id - b.id);
        return {
          ok: true,
          blockCount: normalized.length,
          blocks: normalized,
        };
      } catch (error) {
        return {
          ok: false,
          reason: describeError(error),
          blockCount: 0,
          blocks: [],
        };
      }
    };

    const snapshotBlocksToStateMap = (blocks) => {
      const stateMap = new Map();
      if (!Array.isArray(blocks)) return stateMap;
      for (const block of blocks) {
        if (!block || typeof block !== 'object') continue;
        const id = Number(block.id);
        if (!Number.isInteger(id)) continue;
        stateMap.set(id, {
          id,
          uuid: typeof block.uuid === 'string' ? block.uuid : null,
          title: typeof block.title === 'string' ? block.title : null,
          name: typeof block.name === 'string' ? block.name : null,
          order: typeof block.order === 'string' ? block.order : null,
          parentId: Number.isInteger(block.parentId) ? block.parentId : null,
          pageId: Number.isInteger(block.pageId) ? block.pageId : null,
        });
      }
      return stateMap;
    };

    const captureChecksumStateMap = async () => {
      const snapshot = await captureInitialDbSnapshot();
      return {
        ok: snapshot.ok === true,
        reason: snapshot.reason || null,
        state: snapshotBlocksToStateMap(snapshot.blocks),
      };
    };

    const replayDatomEntriesFromStateDiff = (beforeMap, afterMap) => {
      const datoms = [];
      const allIds = new Set();
      for (const id of beforeMap.keys()) allIds.add(id);
      for (const id of afterMap.keys()) allIds.add(id);

      const scalarAttrs = [
        ['uuid', ':block/uuid'],
        ['title', ':block/title'],
        ['name', ':block/name'],
        ['order', ':block/order'],
      ];
      const refAttrs = [
        ['parentId', ':block/parent'],
        ['pageId', ':block/page'],
      ];

      for (const id of allIds) {
        const before = beforeMap.get(id) || null;
        const after = afterMap.get(id) || null;

        for (const [key, attr] of scalarAttrs) {
          const beforeValue = before ? before[key] : null;
          const afterValue = after ? after[key] : null;
          if (beforeValue === afterValue) continue;
          if (typeof beforeValue === 'string') {
            datoms.push({ e: id, a: attr, v: beforeValue, added: false });
          }
          if (typeof afterValue === 'string') {
            datoms.push({ e: id, a: attr, v: afterValue, added: true });
          }
        }

        for (const [key, attr] of refAttrs) {
          const beforeValue = before ? before[key] : null;
          const afterValue = after ? after[key] : null;
          if (beforeValue === afterValue) continue;
          if (Number.isInteger(beforeValue)) {
            datoms.push({ e: id, a: attr, v: beforeValue, added: false });
          }
          if (Number.isInteger(afterValue)) {
            datoms.push({ e: id, a: attr, v: afterValue, added: true });
          }
        }
      }

      return datoms;
    };

    const counts = {
      add: 0,
      save: 0,
      inlineTag: 0,
      emptyInlineTag: 0,
      pageReference: 0,
      blockReference: 0,
      propertySet: 0,
      batchSetProperty: 0,
      propertyRemove: 0,
      propertyValueDelete: 0,
      templateApply: 0,
      delete: 0,
      move: 0,
      moveUpDown: 0,
      indent: 0,
      outdent: 0,
      undo: 0,
      redo: 0,
      copyPaste: 0,
      copyPasteTreeToEmptyTarget: 0,
      fallbackAdd: 0,
      errors: 0,
    };

    const errors = [];
    const operationLog = [];
    const phaseTimeoutMs = Math.max(5000, Number(config.readyTimeoutMs || 0) + 5000);
    const opReadTimeoutMs = Math.max(2000, Number(config.opTimeoutMs || 0) * 2);

    installFatalWarningTrap();
    installWsCapture();
    clearFatalSignalState();

    await withTimeout(waitForEditorReady(), phaseTimeoutMs, 'waitForEditorReady');
    failIfFatalSignalSeen();
    const anchor = await withTimeout(getAnchor(), phaseTimeoutMs, 'getAnchor');
    await withTimeout(ensureClientRootBlock(anchor), phaseTimeoutMs, 'ensureClientRootBlock');

    installReplayTxCapture();

    const initialManaged = await withTimeout(listManagedBlocks(), phaseTimeoutMs, 'listManagedBlocks');
    if (!initialManaged.length) {
      await withTimeout(
        logseq.api.insert_block(anchor.uuid, config.markerPrefix + ' seed', {
          sibling: true,
          before: false,
          focus: false,
        }),
        phaseTimeoutMs,
        'insert seed block'
      );
    }

    let outlinerOpCoverage = null;
    try {
      outlinerOpCoverage = await withTimeout(
        (async () => {
          await waitForOutlinerInteropReady();
          return runAllOutlinerOpsCoveragePass(anchor);
        })(),
        Math.max(900000, phaseTimeoutMs * 6),
        'runAllOutlinerOpsCoveragePass'
      );
    } catch (error) {
      const reason = describeError(error);
      outlinerOpCoverage = {
        ok: false,
        total: 0,
        passed: 0,
        failed: expectedOutlinerOps.length,
        stepTimeoutMs: null,
        expectedOps: [...expectedOutlinerOps],
        coveredOps: [],
        missingOps: [...expectedOutlinerOps],
        unexpectedOps: [],
        failedOps: expectedOutlinerOps.map((op) => ({ op, error: reason })),
        sample: expectedOutlinerOps.map((op) => ({
          op,
          ok: false,
          error: reason,
          durationMs: 0,
        })),
        reason,
      };
    }

    const propertyOpsState = {
      propertyName: (config.markerPrefix + 'sim-prop').toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      tagName: (config.markerPrefix + 'sim-tag').replace(/[^a-zA-Z0-9_-]+/g, '-'),
      propertyUuid: null,
      propertyEid: null,
      tagUuid: null,
      ready: false,
    };

    const ensurePropertyOpsReady = async () => {
      if (
        propertyOpsState.ready &&
        propertyOpsState.tagUuid &&
        Number.isInteger(propertyOpsState.propertyEid)
      ) {
        return propertyOpsState;
      }
      const propertyEntity = await logseq.api.upsert_property(
        propertyOpsState.propertyName,
        { type: 'default', cardinality: 'many' },
        {}
      );
      const propertyUuid =
        getEntityUuid(propertyEntity) ||
        getEntityUuid(await logseq.api.get_property(propertyOpsState.propertyName));
      if (!propertyUuid) {
        throw new Error('Failed to resolve property-op property uuid');
      }
      const propertyEid = await queryEidByUuid(propertyUuid);
      if (!Number.isInteger(propertyEid)) {
        throw new Error('Failed to resolve property-op property eid');
      }
      const tag = await logseq.api.create_tag(propertyOpsState.tagName, {});
      const tagUuid =
        tag?.uuid ||
        tag?.['block/uuid'] ||
        tag?.block?.uuid ||
        null;
      if (!tagUuid) {
        throw new Error('Failed to create property-op tag');
      }
      propertyOpsState.propertyUuid = propertyUuid;
      propertyOpsState.propertyEid = propertyEid;
      propertyOpsState.tagUuid = tagUuid;
      propertyOpsState.ready = true;
      return propertyOpsState;
    };

    const templateOpsState = {
      templateRootUuid: null,
      templateRootEid: null,
      ready: false,
    };

    const ensureTemplateOpsReady = async () => {
      if (templateOpsState.ready && templateOpsState.templateRootUuid) {
        const existing = await logseq.api.get_block(templateOpsState.templateRootUuid, { includeChildren: false });
        if (existing?.uuid && Number.isInteger(templateOpsState.templateRootEid)) {
          return templateOpsState;
        }
      }

      const templateRoot = await logseq.api.insert_block(anchor.uuid, config.markerPrefix + ' template-root', {
        sibling: true,
        before: false,
        focus: false,
      });
      const templateRootUuid = getEntityUuid(templateRoot);
      if (!templateRootUuid) {
        throw new Error('Failed to create template root block');
      }

      const templateChild = await logseq.api.insert_block(
        templateRootUuid,
        config.markerPrefix + ' template-child',
        { sibling: false, before: false, focus: false }
      );
      if (!getEntityUuid(templateChild)) {
        throw new Error('Failed to create template child block');
      }

      const templateRootEid = await queryEidByUuid(templateRootUuid);
      if (!Number.isInteger(templateRootEid)) {
        throw new Error('Failed to resolve template root eid');
      }

      templateOpsState.templateRootUuid = templateRootUuid;
      templateOpsState.templateRootEid = templateRootEid;
      templateOpsState.ready = true;
      return templateOpsState;
    };

    const initialDb = await withTimeout(
      captureInitialDbSnapshot(),
      phaseTimeoutMs,
      'captureInitialDbSnapshot'
    );
    replayCaptureStoreEntry.initialDb = initialDb;
    replayCaptureStoreEntry.updatedAt = Date.now();
    let replaySnapshotState = {
      ok: initialDb?.ok === true,
      reason: initialDb?.reason || null,
      state: snapshotBlocksToStateMap(initialDb?.blocks),
    };

    const appendReplayFallbackTxFromSnapshot = async (opIndex) => {
      if (!replayCaptureEnabled) return;
      const nextSnapshot = await captureChecksumStateMap();
      if (!nextSnapshot || nextSnapshot.ok !== true || !nextSnapshot.state) {
        replaySnapshotState = nextSnapshot;
        return;
      }
      if (!replaySnapshotState || replaySnapshotState.ok !== true || !replaySnapshotState.state) {
        replaySnapshotState = nextSnapshot;
        return;
      }
      const alreadyCaptured = replayCaptureState.txLog.some((entry) => entry?.opIndex === opIndex);
      const datoms = replayDatomEntriesFromStateDiff(replaySnapshotState.state, nextSnapshot.state);
      if (!alreadyCaptured && datoms.length > 0) {
        const entry = {
          capturedAt: Date.now(),
          opIndex,
          source: 'snapshot-diff',
          datoms,
        };
        replayCaptureState.txLog.push(entry);
        replayCaptureStoreEntry.txCapture.txLog.push(entry);
        replayCaptureStoreEntry.txCapture.totalTx = replayCaptureStoreEntry.txCapture.txLog.length;
        replayCaptureStoreEntry.updatedAt = Date.now();
      }
      replaySnapshotState = nextSnapshot;
    };

    let executed = 0;

    for (let i = 0; i < config.plan.length; i += 1) {
      failIfFatalSignalSeen();
      const requested = config.plan[i];
      const operable = await withTimeout(
        listOperableBlocks(),
        opReadTimeoutMs,
        'listOperableBlocks before operation'
      );
      let operation = chooseRunnableOperation(requested, operable.length);
      if (operation !== requested) {
        counts.fallbackAdd += 1;
      }

      try {
        await sleep(Math.floor(nextRandom() * 10));
        replayCaptureState.currentOpIndex = i;

        const runOperation = async () => {
          if (operation === 'add') {
            const target = operable.length > 0 ? randomItem(operable) : anchor;
            const content = nextRandom() < 0.2 ? '' : config.markerPrefix + ' add-' + i;
            const asChild = operable.length > 0 && nextRandom() < 0.35;
            const inserted = await logseq.api.insert_block(target.uuid, content, {
              sibling: !asChild,
              before: false,
              focus: false,
            });
            return {
              kind: 'add',
              targetUuid: target.uuid || null,
              insertedUuid: inserted?.uuid || null,
              content,
              sibling: !asChild,
              before: false,
            };
          }

          if (operation === 'save') {
            let candidate = randomItem(
              operable.filter((block) => block?.uuid && !isClientRootBlock(block))
            );
            if (!candidate?.uuid) {
              const target = operable.length > 0 ? randomItem(operable) : anchor;
              candidate = await logseq.api.insert_block(target.uuid, config.markerPrefix + ' save-target-' + i, {
                sibling: true,
                before: false,
                focus: false,
              });
              if (!candidate?.uuid) {
                throw new Error('Failed to create save candidate block');
              }
            }
            const latest = await logseq.api.get_block(candidate.uuid, { includeChildren: false });
            const previousContent = typeof latest?.content === 'string'
              ? latest.content
              : (typeof candidate.content === 'string' ? candidate.content : '');
            const nextContent = previousContent.length > 0
              ? previousContent + ' ' + config.markerPrefix + ' save-' + i
              : config.markerPrefix + ' save-' + i;
            await logseq.api.update_block(candidate.uuid, nextContent);
            return {
              kind: 'save',
              candidateUuid: candidate.uuid || null,
              previousContentLength: previousContent.length,
              nextContentLength: nextContent.length,
            };
          }

          if (operation === 'inlineTag') {
            const candidate = randomItem(
              operable.filter((block) => block?.uuid && !isClientRootBlock(block))
            ) || anchor;
            const latest = await logseq.api.get_block(candidate.uuid, { includeChildren: false });
            const previousContent = typeof latest?.content === 'string'
              ? latest.content
              : (typeof candidate.content === 'string' ? candidate.content : '');
            const tagName = (config.markerPrefix + 'inline-tag-' + i).replace(/[^a-zA-Z0-9_-]+/g, '-');
            const token = '#[[' + tagName + ']]';
            const nextContent = previousContent.length > 0
              ? previousContent + ' ' + token
              : token;
            await logseq.api.update_block(candidate.uuid, nextContent);
            return {
              kind: 'inlineTag',
              candidateUuid: candidate.uuid || null,
              token,
            };
          }

          if (operation === 'emptyInlineTag') {
            const target = randomItem(
              operable.filter((block) => block?.uuid && !isClientRootBlock(block))
            ) || anchor;
            const tagNameRaw = (config.markerPrefix + 'tag-' + i).replace(/[^a-zA-Z0-9_-]+/g, '-');
            const tagName = tagNameRaw.replace(/^-+/, '') || ('tag-' + i);
            const token = '#' + tagName;
            const inserted = await logseq.api.insert_block(target.uuid, token, {
              sibling: true,
              before: false,
              focus: false,
            });
            return {
              kind: 'emptyInlineTag',
              targetUuid: target.uuid || null,
              insertedUuid: inserted?.uuid || null,
              token,
            };
          }

          if (operation === 'pageReference') {
            const candidate = randomItem(
              operable.filter((block) => block?.uuid && !isClientRootBlock(block))
            ) || anchor;
            const latest = await logseq.api.get_block(candidate.uuid, { includeChildren: false });
            const previousContent = typeof latest?.content === 'string'
              ? latest.content
              : (typeof candidate.content === 'string' ? candidate.content : '');
            const refPageName = (config.markerPrefix + 'page-ref-' + i).replace(/[^a-zA-Z0-9 _-]+/g, '-').trim();
            await logseq.api.create_page(refPageName, null, { redirect: false });
            const token = '[[' + refPageName + ']]';
            const nextContent = previousContent.length > 0
              ? previousContent + ' ' + token
              : token;
            await logseq.api.update_block(candidate.uuid, nextContent);
            return {
              kind: 'pageReference',
              candidateUuid: candidate.uuid || null,
              refPageName,
            };
          }

          if (operation === 'blockReference') {
            let blockPool = operable.filter((block) => block?.uuid && !isClientRootBlock(block));
            if (blockPool.length < 2) {
              const seedTarget = blockPool.length > 0 ? blockPool[0] : anchor;
              const inserted = await logseq.api.insert_block(
                seedTarget.uuid,
                config.markerPrefix + ' block-ref-target-' + i,
                { sibling: true, before: false, focus: false }
              );
              if (!inserted?.uuid) {
                throw new Error('Failed to create block-ref target');
              }
              blockPool = (await listOperableBlocks()).filter(
                (block) => block?.uuid && !isClientRootBlock(block)
              );
            }
            if (blockPool.length < 2) {
              throw new Error('Not enough blocks for block reference');
            }
            const [target, source] = pickRandomGroup(blockPool, 2, 2);
            const latestTarget = await logseq.api.get_block(target.uuid, { includeChildren: false });
            const previousContent = typeof latestTarget?.content === 'string'
              ? latestTarget.content
              : (typeof target.content === 'string' ? target.content : '');
            const token = '((' + source.uuid + '))';
            const nextContent = previousContent.length > 0
              ? previousContent + ' ' + token
              : token;
            await logseq.api.update_block(target.uuid, nextContent);
            return {
              kind: 'blockReference',
              targetUuid: target.uuid || null,
              sourceUuid: source.uuid || null,
            };
          }

          if (operation === 'propertySet') {
            const state = await ensurePropertyOpsReady();
            const candidate = randomItem(operable.filter((block) => block?.uuid)) || anchor;
            const value = config.markerPrefix + ' prop-set-' + i;
            await logseq.api.upsert_block_property(candidate.uuid, state.propertyName, value, {});
            return {
              kind: 'propertySet',
              candidateUuid: candidate.uuid || null,
              propertyName: state.propertyName,
            };
          }

          if (operation === 'batchSetProperty') {
            const state = await ensurePropertyOpsReady();
            if (!Number.isInteger(state.propertyEid)) {
              throw new Error('Property entity id is unavailable for batchSetProperty');
            }

            let targets = operable
              .filter((block) => block?.uuid && !isClientRootBlock(block))
              .map((block) => ({ uuid: block.uuid }));
            while (targets.length < 2) {
              const parent = targets.length > 0 ? targets[0] : anchor;
              const inserted = await logseq.api.insert_block(
                parent.uuid,
                config.markerPrefix + ' batch-prop-target-' + i + '-' + targets.length,
                { sibling: true, before: false, focus: false }
              );
              if (!inserted?.uuid) {
                throw new Error('Failed to create batchSetProperty target');
              }
              targets.push({ uuid: inserted.uuid });
            }

            const selectedTargets = pickRandomGroup(targets, 2, Math.min(4, targets.length));
            const selectedEids = [];
            const selectedUuids = [];
            for (const target of selectedTargets) {
              if (!target?.uuid) continue;
              const eid = await queryEidByUuid(target.uuid);
              if (Number.isInteger(eid)) {
                selectedEids.push(eid);
                selectedUuids.push(target.uuid);
              }
            }
            if (selectedEids.length < 2) {
              throw new Error('Failed to resolve multiple target eids for batchSetProperty');
            }

            const value = config.markerPrefix + ' batch-set-' + i;
            await applyRawOutlinerOp('batch-set-property', [
              selectedEids,
              state.propertyEid,
              value,
              {},
            ]);
            return {
              kind: 'batchSetProperty',
              propertyName: state.propertyName,
              targetCount: selectedUuids.length,
              targetUuids: selectedUuids,
            };
          }

          if (operation === 'propertyRemove') {
            const state = await ensurePropertyOpsReady();
            const candidate = randomItem(operable.filter((block) => block?.uuid)) || anchor;
            await logseq.api.remove_block_property(candidate.uuid, state.propertyName);
            return {
              kind: 'propertyRemove',
              candidateUuid: candidate.uuid || null,
              propertyName: state.propertyName,
            };
          }

          if (operation === 'propertyValueDelete') {
            const state = await ensurePropertyOpsReady();
            const candidate = randomItem(operable.filter((block) => block?.uuid)) || anchor;
            await logseq.api.add_block_tag(candidate.uuid, state.tagUuid);
            await logseq.api.remove_block_tag(candidate.uuid, state.tagUuid);
            return {
              kind: 'propertyValueDelete',
              candidateUuid: candidate.uuid || null,
              tagUuid: state.tagUuid,
            };
          }

          if (operation === 'templateApply') {
            const state = await ensureTemplateOpsReady();
            if (!Number.isInteger(state.templateRootEid)) {
              throw new Error('Template root eid is unavailable for templateApply');
            }
            const target = randomItem(
              operable.filter((block) => block?.uuid && !isClientRootBlock(block))
            ) || anchor;
            const targetEid = await queryEidByUuid(target.uuid);
            if (!Number.isInteger(targetEid)) {
              throw new Error('Failed to resolve templateApply target eid');
            }
            await applyRawOutlinerOp('apply-template', [
              state.templateRootEid,
              targetEid,
              { sibling: true },
            ]);
            return {
              kind: 'templateApply',
              templateRootUuid: state.templateRootUuid,
              targetUuid: target.uuid || null,
            };
          }

          if (operation === 'copyPaste') {
            const pageBlocks = await listPageBlocks();
            const copyPool = (operable.length > 0 ? operable : pageBlocks).filter((b) => b?.uuid);
            if (copyPool.length === 0) {
              throw new Error('No blocks available for copyPaste');
            }
            const source = randomItem(copyPool);
            const target = randomItem(copyPool);
            await logseq.api.select_block(source.uuid);
            await logseq.api.invoke_external_command('logseq.editor/copy');
            const latestSource = await logseq.api.get_block(source.uuid);
            const sourceContent = latestSource?.content || source.content || '';
            const copiedContent =
              config.markerPrefix + ' copy-' + i + (sourceContent ? ' :: ' + sourceContent : '');
            const inserted = await logseq.api.insert_block(target.uuid, copiedContent, {
              sibling: true,
              before: false,
              focus: false,
            });
            return {
              kind: 'copyPaste',
              sourceUuid: source.uuid || null,
              targetUuid: target.uuid || null,
              insertedUuid: inserted?.uuid || null,
              copiedContent,
            };
          }

          if (operation === 'copyPasteTreeToEmptyTarget') {
            const pageBlocks = await listPageBlocks();
            const treePool = (operable.length >= 2 ? operable : pageBlocks).filter((b) => b?.uuid);
            if (treePool.length < 2) {
              throw new Error('Not enough blocks available for multi-block copy');
            }
            const sources = pickRandomGroup(treePool, 2, 4);
            const sourceTrees = [];
            for (const source of sources) {
              const sourceTree = await logseq.api.get_block(source.uuid, { includeChildren: true });
              if (sourceTree?.uuid) {
                sourceTrees.push(sourceTree);
              }
            }
            if (sourceTrees.length === 0) {
              throw new Error('Failed to load source tree blocks');
            }

            const treeTarget = operable.length > 0 ? randomItem(operable) : anchor;
            const emptyTarget = await logseq.api.insert_block(treeTarget.uuid, '', {
              sibling: true,
              before: false,
              focus: false,
            });
            if (!emptyTarget?.uuid) {
              throw new Error('Failed to create empty target block');
            }

            await logseq.api.update_block(emptyTarget.uuid, '');
            const payload = sourceTrees.map((tree, idx) => {
              const node = toBatchTree(tree);
              const origin = typeof node.content === 'string' && node.content.length > 0
                ? ' :: ' + node.content
                : '';
              node.content = config.markerPrefix + ' tree-copy-' + i + '-' + idx + origin;
              return node;
            });
            let fallbackToSingleTree = false;
            try {
              await logseq.api.insert_batch_block(emptyTarget.uuid, payload, { sibling: false });
            } catch (_error) {
              fallbackToSingleTree = true;
              for (const tree of sourceTrees) {
                await logseq.api.insert_batch_block(emptyTarget.uuid, toBatchTree(tree), { sibling: false });
              }
            }
            return {
              kind: 'copyPasteTreeToEmptyTarget',
              treeTargetUuid: treeTarget.uuid || null,
              emptyTargetUuid: emptyTarget.uuid || null,
              sourceUuids: sourceTrees.map((tree) => tree?.uuid).filter(Boolean),
              payloadSize: payload.length,
              fallbackToSingleTree,
            };
          }

          if (operation === 'move') {
            const source = randomItem(operable);
            const candidates = operable.filter((block) => block.uuid !== source.uuid);
            const target = randomItem(candidates);
            const before = nextRandom() < 0.5;
            await logseq.api.move_block(source.uuid, target.uuid, {
              before,
              children: false,
            });
            return {
              kind: 'move',
              sourceUuid: source.uuid || null,
              targetUuid: target.uuid || null,
              before,
              children: false,
            };
          }

          if (operation === 'moveUpDown') {
            const up = nextRandom() < 0.5;
            const prepared = await ensureMoveUpDownCandidate(operable, anchor, i, up);
            const candidate = prepared?.candidate;
            if (!candidate?.uuid) {
              throw new Error('No valid move-up-down candidate');
            }
            await logseq.api.select_block(candidate.uuid);
            const command = up
              ? 'logseq.editor/move-block-up'
              : 'logseq.editor/move-block-down';
            await logseq.api.invoke_external_command(command);
            return {
              kind: 'moveUpDown',
              candidateUuid: candidate.uuid || null,
              siblingUuid: prepared?.siblingUuid || null,
              direction: up ? 'up' : 'down',
              command,
            };
          }

          if (operation === 'indent') {
            const candidate = await ensureIndentCandidate(operable, anchor, i);
            const prevUuid = await getPreviousSiblingUuid(candidate.uuid);
            if (!prevUuid) {
              throw new Error('No previous sibling for indent candidate');
            }
            await logseq.api.move_block(candidate.uuid, prevUuid, {
              before: false,
              children: true,
            });
            return {
              kind: 'indent',
              candidateUuid: candidate.uuid || null,
              targetUuid: prevUuid,
              before: false,
              children: true,
            };
          }

          if (operation === 'outdent') {
            const candidate = await ensureOutdentCandidate(operable, anchor, i);
            const full = await logseq.api.get_block(candidate.uuid, { includeChildren: false });
            const parentId = full?.parent?.id;
            const pageId = full?.page?.id;
            if (!parentId || !pageId || parentId === pageId) {
              throw new Error('Outdent candidate is not nested');
            }
            const parent = await logseq.api.get_block(parentId, { includeChildren: false });
            if (!parent?.uuid) {
              throw new Error('Cannot resolve parent block for outdent');
            }
            await logseq.api.move_block(candidate.uuid, parent.uuid, {
              before: false,
              children: false,
            });
            return {
              kind: 'outdent',
              candidateUuid: candidate.uuid || null,
              targetUuid: parent.uuid || null,
              before: false,
              children: false,
            };
          }

          if (operation === 'delete') {
            const candidates = operable.filter((block) => block.uuid !== anchor.uuid && !isClientRootBlock(block));
            const victimPool = candidates.length > 0 ? candidates : operable;
            const victim = randomItem(victimPool);
            if (isClientRootBlock(victim)) {
              throw new Error('Skip deleting protected client root block');
            }
            await logseq.api.remove_block(victim.uuid);
            return {
              kind: 'delete',
              victimUuid: victim.uuid || null,
            };
          }

          if (operation === 'undo') {
            await logseq.api.invoke_external_command('logseq.editor/undo');
            await sleep(config.undoRedoDelayMs);
            return { kind: 'undo' };
          }

          if (operation === 'redo') {
            await logseq.api.invoke_external_command('logseq.editor/redo');
            await sleep(config.undoRedoDelayMs);
            return { kind: 'redo' };
          }

          return { kind: operation };
        };

        const opDetail = await withTimeout(runOperation(), config.opTimeoutMs, operation + ' operation');
        failIfFatalSignalSeen();
        try {
          await withTimeout(
            appendReplayFallbackTxFromSnapshot(i),
            opReadTimeoutMs,
            'appendReplayFallbackTxFromSnapshot'
          );
        } catch (_error) {
          // best-effort fallback capture
        }

        counts[operation] += 1;
        executed += 1;
        const opEntry = { index: i, requested, executedAs: operation, detail: opDetail || null };
        operationLog.push(opEntry);
        replayCaptureStoreEntry.opLog.push(opEntry);
        replayCaptureStoreEntry.updatedAt = Date.now();
      } catch (error) {
        counts.errors += 1;
        errors.push({
          index: i,
          requested,
          attempted: operation,
          message: String(error?.message || error),
        });

        try {
          const recoveryOperable = await withTimeout(
            listOperableBlocks(),
            opReadTimeoutMs,
            'listOperableBlocks for recovery'
          );
          const target = recoveryOperable.length > 0 ? randomItem(recoveryOperable) : anchor;
          await withTimeout(
            logseq.api.insert_block(target.uuid, config.markerPrefix + ' recovery-' + i, {
              sibling: true,
              before: false,
              focus: false,
            }),
            opReadTimeoutMs,
            'insert recovery block'
          );
          counts.add += 1;
          executed += 1;
          try {
            await withTimeout(
              appendReplayFallbackTxFromSnapshot(i),
              opReadTimeoutMs,
              'appendReplayFallbackTxFromSnapshot-recovery'
            );
          } catch (_error) {
            // best-effort fallback capture
          }
          const opEntry = {
            index: i,
            requested,
            executedAs: 'add',
            detail: {
              kind: 'recovery-add',
              targetUuid: target.uuid || null,
            },
          };
          operationLog.push(opEntry);
          replayCaptureStoreEntry.opLog.push(opEntry);
          replayCaptureStoreEntry.updatedAt = Date.now();
        } catch (recoveryError) {
          errors.push({
            index: i,
            requested,
            attempted: 'recovery-add',
            message: String(recoveryError?.message || recoveryError),
          });
          break;
        }
      } finally {
        replayCaptureState.currentOpIndex = null;
      }
    }

    let checksum = null;
    const warnings = [];
    failIfFatalSignalSeen();
    if (config.verifyChecksum) {
      try {
        checksum = await withTimeout(
          runChecksumDiagnostics(),
          Math.max(
            45000,
            Number(config.syncSettleTimeoutMs || 0) +
              Number(config.readyTimeoutMs || 0) +
              10000
          ),
          'runChecksumDiagnostics'
        );
      } catch (error) {
        checksum = {
          ok: false,
          reason: String(error?.message || error),
          timedOut: true,
        };
      }
      if (!checksum.ok) {
        warnings.push({
          index: config.plan.length,
          requested: 'verifyChecksum',
          attempted: 'verifyChecksum',
          message: checksum.reason || 'checksum mismatch',
          checksum,
        });
      }
    }

    const finalManaged = await withTimeout(listManagedBlocks(), phaseTimeoutMs, 'final listManagedBlocks');
    replayCaptureState.enabled = false;
    const replayTxCapture = {
      enabled: replayCaptureEnabled,
      installed: replayCaptureState.installed === true,
      installReason: replayCaptureState.installReason,
      totalTx: replayCaptureState.txLog.length,
      txLog: replayCaptureState.txLog,
    };
    replayCaptureStoreEntry.txCapture = replayTxCapture;
    replayCaptureStoreEntry.updatedAt = Date.now();
    return {
      ok: errors.length === 0,
      requestedOps: config.plan.length,
      executedOps: executed,
      counts,
      markerPrefix: config.markerPrefix,
      anchorUuid: anchor.uuid,
      finalManagedCount: finalManaged.length,
      sampleManaged: finalManaged.slice(0, 5).map((block) => ({
        uuid: block.uuid,
        content: block.content,
      })),
      errorCount: errors.length,
      errors: errors.slice(0, 20),
      warnings: warnings.slice(0, 20),
      rtcLogs: getRtcLogList(),
      consoleLogs: Array.isArray(consoleCaptureEntry) ? [...consoleCaptureEntry] : [],
      wsMessages: {
        installed: wsCaptureEntry?.installed === true,
        installReason: wsCaptureEntry?.installReason || null,
        outbound: Array.isArray(wsCaptureEntry?.outbound) ? [...wsCaptureEntry.outbound] : [],
        inbound: Array.isArray(wsCaptureEntry?.inbound) ? [...wsCaptureEntry.inbound] : [],
      },
      requestedPlan: Array.isArray(config.plan) ? [...config.plan] : [],
      opLog: operationLog,
      opLogSample: operationLog.slice(0, 20),
      outlinerOpCoverage,
      initialDb,
      txCapture: replayTxCapture,
      checksum,
    };
  })())()`;
}

function buildCleanupTodayPageProgram(config = {}) {
  const cleanupConfig = {
    cleanupTodayPage: true,
    ...(config || {}),
  };

  return `(() => (async () => {
    const config = ${JSON.stringify(cleanupConfig)};
    const asPageName = (pageLike) => {
      if (typeof pageLike === 'string' && pageLike.length > 0) return pageLike;
      if (!pageLike || typeof pageLike !== 'object') return null;
      if (typeof pageLike.name === 'string' && pageLike.name.length > 0) return pageLike.name;
      if (typeof pageLike.originalName === 'string' && pageLike.originalName.length > 0) return pageLike.originalName;
      if (typeof pageLike.title === 'string' && pageLike.title.length > 0) return pageLike.title;
      return null;
    };

    const purgePageBlocks = async (pageName) => {
      if (!pageName) {
        return { ok: false, pageName, reason: 'empty page name' };
      }
      if (!globalThis.logseq?.api?.get_page_blocks_tree || !globalThis.logseq?.api?.remove_block) {
        return { ok: false, pageName, reason: 'page block APIs unavailable' };
      }

      let tree = [];
      try {
        tree = await logseq.api.get_page_blocks_tree(pageName);
      } catch (error) {
        return { ok: false, pageName, reason: 'failed to read page tree: ' + String(error?.message || error) };
      }

      const topLevel = Array.isArray(tree)
        ? tree.map((block) => block?.uuid).filter(Boolean)
        : [];
      for (const uuid of topLevel) {
        try {
          await logseq.api.remove_block(uuid);
        } catch (_error) {
          // best-effort cleanup; continue deleting remaining blocks
        }
      }

      return {
        ok: true,
        pageName,
        removedBlocks: topLevel.length,
      };
    };

    try {
      const pages = [];

      if (!globalThis.logseq?.api?.get_today_page) {
        return { ok: false, reason: 'today page API unavailable' };
      }
      const today = await logseq.api.get_today_page();
      const todayName = asPageName(today);
      if (todayName) {
        pages.push(todayName);
      }

      const uniquePages = Array.from(new Set(pages.filter(Boolean)));
      const pageResults = [];
      for (const pageName of uniquePages) {
        const pageResult = await purgePageBlocks(pageName);
        let deleted = false;
        let deleteError = null;
        if (globalThis.logseq?.api?.delete_page) {
          try {
            await logseq.api.delete_page(pageName);
            deleted = true;
          } catch (error) {
            deleteError = String(error?.message || error);
          }
        }
        pageResults.push({
          ...pageResult,
          deleted,
          deleteError,
        });
      }

      return {
        ok: pageResults.every((item) => item.ok),
        pages: pageResults,
      };
    } catch (error) {
      return { ok: false, reason: String(error?.message || error) };
    }
  })())()`;
}

function buildGraphBootstrapProgram(config) {
  return `(() => (async () => {
    const config = ${JSON.stringify(config)};
    const lower = (value) => String(value || '').toLowerCase();
    const targetGraphLower = lower(config.graphName);
    const stateKey = '__logseqOpBootstrapState';
    const state = (window[stateKey] && typeof window[stateKey] === 'object') ? window[stateKey] : {};
    window[stateKey] = state;
    if (state.targetGraph !== config.graphName || state.runId !== config.runId) {
      state.initialGraphName = null;
      state.initialRepoName = null;
      state.initialTargetMatched = null;
      state.passwordAttempts = 0;
      state.refreshCount = 0;
      state.graphDetected = false;
      state.graphCardClicked = false;
      state.passwordSubmitted = false;
      state.actionTriggered = false;
      state.gotoGraphsOk = false;
      state.gotoGraphsError = null;
      state.downloadStarted = false;
      state.downloadCompleted = false;
      state.downloadCompletionSource = null;
      state.lastDownloadLog = null;
      state.lastRefreshAt = 0;
      state.lastGraphClickAt = 0;
      state.targetStateStableHits = 0;
      state.switchAttempts = 0;
    }
    state.runId = config.runId;
    state.targetGraph = config.graphName;
    if (typeof state.passwordAttempts !== 'number') state.passwordAttempts = 0;
    if (typeof state.refreshCount !== 'number') state.refreshCount = 0;
    if (typeof state.graphDetected !== 'boolean') state.graphDetected = false;
    if (typeof state.graphCardClicked !== 'boolean') state.graphCardClicked = false;
    if (typeof state.passwordSubmitted !== 'boolean') state.passwordSubmitted = false;
    if (typeof state.actionTriggered !== 'boolean') state.actionTriggered = false;
    if (typeof state.gotoGraphsOk !== 'boolean') state.gotoGraphsOk = false;
    if (typeof state.gotoGraphsError !== 'string' && state.gotoGraphsError !== null) state.gotoGraphsError = null;
    if (typeof state.downloadStarted !== 'boolean') state.downloadStarted = false;
    if (typeof state.downloadCompleted !== 'boolean') state.downloadCompleted = false;
    if (typeof state.downloadCompletionSource !== 'string' && state.downloadCompletionSource !== null) {
      state.downloadCompletionSource = null;
    }
    if (typeof state.lastDownloadLog !== 'object' && state.lastDownloadLog !== null) {
      state.lastDownloadLog = null;
    }
    if (typeof state.initialRepoName !== 'string' && state.initialRepoName !== null) {
      state.initialRepoName = null;
    }
    if (typeof state.initialTargetMatched !== 'boolean' && state.initialTargetMatched !== null) {
      state.initialTargetMatched = null;
    }
    if (typeof state.lastRefreshAt !== 'number') {
      state.lastRefreshAt = 0;
    }
    if (typeof state.lastGraphClickAt !== 'number') {
      state.lastGraphClickAt = 0;
    }
    if (typeof state.targetStateStableHits !== 'number') {
      state.targetStateStableHits = 0;
    }
    if (typeof state.switchAttempts !== 'number') {
      state.switchAttempts = 0;
    }

    const setInputValue = (input, value) => {
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(input, value);
      } else {
        input.value = value;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const dispatchClick = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      try {
        node.scrollIntoView({ block: 'center', inline: 'center' });
      } catch (_error) {
        // ignore scroll failures
      }

      try {
        node.focus();
      } catch (_error) {
        // ignore focus failures
      }

      try {
        node.click();
        return true;
      } catch (_error) {
        // fall back to explicit events
      }

      node.dispatchEvent(new MouseEvent('mousedown', { view: window, bubbles: true, cancelable: true }));
      node.dispatchEvent(new MouseEvent('mouseup', { view: window, bubbles: true, cancelable: true }));
      node.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
      return true;
    };

    const graphNameMatchesTarget = (graphName) => {
      const value = lower(graphName);
      if (!value) return false;
      return (
        value === targetGraphLower ||
        value.endsWith('/' + targetGraphLower) ||
        value.endsWith('_' + targetGraphLower) ||
        value.includes('logseq_db_' + targetGraphLower)
      );
    };

    const stateMatchesTarget = (repoName, graphName) => {
      const hasRepo = typeof repoName === 'string' && repoName.length > 0;
      const hasGraph = typeof graphName === 'string' && graphName.length > 0;
      const repoMatches = hasRepo ? graphNameMatchesTarget(repoName) : false;
      const graphMatches = hasGraph ? graphNameMatchesTarget(graphName) : false;
      if (hasRepo && hasGraph) {
        return repoMatches && graphMatches;
      }
      if (hasRepo) return repoMatches;
      if (hasGraph) return graphMatches;
      return false;
    };

    const listGraphCards = () =>
      Array.from(document.querySelectorAll('div[data-testid^="logseq_db_"]'));

    const findGraphCard = () => {
      const exact = document.querySelector('div[data-testid="logseq_db_' + config.graphName + '"]');
      if (exact) return exact;

      const byTestId = listGraphCards()
        .find((card) => lower(card.getAttribute('data-testid')).includes(targetGraphLower));
      if (byTestId) return byTestId;

      return listGraphCards()
        .find((card) => lower(card.textContent).includes(targetGraphLower));
    };

    const clickRefresh = () => {
      const candidates = Array.from(document.querySelectorAll('button,span,a'));
      const refreshNode = candidates.find((el) => (el.textContent || '').trim() === 'Refresh');
      const clickable = refreshNode ? (refreshNode.closest('button') || refreshNode) : null;
      return dispatchClick(clickable);
    };

    const clickGraphCard = (card) => {
      if (!card) return false;
      const anchors = Array.from(card.querySelectorAll('a'));
      const exactAnchor = anchors.find((el) => lower(el.textContent).trim() === targetGraphLower);
      const looseAnchor = anchors.find((el) => lower(el.textContent).includes(targetGraphLower));
      const anyAnchor = anchors[0];
      const actionButton = Array.from(card.querySelectorAll('button'))
        .find((el) => lower(el.textContent).includes(targetGraphLower));
      const target = exactAnchor || looseAnchor || anyAnchor || actionButton || card;
      return dispatchClick(target);
    };

    const getCurrentGraphName = async () => {
      try {
        if (!globalThis.logseq?.api?.get_current_graph) return null;
        const current = await logseq.api.get_current_graph();
        if (!current || typeof current !== 'object') return null;
        if (typeof current.name === 'string' && current.name.length > 0) return current.name;
        if (typeof current.url === 'string' && current.url.length > 0) {
          const parts = current.url.split('/').filter(Boolean);
          return parts[parts.length - 1] || null;
        }
      } catch (_error) {
        // ignore
      }
      return null;
    };

    const getCurrentRepoName = () => {
      try {
        if (!globalThis.logseq?.api?.get_state_from_store) return null;
        const value = logseq.api.get_state_from_store(['git/current-repo']);
        return typeof value === 'string' && value.length > 0 ? value : null;
      } catch (_error) {
        return null;
      }
    };

    const getDownloadingGraphUuid = () => {
      try {
        if (!globalThis.logseq?.api?.get_state_from_store) return null;
        return logseq.api.get_state_from_store(['rtc/downloading-graph-uuid']);
      } catch (_error) {
        return null;
      }
    };

    const getRtcLog = () => {
      try {
        if (!globalThis.logseq?.api?.get_state_from_store) return null;
        return logseq.api.get_state_from_store(['rtc/log']);
      } catch (_error) {
        return null;
      }
    };

    const asLower = (value) => String(value || '').toLowerCase();
    const parseRtcDownloadLog = (value) => {
      if (!value || typeof value !== 'object') return null;
      const type = value.type || value['type'] || null;
      const typeLower = asLower(type);
      if (!typeLower.includes('rtc.log/download')) return null;

      const subType =
        value['sub-type'] ||
        value.subType ||
        value.subtype ||
        value.sub_type ||
        null;
      const graphUuid =
        value['graph-uuid'] ||
        value.graphUuid ||
        value.graph_uuid ||
        null;
      const message = value.message || null;
      return {
        type: String(type || ''),
        subType: String(subType || ''),
        graphUuid: graphUuid ? String(graphUuid) : null,
        message: message ? String(message) : null,
      };
    };

    const probeGraphReady = async () => {
      try {
        if (!globalThis.logseq?.api?.get_current_page_blocks_tree) {
          return { ok: false, reason: 'get_current_page_blocks_tree unavailable' };
        }
        await logseq.api.get_current_page_blocks_tree();
        return { ok: true, reason: null };
      } catch (error) {
        return { ok: false, reason: String(error?.message || error) };
      }
    };

    const initialGraphName = await getCurrentGraphName();
    const initialRepoName = getCurrentRepoName();
    const initialTargetMatched = stateMatchesTarget(initialRepoName, initialGraphName);
    if (!state.initialGraphName && initialGraphName) {
      state.initialGraphName = initialGraphName;
    }
    if (!state.initialRepoName && initialRepoName) {
      state.initialRepoName = initialRepoName;
    }
    if (state.initialTargetMatched === null) {
      state.initialTargetMatched = initialTargetMatched;
    }

    const shouldForceSelection =
      (config.forceSelection === true && !state.graphCardClicked && !state.downloadStarted) ||
      !initialTargetMatched;
    let onGraphsPage = location.hash.includes('/graphs');
    if ((shouldForceSelection || !initialTargetMatched) && !onGraphsPage) {
      try {
        location.hash = '#/graphs';
        state.gotoGraphsOk = true;
      } catch (error) {
        state.gotoGraphsError = String(error?.message || error);
      }
      onGraphsPage = location.hash.includes('/graphs');
    }

    const modal = document.querySelector('.e2ee-password-modal-content');
    const passwordModalVisible = !!modal;
    let passwordAttempted = false;
    let passwordSubmittedThisStep = false;
    if (modal) {
      const passwordInputs = Array.from(
        modal.querySelectorAll('input[type="password"], .ls-toggle-password-input input, input')
      );
      if (passwordInputs.length >= 2) {
        setInputValue(passwordInputs[0], config.password);
        setInputValue(passwordInputs[1], config.password);
        passwordAttempted = true;
      } else if (passwordInputs.length === 1) {
        setInputValue(passwordInputs[0], config.password);
        passwordAttempted = true;
      }

      if (passwordAttempted) {
        state.passwordAttempts += 1;
      }

      const submitButton = Array.from(modal.querySelectorAll('button'))
        .find((button) => /(submit|open|unlock|confirm|enter)/i.test((button.textContent || '').trim()));
      if (submitButton && !submitButton.disabled) {
        passwordSubmittedThisStep = dispatchClick(submitButton);
        state.passwordSubmitted = state.passwordSubmitted || passwordSubmittedThisStep;
        state.actionTriggered = state.actionTriggered || passwordSubmittedThisStep;
      }
    }

    let graphCardClickedThisStep = false;
    let refreshClickedThisStep = false;
    if (location.hash.includes('/graphs')) {
      const card = findGraphCard();
      if (card) {
        const now = Date.now();
        state.graphDetected = true;
        if (!state.graphCardClicked && now - state.lastGraphClickAt >= 500) {
          graphCardClickedThisStep = clickGraphCard(card);
          if (graphCardClickedThisStep) {
            state.lastGraphClickAt = now;
            state.switchAttempts += 1;
          }
          state.graphCardClicked = state.graphCardClicked || graphCardClickedThisStep;
          state.actionTriggered = state.actionTriggered || graphCardClickedThisStep;
        }
      } else {
        const now = Date.now();
        if (now - state.lastRefreshAt >= 2000) {
          refreshClickedThisStep = clickRefresh();
          if (refreshClickedThisStep) {
            state.refreshCount += 1;
            state.lastRefreshAt = now;
          }
        }
      }
    }

    const downloadingGraphUuid = getDownloadingGraphUuid();
    if (downloadingGraphUuid) {
      state.actionTriggered = true;
      state.downloadStarted = true;
    }

    const rtcDownloadLog = parseRtcDownloadLog(getRtcLog());
    if (rtcDownloadLog) {
      state.lastDownloadLog = rtcDownloadLog;
      const subTypeLower = asLower(rtcDownloadLog.subType);
      const messageLower = asLower(rtcDownloadLog.message);
      if (subTypeLower.includes('download-progress') || subTypeLower.includes('downloadprogress')) {
        state.downloadStarted = true;
      }
      if (
        (subTypeLower.includes('download-completed') || subTypeLower.includes('downloadcompleted')) &&
        messageLower.includes('ready')
      ) {
        state.downloadStarted = true;
        state.downloadCompleted = true;
        state.downloadCompletionSource = 'rtc-log';
      }
    }

    const currentGraphName = await getCurrentGraphName();
    const currentRepoName = getCurrentRepoName();
    const onGraphsPageFinal = location.hash.includes('/graphs');
    const repoMatchesTarget = graphNameMatchesTarget(currentRepoName);
    const graphMatchesTarget = graphNameMatchesTarget(currentGraphName);
    const switchedToTargetGraph = stateMatchesTarget(currentRepoName, currentGraphName) && !onGraphsPageFinal;
    if (switchedToTargetGraph) {
      state.targetStateStableHits += 1;
    } else {
      state.targetStateStableHits = 0;
    }
    if (
      !switchedToTargetGraph &&
      !onGraphsPageFinal &&
      !passwordModalVisible &&
      !state.downloadStarted &&
      !state.graphCardClicked
    ) {
      try {
        location.hash = '#/graphs';
        state.gotoGraphsOk = true;
      } catch (error) {
        state.gotoGraphsError = String(error?.message || error);
      }
    }
    const needsReadinessProbe =
      switchedToTargetGraph &&
      !passwordModalVisible &&
      !downloadingGraphUuid;
    const readyProbe = needsReadinessProbe
      ? await probeGraphReady()
      : { ok: false, reason: 'skipped' };

    if (state.downloadStarted && !state.downloadCompleted && readyProbe.ok) {
      state.downloadCompleted = true;
      state.downloadCompletionSource = 'db-ready-probe';
    }

    const downloadLifecycleSatisfied = !state.downloadStarted || state.downloadCompleted;
    const requiresAction = config.requireAction !== false;
    const ok =
      switchedToTargetGraph &&
      !passwordModalVisible &&
      !downloadingGraphUuid &&
      readyProbe.ok &&
      downloadLifecycleSatisfied &&
      (!requiresAction || state.actionTriggered) &&
      state.targetStateStableHits >= 2;
    const availableCards = listGraphCards().slice(0, 10).map((card) => ({
      dataTestId: card.getAttribute('data-testid'),
      text: (card.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 120),
    }));

    return {
      ok,
      targetGraph: config.graphName,
      initialGraphName: state.initialGraphName || null,
      initialRepoName: state.initialRepoName || null,
      initialTargetMatched: state.initialTargetMatched,
      currentGraphName,
      currentRepoName,
      gotoGraphsOk: state.gotoGraphsOk,
      gotoGraphsError: state.gotoGraphsError,
      onGraphsPage: onGraphsPageFinal,
      downloadingGraphUuid,
      switchedToTargetGraph,
      repoMatchesTarget,
      graphMatchesTarget,
      readyProbe,
      actionTriggered: state.actionTriggered,
      graphDetected: state.graphDetected,
      graphCardClicked: state.graphCardClicked,
      graphCardClickedThisStep,
      switchAttempts: state.switchAttempts,
      refreshCount: state.refreshCount,
      refreshClickedThisStep,
      passwordAttempts: state.passwordAttempts,
      passwordAttempted,
      passwordModalVisible,
      passwordSubmitted: state.passwordSubmitted,
      passwordSubmittedThisStep,
      downloadStarted: state.downloadStarted,
      downloadCompleted: state.downloadCompleted,
      downloadCompletionSource: state.downloadCompletionSource,
      targetStateStableHits: state.targetStateStableHits,
      lastDownloadLog: state.lastDownloadLog,
      availableCards,
    };
  })())()`;
}

async function runGraphBootstrap(sessionName, args, runOptions) {
  const deadline = Date.now() + args.switchTimeoutMs;
  const bootstrapRunId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let lastBootstrap = null;

  while (Date.now() < deadline) {
    const bootstrapProgram = buildGraphBootstrapProgram({
      runId: bootstrapRunId,
      graphName: args.graph,
      password: args.e2ePassword,
      forceSelection: true,
      requireAction: true,
    });
    const bootstrapEvaluation = await runAgentBrowser(
      sessionName,
      ['eval', '--stdin'],
      {
        input: bootstrapProgram,
        timeoutMs: BOOTSTRAP_EVAL_TIMEOUT_MS,
        ...runOptions,
      }
    );
    const bootstrap = bootstrapEvaluation?.data?.result;
    if (!bootstrap || typeof bootstrap !== 'object') {
      throw new Error('Graph bootstrap returned empty state for session ' + sessionName);
    }

    lastBootstrap = bootstrap;
    if (bootstrap.ok) {
      return bootstrap;
    }

    await sleep(250);
  }

  throw new Error(
    'Failed to switch/download graph "' + args.graph + '" within timeout. ' +
    'Last bootstrap state: ' + JSON.stringify(lastBootstrap)
  );
}

function buildGraphProbeProgram(graphName) {
  return `(() => (async () => {
    const target = ${JSON.stringify(String(graphName || ''))}.toLowerCase();
    const lower = (v) => String(v || '').toLowerCase();
    const matches = (value) => {
      const v = lower(value);
      if (!v) return false;
      return v === target || v.endsWith('/' + target) || v.endsWith('_' + target) || v.includes('logseq_db_' + target);
    };

    let currentGraphName = null;
    let currentRepoName = null;
    try {
      if (globalThis.logseq?.api?.get_current_graph) {
        const current = await logseq.api.get_current_graph();
        currentGraphName = current?.name || current?.url || null;
      }
    } catch (_error) {
      // ignore
    }
    try {
      if (globalThis.logseq?.api?.get_state_from_store) {
        currentRepoName = logseq.api.get_state_from_store(['git/current-repo']) || null;
      }
    } catch (_error) {
      // ignore
    }

    const repoMatchesTarget = matches(currentRepoName);
    const graphMatchesTarget = matches(currentGraphName);
    const onGraphsPage = location.hash.includes('/graphs');
    const stableTarget = (repoMatchesTarget || graphMatchesTarget) && !onGraphsPage;

    return {
      targetGraph: ${JSON.stringify(String(graphName || ''))},
      currentGraphName,
      currentRepoName,
      repoMatchesTarget,
      graphMatchesTarget,
      onGraphsPage,
      stableTarget,
    };
  })())()`;
}

async function ensureTargetGraphBeforeOps(sessionName, args, runOptions) {
  let lastProbe = null;
  let lastBootstrap = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const probeEval = await runAgentBrowser(
      sessionName,
      ['eval', '--stdin'],
      {
        input: buildGraphProbeProgram(args.graph),
        ...runOptions,
      }
    );
    const probe = probeEval?.data?.result;
    lastProbe = probe;
    if (probe?.stableTarget) {
      return { ok: true, probe, bootstrap: lastBootstrap };
    }

    lastBootstrap = await runGraphBootstrap(sessionName, args, runOptions);
  }

  throw new Error(
    'Target graph verification failed before ops. ' +
    'Last probe: ' + JSON.stringify(lastProbe) + '. ' +
    'Last bootstrap: ' + JSON.stringify(lastBootstrap)
  );
}

function buildSessionNames(baseSession, instances) {
  if (instances <= 1) return [baseSession];
  const sessions = [];
  for (let i = 0; i < instances; i += 1) {
    sessions.push(`${baseSession}-${i + 1}`);
  }
  return sessions;
}

function buildSimulationOperationPlan(totalOps, profile) {
  if (!Number.isInteger(totalOps) || totalOps <= 0) {
    throw new Error('totalOps must be a positive integer');
  }
  if (profile !== 'fast' && profile !== 'full') {
    throw new Error('profile must be one of: fast, full');
  }

  const operationOrder = profile === 'full'
    ? FULL_PROFILE_OPERATION_ORDER
    : FAST_PROFILE_OPERATION_ORDER;
  const plan = [];
  for (let i = 0; i < totalOps; i += 1) {
    plan.push(operationOrder[i % operationOrder.length]);
  }
  return plan;
}

function shuffleOperationPlan(plan, rng = Math.random) {
  const shuffled = Array.isArray(plan) ? [...plan] : [];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return shuffled;
}

function computeRendererEvalTimeoutMs(syncSettleTimeoutMs, opCount) {
  return Math.max(
    1800000,
    RENDERER_EVAL_BASE_TIMEOUT_MS +
      (syncSettleTimeoutMs * 2) +
      300000 +
      (opCount * 500) +
      30000
  );
}

function buildReplayCaptureProbeProgram(markerPrefix) {
  return `(() => {
    const key = '__logseqOpReplayCaptureStore';
    const consoleKey = '__logseqOpConsoleCaptureStore';
    const wsKey = '__logseqOpWsCaptureStore';
    const marker = ${JSON.stringify(String(markerPrefix || ''))};
    const store = window[key];
    const consoleStore = window[consoleKey];
    const wsStore = window[wsKey];
    const entry = store && typeof store === 'object' ? store[marker] : null;
    const consoleEntry =
      consoleStore && typeof consoleStore === 'object' ? consoleStore[marker] : null;
    const wsEntry = wsStore && typeof wsStore === 'object' ? wsStore[marker] : null;
    if (!entry && !consoleEntry && !wsEntry) return null;
    return {
      replayCapture: entry && typeof entry === 'object' ? entry : null,
      consoleLogs: Array.isArray(consoleEntry) ? consoleEntry : [],
      wsMessages: wsEntry && typeof wsEntry === 'object' ? wsEntry : null,
    };
  })()`;
}

async function collectFailureReplayCapture(sessionName, markerPrefix, runOptions) {
  try {
    const evaluation = await runAgentBrowser(
      sessionName,
      ['eval', '--stdin'],
      {
        input: buildReplayCaptureProbeProgram(markerPrefix),
        timeoutMs: 20000,
        ...runOptions,
      }
    );
    const value = evaluation?.data?.result;
    return value && typeof value === 'object' ? value : null;
  } catch (_error) {
    return null;
  }
}

function summarizeRounds(rounds) {
  return rounds.reduce(
    (acc, round) => {
      const roundCounts = round?.counts && typeof round.counts === 'object' ? round.counts : {};
      for (const [k, v] of Object.entries(roundCounts)) {
        acc.counts[k] = (acc.counts[k] || 0) + (Number(v) || 0);
      }
      acc.requestedOps += Number(round.requestedOps || 0);
      acc.executedOps += Number(round.executedOps || 0);
      acc.errorCount += Number(round.errorCount || 0);
      if (round.ok !== true) {
        acc.failedRounds.push(round.round);
      }
      return acc;
    },
    { counts: {}, requestedOps: 0, executedOps: 0, errorCount: 0, failedRounds: [] }
  );
}

function mergeOutlinerCoverageIntoRound(round) {
  if (!round || typeof round !== 'object') return round;
  const coverage =
    round.outlinerOpCoverage && typeof round.outlinerOpCoverage === 'object'
      ? round.outlinerOpCoverage
      : null;
  if (!coverage) return round;

  const expectedOpsRaw = Array.isArray(coverage.expectedOps) ? coverage.expectedOps : [];
  const expectedOps = expectedOpsRaw
    .map((op) => (typeof op === 'string' ? op.trim() : ''))
    .filter((op) => op.length > 0);
  if (expectedOps.length === 0) return round;

  const baseRequestedPlan = Array.isArray(round.requestedPlan) ? round.requestedPlan : [];
  if (baseRequestedPlan.some((op) => typeof op === 'string' && op.startsWith('outliner:'))) {
    return round;
  }

  const baseOpLog = Array.isArray(round.opLog) ? round.opLog : [];
  const baseCounts =
    round.counts && typeof round.counts === 'object' && !Array.isArray(round.counts)
      ? round.counts
      : {};
  const resultByOp = new Map();
  const coverageResults = Array.isArray(coverage.results)
    ? coverage.results
    : (Array.isArray(coverage.sample) ? coverage.sample : []);
  for (const item of coverageResults) {
    if (!item || typeof item !== 'object') continue;
    if (typeof item.op !== 'string' || item.op.length === 0) continue;
    if (!resultByOp.has(item.op)) resultByOp.set(item.op, item);
  }

  const coverageEntries = expectedOps.map((op, index) => {
    const result = resultByOp.get(op) || null;
    const detail = {
      kind: 'outlinerCoverage',
      op,
      ok: result ? result.ok !== false : true,
      error: result?.error || null,
      durationMs: Number.isFinite(Number(result?.durationMs))
        ? Number(result.durationMs)
        : null,
      detail: result?.detail || null,
    };
    return {
      index,
      requested: `outliner:${op}`,
      executedAs: `outliner:${op}`,
      detail,
    };
  });
  const indexOffset = coverageEntries.length;
  const shiftedBaseOpLog = baseOpLog.map((entry, idx) => {
    const nextEntry = entry && typeof entry === 'object' ? { ...entry } : {};
    const originalIndex = Number(nextEntry.index);
    nextEntry.index = Number.isInteger(originalIndex) ? originalIndex + indexOffset : indexOffset + idx;
    return nextEntry;
  });

  const requestedPlan = [
    ...expectedOps.map((op) => `outliner:${op}`),
    ...baseRequestedPlan,
  ];
  const opLog = [...coverageEntries, ...shiftedBaseOpLog];
  const executedCoverageCount = coverageEntries.filter((entry) => entry?.detail?.ok !== false).length;
  const baseExecutedOps = Number.isFinite(Number(round.executedOps))
    ? Number(round.executedOps)
    : shiftedBaseOpLog.length;
  const counts = {
    ...baseCounts,
    outlinerCoverage: expectedOps.length,
    outlinerCoverageFailed: Array.isArray(coverage.failedOps)
      ? coverage.failedOps.length
      : 0,
  };

  return {
    ...round,
    requestedOps: requestedPlan.length,
    executedOps: baseExecutedOps + executedCoverageCount,
    requestedPlan,
    opLog,
    opLogSample: opLog.slice(0, 20),
    counts,
  };
}

async function runSimulationForSession(sessionName, index, args, sharedConfig) {
  if (args.resetSession) {
    try {
      await runAgentBrowser(sessionName, ['close'], {
        autoConnect: false,
        headed: false,
      });
    } catch (_error) {
      // session may not exist yet
    }
  }

  const runOptions = {
    headed: args.headed,
    autoConnect: args.autoConnect,
    profile: sharedConfig.instanceProfiles[index] ?? null,
    launchArgs: sharedConfig.effectiveLaunchArgs,
    executablePath: sharedConfig.effectiveExecutablePath,
  };

  await runAgentBrowser(sessionName, ['open', args.url], runOptions);
  await ensureActiveTabOnTargetUrl(sessionName, args.url, runOptions);

  const rounds = [];
  let bootstrap = null;
  const fixedPlanForInstance =
    sharedConfig.fixedPlansByInstance instanceof Map
      ? sharedConfig.fixedPlansByInstance.get(index + 1)
      : null;
  const rendererEvalTimeoutMs = computeRendererEvalTimeoutMs(
    args.syncSettleTimeoutMs,
    Array.isArray(fixedPlanForInstance) && fixedPlanForInstance.length > 0
      ? fixedPlanForInstance.length
      : sharedConfig.plan.length
  );
  for (let round = 0; round < args.rounds; round += 1) {
    const roundSeed = deriveSeed(
      sharedConfig.seed ?? sharedConfig.runId,
      sessionName,
      index + 1,
      round + 1
    );
    const roundRng = createSeededRng(roundSeed);
    bootstrap = await runGraphBootstrap(sessionName, args, runOptions);
    const clientPlan =
      Array.isArray(fixedPlanForInstance) && fixedPlanForInstance.length > 0
        ? [...fixedPlanForInstance]
        : shuffleOperationPlan(sharedConfig.plan, roundRng);
    const markerPrefix = `${sharedConfig.runPrefix}r${round + 1}-client-${index + 1}-`;
    const rendererProgram = buildRendererProgram({
      runPrefix: sharedConfig.runPrefix,
      markerPrefix,
      plan: clientPlan,
      seed: roundSeed,
      undoRedoDelayMs: args.undoRedoDelayMs,
      readyTimeoutMs: RENDERER_READY_TIMEOUT_MS,
      readyPollDelayMs: RENDERER_READY_POLL_DELAY_MS,
      syncSettleTimeoutMs: args.syncSettleTimeoutMs,
      opTimeoutMs: args.opTimeoutMs,
      fallbackPageName: FALLBACK_PAGE_NAME,
      verifyChecksum: args.verifyChecksum,
      captureReplay: args.captureReplay,
    });

    try {
      const evaluation = await runAgentBrowser(
        sessionName,
        ['eval', '--stdin'],
        {
          input: rendererProgram,
          timeoutMs: rendererEvalTimeoutMs,
          ...runOptions,
        }
      );

      const value = evaluation?.data?.result;
      if (!value) {
        throw new Error(`Unexpected empty result from agent-browser eval (round ${round + 1})`);
      }
      const normalizedRound = mergeOutlinerCoverageIntoRound(value);
      rounds.push({
        round: round + 1,
        ...normalizedRound,
      });
    } catch (error) {
      const captured = await collectFailureReplayCapture(sessionName, markerPrefix, runOptions);
      if (captured && typeof captured === 'object') {
        const replayCapture =
          captured.replayCapture && typeof captured.replayCapture === 'object'
            ? captured.replayCapture
            : {};
        const fallbackOpLog = Array.isArray(replayCapture.opLog) ? replayCapture.opLog : [];
        const fallbackTxCapture =
          replayCapture.txCapture && typeof replayCapture.txCapture === 'object'
            ? replayCapture.txCapture
            : null;
        const fallbackInitialDb =
          replayCapture.initialDb && typeof replayCapture.initialDb === 'object'
            ? replayCapture.initialDb
            : null;
        const fallbackConsoleLogs = Array.isArray(captured.consoleLogs)
          ? captured.consoleLogs
          : [];
        const fallbackWsMessages =
          captured.wsMessages && typeof captured.wsMessages === 'object'
            ? captured.wsMessages
            : null;
        const fallbackExecutedOps = fallbackOpLog.length;
        const roundResult = {
          round: round + 1,
          ok: false,
          requestedOps: clientPlan.length,
          executedOps: fallbackExecutedOps,
          counts: {},
          markerPrefix,
          anchorUuid: null,
          finalManagedCount: 0,
          sampleManaged: [],
          errorCount: 1,
          errors: [
            {
              index: fallbackExecutedOps,
              requested: 'eval',
              attempted: 'eval',
              message: String(error?.message || error),
            },
          ],
          requestedPlan: Array.isArray(clientPlan) ? [...clientPlan] : [],
          opLog: fallbackOpLog,
          opLogSample: fallbackOpLog.slice(0, 20),
          initialDb: fallbackInitialDb,
          txCapture: fallbackTxCapture,
          consoleLogs: fallbackConsoleLogs,
          wsMessages: fallbackWsMessages,
          checksum: null,
          recoveredFromEvalFailure: true,
        };
        rounds.push(roundResult);
      }
      error.partialResult = {
        ok: false,
        rounds: [...rounds],
        ...summarizeRounds(rounds),
      };
      throw error;
    }
  }

  const summary = summarizeRounds(rounds);

  const value = {
    ok: summary.failedRounds.length === 0,
    rounds,
    requestedOps: summary.requestedOps,
    executedOps: summary.executedOps,
    counts: summary.counts,
    errorCount: summary.errorCount,
    failedRounds: summary.failedRounds,
  };

  value.runtime = {
    session: sessionName,
    instanceIndex: index + 1,
    effectiveProfile: runOptions.profile,
    effectiveLaunchArgs: sharedConfig.effectiveLaunchArgs,
    effectiveExecutablePath: sharedConfig.effectiveExecutablePath,
    bootstrap,
    rounds: args.rounds,
    opProfile: args.opProfile,
    opTimeoutMs: args.opTimeoutMs,
    seed: args.seed,
    verifyChecksum: args.verifyChecksum,
    captureReplay: args.captureReplay,
    cleanupTodayPage: args.cleanupTodayPage,
    autoConnect: args.autoConnect,
    headed: args.headed,
  };

  return value;
}

async function runPostSimulationCleanup(sessionName, index, args, sharedConfig) {
  if (!args.cleanupTodayPage) return null;

  const runOptions = {
    headed: args.headed,
    autoConnect: args.autoConnect,
    profile: sharedConfig.instanceProfiles[index] ?? null,
    launchArgs: sharedConfig.effectiveLaunchArgs,
    executablePath: sharedConfig.effectiveExecutablePath,
  };

  const cleanupEval = await runAgentBrowser(
    sessionName,
    ['eval', '--stdin'],
    {
      input: buildCleanupTodayPageProgram({
        cleanupTodayPage: args.cleanupTodayPage,
      }),
      timeoutMs: 30000,
      ...runOptions,
    }
  );
  return cleanupEval?.data?.result || null;
}

function formatFailureText(reason) {
  return String(reason?.stack || reason?.message || reason);
}

function classifySimulationFailure(reason) {
  const text = formatFailureText(reason).toLowerCase();
  if (
    text.includes('checksum mismatch rtc-log detected') ||
    text.includes('db-sync/checksum-mismatch') ||
    text.includes(':rtc.log/checksum-mismatch')
  ) {
    return 'checksum_mismatch';
  }
  if (
    text.includes('tx rejected rtc-log detected') ||
    text.includes('tx-rejected warning detected') ||
    text.includes('db-sync/tx-rejected') ||
    text.includes(':rtc.log/tx-rejected')
  ) {
    return 'tx_rejected';
  }
  if (
    text.includes('missing-entity-id warning detected') ||
    text.includes('nothing found for entity id')
  ) {
    return 'missing_entity_id';
  }
  if (
    text.includes('numeric-entity-id-in-non-transact-op warning detected') ||
    text.includes('non-transact outliner ops contain numeric entity ids')
  ) {
    return 'numeric_entity_id_in_non_transact_op';
  }
  return 'other';
}

function buildRejectedResultEntry(sessionName, index, reason, failFastState) {
  const failureType = classifySimulationFailure(reason);
  const error = formatFailureText(reason);
  const partialResult =
    reason && typeof reason === 'object' && reason.partialResult && typeof reason.partialResult === 'object'
      ? reason.partialResult
      : null;
  const peerCancelledByFailFast =
    (failFastState?.reasonType === 'checksum_mismatch' ||
      failFastState?.reasonType === 'tx_rejected' ||
      failFastState?.reasonType === 'missing_entity_id' ||
      failFastState?.reasonType === 'numeric_entity_id_in_non_transact_op') &&
    Number.isInteger(failFastState?.sourceIndex) &&
    failFastState.sourceIndex !== index;

  if (peerCancelledByFailFast) {
    const cancelledReason =
      failFastState.reasonType === 'tx_rejected'
        ? 'cancelled_due_to_peer_tx_rejected'
        : (
          failFastState.reasonType === 'missing_entity_id'
            ? 'cancelled_due_to_peer_missing_entity_id'
            : (
              failFastState.reasonType === 'numeric_entity_id_in_non_transact_op'
                ? 'cancelled_due_to_peer_numeric_entity_id_in_non_transact_op'
                : 'cancelled_due_to_peer_checksum_mismatch'
            )
        );
    return {
      session: sessionName,
      instanceIndex: index + 1,
      ok: false,
      cancelled: true,
      cancelledReason,
      peerInstanceIndex: failFastState.sourceIndex + 1,
      error,
      failureType: 'peer_cancelled',
      result: partialResult,
    };
  }

  return {
    session: sessionName,
    instanceIndex: index + 1,
    ok: false,
    error,
    failureType,
    result: partialResult,
  };
}

function extractChecksumMismatchDetailsFromError(errorText) {
  const text = String(errorText || '');
  const marker = 'checksum mismatch rtc-log detected:';
  const markerIndex = text.toLowerCase().indexOf(marker);
  if (markerIndex === -1) return null;

  const afterMarker = text.slice(markerIndex + marker.length);
  const match = afterMarker.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

function extractTxRejectedDetailsFromError(errorText) {
  const text = String(errorText || '');
  const marker = 'tx rejected rtc-log detected:';
  const markerIndex = text.toLowerCase().indexOf(marker);
  if (markerIndex === -1) return null;

  const afterMarker = text.slice(markerIndex + marker.length);
  const match = afterMarker.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

function buildRunArtifact({ output, args, runContext, failFastState }) {
  const safeOutput = output && typeof output === 'object' ? output : {};
  const resultItems = Array.isArray(safeOutput.results) ? safeOutput.results : [];
  const clients = resultItems.map((item) => {
    const errorText = item?.error ? String(item.error) : null;
    const mismatch = errorText ? extractChecksumMismatchDetailsFromError(errorText) : null;
    const txRejected = errorText ? extractTxRejectedDetailsFromError(errorText) : null;
      const rounds = Array.isArray(item?.result?.rounds)
      ? item.result.rounds.map((round) => ({
        round: Number(round?.round || 0),
        requestedOps: Number(round?.requestedOps || 0),
        executedOps: Number(round?.executedOps || 0),
        errorCount: Number(round?.errorCount || 0),
        requestedPlan: Array.isArray(round?.requestedPlan)
          ? round.requestedPlan
          : [],
        opLog: Array.isArray(round?.opLog)
          ? round.opLog
          : [],
        errors: Array.isArray(round?.errors)
          ? round.errors
          : [],
        warnings: Array.isArray(round?.warnings)
          ? round.warnings
          : [],
        initialDb: round?.initialDb && typeof round.initialDb === 'object'
          ? round.initialDb
          : null,
        txCapture: round?.txCapture && typeof round.txCapture === 'object'
          ? round.txCapture
          : null,
        consoleLogs: Array.isArray(round?.consoleLogs)
          ? round.consoleLogs
          : [],
        wsMessages: round?.wsMessages && typeof round.wsMessages === 'object'
          ? round.wsMessages
          : null,
        outlinerOpCoverage: round?.outlinerOpCoverage &&
            typeof round.outlinerOpCoverage === 'object'
          ? round.outlinerOpCoverage
          : null,
      }))
      : [];

    return {
      session: item?.session || null,
      instanceIndex: Number.isInteger(item?.instanceIndex) ? item.instanceIndex : null,
      ok: Boolean(item?.ok),
      cancelled: item?.cancelled === true,
      cancelledReason: item?.cancelledReason || null,
      failureType: item?.failureType || null,
      error: errorText,
      mismatch,
      txRejected,
      requestedOps: Number(item?.result?.requestedOps || 0),
      executedOps: Number(item?.result?.executedOps || 0),
      errorCount: Number(item?.result?.errorCount || 0),
      failedRounds: Array.isArray(item?.result?.failedRounds) ? item.result.failedRounds : [],
      requestedPlan: Array.isArray(item?.result?.rounds?.[0]?.requestedPlan)
        ? item.result.rounds[0].requestedPlan
        : [],
      opLogTail: Array.isArray(item?.result?.rounds?.[0]?.opLog)
        ? item.result.rounds[0].opLog.slice(-50)
        : [],
      opLogSample: Array.isArray(item?.result?.rounds?.[0]?.opLogSample)
        ? item.result.rounds[0].opLogSample
        : [],
      errors: Array.isArray(item?.result?.rounds?.[0]?.errors)
        ? item.result.rounds[0].errors
        : [],
      rounds,
    };
  });

  return {
    createdAt: new Date().toISOString(),
    runId: runContext?.runId || null,
    runPrefix: runContext?.runPrefix || null,
    args: args || {},
    summary: {
      ok: Boolean(safeOutput.ok),
      instances: Number(safeOutput.instances || clients.length || 0),
      successCount: Number(safeOutput.successCount || 0),
      failureCount: Number(safeOutput.failureCount || 0),
    },
    failFast: {
      triggered: Boolean(failFastState?.triggered),
      sourceIndex: Number.isInteger(failFastState?.sourceIndex)
        ? failFastState.sourceIndex
        : null,
      reasonType: failFastState?.reasonType || null,
    },
    mismatchCount: clients.filter((item) => item.mismatch).length,
    txRejectedCount: clients.filter((item) => item.txRejected).length,
    clients,
  };
}

function extractReplayContext(artifact) {
  const argsOverride =
    artifact && typeof artifact.args === 'object' && artifact.args
      ? { ...artifact.args }
      : {};
  const fixedPlansByInstance = new Map();
  const clients = Array.isArray(artifact?.clients) ? artifact.clients : [];
  for (const client of clients) {
    const instanceIndex = Number(client?.instanceIndex);
    if (!Number.isInteger(instanceIndex) || instanceIndex <= 0) continue;
    if (!Array.isArray(client?.requestedPlan)) continue;
    fixedPlansByInstance.set(instanceIndex, [...client.requestedPlan]);
  }
  return {
    argsOverride,
    fixedPlansByInstance,
  };
}

async function writeRunArtifact(artifact, baseDir = DEFAULT_ARTIFACT_BASE_DIR) {
  const runId = String(artifact?.runId || Date.now());
  const artifactDir = path.join(baseDir, runId);
  await fsPromises.mkdir(artifactDir, { recursive: true });
  await fsPromises.writeFile(
    path.join(artifactDir, 'artifact.json'),
    JSON.stringify(artifact, null, 2),
    'utf8'
  );
  const clients = Array.isArray(artifact?.clients) ? artifact.clients : [];
  for (let i = 0; i < clients.length; i += 1) {
    const client = clients[i];
    const clientIndex =
      Number.isInteger(client?.instanceIndex) && client.instanceIndex > 0
        ? client.instanceIndex
        : i + 1;
    const clientDir = path.join(artifactDir, 'clients', `client-${clientIndex}`);
    await fsPromises.mkdir(clientDir, { recursive: true });

    const rounds = Array.isArray(client?.rounds) ? client.rounds : [];
    for (let j = 0; j < rounds.length; j += 1) {
      const round = rounds[j];
      const roundIndex =
        Number.isInteger(round?.round) && round.round > 0
          ? round.round
          : j + 1;
      const roundPrefix = `round-${roundIndex}`;

      await fsPromises.writeFile(
        path.join(clientDir, `${roundPrefix}-client-ops.json`),
        JSON.stringify(
          {
            requestedPlan: Array.isArray(round?.requestedPlan) ? round.requestedPlan : [],
            opLog: Array.isArray(round?.opLog) ? round.opLog : [],
            outlinerOpCoverage:
              round?.outlinerOpCoverage && typeof round.outlinerOpCoverage === 'object'
                ? round.outlinerOpCoverage
                : null,
            txCapture: round?.txCapture && typeof round.txCapture === 'object'
              ? round.txCapture
              : null,
            errors: Array.isArray(round?.errors) ? round.errors : [],
            warnings: Array.isArray(round?.warnings) ? round.warnings : [],
          },
          null,
          2
        ),
        'utf8'
      );

      await fsPromises.writeFile(
        path.join(clientDir, `${roundPrefix}-console-log.json`),
        JSON.stringify(
          Array.isArray(round?.consoleLogs) ? round.consoleLogs : [],
          null,
          2
        ),
        'utf8'
      );

      await fsPromises.writeFile(
        path.join(clientDir, `${roundPrefix}-ws-messages.json`),
        JSON.stringify(
          round?.wsMessages && typeof round.wsMessages === 'object'
            ? round.wsMessages
            : { installed: false, outbound: [], inbound: [] },
          null,
          2
        ),
        'utf8'
      );
    }
  }
  return artifactDir;
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

  let replayContext = {
    sourceArtifactPath: null,
    fixedPlansByInstance: new Map(),
  };
  if (args.replay) {
    const replayPath = path.resolve(args.replay);
    const replayContent = await fsPromises.readFile(replayPath, 'utf8');
    const replayArtifact = JSON.parse(replayContent);
    const extractedReplay = extractReplayContext(replayArtifact);
    args = {
      ...args,
      ...extractedReplay.argsOverride,
      replay: args.replay,
    };
    replayContext = {
      sourceArtifactPath: replayPath,
      fixedPlansByInstance: extractedReplay.fixedPlansByInstance,
    };
  }

  const preview = {
    url: args.url,
    session: args.session,
    instances: args.instances,
    graph: args.graph,
    e2ePassword: args.e2ePassword,
    switchTimeoutMs: args.switchTimeoutMs,
    profile: args.profile,
    executablePath: args.executablePath,
    autoConnect: args.autoConnect,
    resetSession: args.resetSession,
    ops: args.ops,
    opProfile: args.opProfile,
    opTimeoutMs: args.opTimeoutMs,
    seed: args.seed,
    replay: args.replay,
    rounds: args.rounds,
    undoRedoDelayMs: args.undoRedoDelayMs,
    syncSettleTimeoutMs: args.syncSettleTimeoutMs,
    verifyChecksum: args.verifyChecksum,
    captureReplay: args.captureReplay,
    cleanupTodayPage: args.cleanupTodayPage,
    headed: args.headed,
  };

  if (args.printOnly) {
    console.log(JSON.stringify(preview, null, 2));
    return;
  }

  await spawnAndCapture('agent-browser', ['--version']);

  const sessionNames = buildSessionNames(args.session, args.instances);
  let effectiveProfile;
  if (args.profile === 'none') {
    effectiveProfile = null;
  } else if (args.profile === 'auto') {
    const autoName = await detectChromeProfile();
    effectiveProfile = await resolveProfileArgument(autoName);
  } else {
    effectiveProfile = await resolveProfileArgument(args.profile);
  }
  const effectiveExecutablePath =
    args.executablePath || (await detectChromeExecutablePath());
  const effectiveLaunchArgs = effectiveProfile ? buildChromeLaunchArgs(args.url) : null;

  const instanceProfiles = [];
  if (args.instances <= 1 || !effectiveProfile) {
    for (let i = 0; i < args.instances; i += 1) {
      instanceProfiles.push(effectiveProfile);
    }
  } else if (looksLikePath(effectiveProfile)) {
    for (let i = 0; i < args.instances; i += 1) {
      instanceProfiles.push(effectiveProfile);
    }
  } else {
    for (let i = 0; i < args.instances; i += 1) {
      const isolated = await createIsolatedChromeUserDataDir(effectiveProfile, i + 1);
      instanceProfiles.push(isolated);
    }
  }

  const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  const sharedConfig = {
    runId,
    runPrefix: `op-sim-${runId}-`,
    seed: args.seed,
    replaySource: replayContext.sourceArtifactPath,
    fixedPlansByInstance: replayContext.fixedPlansByInstance,
    captureReplay: args.captureReplay,
    effectiveProfile,
    instanceProfiles,
    effectiveLaunchArgs,
    effectiveExecutablePath,
    plan: buildSimulationOperationPlan(
      Math.max(1, Math.ceil(args.ops / args.instances)),
      args.opProfile
    ),
  };

  const failFastState = {
    triggered: false,
    sourceIndex: null,
    reasonType: null,
  };
  const closeOtherSessions = async (excludeIndex) => {
    await Promise.all(
      sessionNames.map((sessionName, index) => {
        if (index === excludeIndex) return Promise.resolve();
        return runAgentBrowser(sessionName, ['close'], {
          autoConnect: false,
          headed: false,
        }).catch(() => null);
      })
    );
  };

  const tasks = sessionNames.map((sessionName, index) =>
    (async () => {
      try {
        return await runSimulationForSession(sessionName, index, args, sharedConfig);
      } catch (error) {
        if (!failFastState.triggered) {
          failFastState.triggered = true;
          failFastState.sourceIndex = index;
          failFastState.reasonType = classifySimulationFailure(error);
          await closeOtherSessions(index);
        }
        throw error;
      }
    })()
  );
  const settled = await Promise.allSettled(tasks);
  let cleanupTodayPage = null;
  try {
    cleanupTodayPage = await runPostSimulationCleanup(
      sessionNames[0],
      0,
      args,
      sharedConfig
    );
  } catch (error) {
    cleanupTodayPage = {
      ok: false,
      reason: String(error?.message || error),
    };
  }
  const expectedOpsForInstance = (instanceIndex) => {
    const fixedPlan =
      sharedConfig.fixedPlansByInstance instanceof Map
        ? sharedConfig.fixedPlansByInstance.get(instanceIndex)
        : null;
    const perRound = Array.isArray(fixedPlan) && fixedPlan.length > 0
      ? fixedPlan.length
      : sharedConfig.plan.length;
    return perRound * args.rounds;
  };

  if (sessionNames.length === 1) {
    const single = settled[0];
    if (single.status === 'rejected') {
      const rejected = buildRejectedResultEntry(
        sessionNames[0],
        0,
        single.reason,
        failFastState
      );
      const value = {
        ...(rejected.result && typeof rejected.result === 'object'
          ? rejected.result
          : {}),
        ok: false,
        error: rejected.error || formatFailureText(single.reason),
        failureType: rejected.failureType || 'other',
        cleanupTodayPage,
      };
      if (rejected.cancelled) value.cancelled = true;
      if (rejected.cancelledReason) value.cancelledReason = rejected.cancelledReason;
      if (Number.isInteger(rejected.peerInstanceIndex)) {
        value.peerInstanceIndex = rejected.peerInstanceIndex;
      }
      try {
        const singleOutput = {
          ok: false,
          instances: 1,
          successCount: 0,
          failureCount: 1,
          results: [{
            session: sessionNames[0],
            instanceIndex: 1,
            ok: false,
            result: value,
            error: rejected.error,
            failureType: rejected.failureType,
            cancelled: rejected.cancelled,
            cancelledReason: rejected.cancelledReason,
            peerInstanceIndex: rejected.peerInstanceIndex,
          }],
        };
        const artifact = buildRunArtifact({
          output: singleOutput,
          args,
          runContext: sharedConfig,
          failFastState,
        });
        value.artifactDir = await writeRunArtifact(artifact);
      } catch (error) {
        value.artifactError = String(error?.message || error);
      }
      console.log(JSON.stringify(value, null, 2));
      process.exitCode = 2;
      return;
    }
    const value = single.value;
    value.cleanupTodayPage = cleanupTodayPage;
    try {
      const singleOutput = {
        ok: value.ok,
        instances: 1,
        successCount: value.ok ? 1 : 0,
        failureCount: value.ok ? 0 : 1,
        results: [{
          session: sessionNames[0],
          instanceIndex: 1,
          ok: value.ok,
          result: value,
        }],
      };
      const artifact = buildRunArtifact({
        output: singleOutput,
        args,
        runContext: sharedConfig,
        failFastState,
      });
      value.artifactDir = await writeRunArtifact(artifact);
    } catch (error) {
      value.artifactError = String(error?.message || error);
    }
    console.log(JSON.stringify(value, null, 2));
    if (!value.ok || value.executedOps < expectedOpsForInstance(1)) {
      process.exitCode = 2;
    }
    return;
  }

  const results = settled.map((entry, idx) => {
    const sessionName = sessionNames[idx];
    if (entry.status === 'fulfilled') {
      const value = entry.value;
      const passed =
        Boolean(value?.ok) &&
        Number(value?.executedOps || 0) >= expectedOpsForInstance(idx + 1);
      return {
        session: sessionName,
        instanceIndex: idx + 1,
        ok: passed,
        result: {
          ...value,
          cleanupTodayPage: idx === 0 ? cleanupTodayPage : null,
        },
      };
    }

    return buildRejectedResultEntry(sessionName, idx, entry.reason, failFastState);
  });

  const successCount = results.filter((item) => item.ok).length;
  const output = {
    ok: successCount === results.length,
    instances: results.length,
    successCount,
    failureCount: results.length - successCount,
    results,
  };

  try {
    const artifact = buildRunArtifact({
      output,
      args,
      runContext: sharedConfig,
      failFastState,
    });
    output.artifactDir = await writeRunArtifact(artifact);
  } catch (error) {
    output.artifactError = String(error?.message || error);
  }

  console.log(JSON.stringify(output, null, 2));
  if (!output.ok) {
    process.exitCode = 2;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || String(error));
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  isRetryableAgentBrowserError,
  buildCleanupTodayPageProgram,
  classifySimulationFailure,
  buildRejectedResultEntry,
  extractChecksumMismatchDetailsFromError,
  extractTxRejectedDetailsFromError,
  buildRunArtifact,
  extractReplayContext,
  createSeededRng,
  shuffleOperationPlan,
  buildSimulationOperationPlan,
  mergeOutlinerCoverageIntoRound,
  ALL_OUTLINER_OP_COVERAGE_OPS,
};
