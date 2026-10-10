const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

test("the stdio bridge does not claim client elicitation and preserves query arguments/cancellation", async () => {
  const handlers = new Map();
  const downstreamHandlers = new Map();
  const toolCalls = [];
  let clientOptions;
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
  assert.equal(clientOptions.capabilities.elicitation, undefined);
  assert.equal(handlers.has("elicitation/create"), false);
  const signal = new AbortController().signal;
  const toolParams = { name: "datascriptQuery", arguments: { query: "exact query" } };
  await downstreamHandlers.get("tools/call")({ params: toolParams }, { signal });
  assert.equal(toolCalls[0].params, toolParams);
  assert.equal(toolCalls[0].options.signal, signal);
});