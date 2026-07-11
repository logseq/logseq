# ChatGPT Logseq Plugin Research Report

Date: 2026-07-11

## Recommendation

Build the Logseq integration MCP-first and keep the first release UI-free. The existing Cloudflare Code Mode design is a good fit because it exposes a stable two-tool surface (`search` and `execute`) while the versioned OpenAPI document carries the detailed graph operations. A custom iframe would not materially improve the initial workflows, which are conversational capture, search, and graph editing.

The complete delivery sequence is:

1. Make the remote MCP app pass ChatGPT tool metadata, safety annotation, authentication, and behavior checks.
2. Connect the staging MCP endpoint as a ChatGPT developer-mode app and verify OAuth plus representative read, write, and destructive workflows.
3. Copy the generated `plugin_asdk_app...` ID.
4. Scaffold the installable plugin manifest and reference that app ID.
5. Test the plugin locally before preparing a submission.

This follows ChatGPT's current distinction: the app is the MCP-backed capability, while the plugin is the installable and publishable package containing the app reference.

## Authoritative guidance

- [Build an app](https://learn.chatgpt.com/docs/build-app) defines the app/plugin relationship, requires MCP tool metadata and safety annotations, makes custom UI optional, and requires developer-mode testing before plugin packaging.
- [Build plugins](https://learn.chatgpt.com/docs/build-plugins) requires a developer-mode app ID beginning with `plugin_asdk_app` before the plugin manifest can reference an MCP-backed app.
- [Build your MCP server](https://developers.openai.com/apps-sdk/build/mcp-server) requires tool titles, descriptions, schemas, and impact annotations. Missing `readOnlyHint`, `openWorldHint`, or `destructiveHint` is a validation error.
- [Apps SDK authentication](https://developers.openai.com/apps-sdk/build/auth) requires OAuth protected-resource metadata, authorization-server discovery, per-tool security schemes, PKCE-compatible authorization code flow, and token validation.
- [Apps SDK reference](https://developers.openai.com/apps-sdk/reference) documents the compatibility mirror in `_meta.securitySchemes` and MCP OAuth errors in `_meta["mcp/www_authenticate"]`.
- [Connect from ChatGPT](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt) documents developer-mode app creation, MCP URLs, metadata refresh, and representative ChatGPT testing.

## Current architecture fit

### Keep

- Remote Streamable HTTP MCP at `/mcp`.
- Cloudflare Code Mode progressive discovery with `search` and `execute`.
- OpenAPI summaries and descriptions for every REST operation.
- REST enforcement of graph membership, operation scopes, non-E2EE eligibility, and rate limits.
- Credentials retained in trusted host code rather than exposed to generated JavaScript.
- No full Cloudflare Agents SDK dependency.

### Add or verify

- Human-readable titles for `search` and `execute`.
- Required impact annotations for both tools.
- Top-level per-tool OAuth security schemes and `_meta.securitySchemes` mirrors.
- Absolute protected-resource metadata URLs in authentication challenges.
- JWT verification before MCP tool execution.
- A dedicated Cognito OAuth client that can use ChatGPT's callback URL and request the Logseq scopes.
- End-to-end developer-mode tests using a real non-E2EE staging graph.

## Tool safety classification

| Tool | Read only | Open world | Destructive | Reason |
| --- | --- | --- | --- | --- |
| `search` | `true` | `false` | `false` | It searches the static Logseq OpenAPI document and cannot access graph data. |
| `execute` | `false` | `false` | `true` | It can read and mutate the authenticated user's graph, including delete operations, but cannot access arbitrary external systems. |

The `execute` descriptor deliberately uses the most consequential behavior available through the tool. Individual OpenAPI operations retain their narrower scopes and descriptions, but the MCP permission prompt must not understate that generated code can select a destructive operation.

## OAuth audit

The staging MCP resource metadata exists, and the Worker verifies Cognito JWT signatures, issuer, audience, expiration, and semantic operation scopes. The current Cognito discovery document does not advertise CIMD, dynamic client registration, PKCE methods, or the Logseq resource-server scopes. ChatGPT supports a predefined OAuth client, so the practical staging path is a dedicated Cognito app client configured after ChatGPT supplies its exact callback URL.

The Worker must accept the dedicated ChatGPT app-client audience without dropping support for existing Logseq clients. This may require a controlled list of accepted Cognito client IDs rather than replacing the existing client ID.

OAuth is not considered complete until a real ChatGPT developer-mode link succeeds and both `logseq/read` and `logseq/write` appear in the issued access token.

## Developer-mode verification

Use `https://logseq-sync-staging.logseq.workers.dev/mcp` and verify:

1. ChatGPT discovers exactly `search` and `execute`.
2. Both tools show titles, descriptions, schemas, safety annotations, and OAuth security schemes.
3. Linking completes through Cognito with the generated ChatGPT callback URL.
4. `search` finds the correct endpoint for pages, capture, properties, assets, and deletion.
5. `execute` lists pages with pagination on a non-E2EE graph.
6. `execute` captures a block tree to today's journal.
7. A write appears through the normal sync protocol in Logseq.
8. A destructive call requires the expected confirmation behavior.
9. An E2EE graph returns `semantic-api-unavailable-for-e2ee`.
10. Expired or insufficient-scope tokens trigger reauthorization rather than a generic tool failure.

## Plugin packaging gate

The staging developer app uses `plugin_asdk_app_6a523b64b8d481919e4d3ee457ab54b7`, backed by a dedicated Cognito client with callback URL `https://chatgpt.com/connector/oauth/XmPLN1TTetYY`. Cognito exposes the resource-server scopes as `logseq/read` and `logseq/write`; the Worker accepts this client audience only in staging while retaining the existing Logseq client.

The local installable plugin references that real app ID and validates successfully. End-to-end verification remains open until a user completes the Cognito login and ChatGPT successfully invokes both tools against a non-E2EE staging graph.
