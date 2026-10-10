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

## Query approval

The extension relays Logseq's `datascriptQuery` approval form to Claude and
returns the user's decision unchanged. Claude must support MCP form elicitation;
otherwise queries are blocked. Every invocation requires approval of its exact
query and inputs, with the last-resort rationale and expected size. There is no
automatic approval or retry. Query requests and decisions are recorded in
Logseq's Electron log. Output is capped at 1000 rows and 65536 UTF-8 bytes;
the query language is not restricted to any example.

Rebuild and reinstall this extension after updating its approval forwarding,
then reconnect Claude to the rebuilt Logseq server. Local bridge validation:

```powershell
node --test server/index.test.js
```