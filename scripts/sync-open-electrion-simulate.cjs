#!/usr/bin/env node
'use strict';

const {
  buildOperationPlan,
  parseArgs,
} = require('./lib/logseq-electron-op-sim.cjs');

const DEFAULT_TARGET_TITLE = 'Logseq';
const WebSocketCtor = globalThis.WebSocket;
const DEBUG_TARGET_WAIT_TIMEOUT_MS = 30000;
const DEBUG_TARGET_RETRY_DELAY_MS = 300;
const RENDERER_READY_TIMEOUT_MS = 30000;
const RENDERER_READY_POLL_DELAY_MS = 250;
const BASE_EVALUATE_TIMEOUT_MS = 120000;
const PER_OP_EVALUATE_TIMEOUT_MS = 250;
const FALLBACK_PAGE_NAME = 'op-sim-scratch';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function usage() {
  return [
    'Usage: node scripts/logseq-electron-op-sim.cjs [options]',
    '',
    'Options:',
    '  --ops <n>                 Total operations to execute (must be >= 200, default: 200)',
    '  --port <n>                Electron remote debug port (default: 9333)',
    '  --undo-redo-delay-ms <n>  Wait time after undo/redo command (default: 350)',
    '  -h, --help                Show this message',
    '',
    'Prerequisite: start Logseq Electron with --remote-debugging-port=<port>.',
  ].join('\n');
}

function wsAddListener(ws, event, handler) {
  if (typeof ws.addEventListener === 'function') {
    ws.addEventListener(event, handler);
    return;
  }

  ws.on(event, (...args) => {
    if (event === 'message') {
      const payload = typeof args[0] === 'string' ? args[0] : args[0].toString();
      handler({ data: payload });
      return;
    }
    handler(...args);
  });
}

function createCdpClient(ws) {
  let id = 0;
  const pending = new Map();

  wsAddListener(ws, 'message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;

    const callbacks = pending.get(message.id);
    if (!callbacks) return;
    pending.delete(message.id);

    if (message.error) {
      callbacks.reject(new Error(`CDP error on ${callbacks.method}: ${message.error.message}`));
    } else {
      callbacks.resolve(message.result);
    }
  });

  wsAddListener(ws, 'close', () => {
    for (const entry of pending.values()) {
      entry.reject(new Error('CDP connection closed before response'));
    }
    pending.clear();
  });

  return {
    send(method, params = {}, timeoutMs = 20000) {
      const requestId = ++id;
      const payload = JSON.stringify({ id: requestId, method, params });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.delete(requestId);
          reject(new Error(`Timeout waiting for ${method}`));
        }, timeoutMs);

        pending.set(requestId, {
          method,
          resolve: (result) => {
            clearTimeout(timeout);
            resolve(result);
          },
          reject: (error) => {
            clearTimeout(timeout);
            reject(error);
          },
        });

        ws.send(payload);
      });
    },
  };
}

function pickPageTarget(targets) {
  const pageTargets = targets.filter(
    (target) => target.type === 'page' && typeof target.webSocketDebuggerUrl === 'string'
  );
  if (pageTargets.length === 0) {
    throw new Error('No page target found on debug endpoint');
  }

  return (
    pageTargets.find((target) => (target.title || '').includes(DEFAULT_TARGET_TITLE)) ||
    pageTargets[0]
  );
}

function listPageTargets(targets) {
  return targets
    .filter((target) => target.type === 'page' && typeof target.webSocketDebuggerUrl === 'string')
    .sort((a, b) => {
      const aPreferred = (a.title || '').includes(DEFAULT_TARGET_TITLE) ? 1 : 0;
      const bPreferred = (b.title || '').includes(DEFAULT_TARGET_TITLE) ? 1 : 0;
      return bPreferred - aPreferred;
    });
}

function closeWebSocketQuietly(ws) {
  if (!ws) return;
  try {
    ws.close();
  } catch (_error) {
    // ignore close errors
  }
}

async function targetHasLogseqApi(cdp) {
  const evaluation = await cdp.send(
    'Runtime.evaluate',
    {
      expression: `(() => {
        const api = globalThis.logseq?.api;
        return !!(
          api &&
          typeof api.get_current_block === 'function' &&
          (
            typeof api.get_current_page === 'function' ||
            typeof api.get_today_page === 'function'
          ) &&
          typeof api.append_block_in_page === 'function'
        );
      })()`,
      returnByValue: true,
      awaitPromise: false,
    },
    10000,
  );
  return evaluation?.result?.value === true;
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

    const chooseRunnableOperation = (requestedOperation, operableCount) => {
      if (requestedOperation === 'move' || requestedOperation === 'delete') {
        return operableCount >= 2 ? requestedOperation : 'add';
      }
      return requestedOperation;
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

    const listPageBlocks = async () => {
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
          const currentBlock = await logseq.api.get_current_block();
          if (currentBlock && currentBlock.uuid) {
            return currentBlock;
          }

          if (typeof logseq.api.get_current_page === 'function') {
            const currentPage = await logseq.api.get_current_page();
            const currentPageName = asPageName(currentPage);
            if (currentPageName) {
              const seeded = await logseq.api.append_block_in_page(
                currentPageName,
                config.markerPrefix + ' anchor',
                {}
              );
              if (seeded?.uuid) return seeded;
            }
          }

          if (typeof logseq.api.get_today_page === 'function') {
            const todayPage = await logseq.api.get_today_page();
            const todayPageName = asPageName(todayPage);
            if (todayPageName) {
              const seeded = await logseq.api.append_block_in_page(
                todayPageName,
                config.markerPrefix + ' anchor',
                {}
              );
              if (seeded?.uuid) return seeded;
            }
          }

          {
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

    await waitForEditorReady();
    const anchor = await getAnchor();
    await ensureClientRootBlock(anchor);

    if (!(await listManagedBlocks()).length) {
      await logseq.api.insert_block(anchor.uuid, config.markerPrefix + ' seed', {
        sibling: true,
        before: false,
        focus: false,
      });
    }

    let executed = 0;

    for (let i = 0; i < config.plan.length; i += 1) {
      const requested = config.plan[i];
      const operable = await listOperableBlocks();
      let operation = chooseRunnableOperation(requested, operable.length);
      if (operation !== requested) {
        counts.fallbackAdd += 1;
      }

      try {
        await sleep(Math.floor(Math.random() * 40));

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
          const recoveryOperable = await listOperableBlocks();
          const target = recoveryOperable.length > 0 ? randomItem(recoveryOperable) : anchor;
          await logseq.api.insert_block(target.uuid, config.markerPrefix + ' recovery-' + i, {
            sibling: true,
            before: false,
            focus: false,
          });
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

    const finalManaged = await listManagedBlocks();
    return {
      ok: true,
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
    };
  })())()`;
}

async function openWebSocket(url) {
  if (!WebSocketCtor) {
    throw new Error('Global WebSocket is unavailable in this Node runtime.');
  }

  const ws = new WebSocketCtor(url);
  await new Promise((resolve, reject) => {
    wsAddListener(ws, 'open', resolve);
    wsAddListener(ws, 'error', reject);
  });
  return ws;
}

async function fetchDebugTargets(port) {
  const endpoint = `http://127.0.0.1:${port}/json/list`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Debug endpoint returned HTTP ${response.status} for ${endpoint}`);
  }

  const targets = await response.json();
  if (!Array.isArray(targets)) {
    throw new Error('Debug endpoint returned an invalid target list');
  }
  return targets;
}

async function connectToLogseqPageWebSocket(port) {
  const deadline = Date.now() + DEBUG_TARGET_WAIT_TIMEOUT_MS;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const targets = await fetchDebugTargets(port);
      const pageTargets = listPageTargets(targets);
      if (pageTargets.length === 0) {
        throw new Error('No page target found on debug endpoint');
      }

      let lastTargetError = null;
      for (const target of pageTargets) {
        let ws = null;
        try {
          ws = await openWebSocket(target.webSocketDebuggerUrl);
          const cdp = createCdpClient(ws);
          await cdp.send('Runtime.enable');
          const hasLogseqApi = await targetHasLogseqApi(cdp);
          if (hasLogseqApi) {
            return { ws, cdp };
          }
          closeWebSocketQuietly(ws);
        } catch (error) {
          lastTargetError = error;
          closeWebSocketQuietly(ws);
        }
      }

      throw lastTargetError || new Error('No page target exposes logseq.api yet');
    } catch (error) {
      lastError = error;
      await sleep(DEBUG_TARGET_RETRY_DELAY_MS);
    }
  }

  const suffix = lastError ? ` Last error: ${String(lastError.message || lastError)}` : '';
  throw new Error(
    `Unable to connect to a Logseq page target within ${DEBUG_TARGET_WAIT_TIMEOUT_MS}ms.` + suffix
  );
}

function computeEvaluateTimeoutMs(args) {
  return BASE_EVALUATE_TIMEOUT_MS + args.ops * PER_OP_EVALUATE_TIMEOUT_MS;
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

  const runPrefix = `op-sim-${Date.now()}-`;
  const plan = shuffleOperationPlan(buildOperationPlan(args.ops));
  const markerPrefix = `${runPrefix}client-1-`;
  const { ws, cdp } = await connectToLogseqPageWebSocket(args.port);
  let evaluation;
  try {
    evaluation = await cdp.send(
      'Runtime.evaluate',
      {
        expression: buildRendererProgram({
          runPrefix,
          markerPrefix,
          plan,
          undoRedoDelayMs: args.undoRedoDelayMs,
          readyTimeoutMs: RENDERER_READY_TIMEOUT_MS,
          readyPollDelayMs: RENDERER_READY_POLL_DELAY_MS,
          fallbackPageName: FALLBACK_PAGE_NAME,
        }),
        awaitPromise: true,
        returnByValue: true,
      },
      computeEvaluateTimeoutMs(args),
    );
  } finally {
    ws.close();
  }

  if (evaluation?.exceptionDetails) {
    const detail = evaluation.exceptionDetails.text || evaluation.exceptionDetails.exception?.description;
    throw new Error(`Runtime.evaluate failed: ${detail || 'unknown renderer exception'}`);
  }
  const value = evaluation?.result?.value;
  if (!value) {
    throw new Error('Unexpected empty Runtime.evaluate result');
  }

  console.log(JSON.stringify(value, null, 2));

  if (!value.ok || value.executedOps < args.ops) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
