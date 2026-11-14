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
  'editor_read' | 'editor_command' | 'graph_read' | 'db_query'
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
the command loader. The read-only loader rejects that grant; neither loader
provides arbitrary graph writes.
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

| QuickJS SDK API                                       | Required grants             | Implemented boundary                                                                          |
| ----------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| `ready(callback?)`                                    | None                        | Activation and asynchronous initialization, not subscriptions or a general resident lifecycle |
| `baseInfo`                                            | None                        | `id`, `runtime`, and immutable `grantedCapabilities` after initialization                     |
| `Editor.checkEditing()`                               | `editor_read`               | Editing UUID or `false`                                                                       |
| `Editor.getEditingBlockContent()`                     | `editor_read`               | Live editing text or `null`                                                                   |
| `Editor.getCurrentBlock()`                            | `editor_read`, `graph_read` | Current graph entity or `null`                                                                |
| `Editor.getCurrentPage()`                             | `editor_read`, `graph_read` | Page entity, route summary, or `null`                                                         |
| `Editor.getCurrentPageBlocksTree()`                   | `editor_read`, `graph_read` | Ordered recursive worker tree for the captured materialized route page, or `[]`               |
| `Editor.getSelectedBlocks()`                          | `editor_read`, `graph_read` | Selected entities in the owning projection's order, or `[]`                                   |
| `Editor.getBlockProperty(identity, canonicalIdent)`   | `graph_read`                | Structured property value, including class defaults, or `null`                                |
| `Editor.getPageProperties(identity)`                  | `graph_read`                | Canonical property map, including class defaults, or `null` for a missing page                |
| `Editor.getTodayPage()`                               | `graph_read`                | Existing page for the captured application date, or `null`; never creates it                  |
| `Editor.getAllPages()`                                | `graph_read`                | Bounded, sorted visible-page metadata from the captured graph, or `[]` without a graph        |
| `Editor.getBlock(identity, opts?)`                    | `graph_read`                | Numeric entity ID, UUID, or `{ uuid }`; properties and optional recursive children            |
| `Editor.getPage(identity, opts?)`                     | `graph_read`                | Numeric entity ID, UUID, `{ uuid }`, or page name; no child tree expansion                    |
| `Editor.getPageLinkedReferences(identity)`            | `graph_read`                | References grouped as `[PageEntity, BlockEntity[]][]`, or `null` for a missing target         |
| `DB.datascriptQuery(query, ...inputs)`                | `graph_read`, `db_query`    | DataScript query with bounded plain-data inputs/results                                       |
| `DB.q(query, ...inputs)`                              | `graph_read`, `db_query`    | Exact read-only Datalog alias of `datascriptQuery`, not the legacy simple-query DSL           |
| `Commands.registerEditorCommand(descriptor, handler)` | `editor_command`            | Activation-time registration; handlers return the closed editor action program                |
| `console.log/info/warn/error/debug`                   | None                        | Bounded application diagnostics, not a browser console                                        |

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
`exitEditing` actions, not imperative writes. They use a fresh invocation host
and the existing configured editor executor. Read/query calls inside a handler
still need their separate grants. The command slice requires a noncomposing,
collapsed editor selection; delayed UI commits retain the plugin/editor lease.
See [the command migration notes](../docs/api-migrations.md).

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

`Plugin_broker.get_block_tree` and `Plugin_broker.get_page_linked_references`
provide typed OCaml reads under the same session/invocation boundary. They return
an optional entity and an optional `(entity * entity list) list`, respectively.
The native bridge reserves operation slots 11–22 for the independent graph-write
surface; these reads use slots 23–24 without renumbering existing operations.

Not implemented by this target: imperative block/page/property writes,
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
