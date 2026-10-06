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