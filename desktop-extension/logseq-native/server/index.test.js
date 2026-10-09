const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

test("the stdio bridge forwards exact approval forms and decisions, failing closed", async () => {
  const handlers = new Map();
  const downstreamHandlers = new Map();
  const forwarded = [];
  const toolCalls = [];
  let clientOptions;
  let capabilities = { elicitation: { form: {} } };
  let decision = { action: "accept", content: { approve: true } };
  let ready;
  const started = new Promise(resolve => { ready = resolve; });
  class Client {
    constructor(_identity, options) { clientOptions = options; }
    setRequestHandler(method, handler) { handlers.set(method, handler); }
    async connect() {}
    async close() {}
    async callTool(params, options) { toolCalls.push({ params, options }); }
  }
  class Server {
    setRequestHandler(method, handler) { downstreamHandlers.set(method, handler); }
    getClientCapabilities() { return capabilities; }
    async elicitInput(params, options) {
      forwarded.push({ params, options });
      return decision;
    }
  }
  const modules = {
    "@modelcontextprotocol/client": { Client, StreamableHTTPClientTransport: class {} },
    "@modelcontextprotocol/server": { Server },
    "@modelcontextprotocol/server/stdio": {
      serveStdio(factory) { factory(); ready(); return { async close() {} }; }
    }
  };
  vm.runInNewContext(readFileSync(`${__dirname}/index.js`, "utf8"), {
    require: name => modules[name], URL,
    process: {
      env: { LOGSEQ_MCP_URL: "http://127.0.0.1:12315/mcp", LOGSEQ_MCP_TOKEN: "test-only" },
      stderr: { write() {} }, stdin: { once() {} }, once() {},
      exit() { throw new Error("Unexpected exit"); }
    }
  });
  await started;
  assert.ok(clientOptions.capabilities.elicitation.form);
  const approve = handlers.get("elicitation/create");
  const params = { mode: "form", message: "Exact query and inputs", requestedSchema: { type: "object" } };
  const signal = new AbortController().signal;
  assert.equal(await approve({ params }, { signal }), decision);
  assert.equal(forwarded[0].params, params);
  assert.equal(forwarded[0].options.signal, signal);
  const toolParams = { name: "datascriptQuery", arguments: { query: "exact query" } };
  await downstreamHandlers.get("tools/call")({ params: toolParams }, { signal });
  assert.equal(toolCalls[0].params, toolParams);
  assert.equal(toolCalls[0].options.signal, signal);
  decision = { action: "decline" };
  assert.equal(await approve({ params }, { signal }), decision);
  capabilities = {};
  assert.throws(() => approve({ params }, { signal }), /does not support per-query approval/);
  assert.equal(forwarded.length, 2);
});