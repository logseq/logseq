# `logseq.Commands` API Guide

## Quick start

```ts
import '@logseq/libs'

async function main() {
  const unregister = logseq.Commands.register(
    'insert-hello',
    {
      title: 'Insert hello',
      placement: 'slash',
    },
    async () => {
      await logseq.Editor.insertAtEditingCursor('Hello from command!')
    }
  )

  logseq.beforeunload(async () => {
    unregister && unregister()
  })
}

logseq.ready(main).catch(console.error)
```

## API surface

### `Commands.register(id, options, action?)`

Register a command and return an unregister handler.

```ts
const unregister = logseq.Commands.register(id, options, action)
```

The same command can also put its handler in `options.handler`:

```ts
const unregister = logseq.Commands.register('my-command', {
  title: 'My command',
  placement: 'palette',
  handler: async () => {
    await logseq.UI.showMsg('Run')
  },
})
```

Return value:

- `() => void`: unregister handler.
- `false`: registration failed, usually because handler/action is missing or invalid.

The unregister handler is idempotent. Calling it multiple times is safe.

```ts
const unregister = logseq.Commands.register('temporary-command', {
  title: 'Temporary command',
  placement: 'palette',
  handler: () => console.log('run'),
})

unregister && unregister()
unregister && unregister() // safe no-op
```

### `Commands.execute(id, ...args)`

Execute a built-in or plugin command.

```ts
await logseq.Commands.execute('logseq.go/home')
await logseq.Commands.execute('my-plugin/some-command')
await logseq.Commands.execute('my-plugin.commands.some-command')
await logseq.Commands.execute('local-command')
```

Supported id forms:

| Form                     | Meaning                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `logseq.*`               | Built-in command, forwarded to `App.invokeExternalCommand`. |
| `plugin-id/key`          | Command registered by another plugin.                       |
| `plugin-id.commands.key` | Backward-compatible plugin command address.                 |
| `key`                    | Command registered by the current plugin.                   |

Plugin command keys are normalized to match host registration rules:

- trim whitespace;
- whitespace becomes `_`;
- lower-case;
- `:` becomes `-`;
- numeric first character becomes `_1`, `_2`, etc.

## Register options

```ts
type CommandRegisterOptions = {
  key?: string
  title?: string
  label?: string
  desc?: string
  handler?: CommandCallback | BlockCommandCallback | Array<SlashCommandAction>
  when?: string | string[]
  placement?: CommandPlacement
  placements?: CommandPlacement[]
  keybinding?: SimpleCommandKeybinding | string
  extras?: Record<string, any>
  type?: string
  palette?: boolean
}
```

Important fields:

- `key`: stable command key. Defaults to `id`.
- `title`: display title. `label` is also accepted for compatibility.
- `desc`: command palette description. Defaults to title/label in host palette rendering.
- `handler`: command callback. Can be passed here or as third argument.
- `placement`: single UI surface.
- `placements`: multiple UI surfaces for one logical command.
- `keybinding`: string or `{ mode, binding, mac }` shortcut descriptor.
- `when`: v1 stores this as metadata for future host-side condition evaluation.
- `extras`: placement-specific metadata, e.g. PDF highlight menu options.

## Placements

```ts
type CommandPlacement =
  | 'palette'
  | 'shortcut'
  | 'slash'
  | 'block-context-menu'
  | 'highlight-context-menu'
  | 'page-menu'
  | 'simple'
```

### `palette`

Register a command palette item.

```ts
const unregister = logseq.Commands.register(
  'open-dashboard',
  {
    title: 'Open dashboard',
    placement: 'palette',
  },
  async () => {
    logseq.showMainUI()
  }
)
```

### `shortcut`

Register a keyboard shortcut without necessarily showing it in the command palette.

```ts
const unregister = logseq.Commands.register(
  'toggle-panel',
  {
    title: 'Toggle panel',
    placement: 'shortcut',
    keybinding: {
      mode: 'global',
      binding: 'mod+shift+p',
      mac: 'cmd+shift+p',
    },
  },
  () => {
    logseq.toggleMainUI()
  }
)
```

Shortcut modes:

| Mode          | Meaning                          |
| ------------- | -------------------------------- |
| `global`      | Active globally.                 |
| `non-editing` | Active when not editing a block. |
| `editing`     | Active when editing a block.     |

### `slash`

Register a slash command.

```ts
const unregister = logseq.Commands.register(
  'insert-current-date',
  {
    title: 'Insert current date',
    placement: 'slash',
  },
  async () => {
    await logseq.Editor.insertAtEditingCursor(
      new Date().toISOString().slice(0, 10)
    )
  }
)
```

Slash commands also support the legacy action-step form:

```ts
const unregister = logseq.Commands.register(
  'big-bang',
  { title: 'Big Bang', placement: 'slash' },
  [['editor/input', 'Hello'], ['editor/clear-current-slash']]
)
```

### `block-context-menu`

Register a block context menu item.

```ts
const unregister = logseq.Commands.register(
  'copy-block-uuid',
  {
    title: 'Copy block UUID',
    placement: 'block-context-menu',
  },
  async ({ uuid }) => {
    await navigator.clipboard.writeText(uuid)
  }
)
```

### `page-menu`

Register a page menu item.

```ts
const unregister = logseq.Commands.register(
  'analyze-page',
  {
    title: 'Analyze page',
    placement: 'page-menu',
  },
  async ({ page }) => {
    console.log('Analyze page', page)
  }
)
```

### `highlight-context-menu`

Register a PDF highlight context menu item.

```ts
const unregister = logseq.Commands.register(
  'send-highlight-to-inbox',
  {
    title: 'Send highlight to inbox',
    placement: 'highlight-context-menu',
    extras: { clearSelection: true },
  },
  async ({ content }) => {
    await logseq.Editor.appendBlockInPage('Inbox', content)
  }
)
```

### `simple`

Register a command without visible UI placement. This is useful when the command is intended to be executed by another plugin through `Commands.execute`.

```ts
const unregister = logseq.Commands.register(
  'sync-now',
  {
    title: 'Sync now',
    placement: 'simple',
  },
  async () => {
    await syncNow()
  }
)
```

## Multiple placements

Use `placements` when one logical command should appear in multiple places.

```ts
const unregister = logseq.Commands.register(
  'toggle-focus-mode',
  {
    title: 'Toggle focus mode',
    placements: ['palette', 'shortcut'],
    keybinding: 'mod+shift+f',
  },
  () => {
    toggleFocusMode()
  }
)

// Removes both palette and shortcut registrations.
unregister && unregister()
```

## Dynamic registration patterns

### Enable or disable a command from settings

```ts
let unregisterExport: (() => void) | false | undefined

function registerExportCommand() {
  unregisterExport = logseq.Commands.register(
    'export-current-page',
    { title: 'Export current page', placement: 'palette' },
    exportCurrentPage
  )
}

function unregisterExportCommand() {
  unregisterExport && unregisterExport()
  unregisterExport = undefined
}

async function main() {
  if (logseq.settings?.enableExport) registerExportCommand()

  logseq.onSettingsChanged((next) => {
    unregisterExportCommand()
    if (next.enableExport) registerExportCommand()
  })

  logseq.beforeunload(async () => {
    unregisterExportCommand()
  })
}
```

### Register temporary commands

```ts
const unregister = logseq.Commands.register(
  'temporary-review-action',
  { title: 'Approve review item', placement: 'palette' },
  approveCurrentReviewItem
)

setTimeout(() => {
  unregister && unregister()
}, 60_000)
```

## Compatibility with existing APIs

Old APIs remain supported. Internally, they share the same command registration path as v1 `logseq.Commands`.

| Existing API                                                   | Commands equivalent                                                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `App.registerCommandPalette({ key, label }, action)`           | `Commands.register(key, { title: label, placement: 'palette' }, action)`                              |
| `App.registerCommandShortcut(keybinding, action, opts)`        | `Commands.register(opts.key, { ...opts, placement: 'shortcut', keybinding }, action)`                 |
| `Editor.registerSlashCommand(tag, action)`                     | `Commands.register(tag, { title: tag, placement: 'slash' }, action)`                                  |
| `Editor.registerBlockContextMenuItem(label, action)`           | `Commands.register(key, { title: label, placement: 'block-context-menu' }, action)`                   |
| `Editor.registerHighlightContextMenuItem(label, action, opts)` | `Commands.register(key, { title: label, placement: 'highlight-context-menu', extras: opts }, action)` |
| `App.registerPageMenuItem(tag, action)`                        | `Commands.register(key, { title: tag, placement: 'page-menu' }, action)`                              |

These old APIs also return unregister handlers after v1.

## Cleanup semantics

Commands are cleaned in two ways:

1. **Manual unregister**: call the function returned by `register`.
2. **Plugin lifecycle cleanup**: when the plugin is disabled, reloaded, unloaded, or uninstalled, the host removes all commands registered by that plugin.

Manual unregister removes:

- local SDK hook listener;
- simple command registry entry;
- command palette entry;
- shortcut registry entry;
- slash command entry, if any.

Plugin lifecycle cleanup removes all commands by plugin id, including palette-only commands without shortcuts.

## v1 limitations

- `when` is metadata only. The host does not yet evaluate VSCode-like context expressions such as `editor.inCodeBlock` or `graph.isDb`.
- `Commands.onDidExecute(listener)` is not implemented in v1.
- Command collision handling still follows existing host behavior. Prefer stable, plugin-scoped keys.
- `Commands.execute` works with registered plugin commands and built-in `logseq.*` commands; it is not a general RPC replacement for arbitrary plugin model methods.

## Best practices

- Use a stable `key` for commands that other plugins may call.
- Keep `title` user-facing and concise.
- Store unregister handlers for dynamic commands and call them before re-registering.
- Always clean up dynamic registrations in `logseq.beforeunload`.
- Prefer `placements` over registering the same handler several times manually.
- Use `placement: 'simple'` for plugin-to-plugin automation commands that should not appear in UI.
