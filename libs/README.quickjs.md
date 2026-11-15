# DOM-free QuickJS SDK

The QuickJS target uses a separate SDK entry, `src/LSPlugin.quickjs.ts`, and a
typed OCaml broker. It does not use the legacy iframe transport or expose the
browser, Node, Electron, raw worker RPC, or arbitrary UI source execution.

This inventory describes the QuickJS SDK on this branch. It is not a promise that
the legacy plugin API works everywhere, or that a QuickJS Web/WASM or mobile
host has shipped.

## Discover session grants

After `logseq.ready`, the callback argument and `logseq.baseInfo` refer to the
same immutable metadata snapshot:

```ts
interface PortablePluginInfo {
  readonly id: string
  readonly runtime: 'quickjs'
  readonly grantedCapabilities: readonly QuickjsCapability[]
}

type QuickjsCapability =
  'editor_read' | 'editor_command' | 'graph_read' | 'db_query' | 'graph_write'
```

For example, in a plugin using the QuickJS SDK entry:

```ts
logseq.ready(async ({ grantedCapabilities }) => {
  if (
    grantedCapabilities.includes('graph_read') &&
    grantedCapabilities.includes('db_query')
  ) {
    const rows = await logseq.DB.datascriptQuery(
      '[:find ?e :where [?e :block/uuid]]'
    )
    console.info(rows)
  }
})
```

The broker obtains this list from the host-created session, not from a plugin
manifest, request argument, or JS object. Names are unique and use the stable
order shown above. Duplicate or reordered host grants do not change the list.
Both the metadata object and its copied grant array are frozen by the SDK.
An empty grant list is valid, and metadata/logging do not require a read grant.

**A grant is not an API support or platform support claim.** In particular,
`editor_command` permits typed editor command registration and execution through
the command loader. With `graph_write`, command invocations can also use the
listed editor mutations. The read-only loader rejects both grants; neither loader
provides unrestricted graph writes or arbitrary transactions.
Likewise, `db_query` alone does not imply `graph_read`. The broker still checks
every request against its own session, freshness, and resource limits; editing
or replacing the JS list cannot grant access. A loaded graph or active editor
is not guaranteed by a grant either.

This is a session snapshot, not a permission-request API or an event stream.
There is no dynamic grant escalation. `baseInfo` is unavailable before
initialization. New SDK bundles require a matching host that supplies
`grantedCapabilities`; an older reply without that field fails with
`Unsupported`, not an invented empty/full permission list. Older bundles may
ignore this additive reply field.

## API and permission inventory

Sibling navigation is also available as
`Editor.getPreviousSiblingBlock(identity)` and
`Editor.getNextSiblingBlock(identity)`, each requiring only `graph_read`.
They accept an entity ID, UUID, or `{ uuid }` and return an immediate sibling
entity or `null`. They do not flatten descendants or follow visible UI order.

| QuickJS SDK API                                           | Required grants             | Implemented boundary                                                                          |
| --------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| `ready(callback?)`                                        | None                        | Activation and asynchronous initialization, not subscriptions or a general resident lifecycle |
| `baseInfo`                                                | None                        | `id`, `runtime`, and immutable `grantedCapabilities` after initialization                     |
| `Editor.checkEditing()`                                   | `editor_read`               | Editing UUID or `false`                                                                       |
| `Editor.getEditingBlockContent()`                         | `editor_read`               | Live editing text or `null`                                                                   |
| `Editor.getCurrentBlock()`                                | `editor_read`, `graph_read` | Current graph entity or `null`                                                                |
| `Editor.getCurrentPage()`                                 | `editor_read`, `graph_read` | Page entity, route summary, or `null`                                                         |
| `Editor.getBlock(identity, opts?)`                        | `graph_read`                | Numeric entity ID, UUID, or `{ uuid }`; properties and optional recursive children            |
| `Editor.getPage(identity, opts?)`                         | `graph_read`                | Numeric entity ID, UUID, `{ uuid }`, or page name; no child tree expansion                    |
| `Editor.getBlockProperties(identity)`                     | `graph_read`                | Readable own/class-default properties or `null`                                               |
| `Editor.getPageBlocksTree(identity)`                      | `graph_read`                | Ordered nested page blocks; IDs, UUIDs, or page names                                         |
| `Editor.getBlockChildren(identity)`                       | `graph_read`                | Ordered direct content children, including collapsed children                                 |
| `Editor.insertBlock(identity, content, opts?)`            | `graph_write`               | Insert one block during a command invocation                                                  |
| `Editor.updateBlock(identity, content, opts?)`            | `graph_write`               | Replace a nonediting block title and patch plugin-owned properties                            |
| `Editor.upsertBlockProperty(identity, key, value, opts?)` | `graph_write`               | Plugin-owned scalar property                                                                  |
| `Editor.removeBlockProperty(identity, key)`               | `graph_write`               | Remove a plugin-owned property value                                                          |
| `Editor.removeBlock(identity)`                            | `graph_write`               | Remove a nonediting block subtree through the outliner                                        |
| `Editor.moveBlock(source, target, opts?)`                 | `graph_write`               | Move before, after, or into a target                                                          |
| `Editor.createPage(name, properties?, opts?)`             | `graph_write`               | Create or reuse a page without navigation; empty initial properties only                      |
| `Editor.renamePage(identity, name)`                       | `graph_write`               | Rename a nonactive page; returns `true`                                                       |
| `Editor.deletePage(identity)`                             | `graph_write`               | Recycle a nonactive page using the existing outliner operation                                |
| `DB.datascriptQuery(query, ...inputs)`                    | `graph_read`, `db_query`    | DataScript query with bounded plain-data inputs/results                                       |
| `Commands.registerEditorCommand(descriptor, handler)`     | `editor_command`            | Activation-time registration; handlers return the closed editor action program                |
| `console.log/info/warn/error/debug`                       | None                        | Bounded application diagnostics, not a browser console                                        |
| `Editor.getPageLinkedReferences(identity)`                | `graph_read`                | References grouped as `[PageEntity, BlockEntity[]][]`, or `null` for a missing target         |
| `DB.q(query, ...inputs)`                                  | `graph_read`, `db_query`    | Exact read-only Datalog alias of `datascriptQuery`, not the legacy simple-query DSL           |
| `Editor.getCurrentPageBlocksTree()`                       | `editor_read`, `graph_read` | Ordered recursive worker tree for the captured materialized route page, or `[]`               |
| `Editor.getSelectedBlocks()`                              | `editor_read`, `graph_read` | Selected entities in the owning projection's order, or `[]`                                   |
| `Editor.getBlockProperty(identity, canonicalIdent)`       | `graph_read`                | Structured property value, including class defaults, or `null`                                |
| `Editor.getPageProperties(identity)`                      | `graph_read`                | Canonical property map, including class defaults, or `null` for a missing page                |
| `Editor.getTodayPage()`                                   | `graph_read`                | Existing page for the captured application date, or `null`; never creates it                  |
| `Editor.getAllPages()`                                    | `graph_read`                | Bounded, sorted visible-page metadata from the captured graph, or `[]` without a graph        |

`getBlock` preserves properties and expands nested, ordered block entities when
`includeChildren: true`, including collapsed descendants. Omitted/false keeps
the existing single-entity read. Property values retain existing reference/value
maps rather than being flattened to scalars. `getPage` still rejects `includeChildren: true`
as `Unsupported`; unknown options are `Invalid_request`. Linked references accept
the same identities as `getPage`, including block UUID targets. Existing targets
with no references return `[]`; missing targets and absent graphs return `null`.
Groups follow first page appearance in worker results, preserving reference order
within each page. Missing/malformed source-page metadata rejects rather than
silently dropping references. Explicit
identity reads use graph services; active-editor reads also retain the captured
editing context. A graph/context transition invalidates late replies. Read,
query, diagnostics, and initialization calls remain subject to the existing
bridge message, Unicode, depth, size, call, and execution budgets.

The six additional reads are portable extensions, not complete legacy API
compatibility. Property identifiers are qualified canonical names such as
`plugin.property.example/score`, with an optional leading `:`; display-name
resolution is not supported. Property-map keys include the leading `:`.
Values retain their structured data and references rather than flattening
them to titles or IDs. Explicit values override inherited class defaults.
An existing page with no properties yields `{}`; a missing property or target
yields `null`. A block is not accepted as a page-properties target. Property
projection is bounded independently of unrelated block content.

Current-page trees exclude page roots and follow worker sibling order, including
collapsed descendants. Zoomed block roots follow the existing tree endpoint's
include-root behavior. Entity fields are those supplied by
the existing tree endpoint; this does not add the separate explicit-block
children/property hydration surface. Selections follow the captured selection
scope, not main-page order or sorted UUIDs, and return flat selected entities,
not a recursive tree. A missing selected entity invalidates the captured read.

The catalog excludes `logseq.property/hide?` pages and contains only ID, UUID,
name, title, and available creation/update metadata (plus standard DTO title
aliases). Its `PortablePageMetadata` type requires `id`, `uuid`, `name` and
`title`, with optional `createdAt` and `updatedAt`; legacy `format`, `type` and
`journal?` fields are not promised. It sorts by case-sensitive UTF-8 title, then entity ID. It does not
accept a repository argument or return a truncated success when limits are
exceeded: oversized complete results reject with `Resource_limit`. Today-page
lookup uses the application date captured at invocation, not a JS/browser clock.

Registered command handlers return `insertText`, `showDatePicker`, or
`exitEditing` actions. Separately granted graph writes are described below. They use a fresh invocation host
and the existing configured editor executor. Read/query calls inside a handler
still need their separate grants. The command slice requires a noncomposing,
collapsed editor selection; delayed UI commits retain the plugin/editor lease.
See [the command migration notes](../docs/api-migrations.md).

## Editor graph writes

Writes require `graph_write`; it does not imply `graph_read` or `editor_read`.
The configured command loader also requires `editor_command`. Registration-time
writes and invocations without captured write services reject with `Unsupported`.
The read-only loader rejects write grants. Existing read APIs retain their grants.

Block mutations accept a positive entity ID, UUID or `{ uuid }`, not a page
name. Page rename/delete also accept a page name. Missing mutation targets/graphs
are `Invalid_request`, not successful no-ops. `insertBlock` and `createPage`
return the persisted block and a page receipt respectively; `renamePage` returns
`true`; other writes return no value. The page receipt contains only `{ id, uuid,
name }`, including on reuse: write authority must not reveal existing page
properties. Use `getPage` with `graph_read` for the full page entity.

- Insert defaults to the last child. `start: true` inserts the first child;
  `end: true` is an explicit last child. `sibling: true` inserts after the target;
  `before: true` inserts before it. Start/end cannot combine with sibling/before,
  and start/end cannot both be true. `customUUID` must be a valid unused UUID.
- Insert `properties`, `schema` and `autoOrderedList` are `Unsupported`. Unknown
  fields, wrong value types and contradictory positioning are `Invalid_request`.
- Update accepts `properties`, a patch of at most 32 plugin-owned scalar keys.
  Omitted keys are preserved, `null` removes an own value, and strings/numbers/booleans
  set values using the same namespace/type restrictions as property upsert.
  `schema` is `Unsupported`. Updating page titles or the currently edited block is `Unsupported`, avoiding
  overwriting an editor buffer. Use the configured `insertText` action for that buffer.
- Move defaults to after the target; `{ before: true }` moves immediately before
  it, and `{ children: true }` moves into it as the first child. The flags cannot
  both be true. Self/descendant cycles and sibling moves against page roots are
  `Invalid_request`. Moving page entities through this block API is invalid.
- Removing/moving the active editing block or one of its ancestors, and
  renaming/deleting the active route page or an editing ancestor, are `Unsupported`.
- Create accepts an optional unused `customUUID`. Initial properties must be
  omitted or empty; use separate property writes otherwise. `redirect` may be
  omitted or `false`; this graph-only target never changes the route, unlike the
  legacy default. `redirect: true`, journal/class/schema options and nonempty
  initial properties are `Unsupported`. Rename rejects collisions with another
  page. Delete uses the worker's recoverable recycle semantics, not permanent
  erasure; low-level reads can still inspect recycled entities. Journal, class and
  property page deletion is `Unsupported`: their worker paths may permanently
  retract content instead of recycling it.
- Property keys contain 1–64 ASCII letters, digits, `_` or `-`. Writes resolve
  them only inside `plugin.property.<plugin-id>/<key>`, never a built-in or another
  plugin namespace. Reads expose readable colon-prefixed property idents and
  merge class defaults, so removing an own value can reveal a class default.
- Property values are finite numbers, booleans or strings. Null is
  `Invalid_request`; arrays/objects are `Unsupported`. The host creates scalar
  number/checkbox/default properties. Existing incompatible types or cardinality
  are `Unsupported`; this slice does not change schemas. Upsert options
  `reset`/`entityId` may be omitted or false; true is `Unsupported`.

All calls use the existing runtime/value budgets. The broker validates grants
before entering the service. Application services capture the graph and editor
context, prepare references/operations, then recheck context and invocation
cancellation immediately before sending outliner operations. No raw worker RPC
or transaction payload is exposed to JavaScript. OCaml callers use
`Plugin_protocol.Mutate` with the closed mutation variants through
`Plugin_broker.dispatch`; option/key constructors validate their restricted forms.

`Stale_context` and `Cancelled` prevent mutations before dispatch. Once a worker
operation has been sent, cancellation is not rollback: it may already have
committed, and a late error does not prove that nothing changed. Multiple API
calls and multi-operation property creation are not promised atomic. Do not
blindly retry a mutation after an uncertain result. Backing-service/decoding
failures are `Runtime_failure`; bounded-value/call limits are `Resource_limit`.
Mutations do not force a view reload inside the command: normal worker
subscription refresh resumes after the existing busy-command deferral window.

## Typed OCaml sibling calls

Application-owned callers can use the same authorization and freshness boundary
without constructing JS or interpreting an untyped broker reply:

```ocaml
Plugin_broker.get_sibling_block broker session invocation
  ~direction:Plugin_protocol.Next_sibling (Plugin_protocol.Uuid block_uuid)
```

The result is `(Plugin_protocol.entity option, Plugin_protocol.error) result
Ui_task.t`. The invocation must have application read services. Missing graph,
missing source, or first/last boundary returns `Ok None` (`null` in JS).
Malformed identities/directions are `Invalid_request`; page-name identities are
not accepted. Missing authority is `Permission_denied`; missing read services
is `Unsupported`. Context changes produce `Stale_context`, retired invocations
produce `Cancelled`, transport failures produce `Runtime_failure`, and the
existing bounded-value/call limits produce `Resource_limit`. JS receives these
codes as `PluginError`; local SDK validation can throw before a request is sent.
The application captures the graph before
invocation and rechecks freshness around the existing worker sibling read.

The same boundary exposes `get_current_page_blocks_tree`, `get_selected_blocks`,
`get_block_property`, `get_page_properties`, `get_today_page`, and `get_all_pages`.
Each takes the broker, session and invocation, followed by its typed arguments.
Construct canonical property names with `Plugin_protocol.property_ident`.
Lists return typed entity lists; today returns an optional entity; property
operations return bounded `Json.t` values. Wire methods are respectively
27–32; 25–26 remain reserved for the separate property-write design. No new
worker endpoint, write capability, Dune configuration, or mobile host is needed.

Tree reads return `[]` for absent graphs/targets and retain the shared response
size/depth limits. Page trees contain nested `children`; block children are only
the direct content children, not a flattened descendant walk. The latter uses a
fixed parent-constrained worker query and batched entity reads, not plugin-supplied
query text. Both need only `graph_read`. No worker endpoint is added.

`Plugin_broker.get_block_tree` and `Plugin_broker.get_page_linked_references`
provide typed OCaml reads under the same session/invocation boundary. They return
an optional entity and an optional `(entity * entity list) list`, respectively.
The native bridge retains graph-write operations 11–22 and uses slots 23–24
for these reads without renumbering existing operations.

Not implemented by this target: batch insertion and unlisted block/page options,
settings, subscriptions, plugin installation/discovery,
toolbar/panel/custom renderers, network/timers/files/Git, and browser or OS
window APIs. DOM, CSS injection, WebView, iframe, and ReactDOM fallbacks are not
part of the portable target. Unsupported calls must not be interpreted as
successful no-ops. DB evaluator CPU budgets and true query cancellation remain
deferred; bridge deadlines do not cancel the worker evaluator.

## Build and validation

From the repository root, package a plugin source entry as a single module:

```sh
pnpm --dir libs run build:quickjs \
  --env plugin=/absolute/path/to/plugin.ts \
  --env output=/absolute/path/to/plugin.mjs
```

The build aliases `@logseq/libs` to the QuickJS SDK. Its types live in
`libs/src/LSPlugin.quickjs.ts`; legacy DOM-oriented global declarations are not
the type contract for this target. Building a bundle does not install or launch
it, and does not establish Web/WASM/mobile runtime support.

With the repository OCaml dependencies installed, the existing native probe
validates the real bundle, broker, application read services, and an isolated
worker graph:

```sh
opam exec --switch=5.5.0 -- deps/ui/scripts/check-quickjs-sdk.sh
```

Its grant table covers all eight read-grant subsets, reversed/duplicate host
grants, immutable metadata, and unchanged permission enforcement after attempted
JS mutation. This is headless/native engine evidence, not GUI validation or a
portable-host parity claim. The same script also runs the separate configured
command probe on the current application baseline.
