# Logseq Experiments API Guide

This guide covers the **experimental APIs** available in the Logseq Plugin SDK. These APIs provide advanced functionality for creating custom renderers, loading external scripts, and accessing internal utilities.

> **⚠️ WARNING**: These are experimental features that may change at any time. Plugins using these APIs may not be supported on the Marketplace temporarily.

---

## Overview

The Experiments API is accessed via `logseq.Experiments` and provides:

1. **React Integration** - Access to React and ReactDOM from the host
2. **Custom Renderers** - Register custom code block, route, and daemon renderers
3. **Component Access** - Access to internal Logseq components
4. **Utilities** - ClojureScript interop utilities (toClj, toJs, etc.)
5. **Script Loading** - Dynamic loading of external scripts
6. **Extension Enhancers** - Enhance libraries like KaTeX and CodeMirror

---

## 1. React Integration

Access React and ReactDOM from the Logseq host environment.

### Properties

#### `logseq.Experiments.React`

Returns the React instance from the host scope.

```typescript
const React = logseq.Experiments.React
```

#### `logseq.Experiments.ReactDOM`

Returns the ReactDOM instance from the host scope.

```typescript
const ReactDOM = logseq.Experiments.ReactDOM
```

### Example Usage

```typescript
const React = logseq.Experiments.React
const ReactDOM = logseq.Experiments.ReactDOM

// Use React to create components
const MyComponent = React.createElement('div', null, 'Hello from plugin!')
```

---

## 2. Components

Access internal Logseq components for advanced UI integration.

### `logseq.Experiments.Components.Editor`

A page editor component that can render Logseq page content.

**Type**: `(props: { page: string } & any) => any`

**Parameters**:
- `page` (string): The page name to render

```typescript
const Editor = logseq.Experiments.Components.Editor

// Render a page editor
const editor = Editor({ page: 'My Page Name' })
```

---

## 3. Utilities

ClojureScript interop utilities for data conversion between JavaScript and ClojureScript.

### `logseq.Experiments.Utils`

Provides conversion utilities:

#### `toClj(input: any)`

Convert JavaScript data to ClojureScript data structures.

```typescript
const cljData = logseq.Experiments.Utils.toClj({ key: 'value' })
```

#### `jsxToClj(input: any)`

Convert JSX/JavaScript objects to ClojureScript, preserving JSX structures.

```typescript
const cljData = logseq.Experiments.Utils.jsxToClj(<div>Content</div>)
```

#### `toJs(input: any)`

Convert ClojureScript data structures to JavaScript.

```typescript
const jsData = logseq.Experiments.Utils.toJs(cljData)
```

#### `toKeyword(input: any)`

Convert a string to a ClojureScript keyword.

```typescript
const keyword = logseq.Experiments.Utils.toKeyword('my-key')
```

#### `toSymbol(input: any)`

Convert a string to a ClojureScript symbol.

```typescript
const symbol = logseq.Experiments.Utils.toSymbol('my-symbol')
```

---

## 4. Script Loading

### `logseq.Experiments.loadScripts(...scripts: string[])`

Dynamically load external scripts into the Logseq environment.

**Parameters**:
- `scripts` (string[]): Array of script URLs or relative paths

**Returns**: `Promise<void>`

**Behavior**:
- Relative paths are resolved using the plugin's resource path
- HTTP/HTTPS URLs are loaded directly
- Scripts are loaded in order

```typescript
// Load external library
await logseq.Experiments.loadScripts(
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
)

// Load local script from plugin resources
await logseq.Experiments.loadScripts('./my-script.js')

// Load multiple scripts
await logseq.Experiments.loadScripts(
  'https://cdn.example.com/lib1.js',
  'https://cdn.example.com/lib2.js',
  './local-script.js'
)
```

---

## 5. Custom Renderers

### 5.1 Fenced Code Renderer

Register a custom renderer for code blocks with specific language tags.

#### `logseq.Experiments.registerFencedCodeRenderer(lang: string, opts: object)`

**Parameters**:
- `lang` (string): The language identifier for the code block (e.g., 'mermaid', 'chart')
- `opts` (object):
  - `render` (function, required): Render function that receives props
  - `edit` (boolean, optional): Whether the block is editable
  - `before` (function, optional): Async function to run before rendering
  - `subs` (string[], optional): Subscriptions to state changes

**Render Props**:
- `content` (string): The content of the code block

```typescript
// Register a custom code block renderer
logseq.Experiments.registerFencedCodeRenderer('my-chart', {
  edit: false,
  before: async () => {
    // Load dependencies before rendering
    await logseq.Experiments.loadScripts(
      'https://cdn.jsdelivr.net/npm/chart.js'
    )
  },
  render: (props) => {
    const React = logseq.Experiments.React
    
    return React.createElement('div', {
      ref: (el) => {
        if (el) {
          // Parse content and render chart
          const config = JSON.parse(props.content)
          new Chart(el, config)
        }
      }
    })
  }
})
```

**Usage in Logseq**:
````markdown
```my-chart
{
  "type": "bar",
  "data": {
    "labels": ["A", "B", "C"],
    "datasets": [{"data": [10, 20, 30]}]
  }
}
```
````

### 5.2 Daemon Renderer

Register a renderer that runs continuously in the background (daemon).

#### `logseq.Experiments.registerDaemonRenderer(key: string, opts: object)`

**Parameters**:
- `key` (string): Unique identifier for the daemon renderer
- `opts` (object):
  - `render` (function, required): Render function
  - `sub` (string[], optional): Subscriptions to state changes

```typescript
// Register a daemon renderer for persistent UI
logseq.Experiments.registerDaemonRenderer('my-status-bar', {
  sub: ['ui/theme', 'ui/sidebar-open'],
  render: (props) => {
    const React = logseq.Experiments.React
    
    return React.createElement('div', {
      style: {
        position: 'fixed',
        bottom: 0,
        right: 0,
        padding: '10px',
        background: '#333',
        color: '#fff'
      }
    }, 'Status: Active')
  }
})
```

### 5.3 Route Renderer

Register a custom renderer for specific routes in Logseq.

#### `logseq.Experiments.registerRouteRenderer(key: string, opts: object)`

**Parameters**:
- `key` (string): Unique identifier for the route renderer
- `opts` (object):
  - `path` (string, required): Route path (e.g., '/my-plugin-page')
  - `render` (function, required): Render function
  - `name` (string, optional): Display name for the route
  - `subs` (string[], optional): Subscriptions to state changes

```typescript
// Register a custom route
logseq.Experiments.registerRouteRenderer('my-custom-page', {
  path: '/my-plugin-dashboard',
  name: 'Dashboard',
  subs: ['ui/theme'],
  render: (props) => {
    const React = logseq.Experiments.React
    
    return React.createElement('div', {
      className: 'my-plugin-dashboard'
    }, [
      React.createElement('h1', null, 'Plugin Dashboard'),
      React.createElement('p', null, 'Custom content here')
    ])
  }
})

// Navigate to the route
logseq.App.pushState('page', { name: 'my-plugin-dashboard' })
```

---

## 6. Extension Enhancers

Enhance external libraries that Logseq uses (like KaTeX for math rendering).

### `logseq.Experiments.registerExtensionsEnhancer(type: string, enhancer: function)`

**Parameters**:
- `type` ('katex' | 'codemirror'): The extension type to enhance
- `enhancer` (function): Async function that receives the library instance and can modify it

**Returns**: `Promise<void>`

```typescript
// Enhance KaTeX with custom macros
logseq.Experiments.registerExtensionsEnhancer('katex', async (katex) => {
  // Add custom KaTeX macros
  katex.macros = {
    ...katex.macros,
    '\\RR': '\\mathbb{R}',
    '\\NN': '\\mathbb{N}',
    '\\ZZ': '\\mathbb{Z}'
  }
  
  console.log('KaTeX enhanced with custom macros')
})
```

---

## 7. Plugin Local Access

### `logseq.Experiments.pluginLocal`

Access the internal plugin instance (PluginLocal) for advanced operations.

**Type**: `PluginLocal`

```typescript
const pluginLocal = logseq.Experiments.pluginLocal

// Access plugin-specific internal state
console.log('Plugin ID:', pluginLocal.id)
```

---

## 8. Advanced: Invoke Experimental Methods

### `logseq.Experiments.invokeExperMethod(type: string, ...args: any[])`

Directly invoke experimental methods from the host scope.

**Parameters**:
- `type` (string): Method name (converted to snake_case)
- `...args`: Arguments to pass to the method

**Returns**: `any`

```typescript
// Invoke a custom experimental method
const result = logseq.Experiments.invokeExperMethod(
  'someExperimentalFeature',
  arg1,
  arg2
)
```

---

## Complete Example: Custom Chart Renderer

Here's a complete example combining multiple APIs:

```typescript
import '@logseq/libs'

async function main() {
  console.log('Chart Plugin Loaded')
  
  // Register fenced code renderer for charts
  logseq.Experiments.registerFencedCodeRenderer('chart', {
    edit: false,
    before: async () => {
      // Load Chart.js before rendering
      await logseq.Experiments.loadScripts(
        'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
      )
    },
    render: (props) => {
      const React = logseq.Experiments.React
      
      return React.createElement('div', null, [
        React.createElement('canvas', {
          ref: (canvas) => {
            if (canvas && window.Chart) {
              try {
                const config = JSON.parse(props.content)
                new window.Chart(canvas, config)
              } catch (e) {
                console.error('Chart rendering error:', e)
              }
            }
          }
        })
      ])
    }
  })
}

logseq.ready(main).catch(console.error)
```

**Usage**:
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

## Best Practices

1. **Check Host Scope**: Always ensure the host scope is accessible before using experimental APIs
2. **Error Handling**: Wrap experimental API calls in try-catch blocks
3. **Dependencies**: Load external scripts in `before` hooks to ensure they're ready
4. **Memory Management**: Clean up event listeners and subscriptions in daemon renderers
5. **Compatibility**: Test thoroughly as these APIs may change between Logseq versions
6. **Documentation**: Document which experimental APIs your plugin uses
7. **Marketplace**: Be aware that plugins using these APIs may not be accepted on the Marketplace

---

## Limitations

- **Experimental Status**: These APIs are not stable and may change without notice
- **Marketplace Support**: Plugins using experimental APIs may not be approved for the Marketplace
- **Security**: Be cautious when loading external scripts or accessing host scope
- **Performance**: Custom renderers can impact performance if not optimized
- **Compatibility**: Limited backwards compatibility guarantees

---

## See Also

- [Starter Guide](./starter_guide.md) - Getting started with plugin development
- [DB Properties Guide](./db_properties_guide.md) - Working with database properties
- [DB Query Guide](./db_query_guide.md) - Querying the Logseq database

---

## Support

For questions and issues:
- [Logseq Discord](https://discord.gg/logseq) - #plugin-dev channel
- [GitHub Discussions](https://github.com/logseq/logseq/discussions)
- [Plugin API Documentation](https://plugins-doc.logseq.com/)

Remember: These are experimental features. Use at your own risk and always test thoroughly!
