const {accessSync, constants, realpathSync, statSync} = require("node:fs");
const {homedir, hostname} = require("node:os");
const {delimiter, join} = require("node:path");
const {setTimeout: delay} = require("node:timers/promises");
const {localAgents} = require("./local-agents.cjs");

const localNames = ["codex", "pi"];

function discoverAgents(env = process.env) {
  const dirs = (env.PATH ?? "").split(delimiter).filter(Boolean);
  if (process.platform !== "win32") dirs.push(join(homedir(), ".local", "bin"), "/opt/homebrew/bin", "/usr/local/bin");
  return Object.fromEntries(localNames.flatMap(name => {
    const executable = process.platform === "win32" ? name + ".exe" : name;
    const path = [env["LOGSEQ_BOTS_" + name.toUpperCase()], ...dirs.map(dir => join(dir, executable))]
      .filter(Boolean).find(candidate => {
        try {
          accessSync(candidate, constants.X_OK);
          return statSync(candidate).isFile();
        } catch { return false; }
      });
    return path ? [[name, realpathSync(path)]] : [];
  }));
}

function serverOrigin(value) {
  const url = new URL(value);
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Use an HTTPS Logseq server URL or a localhost development server");
  }
  return url.origin;
}

class RequestError extends Error {
  constructor(status) {
    super(`Logseq runner request failed (HTTP ${status})`);
    this.status = status;
  }
}

async function request(server, credential, path, {signal, lease, body, method = "POST"} = {}) {
  const response = await fetch(server + path, {
    method, redirect: "error",
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    headers: {
      authorization: "Bearer " + credential,
      ...(lease ? {"x-logseq-lease": lease} : {}),
      ...(body ? {"content-type": "application/json"} : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new RequestError(response.status);
  return response;
}

async function pair({server, accountToken, name = hostname(), agents, repository}) {
  const response = await request(serverOrigin(server), accountToken, "/bots/runners", {
    body: {name, agents, repository},
  });
  return response.json();
}

async function revoke({server, credential}) {
  try {
    await request(serverOrigin(server), credential, "/bots/runner/revoke");
  } catch (error) {
    if (error.status !== 401) throw error;
  }
}

function providersFor(config) {
  const {root, repository, commands} = config;
  return localAgents({
    ...process.env, LOGSEQ_BOTS_AGENT_ROOT: root,
    LOGSEQ_BOTS_REPOSITORIES: JSON.stringify(repository ? {[repository]: root} : {}),
    LOGSEQ_BOTS_CODEX: commands.codex, LOGSEQ_BOTS_PI: commands.pi, LOGSEQ_BOTS_CIRCLE: undefined,
  });
}

async function listen(config, {
  signal, onStatus = () => {}, providers = providersFor(config), pollMs = 3000, renewMs = 18000,
} = {}) {
  const server = serverOrigin(config.server);
  const api = (path, options) => request(server, config.credential, "/bots/runner" + path, options);
  const pause = (ms, stop = signal) => delay(ms, undefined, {signal: stop});
  const unavailable = error => [401, 403, 409].includes(error?.status);

  async function retry(action, stop = signal, attempts = 5) {
    for (let attempt = 1; ; attempt++) {
      try { return await action(); }
      catch (error) {
        if (stop?.aborted || unavailable(error) || attempt >= attempts ||
            (error.status && error.status < 500 && ![408, 429].includes(error.status))) throw error;
        await pause(1000 * attempt, stop);
      }
    }
  }

  async function execute(job) {
    const path = "/runs/" + encodeURIComponent(job.id);
    const lease = job.lease;
    const run = new AbortController();
    const stop = signal ? AbortSignal.any([signal, run.signal]) : run.signal;
    const call = (action, options) => api(path + "/" + action, {lease, signal: stop, ...options});
    let heartbeat;
    try {
      const agent = localNames.includes(job.agent) && providers[job.agent];
      await retry(() => call("start"), stop);
      if (!agent || (job.repository && job.repository !== config.repository)) {
        await retry(() => call("complete", {body: {state: "failed", reply: "This device no longer has the requested Agent or workspace."}}), stop);
        return;
      }
      if (job.previous_turn && !job.provider_session_id) {
        await retry(() => call("complete", {body: {state: "attention", reply: "The previous local Agent session could not be resumed."}}), stop);
        return;
      }
      heartbeat = (async () => {
        while (!stop.aborted) {
          await pause(renewMs, stop);
          await retry(() => call("renew"), stop, 3);
        }
      })().catch(() => run.abort());
      let result;
      try {
        const files = [];
        for (const file of job.attachments ?? []) {
          const response = await retry(() => call("attachments/" + encodeURIComponent(file.id), {method: "GET"}), stop);
          files.push({name: file.name, payload: Buffer.from(await response.arrayBuffer())});
        }
        result = await agent({...job, files, signal: stop});
        if (typeof result.reply !== "string" || result.reply.trim() === "") throw new Error("Empty Agent reply");
        result = {
          state: "done", providerSessionId: result.providerSessionId,
          reply: result.reply.trim().slice(0, 24000),
        };
      } catch {
        if (stop.aborted) return;
        result = {state: "attention", reply: "The local Agent did not return a verified result. Check the workspace before running it again."};
      }
      await retry(() => call("complete", {body: result}), stop);
    } finally {
      run.abort();
      await heartbeat;
    }
  }

  let failures = 0;
  while (!signal?.aborted) {
    try {
      const response = await api("/claim", {signal});
      const {job} = await response.json();
      failures = 0;
      onStatus(job ? "working" : "online");
      if (job) {
        try { await execute(job); }
        catch (error) {
          if (error.status === 401 || error.status === 403) throw error;
          onStatus("reconnecting");
          await pause(pollMs);
        }
      } else {
        await pause(pollMs);
      }
    } catch (error) {
      if (signal?.aborted) return;
      if (error.status === 401 || error.status === 403) {
        onStatus("revoked");
        return;
      }
      onStatus("reconnecting");
      failures = Math.min(failures + 1, 5);
      try { await pause(Math.min(30000, pollMs * 2 ** failures)); }
      catch (abort) { if (!signal?.aborted) throw abort; }
    }
  }
}

module.exports = {discoverAgents, listen, pair, revoke, serverOrigin};
