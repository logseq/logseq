---
name: logseq-plugin-sdk
description: Build, debug, or review Logseq plugins with the `@logseq/libs` SDK (TypeScript/JavaScript, iframe/shadow sandboxed). Use when the task involves writing plugin entry code, registering slash/command/UI items, provideUI/provideStyle/provideModel, settings schema, macro renderers, DB-graph properties & tags, Datascript/DSL queries, experimental APIs, theme plugins, or the `logseq/*` CLJS facade generated under this package.
---

# Logseq Plugin SDK Skill

This skill governs work inside `libs/` — the source of the npm package [`@logseq/libs`](./package.json) and its CLJS facade under [`cljs-sdk/`](./cljs-sdk). Use it whenever the user is authoring, upgrading, or debugging a Logseq plugin, or extending the SDK itself.

## When to use

Trigger this skill when the task mentions any of:

- `@logseq/libs`, `logseq.App`, `logseq.Editor`, `logseq.DB`, `logseq.UI`, `logseq.Assets`, `logseq.Git`, `logseq.Experiments`
- `provideUI` / `provideStyle` / `provideModel` / `useSettingsSchema` / `onMacroRendererSlotted`
- `registerSlashCommand`, `registerBlockContextMenuItem`, `registerCommandPalette`, `registerUIItem`
- Plugin `package.json` `logseq` block, themes, `effect` plugins, iframe/shadow sandbox
- DB-graph properties, tags/classes, property idents (`:logseq.property/*`, `:plugin.property.<id>/*`)
- Datascript / DSL queries through `logseq.DB.q` / `logseq.DB.datascriptQuery`
- Regenerating the CLJS SDK (`yarn run generate:schema`, `bb libs:generate-cljs-sdk`)

If the user is editing core Logseq app code (not a plugin), prefer the repo-root `AGENTS.md` instead.

## Golden rules

1. **Always `await logseq.ready(main)`** before touching any API. Most SDK calls are async RPC over postMessage.
2. **Detect graph mode** before using DB-only APIs: `await logseq.App.checkCurrentIsDbGraph()`. `IBatchBlock.properties` is **not** supported for DB graphs — use `Editor.upsertBlockProperty` / `upsertProperty` instead.
3. **Clean up listeners** in `logseq.beforeunload` (collect the `off` functions returned by every `onXxx` hook).
4. **Batch mutations** (`Editor.insertBatchBlock`) and **debounce** `DB.onChanged` / `onBlockChanged` handlers — they fire on every keystroke.
5. **Prefer CSS variables** (`--ls-primary-text-color`, `--ls-primary-background-color`, `--ls-border-color`, …) over hard-coded colors so plugins follow the active theme.
6. **Unique plugin id** in `package.json > logseq.id`; keep it lowercase-kebab. `main`/`entry` must point at a built HTML file.
7. **Experimental APIs (`logseq.Experiments.*`) are unstable** — only use when no stable API exists and document the reason.
8. **Idents are identity.** For built-in or cross-graph stable references, use idents (`:logseq.property/created-at`, `:plugin.property.<plugin-id>/<key>`) instead of display names.

## Canonical plugin skeleton

```ts
import '@logseq/libs'

const offHooks: Array<() => void> = []

async function main() {
  logseq.useSettingsSchema([
    { key: 'enabled', type: 'boolean', default: true, title: 'Enabled', description: '' },
  ])

  logseq.Editor.registerSlashCommand('My Command', async () => {
    await logseq.Editor.insertAtEditingCursor('Hello from my plugin!')
  })

  offHooks.push(
    logseq.DB.onChanged(({ blocks }) => {
      // debounce in real code
    }),
  )

  logseq.beforeunload(async () => {
    offHooks.forEach((off) => off())
  })
}

logseq.ready(main).catch(console.error)
```

## Workflow

1. **Scope the request.** Is it a new plugin, a change to an existing plugin, SDK-internal work, or the CLJS facade?
2. **Load the right reference file(s)** from [`./guides/`](./guides) (see table below) before proposing code.
3. **For SDK-internal changes**, open the matching TypeScript under [`./src/`](./src) (`LSPlugin.ts` for types, `LSPlugin.user.ts` for the proxy implementation, `modules/` for Experiments/Storage/Request).
4. **For CLJS facade changes**, regenerate with:
   ```bash
   yarn run generate:schema          # dist/logseq-sdk-schema.json
   bb libs:generate-cljs-sdk         # target/generated-cljs/logseq/*.cljs
   ```
   Non-proxy methods land in `logseq.core`; each `IXxxProxy` gets its own namespace (`logseq.app`, `logseq.editor`, …).
5. **Validate.** Build the plugin (`npm run build` / `parcel build`) and load it via Settings → Developer mode → `t p` → *Load unpacked plugin*. Use DevTools (`Cmd+Shift+I`) and `logseq.UI.showMsg` for quick feedback.
6. **Respect the package.json rules** (see [`guides/AGENTS.md`](./guides/AGENTS.md) §Configuration Fields).

## Reference map (`./guides/`)

Load these on demand — do not dump their full contents unless needed:

| File | Load when… |
|------|------------|
| [`guides/AGENTS.md`](./guides/AGENTS.md) | Authoritative overview of SDK namespaces, `package.json > logseq` schema, theme plugins, UI injection, macro renderers, lifecycle. Start here for most plugin tasks. |
| [`guides/custom_theme_guide.md`](./guides/custom_theme_guide.md) | Building or reviewing Logseq theme plugins, custom theme CSS, `logseq.themes`, `provideTheme`, theme variables, light/dark mode styling, or UI selector/theme-token guidance. |
| [`guides/starter_guide.md`](./guides/starter_guide.md) | Bootstrapping a new plugin project (Node/TS toolchain, desktop dev-mode loading, hello-world). |
| [`guides/db_properties_guide.md`](./guides/db_properties_guide.md) | Conceptual model: file-graph vs DB-graph properties, schema vs values, tag/class modeling. |
| [`guides/db_properties_references.md`](./guides/db_properties_references.md) | API reference for `upsertProperty`, `upsertBlockProperty`, property schemas/types/cardinality. |
| [`guides/db_tag_property_idents_guide.md`](./guides/db_tag_property_idents_guide.md) | Ident naming rules (`:logseq.property/*`, `:logseq.class/*`, `:plugin.property.<id>/*`, `:plugin.class.<id>/*`) and when to use them. |
| [`guides/db_query_guide.md`](./guides/db_query_guide.md) | DSL (`logseq.DB.q`) vs Datascript (`logseq.DB.datascriptQuery`) queries, parameters, change watchers. |
| [`guides/experiments_api_guide.md`](./guides/experiments_api_guide.md) | `logseq.Experiments.*` — React/ReactDOM reuse, internal components, CLJS interop, custom fenced-code / route / sidebar / property / block-body renderers. |

## Core API quick index

Full code examples live in [`guides/AGENTS.md`](./guides/AGENTS.md) — use this table to jump to the right namespace:

- `logseq.App` — info, graph, navigation, `registerUIItem`, `registerCommandPalette`, lifecycle hooks (`onCurrentGraphChanged`, `onThemeModeChanged`, `onRouteChanged`, `onMacroRendererSlotted`), `checkCurrentIsDbGraph`.
- `logseq.Editor` — slash & context-menu commands, block CRUD, `insertBatchBlock`, pages, cursor/selection, `upsertBlockProperty` / `getBlockProperties` (DB).
- `logseq.DB` — `q`, `datascriptQuery`, `onChanged`, `onBlockChanged`, `getFileContent` / `setFileContent`.
- `logseq.UI` — `showMsg`, `closeMsg`, `queryElementRect`, `queryElementById`.
- `logseq.Assets` — `listFilesOfCurrentGraph`, `makeSandboxStorage`, `makeUrl`, `builtInOpen`.
- `logseq.Git` — `execCommand`, `loadIgnoreFile`, `saveIgnoreFile` (**file graphs / desktop only**).
- `logseq.Experiments` — unstable; see the Experiments guide before using.
- Top-level — `provideUI`, `provideStyle`, `provideModel`, `useSettingsSchema`, `onSettingsChanged`, `updateSettings`, `showMainUI` / `hideMainUI` / `toggleMainUI` / `setMainUIInlineStyle`, `beforeunload`, `ready`.

## Common pitfalls

- Forgetting `await` — nearly every API is async.
- Using `IBatchBlock.properties` in a DB graph (silently ignored).
- Treating `block.content` as current — it is deprecated; use `block.title`.
- Registering the same `key` twice in `provideUI` / `provideStyle` without intending to replace.
- Hard-coding colors instead of `--ls-*` CSS variables.
- Leaking listeners (no cleanup in `beforeunload`).
- Shipping plugins without `logseq.id` or with a non-unique id.
- Assuming Git APIs exist on mobile / DB graphs.

## When editing SDK source

- Type definitions: [`src/LSPlugin.ts`](./src/LSPlugin.ts). Keep `IAppProxy`, `IEditorProxy`, `IDBProxy`, `IUIProxy`, `IAssetsProxy`, `IGitProxy`, `IExperimentsProxy` and the `ILSPluginUser` surface in sync.
- User proxy implementation: [`src/LSPlugin.user.ts`](./src/LSPlugin.user.ts).
- Modules: [`src/modules/`](./src/modules) (Experiments, Storage, Request).
- After changing the public surface, regenerate the CLJS facade (see Workflow step 4) and update [`CHANGELOG.md`](./CHANGELOG.md).
- Follow the repo commit style: short imperative subjects, optional scope (e.g. `enhance(libs): …`, `fix(libs): …`).

## Resources

- API docs: <https://plugins-doc.logseq.com>
- Samples: <https://github.com/logseq/logseq-plugin-samples>
- CLJS template: <https://github.com/logseq/cljs-plugin-example>
- TS template: <https://github.com/YU000jp/logseq-plugin-sample-kit-typescript>
- Discord: <https://discord.gg/KpN4eHY>

