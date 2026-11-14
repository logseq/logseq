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
| `Editor.getBlock(identity, opts?)`                    | `graph_read`                | Numeric entity ID, UUID, or `{ uuid }`; no child tree expansion                               |
| `Editor.getPage(identity, opts?)`                     | `graph_read`                | Numeric entity ID, UUID, `{ uuid }`, or page name; no child tree expansion                    |
| `DB.datascriptQuery(query, ...inputs)`                | `graph_read`, `db_query`    | DataScript query with bounded plain-data inputs/results                                       |
| `Commands.registerEditorCommand(descriptor, handler)` | `editor_command`            | Activation-time registration; handlers return the closed editor action program                |
| `console.log/info/warn/error/debug`                   | None                        | Bounded application diagnostics, not a browser console                                        |

`includeChildren` may be omitted or `false`; `true` is `Unsupported`. Explicit
identity reads use graph services; active-editor reads also retain the captured
editing context. A graph/context transition invalidates late replies. Read,
query, diagnostics, and initialization calls remain subject to the existing
bridge message, Unicode, depth, size, call, and execution budgets.

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
