# Plugin API Migrations

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
