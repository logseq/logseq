# Plugin API Migrations

## QuickJS captured tree, selection, property and page reads

Rebundle against the matching QuickJS host to use these portable extensions:

```ts
const tree = await logseq.Editor.getCurrentPageBlocksTree()
const selected = await logseq.Editor.getSelectedBlocks()
const score = await logseq.Editor.getBlockProperty(blockUuid, 'plugin.property.example/score')
const properties = await logseq.Editor.getPageProperties('Example')
const today = await logseq.Editor.getTodayPage()
const pages = await logseq.Editor.getAllPages()
```

The first two need both `editor_read` and `graph_read`; the remaining four need
only `graph_read`. They reuse the invocation's captured application services,
check freshness before and after asynchronous reads, and cannot select another
graph. No write, command or DB-query grant is implied or required.

Empty trees/selections and absent-graph catalogs return `[]`. Missing entities,
properties and today pages return `null`; an existing property-free page returns
`{}`. Today lookup never creates a journal. Selections use their owning
projection's order. The page catalog excludes hidden pages, projects metadata
only and sorts by UTF-8 title then entity ID; it has no repository argument.
Its return type is `PortablePageMetadata[]`: ID, UUID, name and title, with
optional creation/update timestamps, not legacy file-page fields such as
`format`, `type` or `journal?`.

Property names must be canonical qualified identifiers, optionally prefixed by
`:`. Property-map keys retain that prefix; values retain structured references
and arrays, with explicit properties overriding inherited defaults. Reads do
not flatten values to titles or IDs. Unsupported arguments reject rather than
silently approximating legacy behavior. The existing permission, stale-context,
cancellation and resource error codes still apply, including complete-result
limits instead of silent truncation.

The existing `thread-api/get-block-class-default-properties` worker read now
uses `logseq.property/scalar-default-value` for checkbox schemas, matching
property lookup semantics. Reference and many-valued defaults continue to use
`logseq.property/default-value`.

Shared OCaml callers use the corresponding `Plugin_broker.get_*` functions
and `Plugin_protocol.property_ident`. Wire methods 27–32 are additive; 25–26
remain reserved for the separately approved property-write design. This slice
adds no property mutation, worker endpoint or mobile host and does not depend
on the independently reviewed explicit tree/query or graph-write surfaces.
See the [QuickJS inventory](../libs/README.quickjs.md) for exact limits and
tree-field boundaries. Native headless evidence is not Web/WASM or mobile
runtime validation.

## QuickJS editor API v1

The DOM-free editor surface now includes `getBlockProperties`, `insertBlock`,
`updateBlock`, `upsertBlockProperty` and `removeBlockProperty`, alongside the
existing current-page/current-block/block reads. These are typed broker calls,
not legacy positional worker RPC. See the [SDK contract](../libs/README.quickjs.md#editor-graph-writes)
for supported insertion options, scalar property values and error codes.

The second batch adds `getPageBlocksTree`, `getBlockChildren`, `removeBlock`,
`moveBlock`, `createPage`, `renamePage` and `deletePage`. Existing insertion
supports before/after a sibling UUID through its target identity and placement
flags. Update now accepts a bounded `properties` patch: scalar values set
plugin-owned keys, `null` removes them, and omitted keys remain unchanged.
Tree reads require `graph_read`; every mutation retains `graph_write` and the
same captured command invocation. All mutations use existing worker outliner
operations; no worker endpoint or arbitrary transaction channel was added.

Move defaults to after the target, with `before: true` for immediately before or
`children: true` for first-child placement. Cycles are rejected. Create accepts
an optional `customUUID`, omitted/empty properties and `redirect: false`; omitted
redirect also means no navigation in this portable graph-only subset. Nonempty
initial properties, navigation and journal/class/schema creation are unsupported.
Rename rejects an existing destination page. Delete recycles rather than erases
permanently, so worker reads may still access recycled data. Active editing
blocks/ancestors and the active route page are protected from structural writes.
Create returns only an `{ id, uuid, name }` receipt, even when reusing a page;
full entity reads still require `graph_read` through `getPage`.
Journal, class and property page deletion is `Unsupported`; their worker paths
may permanently retract content instead of recycling it.

Reads keep their existing grants. Mutations need the new independent
`graph_write` grant and an active command invocation with captured application
write services; registration writes are `Unsupported`. A read-only loader cannot
load write-granted plugins. `graph_write` is reported in the immutable session
metadata only when actually granted, and does not grant reads.

This is not full legacy write compatibility. Block API page-name targets,
currently edited block replacement, inline properties, schema/entity-valued
property writes and unlisted options are not implemented. Property keys are
restricted to the calling plugin's namespace rather than arbitrary keywords.
Missing mutation targets reject; missing property reads return `null`.

Freshness and cancellation are checked before sending worker mutations. A
mutation already dispatched can still commit after cancellation or a context
change; there is no rollback or multi-call atomicity guarantee. UI reloads remain
deferred during the existing command invocation window. DB evaluator budgets
and true query cancellation remain deferred. Native/headless graph verification
does not establish GUI, Web/WASM, iOS or Android support; no DOM/WebView fallback
was added.

## QuickJS bound queries, block children, and linked references

The DOM-free target now exposes `DB.q(query, ...inputs)` as the exact read-only
Datalog alias of `DB.datascriptQuery`. Unlike the legacy iframe SDK's `DB.q(dsl)`,
it does not translate simple-query DSL strings. Keep values in `:in` bindings and
pass plain-data inputs separately; do not interpolate values into query text.
Both methods require `graph_read` and `db_query`. No transaction endpoint,
evaluator CPU budget, or true query cancellation is added.

`Editor.getBlock(uuid, { includeChildren: true })` preserves the root entity's
properties and adds recursive ordered children, including collapsed descendants,
through the existing worker tree read. Numeric IDs and `{ uuid }` also work.
The default/false option keeps the existing single-entity read. `getPage` retains
its existing identity/property semantics and rejects child expansion.

`Editor.getPageLinkedReferences(identity)` returns
`[PageEntity, BlockEntity[]][] | null`. Page names, UUIDs, `{ uuid }`, and numeric
IDs are accepted, including references to a block UUID. A missing target or
absent graph returns `null`; an existing target with no references returns `[]`.
References are grouped by source page, preserving worker result order within
groups. These reads need only `graph_read` and use the existing typed broker,
worker endpoints, captured context, value limits, and error categories.
`getCurrentPage` and `getEditingBlockContent` retain their existing captured
page/live unsaved-buffer semantics and grants. Late results reject as
`Stale_context`; retired invocations reject as `Cancelled`.

Property mutations are not part of this read-only slice. They will reuse the
independent graph-write/property-patch implementation after it reaches the base
branch, rather than copying its implementation here.

## QuickJS sibling navigation reads

`Editor.getPreviousSiblingBlock(identity)` and `Editor.getNextSiblingBlock(identity)`
now use the shared typed broker and existing worker sibling query. Both require
`Graph_read`, not editing, command, or DB-query authority. Entity IDs, UUIDs,
and `{ uuid }` are accepted; page names are not. Results are immediate siblings
under the same parent, not flattened tree neighbors. Boundaries, missing blocks,
and absent graphs return `null`; malformed input, denied permissions, stale
context and resource failures reject using the existing `PluginError` codes.
Application OCaml callers use `Plugin_broker.get_sibling_block` with a closed
`Previous_sibling`/`Next_sibling` direction and the same session/invocation.

## QuickJS session capability metadata

`logseq.baseInfo.grantedCapabilities` and the `ready` callback metadata now
contain an immutable snapshot of the host-created session's actual grants.
The broker remains the authority; the list does not grant access or establish
API/platform availability. New SDK bundles require this metadata from a matching
host and fail with `Unsupported` if it is absent. See the
[QuickJS API/permission inventory](../libs/README.quickjs.md) for names and limits.

## QuickJS registered editor commands

The DOM-free QuickJS target now supports explicitly registered editor commands.
Rebuild a plugin with `@logseq/libs/quickjs` and register during `logseq.ready`:

```ts
import logseq from '@logseq/libs/quickjs'

logseq.ready(async () => {
  await logseq.Commands.registerEditorCommand(
    { key: 'greet', label: 'Insert greeting' },
    async () => {
      const block = await logseq.Editor.getCurrentBlock()
      return [{ kind: 'insertText', text: block ? 'Hello' : 'No current block' }]
    }
  )
})
```

The application must load the bundle through `Plugin_host.load_command_plugin`
with the `Editor_command` grant. `Editor_read`, `Graph_read` and `Db_query`
remain separate grants; the example also requires the first two read grants.
Commands appear in the editor slash popup only after activation succeeds.
Keys are unique per plugin, use ASCII letters/digits/`-_.`, and are limited to
64 bytes. Labels are nonempty, control-free UTF-8, limited to 128 bytes.
Registration/callback storage is bounded by the existing 32-call budget;
initialization and reads consume that budget too. Registration after activation
is unsupported. Unload, cancellation, runtime failure or stale invocation
retires the runtime and withdraws its commands.

Each handler must return an explicit array (`[]` is valid; `undefined` is not).
Actions are `insertText`, `showDatePicker` and `exitEditing`; the latter two must
be last. Results use the existing configured editor executor, replacing the
captured slash trigger only after validation. A one-use application ticket
protects the original editor/popup context, including delayed configured UI.
The initial slice requires a noncomposing, collapsed editor selection.
Programs are not atomic DB transactions; cancellation cannot undo dispatched
saves. Existing read/query APIs remain available inside each invocation.

This is a new return-program API, not compatibility for imperative legacy
`Editor.insertBlock`, `Editor.updateBlock`, slash registration or arbitrary graph
writes. There is no DOM, CSS, WebView or executable UI-source fallback.
Native QuickJS is the implemented host; Web/WASM and mobile hosts remain future
work, as do automatic installation/discovery and DB evaluator cancellation.
