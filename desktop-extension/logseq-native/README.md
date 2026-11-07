# Logseq Local MCP for Claude Desktop

This Desktop Extension connects Claude to the native MCP server in a running Logseq app. Logseq remains responsible for tool handling and database access; the extension only adapts Claude Desktop's local stdio transport to Logseq's loopback Streamable HTTP endpoint.

## Build

From PowerShell:

```powershell
.\build.ps1
```

The extension is written to `logseq-native.mcpb` beside the workspace's `plan.md`.

## Install

1. In Claude Desktop, open **Settings > Extensions > Advanced settings**.
2. Choose **Install Extension...** and select `logseq-native.mcpb`.
3. Configure the URL as `http://127.0.0.1:12315/mcp`.
4. Enter a fresh Logseq API token in the sensitive token field.
5. Keep the Logseq app open, with its HTTP API server and MCP enabled.

The extension accepts loopback URLs only. It does not expose Logseq or its API token to the public internet.

## Tool contracts

See the [native tool map](../../docs/mcp-native-tool-map.md) for current behavior
and the [end-to-end test guide](../../docs/mcp-native-e2e-test.md) for validation.
`findEntities` offers structured read-only page/block searches and exact counts
without raw query text or per-query approval. It retains normal authentication;
its limits bound output, not database execution time. Tool changes live in the
Logseq API/MCP server, not this transport extension.

## Query approval

The extension does not advertise MCP form elicitation. Logseq therefore shows
its Desktop Approve once/Cancel dialog for `datascriptQuery`, with Cancel as the
default. Cancel and X dismissal both refuse without running the query.
Every invocation requires approval of its exact query and inputs, with the
last-resort rationale and expected size. There is no
automatic approval or retry. Query requests and decisions are recorded in
Logseq's Electron log. Output is capped at 1000 rows and 65536 UTF-8 bytes;
the query language is not restricted to any example.

Rebuild and reinstall this extension after changing the bridge,
then reconnect Claude to the rebuilt Logseq server. Local bridge validation:

```powershell
node --test server/index.test.js
```