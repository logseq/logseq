# Plugin API Migrations

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
