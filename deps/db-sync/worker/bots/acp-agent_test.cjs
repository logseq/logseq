const assert = require("node:assert/strict");
const {randomUUID} = require("node:crypto");
const {mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} = require("node:fs");
const {tmpdir} = require("node:os");
const {join} = require("node:path");
const {test} = require("node:test");
const {setTimeout: sleep} = require("node:timers/promises");
const {runAcp} = require("./acp-agent.cjs");
const {listen} = require("./runner-client.cjs");
const {createBotService} = require("./index.cjs");

const database = process.env.LOGSEQ_BOTS_ACP_TEST_DATABASE_URL;

function mockAdapter() {
  const assert = require("node:assert/strict");
  const {existsSync, writeFileSync, appendFileSync} = require("node:fs");
  const {basename} = require("node:path");
  const {createInterface} = require("node:readline");
  const executable = process.argv[1];
  const name = basename(executable);
  const sessionId = `${name}-session`;
  const send = message => process.stdout.write(JSON.stringify({jsonrpc: "2.0", ...message}) + "\n");
  const result = (id, value) => send({id, result: value});
  const update = (session, text) => send({method: "session/update", params: {sessionId: session,
    update: {sessionUpdate: "agent_message_chunk", content: {type: "text", text}}}});
  let promptId;
  let loaded = false;
  createInterface({input: process.stdin}).on("line", raw => {
    const {id, method, params, result: response} = JSON.parse(raw);
    appendFileSync(executable + ".log", (method ?? response?.outcome?.outcome ?? "response") + "\n");
    if (method === "initialize") {
      result(id, {protocolVersion: name === "v2" ? 2 : 1, agentCapabilities: {loadSession: name !== "no-load"}});
    } else if (method === "session/new") {
      assert.equal(params.cwd, process.cwd());
      assert.deepEqual(params.mcpServers, []);
      writeFileSync(executable + ".session", sessionId);
      result(id, {sessionId});
    } else if (method === "session/load") {
      assert.equal(params.cwd, process.cwd());
      if (params.sessionId !== sessionId || !existsSync(executable + ".session")) {
        send({id, error: {code: -32000, message: "Unknown mock session"}});
        return;
      }
      update(sessionId, "Replayed history");
      loaded = true;
      result(id, {});
    } else if (method === "session/prompt") {
      const prompt = params.prompt[0].text;
      if (prompt === "disconnect") process.exit(1);
      if (prompt === "wait") return;
      if (prompt === "approval") {
        promptId = id;
        send({id: "permission", method: "session/request_permission", params: {sessionId, options: []}});
        return;
      }
      update("other-session", "Not this turn");
      update(sessionId, `${name} ${loaded ? "resumed" : "started"}: `);
      update(sessionId, prompt);
      result(id, {stopReason: "end_turn"});
    } else if (method === "session/cancel") {
      result(promptId, {stopReason: "cancelled"});
    }
  });
}

function fixtures(t) {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), "logseq-acp-fixture-")));
  t.after(() => rmSync(cwd, {recursive: true, force: true}));
  return {cwd, launcher(name) {
    const path = join(cwd, name);
    writeFileSync(path, `#!/usr/bin/env node\n(${mockAdapter.toString()})();\n`, {mode: 0o700});
    return path;
  }};
}

function execute(path, cwd, prompt, options = {}) {
  return runAcp(path, {cwd, env: process.env, prompt, ...options});
}

test("both ACP agents complete and load their own session after restarting the subprocess", async t => {
  const {cwd, launcher} = fixtures(t);
  for (const name of ["codex", "pi"]) {
    const path = launcher(name);
    const first = await execute(path, cwd, "First task");
    assert.deepEqual(first, {state: "done", reply: `${name} started: First task`,
      providerSessionId: `${name}-session`, providerTransport: "acp-v1"});
    const next = await execute(path, cwd, "Follow up", {sessionId: first.providerSessionId});
    assert.equal(next.reply, `${name} resumed: Follow up`);
    assert.equal(next.providerSessionId, first.providerSessionId);
  }
});

test("ACP rejects incompatible or non-resumable agents and never starts another session after load failure", async t => {
  const {cwd, launcher} = fixtures(t);
  for (const name of ["v2", "no-load"]) {
    const path = launcher(name);
    await assert.rejects(execute(path, cwd, "First task"), /ACP v1 session loading/);
    assert.equal(readFileSync(path + ".log", "utf8"), "initialize\n");
  }
  const path = launcher("codex");
  await assert.rejects(execute(path, cwd, "Follow up", {sessionId: "unknown"}), /ACP request failed/);
  assert.equal(readFileSync(path + ".log", "utf8"), "initialize\nsession/load\n");
});

test("ACP cancels permission-gated turns and rejects disconnected or aborted turns", async t => {
  const {cwd, launcher} = fixtures(t);
  const path = launcher("codex");
  const approval = await execute(path, cwd, "approval");
  assert.equal(approval.state, "needs_input");
  assert.equal(approval.providerSessionId, "codex-session");
  assert.match(readFileSync(path + ".log", "utf8"), /cancelled\nsession\/cancel\n/);
  await assert.rejects(execute(path, cwd, "disconnect"), /ACP adapter closed/);
  await assert.rejects(execute(path, cwd, "wait", {signal: AbortSignal.timeout(200)}), {name: "TimeoutError"});
});

async function waitFor(read, condition) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const value = await read();
    if (condition(value)) return value;
    await sleep(40);
  }
  assert.fail("The mock Bot did not reach the expected state");
}

test("paired runner delivers a Codex to Pi workflow and resumes both bindings", {skip: !database}, async t => {
  const {cwd, launcher} = fixtures(t);
  const acpCommands = {codex: launcher("codex"), pi: launcher("pi")};
  for (const [name, path] of Object.entries(acpCommands)) {
    const key = `LOGSEQ_BOTS_${name.toUpperCase()}_ACP`;
    const previous = process.env[key];
    t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
    process.env[key] = path;
  }
  const owner = randomUUID(), graph = randomUUID(), bot = randomUUID();
  const service = await createBotService({LOGSEQ_BOTS_DATABASE_URL: database}, {graphsFor: async () => [graph]});
  const origin = "http://127.0.0.1";
  async function account(path, body) {
    const response = await service.handle(owner, new Request(origin + path, {
      method: body ? "POST" : "GET", body: body ? JSON.stringify(body) : undefined,
    }));
    assert.equal(response.status, 200);
    return response.json();
  }
  const endpoints = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.ok(url.startsWith(origin + "/bots/runner/"));
    endpoints.push(new URL(url).pathname);
    return service.handleRunner(new Request(url, options));
  });
  let controller, listener;
  async function stop() {
    controller?.abort();
    await listener;
  }
  try {
    const {credential} = await account("/bots/runners", {name: "Mock runner", agents: ["codex", "pi"], repository: "logseq/mobile"});
    const config = {credential, root: cwd, repository: "logseq/mobile", server: origin,
      commands: {codex: "/legacy-unusable", pi: "/legacy-unusable"}};
    function start() {
      controller = new AbortController();
      listener = listen(config, {pollMs: 10, signal: controller.signal});
    }
    const main = "/bots/" + bot;
    await account("/bots", {id: bot, graphId: graph, name: "Fixture", defaultAgent: "codex", repository: "logseq/mobile"});
    const {sessionId} = await account(main + "/messages", {id: randomUUID(), agents: ["codex", "pi"], body: "Prepare the change"});
    const thread = main + "/sessions/" + sessionId;
    start();
    const completed = await waitFor(() => account(thread), view => view.messages.some(message => message.author === "pi"));
    assert.deepEqual(completed.participants, ["codex", "pi"]);
    assert.match(completed.messages.find(message => message.author === "pi").body, /codex started/);
    await stop();
    await account(thread + "/messages", {id: randomUUID(), body: "Check the details"});
    const legacy = await service.handleRunner(new Request(origin + "/bots/runner/claim", {
      method: "POST", headers: {authorization: "Bearer " + credential},
    }));
    assert.equal((await legacy.json()).job, null);
    start();
    await waitFor(() => account(thread), view => view.messages.some(message => message.body.includes("codex resumed:")));
    await account(thread + "/messages", {id: randomUUID(), agent: "pi", body: "Review the follow-up"});
    const resumed = await waitFor(() => account(thread), view => view.messages.some(message => message.body.includes("pi resumed:")));
    assert.equal(resumed.messages.filter(message => message.author === "pi").length, 2);
    for (const path of Object.values(acpCommands)) {
      const requests = readFileSync(path + ".log", "utf8").trim().split("\n");
      assert.deepEqual(requests, ["initialize", "session/new", "session/prompt", "initialize", "session/load", "session/prompt"]);
    }
    assert.equal(endpoints.filter(path => path.endsWith("/complete")).length, 4);
  } finally {
    await stop();
    await service.close();
  }
});
