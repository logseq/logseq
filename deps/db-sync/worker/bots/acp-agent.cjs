const {spawn} = require("node:child_process");
const {setTimeout: delay} = require("node:timers/promises");

const transport = "acp-v1";
const maxFrame = 1024 * 1024;
const maxReply = 24000;

async function runAcp(executable, {cwd, env, prompt, sessionId, signal}) {
  const stop = AbortSignal.any([AbortSignal.timeout(20 * 60000), ...(signal ? [signal] : [])]);
  stop.throwIfAborted();
  const detached = process.platform !== "win32";
  const child = spawn(executable, [], {cwd, env, detached, stdio: ["pipe", "pipe", "ignore"]});
  let closed = false;
  const exit = new Promise(resolve => child.once("close", () => { closed = true; resolve(); }));
  const pending = new Map();
  let requestId = 0;
  let failure;
  let collecting = false;
  let approvalRequired = false;
  let approvalTimeout;
  let reply = "";
  let buffer = "";

  function fail(error) {
    failure ??= error;
    for (const {reject} of pending.values()) reject(failure);
    pending.clear();
  }

  function send(message) {
    if (failure) throw failure;
    child.stdin.write(JSON.stringify({jsonrpc: "2.0", ...message}) + "\n");
  }

  function request(method, params) {
    const id = ++requestId;
    return new Promise((resolve, reject) => {
      if (failure) { reject(failure); return; }
      pending.set(id, {resolve, reject});
      try { send({id, method, params}); }
      catch (error) { fail(error); }
    });
  }

  function receive(line) {
    const frame = JSON.parse(line);
    if (frame?.jsonrpc !== "2.0") throw new Error("Invalid ACP message");
    if (frame.method && frame.id != null) {
      if (frame.method === "session/request_permission") {
        send({id: frame.id, result: {outcome: {outcome: "cancelled"}}});
        if (collecting && frame.params?.sessionId === sessionId && !approvalRequired) {
          approvalRequired = true;
          send({method: "session/cancel", params: {sessionId}});
          approvalTimeout = setTimeout(() => fail(new Error("ACP cancellation timed out")), 2000);
        }
      } else {
        send({id: frame.id, error: {code: -32601, message: "Method not supported"}});
      }
    } else if (frame.method === "session/update") {
      const update = frame.params?.update;
      if (collecting && frame.params.sessionId === sessionId && update?.sessionUpdate === "agent_message_chunk"
          && update.content?.type === "text" && typeof update.content.text === "string") {
        reply += update.content.text.slice(0, maxReply - reply.length);
      }
    } else if (!frame.method && pending.has(frame.id)) {
      const {resolve, reject} = pending.get(frame.id);
      pending.delete(frame.id);
      if (Object.hasOwn(frame, "result") && !Object.hasOwn(frame, "error")) resolve(frame.result);
      else reject(new Error("ACP request failed"));
    }
  }

  function terminate(signal) {
    if (!child.pid || closed) return;
    try {
      if (detached) process.kill(-child.pid, signal);
      else child.kill(signal);
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }

  const abort = () => fail(stop.reason);
  stop.addEventListener("abort", abort, {once: true});
  child.once("error", fail);
  child.once("close", () => fail(new Error("ACP adapter closed")));
  child.stdin.on("error", fail);
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", chunk => {
    if (failure) return;
    buffer += chunk;
    try {
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        if (newline > maxFrame) throw new Error("ACP frame exceeds limit");
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        receive(line);
      }
      if (buffer.length > maxFrame) throw new Error("ACP frame exceeds limit");
    } catch (error) { fail(error); }
  });
  try {
    const init = await request("initialize", {protocolVersion: 1, clientCapabilities: {}});
    if (init?.protocolVersion !== 1 || init.agentCapabilities?.loadSession !== true) {
      throw new Error("The adapter must support ACP v1 session loading");
    }
    const workspace = {cwd, mcpServers: []};
    if (sessionId) {
      await request("session/load", {...workspace, sessionId});
    } else {
      const session = await request("session/new", workspace);
      sessionId = session?.sessionId;
    }
    if (typeof sessionId !== "string" || sessionId.length === 0 || sessionId.length > 200 || sessionId.trim() !== sessionId) {
      throw new Error("Invalid ACP session ID");
    }
    collecting = true;
    const outcome = await request("session/prompt", {sessionId, prompt: [{type: "text", text: prompt}]}).catch(error => {
      if (!approvalRequired || stop.aborted) throw error;
    });
    const provider = {providerSessionId: sessionId, providerTransport: transport};
    if (approvalRequired) {
      return {...provider, state: "needs_input", reply: "The local Agent requested approval. Review the task on the paired device."};
    }
    if (outcome?.stopReason !== "end_turn") {
      return {...provider, state: "attention", reply: reply.trim() || "The local Agent stopped before completing the turn."};
    }
    return {...provider, state: "done", reply};
  } finally {
    clearTimeout(approvalTimeout);
    stop.removeEventListener("abort", abort);
    child.stdin.end();
    if (!closed) {
      terminate("SIGTERM");
      await Promise.race([exit, delay(500)]);
      terminate("SIGKILL");
      await exit;
    }
  }
}

module.exports = {runAcp, transport};
