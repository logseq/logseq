# Logseq Experiments API Guide

This guide covers the **experimental APIs** exposed as `logseq.Experiments` in the Logseq Plugin SDK.

These APIs are intentionally lower-level than the stable SDK. They let plugins:

- reuse host React/ReactDOM
- render internal Logseq components
- convert between JS and ClojureScript data structures
- load scripts dynamically
- register custom renderers for fenced code, routes, sidebars, properties, and block bodies
- hook internal extensions such as KaTeX
- access host/plugin internals when absolutely necessary

> **⚠️ Warning**
>
> Everything in `logseq.Experiments` is unstable. Signatures, render props, and behaviors may change without a normal deprecation window. Plugins using these APIs may be temporarily unsupported on the Marketplace.

---

## Overview

The current experimental surface includes:

1. **React integration**: `React`, `ReactDOM`
2. **Internal components**: `Components.Editor`
3. **Interop utilities**: `Utils.toClj`, `toJs`, `jsxToClj`, `toKeyword`, `toSymbol`
4. **Script loading**: `loadScripts(...)`
5. **Renderer registration**:
   - `registerFencedCodeRenderer(...)`
   - `registerDaemonRenderer(...)`
   - `registerRouteRenderer(...)`
   - `registerHostedRenderer(...)`
   - `registerSidebarRenderer(...)`
   - `registerBlockPropertiesRenderer(...)`
   - `registerBlockRenderer(...)`
6. **Extension enhancers**: `registerExtensionsEnhancer(...)`
7. **Host/plugin internals**:
   - `pluginLocal`
   - `ensureHostScope()`
   - `invokeExperMethod(...)`

---

## 1. React Integration

Use the host's React runtime instead of bundling your own copy.

### `logseq.Experiments.React`

Returns the React instance from the host scope.

```typescript
const React = logseq.Experiments.React
```

### `logseq.Experiments.ReactDOM`

Returns the ReactDOM instance from the host scope.

```typescript
const ReactDOM = logseq.Experiments.ReactDOM
```

### Example

```typescript
const React = logseq.Experiments.React

const MyComponent = React.createElement(
  'div',
  { className: 'my-plugin-card' },
  'Hello from a host React tree'
)
```

---

## 2. Components

### `logseq.Experiments.Components.Editor`

Renders Logseq page content using an internal page editor component.

**Type**

```typescript
(props: { page: string } & Record<string, any>) => any
```

**Parameters**

- `page`: page name to render

```typescript
const Editor = logseq.Experiments.Components.Editor

const preview = Editor({ page: 'My Page Name' })
```

---

## 3. Utilities

`logseq.Experiments.Utils` exposes host interop helpers.

### `toClj(input: any)`

Convert JavaScript data into ClojureScript data structures.

```typescript
const cljData = logseq.Experiments.Utils.toClj({ key: 'value' })
```

### `jsxToClj(input: any)`

Convert JS/JSX-style input to ClojureScript while preserving JSX-ish structures better than a plain conversion.

```typescript
const view = { type: 'div', props: { children: 'Content' } }
const cljView = logseq.Experiments.Utils.jsxToClj(view)
```

### `toJs(input: any)`

Convert ClojureScript values back into plain JavaScript.

```typescript
const jsData = logseq.Experiments.Utils.toJs(cljData)
```

### `toKeyword(input: any)`

Convert a string into a ClojureScript keyword.

```typescript
const keyword = logseq.Experiments.Utils.toKeyword('my-key')
```

### `toSymbol(input: any)`

Convert a string into a ClojureScript symbol.

```typescript
const symbol = logseq.Experiments.Utils.toSymbol('my-symbol')
```

---

## 4. Script Loading

### `logseq.Experiments.loadScripts(...scripts: string[])`

Dynamically load scripts into the host environment.

**Parameters**

- `scripts`: HTTP(S) URLs or relative plugin resource paths

**Returns**

```typescript
Promise<void>
```

**Behavior**

- relative paths are resolved against the current plugin resource root
- HTTP/HTTPS URLs are used as-is
- scripts are loaded in the given order

```typescript
await logseq.Experiments.loadScripts(
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.umd.min.js'
)

await logseq.Experiments.loadScripts('./vendor/local-helper.js')

await logseq.Experiments.loadScripts(
  'https://cdn.example.com/lib1.js',
  'https://cdn.example.com/lib2.js',
  './local-script.js'
)
```

---

## 5. Custom Renderers

Experimental renderers are where most of the newer APIs live.

## 5.1 Fenced Code Renderer

Register a custom renderer for fenced code blocks such as:

````markdown
```my-lang
...
```
````

### `logseq.Experiments.registerFencedCodeRenderer(lang, opts)`

```text
registerFencedCodeRenderer(
  lang: string,
  opts: {
    edit?: boolean
    before?: () => Promise<void>
    subs?: string[]
    render: (props: { content: string }) => any
  }
): any
```

**Options**

- `edit`: whether the fenced block remains editable
- `before`: async preload hook, usually for loading scripts/assets
- `subs`: experimental subscription list
- `render`: React renderer receiving `{ content }`

```typescript
logseq.Experiments.registerFencedCodeRenderer('my-chart', {
  edit: false,
  before: async () => {
    await logseq.Experiments.loadScripts(
      'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.umd.min.js'
    )
  },
  render: ({ content }) => {
    const React = logseq.Experiments.React

    return React.createElement('canvas', {
      ref: (canvas: HTMLCanvasElement | null) => {
        if (!canvas || !window.Chart) return

        try {
          const config = JSON.parse(content)
          new window.Chart(canvas, config)
        } catch (error) {
          console.error('Chart renderer error', error)
        }
      },
    })
  },
})
```

## 5.2 Daemon Renderer

Register a renderer that stays mounted in a global daemon container.

### `logseq.Experiments.registerDaemonRenderer(key, opts)`

```text
registerDaemonRenderer(
  key: string,
  opts: {
    before?: () => Promise<void>
    subs?: string[]
    render: (props: {}) => any
  }
): any
```

**Notes**

- use `subs`, not `sub`
- `before` is supported by the host even if older typings may not show it yet
- daemon renderers are useful for lightweight always-on UI, not large app shells

```typescript
logseq.Experiments.registerDaemonRenderer('my-status-bar', {
  subs: ['ui/theme'],
  render: () => {
    const React = logseq.Experiments.React

    return React.createElement(
      'div',
      {
        style: {
          position: 'fixed',
          right: 12,
          bottom: 12,
          padding: '6px 10px',
          borderRadius: 8,
          background: 'var(--ls-secondary-background-color)',
        },
      },
      'Plugin active'
    )
  },
})
```

## 5.3 Route Renderer

Register a custom route view.

### `logseq.Experiments.registerRouteRenderer(key, opts)`

```text
registerRouteRenderer(
  key: string,
  opts: {
    path: string
    name?: string
    subs?: string[]
    render: (props: {}) => any
  }
): any
```

**Options**

- `path`: route path, e.g. `'/my-plugin-dashboard'`
- `name`: optional display name; if omitted, the internal key is reused
- `subs`: experimental subscription list
- `render`: route component

```typescript
logseq.Experiments.registerRouteRenderer('my-custom-page', {
  path: '/my-plugin-dashboard',
  name: 'Dashboard',
  render: () => {
    const React = logseq.Experiments.React

    return React.createElement('div', { className: 'my-plugin-dashboard' }, [
      React.createElement('h1', { key: 'title' }, 'Plugin Dashboard'),
      React.createElement('p', { key: 'body' }, 'Custom content here'),
    ])
  },
})
```

> Route navigation is handled by Logseq's router. In docs and examples, prefer describing the registered `path` rather than relying on page navigation APIs, which are not the same thing.

## 5.4 Hosted Renderer

Low-level API for host-managed render targets.

Today, the main built-in consumer is the right sidebar, so most plugins should prefer `registerSidebarRenderer(...)` unless they specifically need the lower-level primitive.

### `logseq.Experiments.registerHostedRenderer(key, opts)`

```text
registerHostedRenderer(
  key: string,
  opts: {
    title?: string
    mode?: string
    type?: string
    subs?: string[]
    render: (props: {}) => any
  }
): any
```

**Options**

- `title`: display title when the host surfaces the renderer
- `type`: host-specific placement type
- `mode`: host-specific placement mode
- `subs`: experimental subscription list
- `render`: React renderer

The host currently passes the registered renderer record back into the render function in some placements. Treat that as implementation detail, not a stable contract.

## 5.5 Sidebar Renderer

Convenience wrapper over `registerHostedRenderer(...)` for right-sidebar tools.

### `logseq.Experiments.registerSidebarRenderer(key, opts)`

```text
registerSidebarRenderer(
  key: string,
  opts: {
    title?: string
    subs?: string[]
    render: (props: {}) => any
    [key: string]: any
  }
): any
```

**Behavior**

- your key is automatically namespaced internally as `_sidebar.${key}`
- `type` is forced to `'sidebar'`
- the renderer appears in the right-sidebar plugin menu

```typescript
logseq.Experiments.registerSidebarRenderer('inspector', {
  title: 'Inspector',
  render: () => {
    const React = logseq.Experiments.React

    return React.createElement('div', null, 'Hello from the sidebar renderer')
  },
})
```

## 5.6 Block Properties Renderer

Render custom UI inside a block's properties area.

### `logseq.Experiments.registerBlockPropertiesRenderer(key, opts)`

```text
type BlockPropertiesCondition =
  | { has: string }
  | { equals: [string, any] }
  | { in: [string, any[]] }
  | { not: BlockPropertiesCondition }
  | { any: BlockPropertiesCondition[] }
  | { all: BlockPropertiesCondition[] }

type BlockPropertiesRendererProps = {
  blockId: string
  properties: Record<string, any>
}

registerBlockPropertiesRenderer(
  key: string,
  opts: {
    when?: BlockPropertiesCondition | ((props: BlockPropertiesRendererProps) => boolean)
    mode?: 'prepend' | 'append' | 'replace'
    priority?: number
    subs?: string[]
    render: (props: BlockPropertiesRendererProps) => any
  }
): any
```

**Behavior**

- `when` may be omitted, a declarative condition, or a synchronous predicate
- `mode` controls placement in the properties area:
  - `prepend`: before native properties
  - `append`: after native properties
  - `replace`: replace native properties UI
- higher `priority` wins for conflicts
- for `replace`, the highest-priority matching replace renderer wins
- for `prepend`/`append`, all matching renderers are rendered in priority order

**Render props**

- `blockId`: block UUID string
- `properties`: plain JS object keyed by property names without the leading `:`

**Property serialization details**

Before data is passed into plugins, Logseq normalizes some values:

- keywords become strings like `'logseq.property/status'`
- UUIDs become strings
- entity references become small objects such as `{ uuid, title }`
- sets / collections of entity references become arrays of those objects

```typescript
logseq.Experiments.registerBlockPropertiesRenderer('priority-pill', {
  when: { has: 'priority' },
  mode: 'prepend',
  priority: 10,
  render: ({ properties }) => {
    const React = logseq.Experiments.React
    const priority = properties.priority

    if (!priority) return null

    return React.createElement(
      'span',
      {
        style: {
          display: 'inline-flex',
          marginRight: 8,
          padding: '2px 8px',
          borderRadius: 9999,
          fontSize: 12,
          background: 'var(--ls-tertiary-background-color)',
        },
      },
      `Priority: ${priority}`
    )
  },
})
```

## 5.7 Block Renderer

Replace a block's main outline body with plugin UI.

### `logseq.Experiments.registerBlockRenderer(key, opts)`

```text
type BlockRendererChild = Record<string, any> & {
  children?: BlockRendererChild[]
}

type BlockRendererProps = {
  blockId: string
  properties: Record<string, any>
  uuid?: string
  page?: string
  content?: string
  format?: string
  children?: BlockRendererChild[]
}

registerBlockRenderer(
  key: string,
  opts: {
    when?: (props: BlockRendererProps) => boolean
    includeChildren?: boolean
    priority?: number
    subs?: string[]
    render: (props: BlockRendererProps) => any
  }
): any
```

**Behavior**

- `when` must be a **synchronous predicate function** if provided
- declarative conditions are **not** supported here
- highest `priority` match wins
- when the plugin renderer is active, users can switch back to the native outline view via built-in UI on that block
- when `includeChildren` is `true`, Logseq passes a recursive child tree and hides native outline children while the plugin renderer is active

**Render props**

- `blockId`: block UUID string
- `uuid`: same block UUID
- `page`: page title
- `content`: block content/title text
- `format`: `'markdown'`, `'org'`, etc.
- `properties`: normalized property object
- `children`: recursive normalized child tree when `includeChildren` is enabled

```typescript
logseq.Experiments.registerBlockRenderer('kanban-card', {
  when: ({ properties }) => properties.view === 'kanban-card',
  includeChildren: true,
  priority: 20,
  render: ({ content, children = [] }) => {
    const React = logseq.Experiments.React

    return React.createElement('section', { className: 'my-kanban-card' }, [
      React.createElement('h3', { key: 'title' }, content || 'Untitled'),
      React.createElement(
        'ul',
        { key: 'children' },
        children.map((child, index) =>
          React.createElement('li', { key: child.uuid || index }, child.title || child.content)
        )
      ),
    ])
  },
})
```

---

## 6. Extension Enhancers

### `logseq.Experiments.registerExtensionsEnhancer(type, enhancer)`

Enhance host libraries such as KaTeX.

```text
registerExtensionsEnhancer(
  type: 'katex' | 'codemirror',
  enhancer: (value: any) => Promise<any>
): any
```

For `katex`, the host immediately invokes the enhancer if KaTeX is already present.

```typescript
logseq.Experiments.registerExtensionsEnhancer('katex', async (katex) => {
  katex.macros = {
    ...katex.macros,
    '\\RR': '\\mathbb{R}',
    '\\NN': '\\mathbb{N}',
    '\\ZZ': '\\mathbb{Z}',
  }
})
```

---

## 7. Host / Plugin Internals

## 7.1 `logseq.Experiments.pluginLocal`

Returns the internal `PluginLocal` instance for the current plugin.

```typescript
const pluginLocal = logseq.Experiments.pluginLocal
console.log(pluginLocal.id)
```

Use this sparingly. It is intentionally internal.

## 7.2 `logseq.Experiments.ensureHostScope()`

Returns the host scope, currently `window.top`, after attempting an access check.

```typescript
const host = logseq.Experiments.ensureHostScope()
```

This is mostly useful when you need direct access to host globals and understand the risks.

## 7.3 `logseq.Experiments.invokeExperMethod(type, ...args)`

Direct escape hatch for calling experimental host methods.

```typescript
const result = logseq.Experiments.invokeExperMethod(
  'someExperimentalFeature',
  arg1,
  arg2
)
```

`type` is normalized to snake_case before resolution.

---

## 8. Complete Example: Fenced Code Renderer

```typescript
import '@logseq/libs'

async function main() {
  logseq.Experiments.registerFencedCodeRenderer('chart', {
    edit: false,
    before: async () => {
      await logseq.Experiments.loadScripts(
        'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.umd.min.js'
      )
    },
    render: ({ content }) => {
      const React = logseq.Experiments.React

      return React.createElement('canvas', {
        ref: (canvas: HTMLCanvasElement | null) => {
          if (!canvas || !window.Chart) return

          try {
            const config = JSON.parse(content)
            new window.Chart(canvas, config)
          } catch (error) {
            console.error('Chart rendering error:', error)
          }
        },
      })
    },
  })
}

logseq.ready(main).catch(console.error)
```

**Usage**

````markdown
```chart
{
  "type": "line",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr"],
    "datasets": [{
      "label": "Sales",
      "data": [10, 20, 15, 30],
      "borderColor": "rgb(75, 192, 192)"
    }]
  }
}
```
````

---

## 9. Complete Example: Block Properties Badge

```typescript
import '@logseq/libs'

async function main() {
  logseq.Experiments.registerBlockPropertiesRenderer('task-status-chip', {
    when: {
      any: [
        { equals: ['status', 'todo'] },
        { equals: ['status', 'doing'] },
      ],
    },
    mode: 'append',
    priority: 5,
    render: ({ properties }) => {
      const React = logseq.Experiments.React
      const value = properties.status

      return React.createElement(
        'span',
        {
          style: {
            marginLeft: 8,
            padding: '2px 8px',
            borderRadius: 9999,
            fontSize: 12,
            background: 'var(--ls-secondary-background-color)',
          },
        },
        `Status: ${value}`
      )
    },
  })
}

logseq.ready(main).catch(console.error)
```

---

## 10. Best Practices

1. **Prefer stable APIs first**. Only use `Experiments` when the stable SDK cannot solve the problem.
2. **Use host React**. Avoid bundling a second React runtime into the same tree.
3. **Keep `when` predicates synchronous**. This is especially important for `registerBlockRenderer(...)`.
4. **Use `before` to preload dependencies** instead of doing ad hoc script injection inside render.
5. **Treat `subs` as experimental**. Reactive semantics may change.
6. **Keep renderers lightweight**. Block and daemon renderers can affect overall app responsiveness.
7. **Handle bad input defensively**. Render props often contain user-authored content and properties.
8. **Document your experimental usage** in the plugin README so users understand the risk.
9. **Prefer `registerSidebarRenderer(...)` over raw hosted renderers** when your goal is a right-sidebar tool.
10. **Test against real graphs**. Property values, references, and child trees can vary a lot.

---

## 11. Limitations and Notes

- **Experimental status**: no stability guarantee
- **Marketplace support**: may be restricted temporarily
- **Security**: be careful with external scripts and direct host access
- **Performance**: custom renderers run inside the app UI, so poor implementations are noticeable
- **Typings may lag behavior**: some newer runtime options can land before every generated wrapper/type is refreshed

### ClojureScript SDK note

The generated ClojureScript wrapper namespace `com.logseq.experiments` currently includes wrappers for:

- `load-scripts`
- `register-fenced-code-renderer`
- `register-daemon-renderer`
- `register-hosted-renderer`
- `register-sidebar-renderer`
- `register-route-renderer`
- `register-extensions-enhancer`

At the time of writing, `register-block-properties-renderer` and `register-block-renderer` are not yet present in that generated wrapper, so ClojureScript plugins may need to call them via `invoke-exper-method` until the wrapper is regenerated.

---

## See Also

- [Starter Guide](./starter_guide.md) - getting started with plugin development
- [DB Properties Guide](./db_properties_guide.md) - working with database properties
- [DB Query Guide](./db_query_guide.md) - querying the Logseq database

---

## Support

For questions and issues:

- [Logseq Discord](https://discord.gg/logseq) - `#plugin-dev`
- [GitHub Discussions](https://github.com/logseq/logseq/discussions)
- [Plugin API Documentation](https://plugins-doc.logseq.com/)

Remember: these are experimental features. Use them carefully and test thoroughly.
