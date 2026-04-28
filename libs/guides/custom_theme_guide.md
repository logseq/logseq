# Custom Theme Plugin Guide

This guide summarizes Logseq's current UI theme architecture and gives a practical workflow for building a Logseq **theme plugin** with `@logseq/libs`.

It is based on the current repository structure and these theme-related entry points:

- CSS load order: `tailwind.all.css`
- Design tokens and theme variables: `packages/ui/src/radix.css`, `packages/ui/src/radix-hsl.css`, `packages/ui/src/vars-classic.css`, `packages/ui/src/colors.css`
- Shared shui/Radix component CSS: `resources/css/shui.css`
- CodeMirror theme bridge: `resources/css/codemirror.lsradix.css`
- Frontend component CSS: `src/main/frontend/**/*.css`
- Theme runtime attributes: `src/main/frontend/components/theme.cljs`, `src/main/frontend/state.cljs`, `src/main/frontend/ui.cljs`
- Plugin theme registration/injection: `libs/src/LSPlugin.ts`, `libs/src/LSPlugin.core.ts`, `libs/src/LSPlugin.user.ts`, `libs/src/common.ts`

## Mental model

Logseq themes are mostly CSS-variable based. A theme plugin should first override the semantic variables that the app already consumes, and only then add targeted selector overrides for areas that are not fully tokenized.

### CSS loading order

The main stylesheet imports theme foundations before app component CSS:

1. `packages/ui/src/radix.css` — Radix color scales as `--rx-*` variables, for example `--rx-gray-01` through `--rx-gray-12` and alpha variants.
2. `packages/ui/src/radix-hsl.css` — HSL forms such as `--rx-gray-01-hsl` for Tailwind/shui tokens.
3. `packages/ui/src/vars-classic.css` — Logseq semantic variables, layout variables, default light/dark values for `data-color=logseq`.
4. `packages/ui/src/colors.css` — accent palettes selected by `html[data-color=...]`, mapping `--lx-accent-*`, `--lx-gray-*`, shui tokens, and many `--ls-*` values.
5. `packages/ui/src/index.css` — Tailwind base.
6. `resources/css/shui.css` — shared UI components built on shui/Radix/Tailwind tokens.
7. Third-party CSS: Inter, PhotoSwipe, KaTeX, CodeMirror, PDF.js, Tabler, `codemirror.lsradix.css`.
8. `src/main/frontend/**/[!_]*.css` — component and extension CSS.
9. A selected plugin theme is injected later as a `<link rel="stylesheet">`, so it can override earlier rules when specificity is equal or higher.

### Runtime attributes and classes

Theme CSS should scope by attributes on `html` and compatibility classes on `body`:

| Hook | Set by | Meaning |
| --- | --- | --- |
| `html[data-theme="light"]` / `html[data-theme="dark"]` | `frontend.components.theme/container` | Current light/dark mode. Prefer this for theme CSS. |
| `html.dark` | same component | Tailwind dark-mode hook. |
| `body.light-theme`, `body.white-theme`, `body.dark-theme` | same component | Backward-compatible hooks for older custom CSS/themes. |
| `html[data-color="logseq"]` and other colors | same component | Accent color selection. A theme plugin can override or ignore this. |
| `html[data-font="serif"|"mono"]`, `html[data-font-global="true"]` | same component | Editor/global font preferences. Avoid fighting these unless your theme intentionally owns typography. |
| Platform classes such as `html.is-mobile`, `html.is-electron`, `html.is-mac`, `html.is-native-iphone` | `frontend.ui/inject-document-devices-envs!` | Useful for responsive/mobile-safe fixes. |

### Plugin theme lifecycle

A theme can be registered in either of two ways:

1. Declaratively in `package.json > logseq.themes`. During package preparation, Logseq resolves relative `url` values to plugin resources, registers each theme, and shows them in the theme selector.
2. Programmatically with `logseq.provideTheme(theme)`. This is useful for generated themes or settings-driven variants.

When a user selects a theme, Logseq:

- removes the previously injected custom theme link;
- injects the selected theme CSS link into `document.head`;
- persists the selected theme separately for `light` and `dark` modes;
- updates `:plugin/selected-theme` and emits plugin app hooks such as `:theme-changed`.

## Minimal theme plugin

### Directory layout

```text
logseq-my-theme/
├── package.json
├── index.html
└── themes/
	├── my-theme-light.css
	└── my-theme-dark.css
```

### `package.json`

Use a stable lowercase-kebab `logseq.id`. For a theme-only plugin, set `effect: true` and declare each CSS file in `themes`.

```json
{
  "name": "logseq-my-theme",
  "version": "0.1.0",
  "description": "A custom Logseq theme pack",
  "license": "MIT",
  "main": "index.html",
  "logseq": {
	"id": "my-theme",
	"main": "index.html",
	"title": "My Theme",
	"icon": "./icon.png",
	"effect": true,
	"themes": [
	  {
		"name": "My Theme Light",
		"url": "./themes/my-theme-light.css",
		"mode": "light",
		"description": "Light variant of My Theme"
	  },
	  {
		"name": "My Theme Dark",
		"url": "./themes/my-theme-dark.css",
		"mode": "dark",
		"description": "Dark variant of My Theme"
	  }
	]
  },
  "devDependencies": {
	"@logseq/libs": "^0.0.17"
  }
}
```

### `index.html`

Declarative themes do not need runtime code, but keeping a tiny entry file makes the plugin package explicit and easy to extend later.

```html
<!doctype html>
<html lang="en">
  <head>
	<meta charset="UTF-8" />
	<title>My Logseq Theme</title>
  </head>
  <body></body>
</html>
```

### Programmatic variant with `provideTheme`

If the theme URL or metadata is generated at runtime, use the SDK. Always wait for Logseq to be ready.

```ts
import '@logseq/libs'

async function main() {
  logseq.provideTheme({
	name: 'My Generated Dark Theme',
	url: './themes/generated-dark.css',
	mode: 'dark',
	description: 'Generated from plugin settings',
  })
}

logseq.ready(main).catch(console.error)
```

## CSS strategy

Start with variables. Add selector overrides only for UI that cannot be changed via variables.

### Dark theme starter

```css
/* themes/my-theme-dark.css */

html[data-theme="dark"] {
  color-scheme: dark;

  /* Core backgrounds */
  --ls-primary-background-color: #111827;
  --ls-secondary-background-color: #172033;
  --ls-tertiary-background-color: #202b42;
  --ls-quaternary-background-color: #2a3650;
  --ls-table-tr-even-background-color: var(--ls-secondary-background-color);
  --ls-slide-background-color: var(--ls-primary-background-color);

  /* Text */
  --ls-primary-text-color: #d6deeb;
  --ls-secondary-text-color: #eef2ff;
  --ls-title-text-color: #f8fafc;
  --ls-left-sidebar-text-color: #cbd5e1;

  /* Links and refs */
  --ls-link-text-color: #7dd3fc;
  --ls-link-text-hover-color: #bae6fd;
  --ls-link-ref-text-color: var(--ls-link-text-color);
  --ls-link-ref-text-hover-color: var(--ls-link-text-hover-color);
  --ls-block-ref-link-text-color: #38bdf8;
  --ls-tag-text-color: #93c5fd;
  --ls-tag-text-hover-color: #bfdbfe;

  /* Borders, guidelines, focus */
  --ls-border-color: #334155;
  --ls-secondary-border-color: #475569;
  --ls-tertiary-border-color: rgb(148 163 184 / 0.18);
  --ls-guideline-color: rgb(148 163 184 / 0.18);
  --ls-focus-ring-color: rgb(56 189 248 / 0.45);

  /* Blocks and properties */
  --ls-block-properties-background-color: #1e293b;
  --ls-page-properties-background-color: #1e293b;
  --ls-block-bullet-color: #64748b;
  --ls-block-bullet-border-color: #475569;
  --ls-block-highlight-color: rgb(14 165 233 / 0.22);
  --ls-a-chosen-bg: rgb(56 189 248 / 0.16);
  --ls-menu-hover-color: var(--ls-a-chosen-bg);

  /* Selection, checkbox, quote, mark, inline code */
  --ls-selection-background-color: rgb(56 189 248 / 0.32);
  --ls-selection-text-color: #f8fafc;
  --ls-page-checkbox-color: #64748b;
  --ls-page-checkbox-border-color: #475569;
  --ls-page-blockquote-color: var(--ls-primary-text-color);
  --ls-page-blockquote-bg-color: #172033;
  --ls-page-blockquote-border-color: #38bdf8;
  --ls-page-mark-color: #111827;
  --ls-page-mark-bg-color: #fde68a;
  --ls-page-inline-code-color: #e0f2fe;
  --ls-page-inline-code-bg-color: #0f172a;

  /* Scrollbars and notifications */
  --ls-scrollbar-foreground-color: rgb(148 163 184 / 0.35);
  --ls-scrollbar-background-color: rgb(15 23 42 / 0.35);
  --ls-scrollbar-thumb-hover-color: rgb(148 163 184 / 0.55);
  --ls-notification-background: #1e293b;
  --ls-notification-text-color: #f8fafc;

  /* shui/Tailwind HSL tokens: use space-separated HSL channels, not hsl(). */
  --background: 222 47% 11%;
  --foreground: 210 40% 96%;
  --card: 222 47% 13%;
  --card-foreground: 210 40% 96%;
  --popover: 222 47% 10%;
  --popover-foreground: 210 40% 96%;
  --primary: 199 89% 48%;
  --primary-foreground: 210 40% 98%;
  --secondary: 217 33% 18%;
  --secondary-foreground: 210 40% 96%;
  --muted: 217 33% 16%;
  --border: 217 33% 24%;
  --input: 217 33% 24%;
  --ring: 199 89% 48%;
  --accent: 199 89% 48%;
  --accent-foreground: 210 40% 98%;
}

html[data-theme="dark"] body {
  background: var(--ls-primary-background-color);
  color: var(--ls-primary-text-color);
}

html[data-theme="dark"] ::selection {
  background: var(--ls-selection-background-color);
  color: var(--ls-selection-text-color);
}
```

### Light theme starter

```css
/* themes/my-theme-light.css */

html[data-theme="light"] {
  color-scheme: light;

  --ls-primary-background-color: #ffffff;
  --ls-secondary-background-color: #f8fafc;
  --ls-tertiary-background-color: #eef2f7;
  --ls-quaternary-background-color: #e2e8f0;

  --ls-primary-text-color: #1e293b;
  --ls-secondary-text-color: #0f172a;
  --ls-title-text-color: #0f172a;
  --ls-left-sidebar-text-color: #334155;

  --ls-link-text-color: #0369a1;
  --ls-link-text-hover-color: #075985;
  --ls-link-ref-text-color: var(--ls-link-text-color);
  --ls-link-ref-text-hover-color: var(--ls-link-text-hover-color);
  --ls-block-ref-link-text-color: #0284c7;
  --ls-tag-text-color: #0369a1;
  --ls-tag-text-hover-color: #075985;

  --ls-border-color: #cbd5e1;
  --ls-secondary-border-color: #e2e8f0;
  --ls-tertiary-border-color: rgb(15 23 42 / 0.08);
  --ls-guideline-color: rgb(15 23 42 / 0.08);
  --ls-focus-ring-color: rgb(14 165 233 / 0.35);

  --ls-block-properties-background-color: #f1f5f9;
  --ls-page-properties-background-color: #f1f5f9;
  --ls-block-bullet-color: #94a3b8;
  --ls-block-bullet-border-color: #cbd5e1;
  --ls-block-highlight-color: #e0f2fe;
  --ls-a-chosen-bg: #e0f2fe;
  --ls-menu-hover-color: var(--ls-a-chosen-bg);

  --ls-selection-background-color: #dbeafe;
  --ls-selection-text-color: #0f172a;
  --ls-page-checkbox-color: #94a3b8;
  --ls-page-checkbox-border-color: #94a3b8;
  --ls-page-blockquote-color: var(--ls-primary-text-color);
  --ls-page-blockquote-bg-color: #f8fafc;
  --ls-page-blockquote-border-color: #38bdf8;
  --ls-page-mark-color: #0f172a;
  --ls-page-mark-bg-color: #fef3c7;
  --ls-page-inline-code-color: #0f172a;
  --ls-page-inline-code-bg-color: #f1f5f9;

  --ls-scrollbar-foreground-color: rgb(15 23 42 / 0.12);
  --ls-scrollbar-background-color: rgb(15 23 42 / 0.05);
  --ls-scrollbar-thumb-hover-color: rgb(15 23 42 / 0.22);

  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --primary: 199 89% 40%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 199 89% 40%;
  --accent: 199 89% 40%;
  --accent-foreground: 0 0% 100%;
}
```

## Important variable groups

Prefer these variables before reaching for selectors.

### Global layout and typography

| Variable | Purpose |
| --- | --- |
| `--ls-page-text-size` | Base page text size under `#root`. |
| `--ls-page-title-size` | Page title size. Mobile may override title layout. |
| `--ls-main-content-max-width`, `--ls-main-content-max-width-wide` | Main content width. |
| `--ls-font-family` | Global app font when not overridden by user font settings. |
| `--ls-scrollbar-width` | Custom scrollbar width. |
| `--ls-border-radius-low`, `--ls-border-radius-medium` | Classic radius tokens. |
| `--ls-headbar-height`, `--ls-headbar-inner-top-padding` | Header sizing. |
| `--ls-left-sidebar-width`, `--ls-left-sidebar-sm-width`, `--ls-left-sidebar-nav-btn-size` | Left sidebar sizing. |

### Logseq semantic colors

| Variable | Purpose |
| --- | --- |
| `--ls-primary-background-color` | Main background. |
| `--ls-secondary-background-color` | Secondary surfaces, editors, menus. |
| `--ls-tertiary-background-color` | Nested/raised surfaces. |
| `--ls-quaternary-background-color` | Active/hover surfaces. |
| `--ls-primary-text-color`, `--ls-secondary-text-color`, `--ls-title-text-color` | Body, stronger text, titles. |
| `--ls-border-color`, `--ls-secondary-border-color`, `--ls-tertiary-border-color` | Borders. |
| `--ls-guideline-color` | Block indentation guide lines. |
| `--ls-active-primary-color`, `--ls-active-secondary-color` | Active states. |
| `--ls-a-chosen-bg`, `--ls-menu-hover-color` | Chosen menu/list item backgrounds. |
| `--ls-focus-ring-color` | Focus rings. |

### Links, references, tags, and blocks

| Variable | Purpose |
| --- | --- |
| `--ls-link-text-color`, `--ls-link-text-hover-color` | General links. |
| `--ls-link-ref-text-color`, `--ls-link-ref-text-hover-color` | Page references. |
| `--ls-block-ref-link-text-color` | Block references. |
| `--ls-tag-text-color`, `--ls-tag-text-hover-color`, `--ls-tag-text-opacity`, `--ls-tag-text-hover-opacity` | Tags. |
| `--ls-block-bullet-color`, `--ls-block-bullet-border-color`, `--ls-block-bullet-active-color` | Block bullets. |
| `--ls-block-highlight-color` | Block highlight. |
| `--ls-block-properties-background-color`, `--ls-page-properties-background-color` | Property panels. |

### Content tokens

| Variable | Purpose |
| --- | --- |
| `--ls-selection-background-color`, `--ls-selection-text-color` | Text selection. |
| `--ls-page-checkbox-color`, `--ls-page-checkbox-border-color` | Markdown task checkboxes/radios. |
| `--ls-page-blockquote-color`, `--ls-page-blockquote-bg-color`, `--ls-page-blockquote-border-color` | Blockquotes. |
| `--ls-page-mark-color`, `--ls-page-mark-bg-color` | Highlight/mark text. |
| `--ls-page-inline-code-color`, `--ls-page-inline-code-bg-color` | Inline code. |
| `--ls-table-tr-even-background-color` | Alternating table rows. |
| `--ls-cloze-text-color` | Cloze text. |
| `--ls-slide-background-color` | Slide mode background. |

### shui/Tailwind HSL tokens

Newer shared UI components use HSL channel tokens, often through Tailwind classes such as `bg-background`, `bg-popover`, `border`, `text-foreground`, and `bg-primary`.

Set these as space-separated HSL channels:

```css
html[data-theme="dark"] {
  --background: 222 47% 11%;
  --foreground: 210 40% 96%;
  --card: 222 47% 13%;
  --card-foreground: 210 40% 96%;
  --popover: 222 47% 10%;
  --popover-foreground: 210 40% 96%;
  --primary: 199 89% 48%;
  --primary-foreground: 210 40% 98%;
  --secondary: 217 33% 18%;
  --secondary-foreground: 210 40% 96%;
  --muted: 217 33% 16%;
  --border: 217 33% 24%;
  --input: 217 33% 24%;
  --ring: 199 89% 48%;
  --accent: 199 89% 48%;
  --accent-foreground: 210 40% 98%;
}
```

Do not write `--primary: hsl(199 89% 48%)`; consumers call `hsl(var(--primary))`.

### `--lx-*` and `--rx-*` color scales

- `--rx-*` variables are Radix-style raw palettes. They are broad and already available.
- `--lx-gray-01` through `--lx-gray-12` and `--lx-gray-*-alpha` represent the active neutral scale.
- `--lx-accent-01` through `--lx-accent-12` and `--lx-accent-*-alpha` represent the active accent scale.

If your theme is a complete palette, map `--lx-gray-*` and `--lx-accent-*` as well as `--ls-*`. This makes Radix/shui-heavy UI more consistent:

```css
html[data-theme="dark"] {
  --lx-gray-01: #0f172a;
  --lx-gray-02: #111827;
  --lx-gray-03: #1e293b;
  --lx-gray-04: #273449;
  --lx-gray-05: #334155;
  --lx-gray-06: #475569;
  --lx-gray-07: #64748b;
  --lx-gray-08: #94a3b8;
  --lx-gray-09: #cbd5e1;
  --lx-gray-10: #dbeafe;
  --lx-gray-11: #e2e8f0;
  --lx-gray-12: #f8fafc;

  --lx-accent-09: #0ea5e9;
  --lx-accent-10: #0284c7;
  --lx-accent-11: #38bdf8;
  --lx-accent-12: #e0f2fe;
}
```

## UI selector map

Use this as a last-mile map after variables. Keep overrides narrow and prefer `:where(...)` to avoid specificity wars.

### App shell and layout

| Area | Useful selectors | Notes |
| --- | --- | --- |
| Root/app | `#root`, `#app-container`, `#root-container.theme-container`, `main.theme-container-inner` | `#root` uses `--ls-page-text-size`; `main.theme-container-inner` defines `--left-sidebar-bg-color`. |
| Main content | `#main-container`, `#main-content`, `#main-content-container`, `.page-blocks-inner` | Avoid hard-coded viewport hacks; test desktop and mobile. |
| Header | `.cp__header`, `.head`, `.button`, `.ui__button` | Mostly tokenized through shui/Tailwind variables. |
| Left sidebar | `.left-sidebar-inner`, `.sidebar-header-container`, `.sidebar-contents-container`, `.sidebar-content-group`, `.sidebar-navigations` | Prefer `--left-sidebar-bg-color`, `--ls-left-sidebar-text-color`, and `--ls-left-sidebar-width`. |
| Right sidebar | `#right-sidebar`, `.cp__right-sidebar-inner`, `.sidebar-item`, `.references-blocks-item` | Nested reference cards may need extra contrast. |

### Pages, blocks, and editor

| Area | Useful selectors | Notes |
| --- | --- | --- |
| Page title | `.ls-page-title`, `.page-title`, `.journal-title`, `.page-title-sizer-wrapper` | Prefer `--ls-page-title-size` and title text variables. |
| Blocks | `.ls-block`, `.block-main-container`, `.block-content-wrapper`, `.block-content`, `.block-body` | Avoid altering core layout unless necessary. |
| Block tree guides | `.block-children-container`, `.block-children`, `.block-children-left-border` | Governed by `--ls-guideline-color` and related border variables. |
| Bullets/control | `.block-control-wrap`, `.block-control`, `.bullet-container`, `.bullet-link-wrap` | Governed by bullet variables; keep hit areas accessible. |
| Page refs | `.page-ref`, `.page-reference`, `.breadcrumb` | Use link/reference variables first. |
| Block refs | `.block-ref`, `.block-ref-no-title`, `.open-block-ref-link` | Use `--ls-block-ref-link-text-color`, property surface variables. |
| Properties | `.block-properties`, `.page-properties`, `.property-value-inner`, `.property-key` | Use property background variables. |
| Editor textarea | `.editor-inner textarea`, `.edit-input`, `.non-block-editor textarea` | Background usually comes from `--ls-secondary-background-color`. |
| Autocomplete/slash popup | `#ui__ac-inner`, `.menu-link`, `.absolute-modal[data-modal-name]`, `.cp__commands-slash` | Use menu hover and popover tokens. |

### Shared UI, dialogs, command palette

| Area | Useful selectors | Notes |
| --- | --- | --- |
| Buttons | `.ui__button`, `.button`, `.ui__toggle`, `.ui__toggle-background-on`, `.ui__toggle-background-off` | Set `--primary`, `--primary-foreground`, `--accent`, `--ring`. |
| Dialogs/modals | `.ui__modal`, `.ui__modal-panel`, `.ui__dialog-overlay`, `.ui__dialog-content`, `.ui__alert-dialog-content` | `--ls-modal-overlay-gradient-start/end` can control modal overlays. |
| Dropdowns/popovers | `.ui__dropdown-menu-content`, `.ui__popover-content`, `div[data-radix-menu-content]`, `div[data-radix-popper-content-wrapper]` | Usually driven by `--popover`, `--border`, `--accent`, `--lx-popover-bg`. |
| Select/calendar | `.ui__select-content`, `.ui__calendar`, `.rc-datepicker` | shui tokens and `--accent` matter. |
| Notifications | `.ui__notifications .notification-area` | Use `--ls-notification-background`, `--ls-notification-text-color`. |
| Command palette | `.cp__cmdk` | Border and hint colors use `--ls-border-color`, `--lx-gray-*`, `--accent`. |
| Context menu | `#custom-context-menu`, `.ls-context-menu-content`, `.menu-links-wrapper` | Popover/menu variables usually cover it. |

### Extensions and special surfaces

| Area | Useful selectors/variables | Notes |
| --- | --- | --- |
| CodeMirror | `.cm-s-lsradix`, `.cm-s-lsradix.cm-s-dark`, `.cm-s-lsradix.cm-s-light`, `.CodeMirror-*`, `.cm-*` | `resources/css/codemirror.lsradix.css` already bridges many `--lx-*`/`--ls-*` variables. Override only syntax colors if needed. |
| PDF | `.extensions__pdf-container`, `.extensions__pdf-toolbar`, `.extensions__pdf-outline`, `--ph-highlight-color-*`, `--ph-link-color`, `--ph-view-container-width`, `--lx-pdf-container-dark-bg` | PDF highlight colors are `--ph-*`, not `--ls-highlight-color-*`. |
| Graph | `.graph-layout`, `.graph-filters`, graph extension CSS under `src/main/frontend/extensions/graph.css` | Some graph styles are canvas/SVG-driven; inspect DOM before overriding. |
| Whiteboard/tldraw | `.tl-container`, `.tl-button`, `--ls-wb-stroke-color-default`, `--ls-wb-background-color-default`, `--ls-wb-text-color-default` | Accent colors in `colors.css` set default whiteboard tokens. |
| Tables | `.table-wrapper`, `.table-auto`, table rows | Start with `--ls-table-tr-even-background-color`, borders, text tokens. |
| Cards/flashcards | `.ls-card`, `.ui__dialog-content[label=flashcards__cp]` | Check dialog contrast and card minimum sizes. |
| Plugins UI | `.cp__plugins-page`, `.cp__themes-installed` | Useful when styling the installed theme picker itself. |

## Scoped overrides: examples

### Keep overrides mode-specific

```text
html[data-theme="dark"] :where(.cp__right-sidebar-inner .references-blocks-item) {
  background: color-mix(in srgb, var(--ls-secondary-background-color) 88%, white 12%);
}
```

### Prefer low specificity for optional polish

```text
html[data-theme="light"] :where(.page-reference:hover) {
  background: rgb(14 165 233 / 0.12);
}
```

### Avoid global resets

Avoid rules like this in a theme plugin:

```css
/* Avoid */
* {
  transition: all 200ms ease;
}
```

They can slow editing, affect CodeMirror/PDF.js, and break subtle interaction states.

## Mobile and desktop considerations

- Test `html.is-mobile`, `html.is-native-iphone`, `html.is-native-android`, and `html.is-electron` layouts if your theme changes spacing or header/sidebar dimensions.
- Respect safe-area insets in mobile-specific layout. Existing CSS uses `env(safe-area-inset-*)` in some places.
- Avoid changing `-webkit-app-region` on Electron headers/PDF toolbars unless you are fixing a drag-region issue.
- Do not shrink block control or bullet hit areas below the existing touch-friendly sizes.
- Avoid fixed pixel widths for the main content unless they are variables such as `--ls-main-content-max-width`.

## Assets and fonts

Prefer local assets packaged with the plugin. Relative URLs inside the selected theme CSS are resolved relative to the CSS file by the browser.

```css
@font-face {
  font-family: "MyThemeText";
  src: url("../fonts/MyThemeText.woff2") format("woff2");
  font-display: swap;
}

html[data-theme="dark"] {
  --ls-font-family: "MyThemeText", Inter, ui-sans-serif, system-ui, sans-serif;
}
```

Be careful with remote `@import` URLs: they can slow startup, fail offline, and leak network requests from a local-first app.

## Debugging workflow

1. Enable Logseq Developer mode.
2. Load the unpacked theme plugin.
3. Open DevTools and inspect `document.documentElement`:
   - `data-theme`
   - `data-color`
   - `data-font`
   - platform classes
4. In the theme selector, choose each declared light/dark theme.
5. Verify the selected CSS appears as a `<link rel="stylesheet">` in `document.head`.
6. Inspect computed variables on `html`, `body`, `.theme-container`, and the specific UI area you are styling.
7. If a variable is not taking effect, check whether the component is using `--lx-*`, shui HSL tokens, or a targeted class instead of `--ls-*`.

## Validation checklist

Before publishing a theme plugin, test at least these screens and states:

- [ ] Light and dark mode selection; switching between modes keeps each custom theme selection.
- [ ] Default accent color and at least one non-default `data-color` accent.
- [ ] Page title, journal title, normal blocks, nested blocks, block refs, page refs, tags, properties.
- [ ] Editing state: textarea, slash command menu, autocomplete, date picker, block context menu.
- [ ] Left sidebar, right sidebar, search, command palette, settings dialogs.
- [ ] Notifications, confirmation dialogs, dropdowns, popovers, tooltips.
- [ ] Code blocks / CodeMirror, inline code, marks, blockquotes, tables.
- [ ] PDF viewer highlights and toolbar if PDF is in scope.
- [ ] Graph and whiteboard/tldraw surfaces if your palette changes accents broadly.
- [ ] Desktop Electron and at least one mobile/narrow viewport if the theme changes layout/spacing.
- [ ] High contrast of text against every background; visible focus rings; visible selected/hover states.
- [ ] Reduced-motion friendliness if you add animations.

## Common pitfalls

- Overriding only `--ls-*` while newer shui components still read `--background`, `--popover`, `--border`, `--primary`, or `--lx-*` variables.
- Writing HSL tokens as full CSS colors instead of channel values.
- Using high-specificity selectors or `!important` everywhere, making user custom CSS and future Logseq changes harder to coexist with.
- Styling by generated Tailwind class names instead of stable Logseq/Radix selectors and variables.
- Forgetting to scope a dark theme to `html[data-theme="dark"]` or a light theme to `html[data-theme="light"]`.
- Hard-coding external font/image URLs without offline fallback.
- Changing editor layout, block bullets, or mobile sidebars without testing touch interactions.

## Quick reference: priority order for theme authors

1. Set `--ls-*` semantic variables for Logseq-specific UI.
2. Set shui/Tailwind HSL tokens (`--background`, `--foreground`, `--popover`, `--border`, `--primary`, etc.).
3. Map `--lx-gray-*` and `--lx-accent-*` for newer shared UI consistency.
4. Add extension variables such as `--ph-*` and `--ls-wb-*` only if your theme covers PDF/whiteboard.
5. Add low-specificity, mode-scoped selector overrides for the remaining gaps.


