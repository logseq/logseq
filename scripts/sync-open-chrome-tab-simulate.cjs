#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  buildOperationPlan,
} = require('./lib/logseq-electron-op-sim.cjs');

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
const DEFAULT_SYNC_SETTLE_TIMEOUT_MS = 3000;
const AGENT_BROWSER_ACTION_TIMEOUT_MS = 120000;
const PROCESS_TIMEOUT_MS = 120000;
const AGENT_BROWSER_RETRY_COUNT = 2;
const BOOTSTRAP_EVAL_TIMEOUT_MS = 15000;
const RENDERER_EVAL_BASE_TIMEOUT_MS = 30000;

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
    `  --rounds <n>                Number of operation rounds per instance (default: ${DEFAULT_ROUNDS})`,
    `  --undo-redo-delay-ms <n>    Wait time after undo/redo command (default: ${DEFAULT_UNDO_REDO_DELAY_MS})`,
    `  --sync-settle-timeout-ms <n> Timeout waiting for local/remote tx to settle before checksum verify (default: ${DEFAULT_SYNC_SETTLE_TIMEOUT_MS})`,
    '  --verify-checksum           Run dev checksum diagnostics after each round (default: enabled)',
    '  --no-verify-checksum        Skip post-round checksum diagnostics',
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
    rounds: DEFAULT_ROUNDS,
    undoRedoDelayMs: DEFAULT_UNDO_REDO_DELAY_MS,
    syncSettleTimeoutMs: DEFAULT_SYNC_SETTLE_TIMEOUT_MS,
    verifyChecksum: DEFAULT_VERIFY_CHECKSUM,
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
    const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
    const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
    const describeError = (error) => String(error?.message || error);
    const asPageName = (pageLike) => {
      if (typeof pageLike === 'string' && pageLike.length > 0) return pageLike;
      if (!pageLike || typeof pageLike !== 'object') return null;
      if (typeof pageLike.name === 'string' && pageLike.name.length > 0) return pageLike.name;
      if (typeof pageLike.originalName === 'string' && pageLike.originalName.length > 0) return pageLike.originalName;
      if (typeof pageLike.title === 'string' && pageLike.title.length > 0) return pageLike.title;
      return null;
    };

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
    const checksumWarningStateKey = '__logseqOpChecksumWarnings';
    const checksumWarningPatchKey = '__logseqOpChecksumWarningPatchInstalled';

    const chooseRunnableOperation = (requestedOperation, operableCount) => {
      if (
        requestedOperation === 'move' ||
        requestedOperation === 'delete' ||
        requestedOperation === 'indent'
      ) {
        return operableCount >= 2 ? requestedOperation : 'add';
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

    const installChecksumWarningTrap = () => {
      const warningList = Array.isArray(window[checksumWarningStateKey])
        ? window[checksumWarningStateKey]
        : [];
      window[checksumWarningStateKey] = warningList;
      if (window[checksumWarningPatchKey]) return;
      window[checksumWarningPatchKey] = true;

      const trapMethod = (method) => {
        const original = console[method];
        if (typeof original !== 'function') return;
        console[method] = (...args) => {
          try {
            const text = args.map(stringifyConsoleArg).join(' ');
            if (text.includes(checksumWarningToken)) {
              warningList.push({
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

    const latestChecksumWarning = () => {
      const warningList = Array.isArray(window[checksumWarningStateKey])
        ? window[checksumWarningStateKey]
        : [];
      return warningList.length > 0 ? warningList[warningList.length - 1] : null;
    };

    const latestChecksumMismatchRtcLog = () => {
      try {
        if (!globalThis.logseq?.api?.get_state_from_store) return null;
        const entry = logseq.api.get_state_from_store(['rtc/log']);
        if (!entry || typeof entry !== 'object') return null;

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

        if (!hasMismatchType && !hasDifferentChecksums) return null;
        return {
          type: entry.type || null,
          messageType: entry['message-type'] || entry.messageType || null,
          localTx: entry['local-tx'] || entry.localTx || null,
          remoteTx: entry['remote-tx'] || entry.remoteTx || null,
          localChecksum,
          remoteChecksum,
        };
      } catch (_error) {
        return null;
      }
    };

    const failIfChecksumWarningSeen = () => {
      const rtcLog = latestChecksumMismatchRtcLog();
      if (rtcLog) {
        throw new Error('checksum mismatch rtc-log detected: ' + JSON.stringify(rtcLog));
      }
      const warning = latestChecksumWarning();
      if (!warning) return;
      const details = String(warning.text || '').slice(0, 500);
      throw new Error('checksum warning detected: ' + details);
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

    const pickRandomGroup = (blocks, minSize = 1, maxSize = 3) => {
      const pool = shuffle(blocks);
      const lower = Math.max(1, Math.min(minSize, pool.length));
      const upper = Math.max(lower, Math.min(maxSize, pool.length));
      const size = lower + Math.floor(Math.random() * (upper - lower + 1));
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

    const counts = {
      add: 0,
      delete: 0,
      move: 0,
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

    installChecksumWarningTrap();
    failIfChecksumWarningSeen();

    await withTimeout(waitForEditorReady(), phaseTimeoutMs, 'waitForEditorReady');
    const anchor = await withTimeout(getAnchor(), phaseTimeoutMs, 'getAnchor');
    await withTimeout(ensureClientRootBlock(anchor), phaseTimeoutMs, 'ensureClientRootBlock');

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

    let executed = 0;

    for (let i = 0; i < config.plan.length; i += 1) {
      failIfChecksumWarningSeen();
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
        await sleep(Math.floor(Math.random() * 10));

        const runOperation = async () => {
          if (operation === 'add') {
            const target = operable.length > 0 ? randomItem(operable) : anchor;
            const content = Math.random() < 0.2 ? '' : config.markerPrefix + ' add-' + i;
            const asChild = operable.length > 0 && Math.random() < 0.35;
            await logseq.api.insert_block(target.uuid, content, {
              sibling: !asChild,
              before: false,
              focus: false,
            });
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
            await logseq.api.insert_block(target.uuid, copiedContent, {
              sibling: true,
              before: false,
              focus: false,
            });
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
            try {
              await logseq.api.insert_batch_block(emptyTarget.uuid, payload, { sibling: false });
            } catch (_error) {
              for (const tree of sourceTrees) {
                await logseq.api.insert_batch_block(emptyTarget.uuid, toBatchTree(tree), { sibling: false });
              }
            }
          }

          if (operation === 'move') {
            const source = randomItem(operable);
            const candidates = operable.filter((block) => block.uuid !== source.uuid);
            const target = randomItem(candidates);
            await logseq.api.move_block(source.uuid, target.uuid, {
              before: Math.random() < 0.5,
              children: false,
            });
          }

          if (operation === 'indent') {
            const candidate = await ensureIndentCandidate(operable, anchor, i);
            await runIndent(candidate);
          }

          if (operation === 'outdent') {
            const candidate = await ensureOutdentCandidate(operable, anchor, i);
            await runOutdent(candidate);
          }

          if (operation === 'delete') {
            const candidates = operable.filter((block) => block.uuid !== anchor.uuid && !isClientRootBlock(block));
            const victimPool = candidates.length > 0 ? candidates : operable;
            const victim = randomItem(victimPool);
            if (isClientRootBlock(victim)) {
              throw new Error('Skip deleting protected client root block');
            }
            await logseq.api.remove_block(victim.uuid);
          }

          if (operation === 'undo') {
            await logseq.api.invoke_external_command('logseq.editor/undo');
            await sleep(config.undoRedoDelayMs);
          }

          if (operation === 'redo') {
            await logseq.api.invoke_external_command('logseq.editor/redo');
            await sleep(config.undoRedoDelayMs);
          }
        };

        await withTimeout(runOperation(), config.opTimeoutMs, operation + ' operation');
        failIfChecksumWarningSeen();

        counts[operation] += 1;
        executed += 1;
        operationLog.push({ index: i, requested, executedAs: operation });
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
          operationLog.push({ index: i, requested, executedAs: 'add' });
        } catch (recoveryError) {
          errors.push({
            index: i,
            requested,
            attempted: 'recovery-add',
            message: String(recoveryError?.message || recoveryError),
          });
          break;
        }
      }
    }

    let checksum = null;
    failIfChecksumWarningSeen();
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
        counts.errors += 1;
        errors.push({
          index: config.plan.length,
          requested: 'verifyChecksum',
          attempted: 'verifyChecksum',
          message: checksum.reason || 'checksum mismatch',
          checksum,
        });
      }
    }

    const finalManaged = await withTimeout(listManagedBlocks(), phaseTimeoutMs, 'final listManagedBlocks');
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
      opLogSample: operationLog.slice(0, 20),
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
      } catch (_error) {
        // continue with explicit events
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
  if (profile === 'full') {
    return buildOperationPlan(totalOps);
  }

  const fastOperationOrder = [
    'add',
    'add',
    'move',
    'delete',
    'indent',
    'outdent',
    'add',
    'move',
  ];

  const plan = [];
  for (let i = 0; i < totalOps; i += 1) {
    plan.push(fastOperationOrder[i % fastOperationOrder.length]);
  }
  return plan;
}

function shuffleOperationPlan(plan) {
  const shuffled = Array.isArray(plan) ? [...plan] : [];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return shuffled;
}

function computeRendererEvalTimeoutMs(syncSettleTimeoutMs, opCount) {
  return Math.max(
    120000,
    RENDERER_EVAL_BASE_TIMEOUT_MS +
      (syncSettleTimeoutMs * 2) +
      (opCount * 500) +
      30000
  );
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
  const rendererEvalTimeoutMs = computeRendererEvalTimeoutMs(
    args.syncSettleTimeoutMs,
    sharedConfig.plan.length
  );
  for (let round = 0; round < args.rounds; round += 1) {
    bootstrap = await runGraphBootstrap(sessionName, args, runOptions);
    const clientPlan = shuffleOperationPlan(sharedConfig.plan);
    const markerPrefix = `${sharedConfig.runPrefix}r${round + 1}-client-${index + 1}-`;
    const rendererProgram = buildRendererProgram({
      runPrefix: sharedConfig.runPrefix,
      markerPrefix,
      plan: clientPlan,
      undoRedoDelayMs: args.undoRedoDelayMs,
      readyTimeoutMs: RENDERER_READY_TIMEOUT_MS,
      readyPollDelayMs: RENDERER_READY_POLL_DELAY_MS,
      syncSettleTimeoutMs: args.syncSettleTimeoutMs,
      opTimeoutMs: args.opTimeoutMs,
      fallbackPageName: FALLBACK_PAGE_NAME,
      verifyChecksum: args.verifyChecksum,
    });

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
    rounds.push({
      round: round + 1,
      ...value,
    });
  }

  const summary = rounds.reduce(
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
    verifyChecksum: args.verifyChecksum,
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
    rounds: args.rounds,
    undoRedoDelayMs: args.undoRedoDelayMs,
    syncSettleTimeoutMs: args.syncSettleTimeoutMs,
    verifyChecksum: args.verifyChecksum,
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

  const sharedConfig = {
    runPrefix: `op-sim-${Date.now()}-`,
    effectiveProfile,
    instanceProfiles,
    effectiveLaunchArgs,
    effectiveExecutablePath,
    plan: buildSimulationOperationPlan(
      Math.max(1, Math.ceil(args.ops / args.instances)),
      args.opProfile
    ),
  };

  const failFastState = { triggered: false };
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
  const expectedOps = sharedConfig.plan.length * args.rounds;

  if (sessionNames.length === 1) {
    const single = settled[0];
    if (single.status === 'rejected') {
      throw single.reason;
    }
    const value = single.value;
    value.cleanupTodayPage = cleanupTodayPage;
    console.log(JSON.stringify(value, null, 2));
    if (!value.ok || value.executedOps < expectedOps) {
      process.exitCode = 2;
    }
    return;
  }

  const results = settled.map((entry, idx) => {
    const sessionName = sessionNames[idx];
    if (entry.status === 'fulfilled') {
      const value = entry.value;
      const passed = Boolean(value?.ok) && Number(value?.executedOps || 0) >= expectedOps;
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

    return {
      session: sessionName,
      instanceIndex: idx + 1,
      ok: false,
      error: String(entry.reason?.stack || entry.reason?.message || entry.reason),
    };
  });

  const successCount = results.filter((item) => item.ok).length;
  const output = {
    ok: successCount === results.length,
    instances: results.length,
    successCount,
    failureCount: results.length - successCount,
    results,
  };

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
};
