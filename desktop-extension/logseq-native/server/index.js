const { Client } = require("@modelcontextprotocol/client");
const { StreamableHTTPClientTransport } = require("@modelcontextprotocol/client");
const { Server } = require("@modelcontextprotocol/server");
const { serveStdio } = require("@modelcontextprotocol/server/stdio");

function fail(message) {
  process.stderr.write(`[logseq-native] ${message}\n`);
  process.exit(1);
}

const endpoint = process.env.LOGSEQ_MCP_URL;
const token = process.env.LOGSEQ_MCP_TOKEN;

if (!endpoint || !token) {
  fail("Logseq MCP URL and API token are required. Configure this extension in Claude Desktop.");
}

let parsedEndpoint;
try {
  parsedEndpoint = new URL(endpoint);
} catch {
  fail("Logseq MCP URL is invalid.");
}

const loopbackHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
if (!loopbackHosts.has(parsedEndpoint.hostname) || parsedEndpoint.pathname !== "/mcp") {
  fail("This extension only accepts a loopback Logseq /mcp URL.");
}

async function start() {
  const logseqClient = new Client({
    name: "Logseq Desktop transport",
    version: "0.1.5"
  });
  const logseqTransport = new StreamableHTTPClientTransport(parsedEndpoint, {
    requestInit: {
      headers: { Authorization: `Bearer ${token}` }
    }
  });

  try {
    await logseqClient.connect(logseqTransport);
  } catch (error) {
    fail(`Could not connect to Logseq's MCP endpoint: ${error?.message || String(error)}`);
  }

  process.stderr.write("[logseq-native] Connected to Logseq's local MCP endpoint.\n");

  const handle = serveStdio(() => {
    const server = new Server(
      { name: "Logseq Local MCP", version: "0.1.5" },
      { capabilities: { tools: {} } }
    );
    server.setRequestHandler("tools/list", request =>
      logseqClient.listTools(request.params ?? {}));
    server.setRequestHandler("tools/call", request =>
      logseqClient.callTool(request.params));
    return server;
  }, {
    onerror: error => {
      process.stderr.write(`[logseq-native] MCP transport error: ${error.message}\n`);
    }
  });

  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    try {
      await handle.close();
    } catch {}
    try {
      await logseqClient.close();
    } catch {}
  };

  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());
  process.stdin.once("end", () => void close());
}

start().catch(error => {
  cleanup();
  process.stderr.write(`[logseq-native] Startup failed: ${error.message}\n`);
  process.exitCode = 1;
});