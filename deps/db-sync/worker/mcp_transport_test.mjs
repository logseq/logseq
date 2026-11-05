import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { unstable_dev } from "wrangler";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

let worker;
let endpoint;

before(async () => {
  worker = await unstable_dev(fileURLToPath(new URL("./entry.mjs", import.meta.url)), {
    config: fileURLToPath(new URL("./wrangler.toml", import.meta.url)),
    env: "",
    local: true,
    ip: "127.0.0.1",
    port: 0,
    inspectorPort: 0,
    persist: false,
    experimental: { disableExperimentalWarning: true, watch: false },
  });
  endpoint = `http://${worker.address}:${worker.port}/mcp`;
}, { timeout: 60_000 });

after(async () => {
  await worker?.stop();
});

async function request(init) {
  const response = await fetch(endpoint, { ...init, signal: AbortSignal.timeout(10_000) });
  // Read the whole body: headers alone cannot detect an abandoned SSE stream.
  return { response, body: await response.text() };
}

for (const headers of [
  {},
  { accept: "application/json" },
  { accept: "text/event-stream" },
  { accept: "application/json, text/event-stream" },
  { accept: "text/event-stream", "last-event-id": "old-event", "mcp-session-id": "old-session" },
]) {
  test(`GET rejects standalone and resumed streams: ${JSON.stringify(headers)}`, async () => {
    const { response, body } = await request({ headers });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
    assert.notEqual(response.headers.get("content-type"), "text/event-stream");
    assert.ok(body.length > 0);
  });
}

for (const method of ["HEAD", "DELETE", "PUT", "PATCH", "OPTIONS"]) {
  test(`${method} rejects unsupported MCP methods`, async () => {
    const { response, body } = await request({ method });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
    if (method === "HEAD") assert.equal(body, "");
  });
}

const initialize = {
  jsonrpc: "2.0", id: 1, method: "initialize",
  params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "transport-test", version: "1.0" } },
};

for (const accept of [undefined, "application/json", "application/json, text/event-stream"]) {
  test(`POST initialization completes with JSON: Accept ${accept}`, async () => {
    const headers = { "content-type": "application/json" };
    if (accept) headers.accept = accept;
    const { response, body } = await request({ method: "POST", headers, body: JSON.stringify(initialize) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.equal(response.headers.get("mcp-session-id"), null);
    assert.equal(JSON.parse(body).result.serverInfo.name, "logseq");
  });
}

for (const [message, status, check] of [
  [{ jsonrpc: "2.0", id: 2, method: "tools/list" }, 200, (body) => assert.ok(body.result.tools.some(({ name }) => name === "search"))],
  [{ jsonrpc: "2.0", id: 3, method: "ping" }, 200, (body) => assert.deepEqual(body.result, {})],
  [{ jsonrpc: "2.0", id: 4, method: "unsupported" }, 200, (body) => assert.equal(body.error.code, -32601)],
  [{ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "missing", arguments: {} } }, 200, (body) => assert.equal(body.result.isError, true)],
  [{ jsonrpc: "2.0", method: "notifications/initialized" }, 202, (body) => assert.equal(body, "")],
  ["invalid JSON", 400, (body) => assert.equal(body.error.code, -32700)],
]) {
  test(`POST ${message.method ?? message} completes without a stream`, async () => {
    const { response, body } = await request({
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: typeof message === "string" ? message : JSON.stringify(message),
    });
    assert.equal(response.status, status);
    if (status !== 202) assert.match(response.headers.get("content-type"), /application\/json/);
    check(status === 202 ? body : JSON.parse(body));
  });
}

test("concurrent SSE reconnect attempts all terminate", async () => {
  await Promise.all(Array.from({ length: 50 }, async () => {
    const { response } = await request({ headers: { accept: "text/event-stream" } });
    assert.equal(response.status, 405);
  }));
});

test("SDK client initializes, discovers tools and pings after a rejected SSE probe", async () => {
  const client = new Client({ name: "transport-test", version: "1.0" });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
    const { tools } = await client.listTools();
    assert.ok(tools.some(({ name }) => name === "search"));
    await client.ping();
  } finally {
    await client.close();
  }
});
