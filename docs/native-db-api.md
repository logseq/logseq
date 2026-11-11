# Desktop DB Graph HTTP API Reference

This reference describes the native HTTP API for **Logseq Desktop DB graphs**.
It covers connection, authentication, request format, and 127 DB-compatible
graph, discovery, resource, and Desktop-control commands in the shared API
registry. It does not describe the cloud REST API or file-graph workflows.

Commands are written as `logseq.DB.<command>`, including commands implemented
through Editor, App, or CLI aliases. Those aliases use the same native dispatch;
they do not require a separate CLI process or plugin SDK client.

This is a source-backed catalog, not a claim that every command has been tested
through HTTP against an installed Desktop build. See the
[MCP tool map](./mcp-native-tool-map.md) for MCP contracts and remaining checks.

## Contents

- [Connect and authenticate](#connect-and-authenticate)
- [HTTP methods and endpoints](#http-methods-and-endpoints)
- [Call format and responses](#call-format-and-responses)
- [PowerShell example](#powershell-example)
- [Command catalog](#command-catalog)
- [Structured search options](#structured-search-options)
- [Page and block write options](#page-and-block-write-options)
- [Property and tag options](#property-and-tag-options)
- [Batch operations and Transit import/export](#batch-operations-and-transit-importexport)
- [Native API versus MCP](#native-api-versus-mcp)
- [Registry scope and source references](#registry-scope-and-source-references)

## Connect and authenticate

1. Open Logseq Desktop and the intended **DB graph**.
2. Open Desktop's API server controls. Configure the host and port, add an access
   token, generate or enter its value, and save it. Use the **token value**, not
   its display name.
3. Start the API server. The defaults are host `127.0.0.1` and port `12315`.
   MCP does not have to be enabled to use `/api`.
4. Send requests with these headers:

   ```http
   Authorization: Bearer <desktop-api-token-value>
   Content-Type: application/json
   ```

5. Before writing, call `logseq.DB.getCurrentGraph` and
   `logseq.DB.checkCurrentIsDbGraph` to confirm the target.

The default base URL is `http://127.0.0.1:12315`. Use the configured values if
they differ. This token is a **Desktop API access token**, not a cloud
`logseq_pat_` token.

Requests target the current graph in the Desktop window servicing the server.
There is no per-request graph ID or graph-switching parameter. With multiple
windows, do not assume that the currently focused window is the server's window.

Keep the server bound to loopback unless you deliberately secure remote access.
The listener uses HTTP, and its CORS configuration allows all origins; neither
setting is a substitute for authentication. Configure a nonempty token value:
the current implementation does not enforce authentication when its configured
token collection is absent. Do not rely on an unconfigured server being secure.
Never commit tokens or paste them into diagnostic logs.

## HTTP methods and endpoints

| Endpoint | Method | Purpose | Authentication |
| --- | --- | --- | --- |
| `/` | `GET` | Built-in HTML API help page. | The exact root path is exempt. |
| `/api` | `POST` | Invoke a native command, including read-only commands. | Desktop API token. |
| `/mcp` | `GET`, `POST`, `DELETE` | Separate MCP transport, only when MCP is enabled. Not native graph-resource endpoints. | Desktop API token. |
| CORS preflight | `OPTIONS` | Handled by CORS middleware; not a graph command. | Middleware-dependent; send authentication on the actual request. |

The native API is a **command invocation API**, not resource-oriented REST.
There are no native `GET /api/pages`, `PATCH /api/blocks`, or
`DELETE /api/pages/<uuid>` routes. Reading, creating, updating, recycling, and
permanently deleting entities all use `POST /api` with different command names.

## Call format and responses

```http
POST /api HTTP/1.1
Host: 127.0.0.1:12315
Authorization: Bearer <desktop-api-token-value>
Content-Type: application/json

{"method":"logseq.DB.getAppInfo","args":[]}
```

The body has:

| Field | Type | Meaning |
| --- | --- | --- |
| `method` | string | Full command name, such as `logseq.DB.getPage`. |
| `args` | array | Positional arguments in the order listed below. Use `[]` for commands without arguments. |

For example:

```json
{"method":"logseq.DB.getPage","args":["Example page"]}
```

Optional arguments are marked `?` in the catalog. Use `null` when skipping an
optional middle argument but supplying a later one:

```json
{"method":"logseq.DB.createPage","args":["Example page",null,{"redirect":false}]}
```

This is a write example, not a connection test. A JSON object in `args` is a
single argument; its fields are not top-level request fields.

### Results and errors

- Success returns the native command's result directly: an object, array,
  scalar, or empty/null result depending on the command. It is not an MCP
  `content` envelope.
- Missing entities are method-specific: some getters return null, some return
  `{found:false,...}`, and some throw. A successful HTTP status alone does not
  prove that an entity exists or a write achieved its intended effect.
- Authentication failures return HTTP `401`.
- An incomplete call can return HTTP `400`; renderer errors, including
  unresolvable command calls, return HTTP `500` with an error message.
- Entity fields are method-specific. Normalized Editor entities and raw/query
  projections do not share one universal field naming or nesting convention.
  Do not assume that every result uses the SDK's camelCase entity shape.

IDs also vary by command: UUID strings, numeric database IDs, page names, and
qualified identifiers are not interchangeable. Prefer UUIDs for entity writes;
use a numeric ID only where explicitly accepted or required.

The server's request timeout setting is not a guaranteed graph-query execution
deadline. There is no universal native response row or byte cap. Large getters,
trees, inventories, and raw queries can produce large responses.

## PowerShell example

Provision `LOGSEQ_API_TOKEN` in your environment without storing it in this
document or a tracked script. This helper makes no automatic retries and does
not catch or hide HTTP failures:

```powershell
if ([string]::IsNullOrWhiteSpace($env:LOGSEQ_API_TOKEN)) {
    throw 'Set LOGSEQ_API_TOKEN to a configured Desktop API token.'
}

$baseUrl = 'http://127.0.0.1:12315'
$headers = @{ Authorization = "Bearer $env:LOGSEQ_API_TOKEN" }

function Invoke-LogseqDbApi {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Command,
        [object[]] $Arguments = @()
    )

    $body = @{
        method = "logseq.DB.$Command"
        args = $Arguments
    } | ConvertTo-Json -Depth 20 -Compress

    Invoke-RestMethod -Uri "$baseUrl/api" -Method Post -Headers $headers `
        -ContentType 'application/json; charset=utf-8' `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
}

Invoke-LogseqDbApi -Command getAppInfo
Invoke-LogseqDbApi -Command getCurrentGraph
Invoke-LogseqDbApi -Command checkCurrentIsDbGraph
Invoke-LogseqDbApi -Command listPages -Arguments @(@{ expand = $false })
```

These example calls read information; they do not mutate the graph.

## Command catalog

All commands below use `POST /api`. Effects:

- **R**: graph/configuration/UI-state read, discovery, or local utility.
- **W**: graph or stored configuration write.
- **U**: Desktop UI/navigation/application control; may depend on current UI state.
- **E**: triggers a Desktop export/download, rather than streaming a file in the HTTP response.
- **D**: irreversible deletion; use only with explicit authorization and a backup.

Effects describe native commands, not MCP approval policies. A return value is
not automatically write verification.

### Connection, graph context, and configuration

| Command | Arguments, in order | Purpose / result | Effect |
| --- | --- | --- | --- |
| `logseq.DB.getAppInfo` | none | Application version and DB support information (`version`, `supportDb`). | R |
| `logseq.DB.checkCurrentIsDbGraph` | none | Whether the current graph is DB-based. The `DB` prefix alone does not enforce this for every alias. | R |
| `logseq.DB.getCurrentGraph` | none | Current graph's `url`, `name`, and `path`, or null for no applicable graph. | R |
| `logseq.DB.getMcpApiMethods` | none | Sorted callable shared-registry names in snake_case. Not a list of MCP tools. | R |
| `logseq.DB.getContentCapabilities` | none | Rendering/plugin capability discovery. Native result does not include MCP-only creation-policy additions. | R |
| `logseq.DB.getUserConfigs` | none | User preferences and context. May include personal/account information; avoid logging the complete response. | R |
| `logseq.DB.getCurrentGraphConfigs` | `key1?`, `key2?`, ... | Whole graph configuration, or nested lookup using the positional key path. | R |
| `logseq.DB.setCurrentGraphConfigs` | `configs: object` | Update supplied graph configuration keys. | W |
| `logseq.DB.getCurrentGraphFavorites` | none | Current graph favorites. | R |
| `logseq.DB.getCurrentGraphRecent` | none | Recently accessed pages. | R |
| `logseq.DB.getStateFromStore` | `path: string or array` | Developer-level renderer state lookup. A string is a single path component; `@`-prefixed components preserve string keys. | R |
| `logseq.DB.setStateFromStore` | `path: string or array`, `value` | Developer-level renderer state assignment; not a durable graph-property API. | U |
| `logseq.DB.forceSaveGraph` | none | Currently returns `true` without performing a graph flush. Do not use as a persistence guarantee. | R |

### Pages and journals

| Command | Arguments, in order | Purpose / result | Effect |
| --- | --- | --- | --- |
| `logseq.DB.listPages` | `options?: {expand?: boolean}` | Visible named-entity inventory. Expanded rows add creation/update timestamps. No native pagination or title filter. | R |
| `logseq.DB.getAllPages` | none | All non-hidden named entities. Not a strict Page-class-only inventory. | R |
| `logseq.DB.getPage` | `nameOrUuid` | Resolve a page/entity through native page lookup; returns an entity or null. | R |
| `logseq.DB.getPageData` | `pageNameOrUuid: string` | Page data as `{entity, blocks}`, including the nested outline. A missing page produces an error. | R |
| `logseq.DB.getTodayPage` | none | Today's journal page, if present. | R |
| `logseq.DB.getCurrentPage` | none | Current UI page, if applicable. | R |
| `logseq.DB.getPageBlocksTree` | `pageNameOrUuid` | Full page outline. Can be large. | R |
| `logseq.DB.getCurrentPageBlocksTree` | none | Full outline of the current UI page. | R |
| `logseq.DB.getPageBlockUUIDs` | `pageUuid: string` | Descendant projections with UUIDs and hierarchy/title information, not merely UUID strings. Throws for a missing target or a block target. | R |
| `logseq.DB.inspectPage` | `pageUuid`, `detail?: "page" \| "blocks" \| "tags" \| "properties" \| "declared" \| "all"` | Inspection envelope with `found`, `page_uuid`, and requested detail. Default detail is `page`. | R |
| `logseq.DB.getPageStats` | `pageUuid` | Structural, empty-block, reference, tag/property-holder, and alias statistics. Throws when the target cannot be inspected as a page. | R |
| `logseq.DB.getPageProperties` | `pageNameOrUuid` | Read the page's property values. | R |
| `logseq.DB.getJournalCandidates` | none | Entities with journal-day metadata. Does not create journals. | R |
| `logseq.DB.createPage` | `name: string`, `properties?: object`, `options?: object` | Create/reuse a page using native behavior. MCP preflights exact-title conflicts and orchestrates recycled-title reuse; case-variant preflight can disagree with native resolution. See [write options](#page-and-block-write-options). | W/U |
| `logseq.DB.createJournalPage` | `date: string or timestamp` | Create a journal without redirecting. `YYYY-MM-DD` means that exact local calendar day; timestamps/date-time strings use the parsed instant's local day. Invalid dates do not create a page. | W |
| `logseq.DB.renamePage` | `pageUuid: string`, `newName: string` | Rename the exact page UUID; returns `true` on completion. Do not pass its title in place of the UUID. | W |
| `logseq.DB.deletePage` | `pageName: string` | Recycle a page through the native handler, preserving its title. Does not perform MCP's reference acknowledgements or preservation read-back. | W |
| `logseq.DB.restorePage` | `pageNameOrUuid` | Restore a recycled page. | W |
| `logseq.DB.listRecycled` | none | Entities with a deletion marker. Not an automatic purge operation. | R |
| `logseq.DB.deleteRecycledPagePermanently` | `pageNameOrUuid` | Permanently delete a resolved recycled page; only invokes deletion when it is recycled. This API exists even though MCP has no recycle-bin purge tool. | D |

Use `findEntities` with `kind:"page"` when you need a Page-class inventory and an
explicit live/recycled state. Named-entity lists and page inspection routes are
not interchangeable with that classification.

### Blocks, outlines, and embeds

| Command | Arguments, in order | Purpose / result | Effect |
| --- | --- | --- | --- |
| `logseq.DB.getBlock` | `uuidOrNumericId`, `options?: {includeChildren?, includePage?, camelCase?}` | Read a normalized entity. `includeChildren:true` expands descendants; otherwise children are immediate UUID references. `includePage:true` allows a page target. | R |
| `logseq.DB.getCurrentBlock` | `options?: object` | Read the current editing block using block-read options. | R |
| `logseq.DB.getPreviousSiblingBlock` | `uuid`, `options?: object` | Previous sibling, using block-read options. | R |
| `logseq.DB.getNextSiblingBlock` | `uuid`, `options?: object` | Next sibling, using block-read options. | R |
| `logseq.DB.getBlockTree` | `blockUuid`, `maxDepth: integer 0..100`, `maxNodes: integer 1..1000` | `{found, block_uuid, block, node_count, truncated}`. Supply both limits; the native route has no MCP defaults. Root depth is zero. | R |
| `logseq.DB.newBlockUuid` | none | Generate a UUID; does not insert a block. | R |
| `logseq.DB.insertBlock` | `targetUuidOrPageName`, `content: string`, `options?: object` | Insert one block. Native placement uses boolean options, not MCP placement strings. | W |
| `logseq.DB.insertBatchBlock` | `targetUuidOrPageName`, `blocks: array`, `options?: object` | Insert a batch, including nested `children`. See [write options](#page-and-block-write-options). | W |
| `logseq.DB.prependBlockInPage` | `pageNameOrUuid`, `content: string`, `options?: object` | Insert at a page's start. A missing named page can be created; null can select the current/today page. | W |
| `logseq.DB.appendBlockInPage` | `pageNameOrUuid`, `content: string`, `options?: object` | Insert at a page's end. May create a missing named page. Explicit page/content arguments are recommended for HTTP. | W |
| `logseq.DB.updateBlock` | `uuid`, `content: string`, `options?: object` | Update text and optional properties/schema. No automatic read-back verification. | W |
| `logseq.DB.moveBlock` | `sourceUuid`, `targetUuid`, `options?: {before?: boolean, children?: boolean}` | Move relative to the target, or into its children. | W |
| `logseq.DB.removeBlock` | `uuid`, `options?: object` | Remove through the native editor handler. The options argument is currently ignored. | W |
| `logseq.DB.setBlockCollapsed` | `uuid`, `flagOrOptions: boolean or "toggle" or {flag: boolean or "toggle"}` | Collapse, expand, or toggle. An absent flag is coerced to false; pass it explicitly. | W |
| `logseq.DB.setBlockIcon` | `blockId`, `iconType: "tabler-icon" or "emoji"`, `iconName: string` | Set an icon. Emoji input is a recognized emoji name, not arbitrary text. | W |
| `logseq.DB.removeBlockIcon` | `blockId` | Remove the icon property. | W |
| `logseq.DB.createEmbed` | `parentUuid`, `targetUuid` | Insert an empty linked block targeting a live page/block. Rejects self/ancestor targets and property targets; returns the inserted entity. | W |
| `logseq.DB.listEmbeds` | `options?: {page_uuid?, target_uuid?, limit?}` | Live embed inventory as `{embeds, count, truncated}`. UUID filters; limit defaults to 100, range 1..1000. Not a missing-target audit. | R |

For `getBlock`, omitted options default to allowing a page target; when supplying
an options object for a page, explicitly include `includePage:true`.
`camelCase` defaults to true.

### Search, references, and title audits

| Command | Arguments, in order | Purpose / result | Effect |
| --- | --- | --- | --- |
| `logseq.DB.findEntities` | `options: object` | Structured, literal, bounded-output page/block search, including exact counts. See [structured search options](#structured-search-options). | R |
| `logseq.DB.search` | `query: string`, `options?: {limit?: number, "page-db-id"?: number or string, "more?"?: boolean}` | Native search-index lookup. Default limit is 10; page scope uses a numeric ID or stored page name, not a UUID. Not guaranteed literal substring matching; MCP `searchBlocks` adds its own filtering. | R/U |
| `logseq.DB.getBacklinks` | `targetUuid` | `{target_uuid, total, refs, tagged, property_values, diagnostic}`. Counts reference categories, not necessarily unique referring entities. | R |
| `logseq.DB.getPageLinkedReferences` | `pageNameOrUuid` | Linked references grouped by containing page. | R |
| `logseq.DB.getTagUsers` | `tagUuid` | Entities holding the tag. | R |
| `logseq.DB.getPropertyUsers` | `qualifiedIdent: string` | Holders, stored values, and optional resolved value entities for an exact identifier such as `:user.property/Effort`. Not a title/UUID lookup. | R |
| `logseq.DB.getTitleHolders` | `title: string` | Exact-title holders, including deletion metadata. No case folding or canonical page-name resolution; not an availability boolean. | R |
| `logseq.DB.getTitleInventory` | none | Page/tag rows with `id`, `uuid`, `title`, `kind`, and `recycled`. Useful for cross-state title audits. | R |
| `logseq.DB.getOrphanTags` | none | Tags with no tag holders; not a universal no-inbound-reference audit. | R |
| `logseq.DB.getOrphanProperties` | none | Unused namespaced property attributes with `ident`, `title`, and `type`; not arbitrary orphan blocks. | R |
| `logseq.DB.q` | `query: string` | Native query DSL; returns flattened results. Not Datalog and not the framed search API. | R |
| `logseq.DB.customQuery` | `query: string` | EDN custom-query form; returns flattened results. JSON cannot supply executable result-transform callbacks. | R |
| `logseq.DB.datascriptQuery` | `datalog: string`, `input1?`, `input2?`, ... | Raw Datalog plus positional inputs; native query context can resolve current-page/today values. Not the MCP approval wrapper. | R |

Prefer dedicated reads or `findEntities` for supported questions. Native raw
queries have no MCP wrapper row/byte cap or per-call approval dialog. An agent
operating under an approval-gated MCP workflow must not use HTTP as a way around
that requirement. Only use raw HTTP queries when that integration and operation
are explicitly authorized.

For UUID-scoped literal content, prefer `findEntities.page_uuid`. Native
`search` resolves a string `page-db-id` by stored `:block/name`; an unresolved
name leaves the search unscoped. Its `more?` option selects the Desktop UI's
more-result state, not a structured-search cursor.

### Tags and inheritance

| Command | Arguments, in order | Purpose / result | Effect |
| --- | --- | --- | --- |
| `logseq.DB.listTags` | `options?: {expand?: boolean}` | Minimal title/UUID rows, or expanded class schema. No native pagination. | R |
| `logseq.DB.getAllTags` | none | Class/tag entities excluding the root class. | R |
| `logseq.DB.getTag` | `uuidOrNumericIdOrIdentOrTitle` | Resolve one tag; use exact identity for writes when titles are ambiguous. | R |
| `logseq.DB.getTagsByName` | `name: string` | Matching tags by name, rather than assuming one title holder. | R |
| `logseq.DB.getTagObjects` | `tagUuidOrIdentOrTitle` | Objects belonging to the resolved class/tag. | R |
| `logseq.DB.createTag` | `title: string`, `options?: {uuid?, tagProperties?}` | Create a tag. Title must be nonblank and cannot contain `/`. See [tag options](#property-and-tag-options). | W |
| `logseq.DB.addTagExtends` | `tagId`, `parentTagId` | Add class inheritance. Built-in inheritance modification is rejected. | W |
| `logseq.DB.removeTagExtends` | `tagId`, `parentTagId` | Remove class inheritance. Built-in inheritance modification is rejected. | W |
| `logseq.DB.addBlockTag` | `blockIdOrName`, `tagId` | Tag an existing entity; returns the updated entity when resolved. | W |
| `logseq.DB.removeBlockTag` | `blockIdOrName`, `tagId` | Remove the tag value from an entity. | W |
| `logseq.DB.addTagProperty` | `tagId`, `propertyIdOrName` | Declare a property on the class. Private built-in properties are rejected. | W |
| `logseq.DB.removeTagProperty` | `tagId`, `propertyIdOrName` | Remove a declared class property. | W |

There is no separately exported native `deleteTag` command. MCP's `deleteTag`
orchestrates existing native operations; do not send a nonexistent
`logseq.DB.deleteTag` call.

### Property definitions, values, and enums

| Command | Arguments, in order | Purpose / result | Effect |
| --- | --- | --- | --- |
| `logseq.DB.listProperties` | `options?: {expand?: boolean}` | Minimal title/UUID rows, or expanded property schema. No native pagination. | R |
| `logseq.DB.getAllProperties` | none | Property definition entities. | R |
| `logseq.DB.getProperty` | `propertyNameOrIdent: string` | Resolve a property; unqualified names use caller/plugin namespace rules. | R |
| `logseq.DB.getPropertiesByTitle` | `title: string` | Exact-title matching property definitions; useful when one display title has multiple identifiers. | R |
| `logseq.DB.upsertProperty` | `key: string`, `schema: object`, `options?: object` | Create/update a caller-owned property definition. Names are sanitized and schema is normalized; see [property options](#property-and-tag-options). | W |
| `logseq.DB.removeProperty` | `key: string` | Remove a plugin-property definition. Non-plugin identifiers are rejected. | W |
| `logseq.DB.getBlockProperty` | `blockUuid`, `key: string` | Read one value by resolved property identifier. | R |
| `logseq.DB.getBlockProperties` | `blockUuid` | Read the block's property values. | R |
| `logseq.DB.upsertBlockProperty` | `blockUuid`, `key: string`, `value`, `options?: {entityId?, reset?, schema?}` | Assign value(s). Existing qualified properties can be used; creating a definition must pass caller-namespace controls. | W |
| `logseq.DB.removeBlockProperty` | `blockUuid`, `key: string` | Remove the property value from this block, not its definition. | W |
| `logseq.DB.addPropertyValueChoices` | `property: uuid or {uuid}`, `choices: array of uuid or {uuid}` | Add existing value entities as closed-value choices. Not an array of display labels. | W |
| `logseq.DB.setPropertyNodeTags` | `propertyId`, `numericTagIds: number[]` | Set allowed node classes on a property. Tag IDs must be numeric database IDs, not UUID strings. | W |
| `logseq.DB.getClosedValues` | `options?` | Property/value pairs for existing closed choices, including built-in enums. Default/`include_metadata:false` preserves the original projection; `include_metadata:true` additionally returns property `valueType`, choice `id` and directly stored deletion metadata. Options accept only the optional boolean `include_metadata`. No UUID/content expansion or writes. | R |
| `logseq.DB.getStatusRows` | none | Entity/status-value pairs for entities with Status. | R |

### Assets, DB-stored resources, and graph transfer

| Command | Arguments, in order | Purpose / result | Effect |
| --- | --- | --- | --- |
| `logseq.DB.listAssets` | none | Asset-class metadata in UUID order: UUID, title, type, size, checksum, external URL/name. Excludes only directly deleted assets; inherited parent/page recycling is not filtered. Not asset bytes. | R |
| `logseq.DB.makeAssetUrl` | `path: string` | Resolve an asset path to an environment-specific accessible URL. Absolute URLs are returned directly. Not a downloadable HTTP asset endpoint. | R |
| `logseq.DB.getFileContent` | `path: string` | Read a stored file record from the current graph. Not a page-Markdown export. | R |
| `logseq.DB.setFileContent` | `path: string`, `content: string` | Write a permitted DB-stored resource: `logseq/custom.js`, `logseq/custom.css`, `logseq/publish.js`, or `logseq/publish.css`. Other paths are rejected. | W |
| `logseq.DB.upsertNodes` | `operations: array`, `options?: {"dry-run"?: boolean}` | Validate/build and optionally import batch additions/block edits. Returns a summary string; see [batch operations](#batch-operations-and-transit-importexport). | W, or R for dry run |
| `logseq.DB.exportEdn` | `options?: object` | Return graph/export metadata and a Transit-encoded `export-body` string. Default export type is `graph`. | R |
| `logseq.DB.importEdn` | `transitEncodedExport: string` | Import a Transit-encoded export structure. Plain EDN text is not the input contract. | W |
| `logseq.DB.downloadGraphDb` | none | Trigger a Desktop DB graph download. No HTTP file stream is returned. | E |
| `logseq.DB.downloadGraphPages` | none | Trigger a Desktop graph-pages download. No HTTP file stream is returned. | E |

Writing JavaScript resources can change executed application/publishing behavior.
Treat such writes as code changes, not harmless text updates.

### Editor state and selection

| Command | Arguments, in order | Purpose / result | Effect |
| --- | --- | --- | --- |
| `logseq.DB.checkEditing` | none | Editing block UUID string, or false. | R |
| `logseq.DB.getEditingBlockContent` | none | Text in the active editing buffer. | R |
| `logseq.DB.getEditingCursorPosition` | none | Active cursor-position information. | R |
| `logseq.DB.getSelectedBlocks` | none | Currently selected blocks. | R |
| `logseq.DB.clearSelectedBlocks` | none | Clear UI selection. | U |
| `logseq.DB.selectBlock` | `uuid` | Select an existing block. | U |
| `logseq.DB.editBlock` | `uuid`, `options?: {pos?: number}` | Enter editing mode at a numeric position; omit `pos` to use the native end-of-block default. The JSON string `"max"` is not the internal keyword default. | U |
| `logseq.DB.exitEditingMode` | `select?: boolean` | Exit editing, optionally selecting the block. | U |
| `logseq.DB.insertAtEditingCursor` | `content: string` | Insert into the current editing buffer. Depends on an active editor. | W/U |
| `logseq.DB.restoreEditingCursor` | none | Restore saved cursor state. | U |
| `logseq.DB.saveFocusedCodeEditorContent` | none | Save the currently focused code editor's content. | W/U |

### Desktop navigation and UI controls

| Command | Arguments, in order | Purpose / result | Effect |
| --- | --- | --- | --- |
| `logseq.DB.getCurrentRoute` | none | Current UI route and parameters. | R |
| `logseq.DB.pushState` | `route: string`, `params?: object`, `query?: object` | Navigate, adding a history entry. For `page`, use `params.name`; `query.anchor` selects an anchor. | U |
| `logseq.DB.replaceState` | `route: string`, `params?: object`, `query?: object` | Navigate, replacing the current history entry. Same route arguments as `pushState`. | U |
| `logseq.DB.openInRightSidebar` | `numericIdOrUuid` | Open an entity in the sidebar. The plugin-key string variant requires plugin context and is not a plain entity identifier. | U |
| `logseq.DB.setLeftSidebarVisible` | `flag: boolean or "toggle"` | Show/hide/toggle the left sidebar. | U |
| `logseq.DB.setRightSidebarVisible` | `flag: boolean or "toggle"` | Show/hide/toggle the right sidebar. | U |
| `logseq.DB.clearRightSidebarBlocks` | `options?: {close?: boolean}` | Clear sidebar blocks, optionally closing the sidebar. | U |
| `logseq.DB.showThemes` | none | Open the theme chooser. | U |
| `logseq.DB.setThemeMode` | `mode: string` | Set application theme mode. | U |
| `logseq.DB.openExternalLink` | `url: string` | Open an HTTP(S) URL externally. | U |
| `logseq.DB.openPdfViewer` | `blockIdentityOrFileUrl` | Open the Desktop PDF viewer for an asset identity/path/URL. Not a PDF-byte response. | U |
| `logseq.DB.invokeExternalCommand` | `commandType: string`, `arg1?`, `arg2?`, ... | Invoke a supported application command-bus command (`logseq.*`). Not a graph CRUD API or arbitrary shell runner. | U |
| `logseq.DB.showMsg` | `content: string`, `status?: string`, `options?: {key?, timeout?}` | Display a notification; returns its key. Default status is success; timeout zero keeps it visible. | U |
| `logseq.DB.queryElementRect` | `selector: string` | DOM element bounding rectangle, if found. | R |
| `logseq.DB.queryElementById` | `id: string` | DOM element description such as `TAG#id`, if found; not a graph entity query. | R |
| `logseq.DB.relaunch` | none | Relaunch Desktop; interrupts API availability. | U |
| `logseq.DB.quit` | none | Quit Desktop; stops this API server. | U |

## Structured search options

`logseq.DB.findEntities` accepts one JSON object:

| Option | Accepted values / meaning |
| --- | --- |
| `kind` | Required: `"page"` or `"block"`. Uses canonical entity classification. |
| `state` | `"live"` (default), `"recycled"`, or `"all"`. Recycling includes relevant ancestry/owning-page state. |
| `name_source` | `"title"` (default), `"alias"`, or `"both"`. Alias matching is valid only for `kind:"page"`. Controls the names tested by title filters; does not change the returned entity's own title. |
| `page_uuid` | Optional existing Page-class UUID; only valid for `kind:"block"`. |
| `where` | Optional filter tree: a leaf, `{"all":[...]}`, or `{"any":[...]}`. Groups must be nonempty. |
| `select` | Row fields: `uuid`, `title`, `page_uuid`, `page_title`, `parent_uuid`, `recycled`, `aliases` (pages only), `matched_names`. Defaults to `["uuid","title","page_uuid"]`; name details are fetched only when selected. |
| `output` | `"rows"` (default) or `"count"`. |
| `limit` | Row limit: default 50; integer 1..1000. Applies to row output, not the count total. |
| `cursor` | Returned continuation object `{after_id,basis_rev,fingerprint}`; omit on the first call. Not allowed with count output. |

Allowed filter leaves:

| Field | Operator | Value |
| --- | --- | --- |
| `title` | `equals`, `contains`, `starts_with` | Literal string, up to 1024 characters. `contains`/`starts_with` require nonempty text; `equals` also accepts `""`. Matching is case-sensitive. |
| `title` | `empty` | No value; matches the exact empty string, not whitespace. |
| `position` | `eq` | `"first_outline_child"`; only valid for `kind:"block"`. |
| `has_children` | `eq` | Boolean. |
| `has_link` | `eq` | Boolean; tests embed/link structure, not every textual reference. |

At most 32 filter nodes and depth 4 are allowed, with the root at depth zero.
There are no arbitrary attributes, regexes, Datalog, or JavaScript callbacks.
With `name_source:"alias"`, title filters test the titles of entities referenced
by the result page's `:logseq.property/alias` or legacy `:block/alias` relations.
`"both"` tests the page's own title as well. A single candidate name must satisfy
the whole filter; structural predicates still describe the result page. There is
no automatic case folding, recursive alias-chain resolution or choice of one
target when several pages declare the same alias.

Results and exact counts are distinct result entities, not individual matching
names. `state` filters those entities; `"live"` additionally excludes recycled
alias names. `"recycled"` and `"all"` allow either live or recycled names on the
selected entities. `aliases` lists declared names as `{uuid,title,recycled}`;
`matched_names` lists qualifying names as `{uuid,title,source,recycled}`, with
`source:"title"` or `"alias"`. These arrays are UUID-ordered (matched names first
group by source) and share the response byte cap. An oversized single row errors;
select fewer fields rather than assuming an alias list was silently truncated.
Rows keep the declaring page's UUID and title. A title-only match can still be
an alias entity's own page; inspect the match details rather than assuming it
was resolved to another page.

For alias-only lookup:

```json
{
  "method": "logseq.DB.findEntities",
  "args": [{
    "kind": "page",
    "name_source": "alias",
    "where": {"field": "title", "op": "equals", "value": "Alpha"},
    "select": ["uuid", "title", "matched_names"]
  }]
}
```

For a paginated graph-wide alias inventory, omit `where` and use
`{"kind":"page","name_source":"alias","select":["uuid","title","aliases"]}`.
Only pages with qualifying aliases are included; use title mode with the same
selection to include pages with no aliases (their `aliases` is `[]`).

First-outline-child means the first direct ordinary outline child by order/ID,
excluding built-in view children and structural/property-value children.

Example: find empty first outline blocks without children or an embed link:

```json
{
  "method": "logseq.DB.findEntities",
  "args": [{
    "kind": "block",
    "state": "live",
    "where": {
      "all": [
        {"field": "title", "op": "empty"},
        {"field": "position", "op": "eq", "value": "first_outline_child"},
        {"field": "has_children", "op": "eq", "value": false},
        {"field": "has_link", "op": "eq", "value": false}
      ]
    },
    "select": ["uuid", "title", "page_uuid", "page_title"],
    "limit": 50
  }]
}
```

This is a finder, not a deletion instruction: inspect candidate identities
before making repairs. `has_link:false` does not replace a reference audit.

For literal content on one page, use `kind:"block"`, `page_uuid`, and a
`title`/`contains` leaf. For a cross-state page count:

```json
{"method":"logseq.DB.findEntities","args":[{"kind":"page","state":"all","output":"count"}]}
```

Both modes return `{output,matches,count,count_is_exact,truncated,next_cursor,limits}`.
Row output stores projected rows in `matches`, with `count_is_exact:false`;
`count` is the number of returned rows, not all matches. Count output returns
the exact total, `count_is_exact:true`, `matches:[]`, `truncated:false`, and
`next_cursor:null`. A completed row search also has `next_cursor:null`.

Rows are ordered by internal entity ID. Send the returned cursor unchanged with
the same graph/search for the next page; the limit may change. A graph revision
change invalidates the cursor. Restart the search rather than guessing cursor
fields or silently combining results from different revisions.

The serialized response cap is 65,536 UTF-8 bytes. A single oversized row errors;
request fewer fields. These output limits **do not bound database execution time
or scan work**.

## Page and block write options

Use native spellings, not MCP's `dry_run`, `verbose`, acknowledgement flags,
placement strings, or import format options.

| Command | Native options |
| --- | --- |
| `createPage` | `redirect`, `journal`, `class`, `customUUID`, `schema`; `format` is also accepted by the shared Editor entry point, but is not a DB storage-format selector. Prefer `redirect:false` for an integration. |
| `insertBlock` | `before`, `start`, `end`, `sibling`, `customUUID`, `properties`, `autoOrderedList`, `schema`. |
| `insertBatchBlock` | `sibling`, `before`, `schema`. |
| `updateBlock` | `properties`, `schema`, `reset-property-values`. |
| `moveBlock` | `before`, `children`. |

Batch block nodes use `content`, optional `uuid`, `properties`, and nested
`children`. For example, with an authorized disposable page UUID:

```json
{
  "method": "logseq.DB.insertBatchBlock",
  "args": [
    "<page-uuid>",
    [{"content":"Parent","children":[{"content":"Child"}]}],
    {"sibling":false}
  ]
}
```

Custom UUID conflicts are errors. Properties use the native namespace/schema
rules below. Existing property schemas should be changed through
`upsertProperty`, not by supplying a replacement schema during value assignment.

`appendBlockInPage` also has native overloads `(content)`, `(page, content)`,
and `(content, options)`. The catalog uses the explicit
`(page, content, options)` form to avoid dependence on current UI context.

## Property and tag options

### Property identifiers and schema

Qualified identifiers such as `:user.property/Effort`,
`:logseq.property/status`, and `:plugin.property.<id>/Effort` identify different
properties. Display titles are not identifiers, and one title can have multiple
holders. Unqualified names resolve in the caller/plugin property namespace.
An HTTP access token does not itself establish a plugin identity.

Definition upsert is restricted to the caller-owned namespace; deleting a
definition is restricted to plugin-property identifiers. Native value assignment
can target an existing qualified property without taking over short-name lookup.
Do not assume that HTTP and MCP have identical additional namespace restrictions.
An unavailable caller context or a disallowed namespace can produce an error.

`upsertProperty` sanitizes names, including trimming and removing spaces and
leading colon/underscore/whitespace characters. Do not expect a supplied display
name such as `"mcp test text"` to remain unchanged. Read back the definition and
its actual identifier/title.

Its schema accepts:

| Field | Values / role |
| --- | --- |
| `type` | `default`, `number`, `date`, `datetime`, `checkbox`, `url`, `node`, `asset`, `json`, `string`. |
| `cardinality` | `one` or `many`; also normalized from `db.cardinality/one` or `db.cardinality/many`. |
| `hide` | Visibility flag, normalized to the native hide property. |
| `public` | Public flag, normalized by the native API. |

The options object is passed as native property-creation options; `properties`
can provide values on the definition entity. It is not an MCP
`createProperty` options object.

For `upsertBlockProperty`, `entityId:true` indicates entity-ID values;
`reset:true` resets existing many-valued values before assignment; `schema`
can define a newly created property. Many-valued assignment otherwise adds
values, and null can remove a value assignment. JSON properties do not support
multiple values. Consult the property definition before choosing value types.

### Tag creation

`createTag` accepts optional `uuid` and `tagProperties`. Each `tagProperties`
entry contains `name`, `schema`, and optional `properties`, following native
property-creation rules. These are class declarations, not a list of block
tag values. Inheritance and declared-property changes have separate commands.

## Batch operations and Transit import/export

### `upsertNodes`

The input is an array of objects with:

- `operation`: `"add"` or `"edit"`.
- `entityType`: `"page"`, `"block"`, `"tag"`, or `"property"`.
- `id`: optional local ID for a newly added page, or the UUID for a block edit.
- `data`: type-specific fields below.

Supported operations:

| Operation | Required / optional `data` |
| --- | --- |
| Add page | Required `title`. A local operation `id` lets block additions target the same new page. |
| Add block | Required `title` and `page-id`; optional `tags` array of existing tag UUIDs. `page-id` must be an existing page UUID or a new page's local ID from this call, not a page title. |
| Edit block | Required operation `id` UUID and `data.title`. Tags and placement edits are not supported here. |
| Add tag | Required `title`; optional `class-extends`, `class-properties` arrays of identifiers resolved by the batch builder. |
| Add property | Required `title`; optional `property-type`, `property-cardinality` (`one`/`many`), and `property-classes`. Class restrictions imply node type. |

Page, tag, and property edits are rejected. This batch API does not support
deletion or arbitrary nested outline placement.

Dry run validates and builds the import without applying it. The native key is
**`dry-run`**, not `dry_run`:

```json
{
  "method": "logseq.DB.upsertNodes",
  "args": [
    [
      {"operation":"add","entityType":"page","id":"new-page","data":{"title":"Example page"}},
      {"operation":"add","entityType":"block","data":{"page-id":"new-page","title":"Example block"}}
    ],
    {"dry-run":true}
  ]
}
```

The return is a summary string, not a verified result or a UUID mapping.

### `exportEdn` and `importEdn`

`exportEdn` uses native **hyphenated** keys:

| `export-type` | Additional options |
| --- | --- |
| `graph` | Default; machine-oriented graph datom export. |
| `graph-human` | `graph-options`, including `include-timestamps?`, `exclude-namespaces`, and other native human-export options. |
| `graph-ontology` | Export property/class definitions. |
| `page` | Required numeric `page-id`. |
| `block` | Required numeric `block-id`. |
| `selected-nodes` | `node-ids`: numeric entity IDs. |
| `view-nodes` | `rows`: numeric node IDs, or grouped rows when `group-by?` is true. |

```json
{"method":"logseq.DB.exportEdn","args":[{"export-type":"graph"}]}
```

The native result contains `export-body` (a **Transit-encoded string**) and
`graph`. Pass that string as the sole `importEdn` argument when intentionally
importing; do not pass the whole response, plain EDN source, or JSON parsed
without a Transit codec. Import is a graph write; export does not prove that a
subsequent import is safe for an existing graph.

For advanced human-export flags, use the
[native exporter](../deps/db/src/logseq/db/sqlite/export.cljs) as the authority.

## Native API versus MCP

The MCP tool names are not automatically native API commands. For example:

| MCP tool | Native route(s) / distinction |
| --- | --- |
| `searchBlocks` | Native `search` plus MCP literal-result filtering. Use `findEntities` for framed literal native search. |
| `suggestLinks` | MCP-only draft analysis over native `findEntities` title/alias reads; not a new native command. |
| `getGraphHealth` | MCP-only observations over existing read APIs: five default checks plus optional page, recycled-reference and choice-membership audits. Choice validation explicitly requests `getClosedValues({include_metadata:true})`; existing no-argument API callers retain their response shape. Not a new native command or atomic snapshot. |
| `pageStats` | Native `getPageStats`; MCP adds its result contract. |
| `createProperty` | Native `upsertProperty` plus MCP checks/diagnostics. |
| `listClosedValues` | Native `getClosedValues`. |
| `deleteTag` | Orchestration of existing routes, not a `deleteTag` export. |
| `importPage` | Batch insertion/update orchestration, not a native `importPage` export. |
| `isTitleAvailable` | Title-holder/inventory interpretation, not a native boolean command. |
| `datascriptQuery` | Native query wrapped with explicit MCP approval, logging, and output limits. |

Direct `/api` calls do not inherit MCP acknowledgements, `verified`,
`verbose`, `dry_run`, collision/title-release policy, diagnostics, per-query
approval, or output caps unless the native command explicitly implements them.
For example, only `upsertNodes` above documents its own `dry-run`, and
`findEntities` implements its own cursor/output limits.

Use the [MCP tool map](./mcp-native-tool-map.md) for the corresponding tool input
contracts. Do not copy MCP-only option names into native positional arguments.
After a native write, perform a targeted read-back before reporting success.
Do not retry a timed-out write blindly: first check whether it already applied.

## Registry scope and source references

The shared registry currently contains 167 exports. This catalog accounts for
127 DB-compatible graph/resource/utility/Desktop commands. The remaining 40
exports are intentionally outside this reference's scope:

- 35 entries in the registry's `plugin apis` section: plugin lifecycle, hooks,
  storage, package/configuration files, settings, UI/command registration, search
  services, and external-plugin management.
- `experRegisterFencedCodeRenderer` and `experLoadScripts`: plugin-context
  experiments, including callback/script inputs, not ordinary JSON DB operations.
- `experRequest` and `httpRequestAbort`: plugin-context external HTTP request
  utilities, not graph queries.
- `setFocusedSettings`: a plugin-settings helper, not graph configuration.

These entries can appear in `getMcpApiMethods`; discovery of a callable registry
entry does not establish a useful or supported plain-JSON DB contract.
The `DB` alias changes dispatch naming, not plugin-context requirements.

The server converts camelCase command names to snake_case registry keys; it
also handles the `UUIDs` spelling used by `getPageBlockUUIDs`. The namespaces
App, Editor, DB, and CLI all reach the shared registry. This reference presents
their DB-compatible entries uniformly under `logseq.DB`.

Authoritative sources:

- [HTTP server, authentication, routes](../src/electron/electron/server.cljs)
- [Command-name resolution](../src/electron/electron/mcp_compat.cljs)
- [Renderer namespace/alias dispatch](../src/main/electron/listener.cljs)
- [Complete shared export registry](../src/main/logseq/api.cljs)
- [DB graph operations and structured search](../src/main/logseq/api/db_based.cljs)
- [Editor-backed operations](../src/main/logseq/api/editor.cljs)
- [Application and graph context](../src/main/logseq/api/app.cljs)
- [Raw queries and DB-stored resources](../src/main/logseq/api/db.cljs)
- [CLI-backed shared aliases and Transit transfer](../src/main/logseq/api/db_based/cli.cljs)
- [List/batch schemas and builders](../src/main/logseq/api/db_based/tools.cljs)
- [Block/property conversion and namespace controls](../src/main/logseq/api/block.cljs)
- [SDK declarations](../libs/src/LSPlugin.ts)
- [Native MCP tool map](./mcp-native-tool-map.md)

Current source and native argument handling take precedence where older SDK or
built-in API examples describe file graphs or only a subset of shared aliases.
