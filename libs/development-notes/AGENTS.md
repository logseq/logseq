# AGENTS.md - Logseq Plugin Development Guide

## Overview

This document provides guidance for AI agents (Copilot, coding assistants, etc.) to help develop Logseq plugins using
the `@logseq/libs` SDK.

Logseq is a privacy-first, open-source knowledge management and note-taking application built on top of local plain-text
Markdown and Org-mode files. The plugin system extends Logseq's functionality through a JavaScript/TypeScript SDK.

## Repository Structure

### Core SDK (`logseq/logseq` - `libs/` folder)

The official SDK source code is located in the `libs/` directory of the main Logseq repository:

```
libs/
├── src/
│   ├── LSPlugin.ts           # Main type definitions & interfaces
│   ├── LSPlugin.user.ts      # User-facing plugin API implementation
│   ├── LSPlugin.core.ts      # Core plugin system
│   ├── LSPlugin. caller.ts   # IPC message caller
│   ├── LSPlugin.shadow.ts    # Shadow DOM support
│   ├── helpers.ts            # Utility functions
│   ├── modules/              # Additional modules (Experiments, Storage, Request)
│   └── postmate/             # Cross-frame communication
├── package.json              # NPM package config (@logseq/libs)
├── README.md                 # SDK documentation
└── CHANGELOG.md              # Version history
```

### Plugin Samples (`logseq/logseq-plugin-samples`)

Official sample plugins demonstrating various SDK features:

| Sample                        | Description                      | Key APIs                                        |
|-------------------------------|----------------------------------|-------------------------------------------------|
| `logseq-slash-commands`       | Basic slash command registration | `Editor.registerSlashCommand`                   |
| `logseq-pomodoro-timer`       | Macro renderer & slot UI         | `App.onMacroRendererSlotted`, `provideUI`       |
| `logseq-a-translator`         | Selection hooks & float UI       | `Editor.onInputSelectionEnd`, `provideUI`       |
| `logseq-awesome-fonts`        | Custom styles & settings         | `provideStyle`, `useSettingsSchema`             |
| `logseq-bujo-themes`          | Custom theme development         | `provideTheme`                                  |
| `logseq-journals-calendar`    | Calendar integration             | `App.getCurrentGraph`, `Editor.getPage`         |
| `logseq-emoji-picker`         | UI overlay with 3rd party libs   | `showMainUI`, `hideMainUI`                      |
| `logseq-reddit-hot-news`      | Batch block insertion            | `Editor.insertBatchBlock`, `App.registerUIItem` |
| `logseq-imdb-top250-importer` | DB graph data import             | DB-specific APIs                                |

## Plugin Architecture

### Entry Point Pattern

Every Logseq plugin follows this basic pattern:

```typescript
import '@logseq/libs'

async function main() {
  // Plugin initialization code
  console.log('Plugin loaded!')
}

// Bootstrap
logseq.ready(main).catch(console.error)
```

### Plugin Modes

Plugins can run in two modes defined in `package.json`:

- **`iframe`** (default): Plugin runs in an isolated iframe sandbox
- **`shadow`** (still draft): Plugin runs in a Shadow DOM container (faster, less isolation)

> **⚠️ Sandbox Environment:** All Logseq plugins run in an isolated iframe sandbox.
> This provides security isolation between plugins and the
> main application. Communication between the plugin iframe and
> Logseq happens through a postMessage-based RPC mechanism.

### package.json Configuration

## Package. json Configuration

### Basic Structure

```json
{
  "name": "logseq-my-plugin",
  "version": "0.1.0",
  "description": "A brief description of your plugin",
  "author": "Your Name",
  "license": "MIT",
  "main": "dist/index.html",
  "scripts": {
    "dev": "parcel ./index.html --public-url ./",
    "build": "parcel build --public-url .  --no-source-maps index.html"
  },
  "devDependencies": {
    "@logseq/libs": "^0.0.17",
    "parcel": "^2.0.0"
  },
  "logseq": {
    "id": "my-unique-plugin-id",
    "main": "dist/index.html",
    "icon": "./icon.png"
  }
}
```

### Logseq Configuration Block

The `logseq` field in `package.json` defines plugin metadata and behavior:

```json
{
  "logseq": {
    "id": "my-unique-plugin-id",
    "main": "dist/index.html",
    "icon": "./icon. png",
    "title": "My Plugin Display Name",
    "effect": true,
    "themes": [
      {
        "name": "My Dark Theme",
        "url": "./css/dark.css",
        "mode": "dark",
        "description": "A beautiful dark theme"
      },
      {
        "name": "My Light Theme",
        "url": "./css/light.css",
        "mode": "light",
        "description": "A clean light theme"
      }
    ]
  }
}
```

### Configuration Fields

| Field      | Type      | Required | Description                                                                                                                                                                 |
|------------|-----------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id`       | `string`  | Yes      | Unique plugin identifier.  Must be unique across all plugins.  Use lowercase with hyphens.                                                                                  |
| `main`     | `string`  | Yes      | Entry point HTML file path (relative to package.json).                                                                                                                      |
| `entry`    | `string`  | No       | Alias for `main`.                                                                                                                                                           |
| `icon`     | `string`  | No       | Plugin icon path.  Displayed in plugin marketplace and settings.                                                                                                            |
| `title`    | `string`  | No       | Display name shown in UI. Falls back to package `name` if not set.                                                                                                          |
| `effect`   | `boolean` | No       | When `true`, the plugin runs as a background effect without user interaction.  Useful for plugins that only inject styles/themes or run automated tasks. Default:  `false`. |
| `themes`   | `Theme[]` | No       | Array of theme definitions this plugin provides.                                                                                                                            |
| `devEntry` | `string`  | No       | Alternative entry point for development (e.g., with HMR).                                                                                                                   |

### Theme Configuration

For theme-only plugins, define themes in the `themes` array:

```json
{
  "logseq": {
    "id": "my-theme-pack",
    "main": "dist/index.html",
    "effect": true,
    "themes": [
      {
        "name": "Nord Dark",
        "url": "./themes/nord-dark.css",
        "mode": "dark",
        "description": "Nord-inspired dark color scheme"
      },
      {
        "name": "Nord Light",
        "url": "./themes/nord-light.css",
        "mode": "light",
        "description": "Nord-inspired light color scheme"
      }
    ]
  }
}
```

**Theme Object Fields:**

| Field         | Type     | Required | Description                                      |
|---------------|----------|----------|--------------------------------------------------|
| `name`        | `string` | Yes      | Theme display name shown in theme selector.      |
| `url`         | `string` | Yes      | Path to the CSS file (relative to package.json). |
| `mode`        | `light`  | `dark`   | Yes                                              | Theme mode.  Determines when theme appears in selector. |
| `description` | `string` | No       | Brief description of the theme.                  |

## Core API Namespaces

The SDK exposes the following primary namespaces through the global `logseq` object:

### `logseq. App` - Application APIs

Application-level operations and hooks:

```typescript
// Get app/user information
await logseq.App.getInfo()
await logseq.App.getUserConfigs()
await logseq.App.getCurrentGraph()

// Graph operations
await logseq.App.getCurrentGraphFavorites()
await logseq.App.getCurrentGraphRecent()

// Navigation
logseq.App.pushState('page', { name: 'my-page' })

// UI Registration
logseq.App.registerUIItem('toolbar', {
  key: 'my-button',
  template: `<a data-on-click="myHandler">Click</a>`
})

// Command Registration
logseq.App.registerCommandPalette({
  key: 'my-command',
  label: 'My Command',
  keybinding: { binding: 'mod+shift+m' }
}, () => { /* action */ })

// Event Hooks
logseq.App.onCurrentGraphChanged(() => {})
logseq.App.onThemeModeChanged(({ mode }) => {})
logseq.App.onRouteChanged(({ path }) => {})
logseq.App.onMacroRendererSlotted(({ slot, payload }) => {})
```

### `logseq.Editor` - Editor APIs

Block and page manipulation:

```typescript
// Slash Commands
logseq.Editor.registerSlashCommand('My Command', async ({ uuid }) => {
  await logseq.Editor.insertAtEditingCursor('Hello!')
})

// Block Context Menu
logseq.Editor.registerBlockContextMenuItem('My Action', async ({ uuid }) => {
  const block = await logseq.Editor.getBlock(uuid)
})

// Block Operations
await logseq.Editor.getBlock(uuid)
await logseq.Editor.insertBlock(uuid, 'content', { sibling: true })
await logseq.Editor.updateBlock(uuid, 'new content')
await logseq.Editor.removeBlock(uuid)
await logseq.Editor.insertBatchBlock(uuid, [
  { content: 'Block 1', children: [{ content: 'Child' }] }
])

// Page Operations
await logseq.Editor.getPage('page-name')
await logseq.Editor.createPage('new-page', { prop: 'value' })
await logseq.Editor.deletePage('page-name')
await logseq.Editor.getCurrentPageBlocksTree()

// Cursor & Selection
await logseq.Editor.checkEditing()
await logseq.Editor.getEditingCursorPosition()
await logseq.Editor.insertAtEditingCursor('text')
await logseq.Editor.exitEditingMode()

// Properties (DB graphs)
await logseq.Editor.upsertBlockProperty(uuid, 'key', 'value')
await logseq.Editor.getBlockProperties(uuid)
```

### `logseq.DB` - Database APIs

Query and data operations:

```typescript
// DSL Query (Logseq query language)
const results = await logseq.DB.q('[[my-page]]')

// Datascript Query
const results1 = await logseq.DB.datascriptQuery(`
  [: find (pull ?b [*])
   :where [?b :block/marker "TODO"]]
`)

// Watch for changes
logseq.DB.onChanged(({ blocks, txData }) => {
  console.log('Database changed:', blocks)
})

// Watch specific block
logseq.DB.onBlockChanged(uuid, (block, txData) => {
  console.log('Block changed:', block)
})

// File operations
await logseq.DB.getFileContent('logseq/custom.css')
await logseq.DB.setFileContent('logseq/custom.js', 'console.log("hi")')
```

### `logseq.UI` - UI Utilities

```typescript
// Toast messages
await logseq.UI.showMsg('Success! ', 'success')
await logseq.UI.showMsg('Warning!', 'warning', { timeout: 5000 })
logseq.UI.closeMsg(key)

// DOM queries
const rect = await logseq.UI.queryElementRect('.my-selector')
const exists = await logseq.UI.queryElementById('my-id')
```

### `logseq.Git` - Git Operations

```typescript
const result = await logseq.Git.execCommand(['status'])
const ignoreContent = await logseq.Git.loadIgnoreFile()
await logseq.Git.saveIgnoreFile('. DS_Store\nnode_modules')
```

### `logseq.Assets` - Asset Management

```typescript
const files = await logseq.Assets.listFilesOfCurrentGraph(['png', 'jpg'])
const storage = logseq.Assets.makeSandboxStorage()
const url = await logseq.Assets.makeUrl('path/to/file')
await logseq.Assets.builtInOpen('path/to/asset. pdf')
```

## UI Injection Patterns

### provideUI - Inject Custom UI

```typescript
logseq.provideUI({
  key: 'my-ui',
  path: '#my-target',  // or use `slot` for macro renderers
  template: `<div data-on-click="myHandler">Click me</div>`,
  style: { backgroundColor: 'white', padding: '10px' },
  attrs: { title: 'My UI' },
  close: 'outside',  // close when clicking outside
})
```

### provideStyle - Inject CSS

```typescript
logseq.provideStyle(`
  .my-class {
    color: var(--ls-primary-text-color);
    background:  var(--ls-primary-background-color);
  }
`)

// Or with a key for updates
logseq.provideStyle({
  key: 'my-styles',
  style: `.my-class { color: red; }`
})
```

### provideModel - Event Handlers

```typescript
logseq.provideModel({
  myHandler(e) {
    console.log('Clicked!', e.dataset)
  },
  async asyncHandler(e) {
    const block = await logseq.Editor.getBlock(e.dataset.blockUuid)
  }
})
```

### Main UI (Full-screen Overlay)

```typescript
// Show plugin's main UI
logseq.showMainUI({ autoFocus: true })

// Hide it
logseq.hideMainUI({ restoreEditingCursor: true })

// Toggle
logseq.toggleMainUI()

// Style the main UI container
logseq.setMainUIInlineStyle({
  position: 'fixed',
  top: '100px',
  left: '50%',
  zIndex: 11,
})
```

## Settings Schema

Define user-configurable settings:

```typescript
logseq.useSettingsSchema([
  {
    key: 'apiKey',
    type: 'string',
    default: '',
    title: 'API Key',
    description: 'Enter your API key'
  },
  {
    key: 'enableFeature',
    type: 'boolean',
    default: true,
    title: 'Enable Feature',
    description: 'Toggle this feature on/off'
  },
  {
    key: 'theme',
    type: 'enum',
    enumChoices: ['light', 'dark', 'auto'],
    enumPicker: 'select',
    default: 'auto',
    title: 'Theme',
    description: 'Select theme mode'
  },
  {
    key: 'fontSize',
    type: 'number',
    default: 14,
    title: 'Font Size',
    description: 'Customize font size',
    inputAs: 'range'
  }
])

// Access settings
const apiKey = logseq.settings?.apiKey

// Update settings
logseq.updateSettings({ apiKey: 'new-key' })

// Listen for changes
logseq.onSettingsChanged((newSettings, oldSettings) => {
  console.log('Settings changed:', newSettings)
})
```

## Macro Renderer Pattern

Create custom block renderers using `{{renderer : type, arg1, arg2}}`:

```typescript
logseq.App.onMacroRendererSlotted(({ slot, payload }) => {
  const [type, ...args] = payload.arguments

  if (type !== ': my-renderer') return

  logseq.provideUI({
    key: `my-renderer-${payload.uuid}`,
    slot,
    template: `
      <div class="my-renderer">
        <span>${args.join(', ')}</span>
      </div>
    `,
  })
})

// Register slash command to insert the macro
logseq.Editor.registerSlashCommand('Insert My Renderer', async () => {
  await logseq.Editor.insertAtEditingCursor(
    `{{renderer :my-renderer, arg1, arg2}}`
  )
})
```

## Key Types Reference

### Block Entity

```typescript
interface BlockEntity {
  id: number           // Database entity ID
  uuid: string         // Block UUID
  title: string        // Block content
  content?: string     // @deprecated, use title
  format: 'markdown' | 'org'
  parent: { id: number }
  page: { id: number }
  properties?: Record<string, any>
  children?: BlockEntity[]
  'collapsed? ': boolean
  createdAt: number
  updatedAt: number
}
```

### Page Entity

```typescript
interface PageEntity {
  id: number
  uuid: string
  name: string
  type: 'page' | 'journal' | 'whiteboard' | 'class' | 'property' | 'hidden'
  format: 'markdown' | 'org'
  'journal? ': boolean
  journalDay?: number  // YYYYMMDD format for journals
  properties?: Record<string, any>
  createdAt: number
  updatedAt: number
}
```

## Development Workflow

### Setup

```bash
# Clone sample repository
git clone https://github.com/logseq/logseq-plugin-samples
cd logseq-plugin-samples/logseq-slash-commands

# Install dependencies
npm install  # or yarn

# Build
npm run build
```

### Loading in Logseq

1. Open Logseq Desktop
2. Enable **Developer mode** in Settings
3. Press `t p` to open Plugins dashboard
4. Click **Load unpacked plugin**
5. Select your plugin directory

### Debugging

- Use browser DevTools (Ctrl/Cmd + Shift + I)
- Check console for `@logseq/libs` debug output
- Use `logseq.UI.showMsg()` for quick debugging

## Best Practices

### Performance

1. **Debounce frequent operations** - especially DB queries and UI updates
2. **Use `onBlockChanged` sparingly** - it fires on every edit
3. **Batch block operations** - use `insertBatchBlock` instead of multiple `insertBlock` calls
4. **Clean up listeners** - store and call off-hooks in `beforeunload`

```typescript
const offHooks: (() => void)[] = []

offHooks.push(
  logseq.DB.onChanged(() => { /* ...  */ })
)

logseq.beforeunload(async () => {
  offHooks.forEach(off => off())
})
```

### Error Handling

```typescript
try {
  const block = await logseq.Editor.getBlock(uuid)
  if (!block) {
    await logseq.UI.showMsg('Block not found', 'warning')
    return
  }
  // ... proceed
} catch (error) {
  console.error('Plugin error:', error)
  await logseq.UI.showMsg('An error occurred', 'error')
}
```

### CSS Variables

Use Logseq's CSS custom properties for consistent theming:

```css
.my-plugin-ui {
  color: var(--ls-primary-text-color);
  background: var(--ls-primary-background-color);
  border: 1px solid var(--ls-border-color);
}
```

### DB vs File Graphs

Check graph type before using DB-specific features:

```typescript
const isDbGraph = await logseq.App.checkCurrentIsDbGraph()
if (isDbGraph) {
  // Use DB-specific APIs
  await logseq.Editor.upsertProperty('my-prop', { type: 'string' })
}
```

## Resources

- **API Documentation**: https://plugins-doc.logseq.com
- **Plugin Samples**: https://github.com/logseq/logseq-plugin-samples
- **SDK Source**: https://github.com/logseq/logseq/tree/master/libs
- **NPM Package**: https://www.npmjs.com/package/@logseq/libs
- **Discord Community**: https://discord.gg/KpN4eHY
- **Community Templates**:
    - ClojureScript: https://github.com/logseq/cljs-plugin-example
    - TypeScript: https://github.com/YU000jp/logseq-plugin-sample-kit-typescript

## Version Compatibility

Always check the minimum Logseq version required for specific APIs. Keep `@logseq/libs` updated to the latest version
for best compatibility and performance.

```bash
# Check current version
npm info @logseq/libs version

# Update
npm update @logseq/libs
```