import http from "node:http";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { GraphManager } from "./graphs.mjs";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools.mjs";

const MAX_BODY_BYTES = 16 * 1024 * 1024;

function env(name) {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

/**
 * Points the CLI at the self-hosted sync server. LOGSEQ_SYNC_URL is the HTTP
 * base; the websocket URL is derived from it unless set explicitly.
 */
function configureSyncEndpoints() {
  const syncUrl = env("LOGSEQ_SYNC_URL");
  if (!syncUrl) {
    throw new Error("LOGSEQ_SYNC_URL is required, e.g. http://logseq-sync:8787");
  }
  const base = new URL(syncUrl);
  if (base.hostname === "casaos_ip") {
    throw new Error("LOGSEQ_SYNC_URL still has the CASAOS_IP placeholder; set your sync server address");
  }
  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new Error(`LOGSEQ_SYNC_URL must be http(s), got ${syncUrl}`);
  }
  const httpBase = base.origin + base.pathname.replace(/\/+$/, "");
  const wsBase = httpBase.replace(/^http/, "ws");
  process.env.LOGSEQ_CLI_HTTP_BASE = httpBase;
  process.env.LOGSEQ_CLI_WS_URL = env("LOGSEQ_SYNC_WS_URL") ?? `${wsBase}/sync/%s`;
  return { httpBase, wsUrl: process.env.LOGSEQ_CLI_WS_URL };
}

function loadConfig() {
  const dataDir = env("HOME") ?? "/data";
  return {
    port: Number(env("MCP_PORT") ?? 8080),
    token: env("MCP_TOKEN"),
    dataDir,
    rootDir: env("LOGSEQ_CLI_ROOT_DIR") ?? path.join(dataDir, "logseq"),
    username: env("LOGSEQ_USERNAME"),
    password: env("LOGSEQ_PASSWORD"),
    e2eePassword: env("LOGSEQ_E2EE_PASSWORD"),
    autoOpenGraphs: (env("LOGSEQ_GRAPHS") ?? "")
      .split(",")
      .map((graph) => graph.trim())
      .filter(Boolean),
    syncCheckIntervalMs: Number(env("SYNC_CHECK_INTERVAL_SECONDS") ?? 60) * 1000,
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function authorized(req, token) {
  if (!token) return true;
  return req.headers.authorization === `Bearer ${token}`;
}

async function handleMcp(req, res, manager) {
  if (req.method !== "POST") {
    // Stateless server: no standalone SSE stream and no sessions to delete.
    sendJson(res, 405, {
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed" },
      id: null,
    });
    return;
  }

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (error) {
    sendJson(res, 400, {
      jsonrpc: "2.0",
      error: { code: -32700, message: `Parse error: ${error.message}` },
      id: null,
    });
    return;
  }

  const server = new McpServer(
    { name: "logseq-selfhost", version: "1.0.0" },
    { instructions: SERVER_INSTRUCTIONS },
  );
  registerTools(server, manager);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}

async function main() {
  const endpoints = configureSyncEndpoints();
  const config = loadConfig();
  console.log(JSON.stringify({ time: new Date().toISOString(), event: "sync-endpoints", ...endpoints }));
  const manager = new GraphManager(config);
  await manager.init();

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      if (url.pathname === "/health") {
        const health = await manager.health();
        sendJson(res, health.ok ? 200 : 503, health);
        return;
      }
      if (url.pathname === "/mcp") {
        if (!authorized(req, config.token)) {
          sendJson(res, 401, { error: "unauthorized" });
          return;
        }
        await handleMcp(req, res, manager);
        return;
      }
      sendJson(res, 404, { error: "not found" });
    } catch (error) {
      console.error(error);
      if (!res.headersSent) sendJson(res, 500, { error: String(error?.message ?? error) });
    }
  });

  httpServer.listen(config.port, () => {
    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        event: "mcp-listening",
        port: config.port,
        auth: config.token ? "bearer" : "none",
      }),
    );
  });

  const shutdown = async () => {
    httpServer.close();
    await manager.shutdown();
    process.exit(0);
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
