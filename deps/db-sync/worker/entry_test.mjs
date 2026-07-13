import assert from "node:assert/strict";
import test from "node:test";

import { chatGptToolDescriptors } from "./chatgpt_app.mjs";
import {
  logseqIconResponse,
  setLogseqMcpServerInfoIcons,
} from "./logseq_icon.mjs";
import { ensureMcpAcceptHeader } from "./mcp_request.mjs";
import { openAiAppsChallengeResponse } from "./openai_app_challenge.mjs";
import { semanticRequestBody, semanticRequestUrl } from "./semantic_request.mjs";

test("OpenAI app domain challenge returns the configured token as plain text", async () => {
  const token = "openai-domain-verification-token";
  const response = openAiAppsChallengeResponse(
    new Request("https://api.logseq.io/.well-known/openai-apps-challenge"),
    { OPENAI_APPS_CHALLENGE: token },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(await response.text(), token);
});

test("OpenAI app domain challenge fails fast when the token is not configured", () => {
  assert.throws(
    () => openAiAppsChallengeResponse(
      new Request("https://api.logseq.io/.well-known/openai-apps-challenge"),
      {},
    ),
    /OPENAI_APPS_CHALLENGE is required/,
  );
});

test("OpenAI app domain challenge route does not match nested paths", async () => {
  const response = openAiAppsChallengeResponse(
    new Request("https://api.logseq.io/mcp/.well-known/openai-apps-challenge"),
    { OPENAI_APPS_CHALLENGE: "token" },
  );

  assert.equal(response, null);
});

test("OpenAI app domain challenge route only handles GET", () => {
  const response = openAiAppsChallengeResponse(
    new Request("https://api.logseq.io/.well-known/openai-apps-challenge", { method: "POST" }),
    { OPENAI_APPS_CHALLENGE: "token" },
  );

  assert.equal(response, null);
});

test("Code Mode derives decoded asset size instead of trusting the agent", () => {
  const url = semanticRequestUrl({
    method: "POST",
    path: "/api/v1/graphs/graph-1/assets",
    query: { encoding: "base64", size: 3, checksum: "a".repeat(64) },
    body: "AQIDBA==",
    rawBody: true,
  }, "https://staging.example/mcp");

  assert.equal(url.searchParams.get("size"), "4");
});

test("Code Mode rejects invalid base64 before forwarding", () => {
  assert.throws(() => semanticRequestUrl({
    path: "/api/v1/graphs/graph-1/assets",
    query: { encoding: "base64", size: 1 },
    body: "not base64!",
  }, "https://staging.example/mcp"), /invalid base64/);

});

test("Code Mode always forwards base64 assets as a raw body", () => {
  const options = {
    path: "/api/v1/graphs/graph-1/assets",
    query: { encoding: "base64", size: 3 },
    body: "AQIDBA==",
  };
  const url = semanticRequestUrl(options, "https://staging.example/mcp");

  assert.equal(semanticRequestBody(options, url), "AQIDBA==");
});

test("ChatGPT tool descriptors declare titles, impact, and per-tool auth", () => {
  const descriptors = chatGptToolDescriptors();
  const search = descriptors.find((tool) => tool.name === "search");
  const execute = descriptors.find((tool) => tool.name === "execute");

  assert.deepEqual(search.annotations, {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  });
  assert.deepEqual(search.securitySchemes, [
    { type: "oauth2", scopes: ["logseq/read", "logseq/write"] },
  ]);
  assert.deepEqual(search._meta.securitySchemes, search.securitySchemes);

  assert.deepEqual(execute.annotations, {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
  });
  assert.deepEqual(execute.securitySchemes, [
    { type: "oauth2", scopes: ["logseq/read", "logseq/write"] },
  ]);
  assert.deepEqual(execute._meta.securitySchemes, execute.securitySchemes);
});

test("ChatGPT tools require DB graph property semantics", () => {
  const descriptors = chatGptToolDescriptors().filter((tool) => tool.name !== "get_asset_image");

  for (const tool of descriptors) {
    assert.match(tool.description, /DB graph/);
    assert.match(tool.description, /typed properties/);
    assert.match(tool.description, /key:: value/);
  }
});

test("ChatGPT tools describe the DB Task workflow", () => {
  const descriptors = chatGptToolDescriptors().filter((tool) => tool.name !== "get_asset_image");

  for (const tool of descriptors) {
    assert.match(tool.description, /\/tasks/);
    assert.match(tool.description, /never use Markdown TODO/);
    assert.match(tool.description, /never use graph search to list tasks/);
  }
});

test("ChatGPT tools describe streaming asset uploads", () => {
  for (const tool of chatGptToolDescriptors().filter((descriptor) => descriptor.name !== "get_asset_image")) {
    assert.match(tool.description, /\/assets/);
    assert.match(tool.description, /SHA-256/);
    assert.match(tool.description, /100MB/);
    assert.match(tool.description, /encoding=base64/);
    assert.match(tool.description, /decoded/);
    assert.match(tool.description, /recalculates the decoded size/);
  }
});

test("ChatGPT exposes a read-only image asset tool", () => {
  const tool = chatGptToolDescriptors().find((descriptor) => descriptor.name === "get_asset_image");

  assert.equal(tool.title, "Display Logseq image asset");
  assert.deepEqual(tool.annotations, {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  });
  assert.deepEqual(tool.securitySchemes, [{ type: "oauth2", scopes: ["logseq/read"] }]);
});

test("ChatGPT image asset tool declares a UI resource for ordinary chat rendering", () => {
  const tool = chatGptToolDescriptors().find((descriptor) => descriptor.name === "get_asset_image");

  assert.ok(tool._meta?.ui);
  assert.equal(tool._meta.ui.resourceUri, "ui://widget/logseq-asset-image.html");
  assert.equal(tool._meta["openai/outputTemplate"], "ui://widget/logseq-asset-image.html");
  assert.equal(tool.outputSchema.type, "object");
  assert.deepEqual(tool.outputSchema.required, ["uuid", "title", "mimeType", "size"]);
});

test("MCP serverInfo advertises the Logseq icon from the worker origin", () => {
  const server = { server: { _serverInfo: { name: "logseq", version: "1.0.0" } } };

  setLogseqMcpServerInfoIcons(server, new Request("https://staging.example/mcp"));

  assert.deepEqual(server.server._serverInfo.icons, [{
    src: "https://staging.example/mcp/icon.png",
    mimeType: "image/png",
    sizes: ["192x192"],
  }]);
});

test("MCP icon response serves a PNG logo", async () => {
  const response = logseqIconResponse();
  const payload = new Uint8Array(await response.arrayBuffer());

  assert.equal(response.headers.get("content-type"), "image/png");
  assert.match(response.headers.get("cache-control"), /public/);
  assert.deepEqual([...payload.slice(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
});

test("MCP requests with JSON-only Accept are upgraded for streamable HTTP discovery", () => {
  const request = new Request("https://staging.example/mcp", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });

  const upgraded = ensureMcpAcceptHeader(request);

  assert.notEqual(upgraded, request);
  assert.equal(upgraded.headers.get("accept"), "application/json, text/event-stream");
  assert.equal(upgraded.headers.get("content-type"), "application/json");
});

test("MCP requests without Accept are upgraded for streamable HTTP discovery", () => {
  const request = new Request("https://staging.example/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });

  const upgraded = ensureMcpAcceptHeader(request);

  assert.equal(upgraded.headers.get("accept"), "application/json, text/event-stream");
});

test("MCP requests that already support streamable HTTP are preserved", () => {
  const request = new Request("https://staging.example/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });

  assert.equal(ensureMcpAcceptHeader(request), request);
});
