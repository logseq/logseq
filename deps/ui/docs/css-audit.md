# CSS used-class audit (LUI bundle)

Static audit of which stylesheet selectors can still match anything the
OCaml UI emits. **Analysis only — nothing was removed.** Goal: identify
cljs-era CSS that is safe to drop without breaking the UI.

## Scope & inputs

Stylesheets loaded by `static/index.html` (the only `<link>` tags):

| file | size | role |
|---|---|---|
| `css/tabler-icons.min.css` | 199 KiB | tabler icon font (`ti-*` glyph classes) |
| `css/style.css` | 677 KiB | app stylesheet (tailwind build + app rules) |
| `css/inter.css` | 4 KiB | Inter `@font-face` (uses `css/web/*.woff2`) |

Files present in `static/css/` but **not referenced by index.html** and not
loaded by any script (grepped `js/*.js|*.mjs` and `deps/ui/src`):
`shui.css` (16 KiB), `ui.css` (48 KiB), `codemirror.lsradix.css` (8 KiB),
`tabler-extension.css` (4 KiB) — ~72 KiB of dead payload outright.
(`custom.css` is a runtime *user* stylesheet fetched from the graph, not a
shipped file.)

## Methodology

"Emitted" haystack (what the UI can put on an element):

1. Every string literal in `static/js/main.js` (Melange IIFE, 88,881
   literals — matches `[A-Za-z0-9!&*_+.,:/#@%()\[\]<>~|?='"  -]{1,140}`
   tokens after whitespace-splitting).
2. Every `"..."` literal in `deps/ui/src/**/*.ml` (125 files, 81,355
   strings) — catches `style_class:`/`~cls:`/`mk ~cls:` args verbatim.
3. `static/index.html` markup.
4. Substring fallback: a class name counts as used if it appears *anywhere*
   in the built bundle + OCaml sources, or in any other script index.html
   loads (`lsplugin.*`, `pdf_viewer3.mjs`, `pdfjs/pdf*.mjs`,
   `photoswipe*`, `highlight.min.js`, `glide.min.js`, `marked`,
   `html2canvas`, `katex`, `tabler.ext.js`, …) — those libraries emit their
   own DOM.

Selector enumeration: `tinycss2` parse of the three loaded sheets —
9,427 rules (recursing into `@media`/`@supports`/`@layer`/`@container`),
split into 10,571 complex selectors, yielding 7,403 distinct class names.

Verdicts:

- **class used** — emitted literally, or found as a substring in OCaml
  sources / the bundle (`substring-src`), or only in auxiliary loaded
  libraries (`substring-aux`).
- **class absent** — nowhere in any haystack.
- **selector dead** — has ≥1 class and *every* class is absent.
- **selector live** — at least one class is used.
- **rule removable** — every selector part dead.

## Numbers

Classes: 7,403 distinct → **936 emitted literals + 110 substring-src +
208 substring-aux = 1,254 referenced**; 6,149 absent.

Selectors: **2,637 live / 2,403 dead / 5,215 dead-but-dynamic / 316 no-class**
(dead-dynamic = all classes absent but at least one matches a runtime-concat
pattern below).

Rules: **1,911 rules are fully dead** (every selector dead, no dynamic
prefix) — **≈187 KiB**, all inside `style.css` (~29% of its rule bytes).

`tabler-icons.min.css`: 4,951 of ~4,963 selectors reference `ti-<name>`
glyph classes that never appear as literals — **but they are not dead
code** (see dynamic section): they are emitted as `"ti ti-" ^ name` where
`name` comes from `icon_tabler_data.ml`, `window.tablerIcons`, user
`logseq.property/icon` values and plugin data. Moreover
`icon_picker.ml` *enumerates this stylesheet's selectors at runtime* to
build the icon list — the file doubles as the icon database, so it cannot
be subsetted or removed.

## Top unused selector groups (style.css)

Counted by first absent class in each dead selector:

| selectors | group | verdict |
|---|---|---|
| ~396 | `cp__*` cljs app chrome — `cp__handbooks-*` (115), `cp__rtc-sync-*` (~100), `cp__onboarding-*`, `cp__themes-*`, `cp__repos-*`, `cp__plugins-settings-*` | dead (feature not ported or dropped) |
| ~191 | CodeMirror — `cm-s-solarized`, `cm-s-lsradix`, `cm-s-default`, `cm-s-light`, `CodeMirror*`, `cm-fat-cursor` | dead (no CodeMirror loaded; `codemirror.lsradix.css` itself is unreferenced) |
| ~139 | `extensions__pdf-*` — cljs PDF UI (finder, toolbar, outline, highlights, resizer, ctx-menu) | dead cljs extension; pdf.js' own injected DOM (`textLayer`, `canvasWrapper`, `loading`, annotation `*Annotation` classes…) survives via substring-aux |
| 121 | `fontsize-ensurer` + `reset-size1..11` | dead cljs measuring divs |
| 64 | `resizers` | dead |
| ~55 | `graph-*` / `graph-settings-*` / `graph-time-travel` | Graph View not ported |
| ~31 | `ls-gallery-*` / `has-gallery-asset` / `classic-table` | gallery/table views not ported |
| ~15 | `shepherd-*` | onboarding tour lib not loaded |
| ~26 | `ui__dropdown-trigger`, `dropdown-wrapper` | cljs dropdown wrapper not emitted by port |
| misc | `editToolbar`, `colorPicker`, `thicknessPicker`, `form-checkbox`, `form-radio`, `block-renderer-container`, `block-body`, `property-configure`, `xfaTable` | dead unless a matching port lands |
| misc | dead tailwind utilities (`top-*`, `-right-*`, `z-[...]`, `col-span-*`, `mx-*`, `bottom-*`, `max-*`, `border-*`, `!w-*`, `px-*` variants…) | utilities generated for classes the cljs sources had but the OCaml port does not emit |

## Dynamic classes — second pass required

These patterns mean "absent from literals" ≠ removable. Any removal pass
must whitelist them:

- `"ti ti-" ^ name`, `"tie tie-" ^ name` — tabler/extension font icons.
  `name` is data: `icon_tabler_data.ml` (generated), `window.tablerIcons`
  (tabler.ext.js), the user's `logseq.property/icon` value, plugin-supplied
  names, `properties_select.ml` `it_icon`.
- `"ui__icon ti ls-icon-" ^ name`, `"tabler-icon tabler-icon-" ^ name` —
  icon wrappers (`icons.ml`, `right_sidebar_view`, `settings_page`).
- `"cp__settings-" ^ key ^ "-cnt"` — settings section containers.
- `"shui-shortcut-" ^ kind ^ " shui-shortcut-glow"`, `"ui__toast-status-icon "
  ^ kind`, `"sidebar-content-group " ^ class_`, `"button cp__header-btn "
  ^ cls` — caller/data-supplied suffix classes.
- Root/body classes via `Platform.root_add_class`/`body_add_class`:
  `dark`, `dark-theme`, `light-theme`, `white-theme` (+ `html.dark` rules
  in style.css).
- `classList.add/remove/toggle` with variable arguments in `main.js`
  (plugin UI, editor state classes).
- Platform/host classes absent on web but reserved: `is-native-*`,
  `is-electron`, `is-mac`, `is-android` (85 selectors — Electron parity).
- Library-injected DOM: LSPlugin (`ls-ui-float-content`,
  `lsp-shadow-sandbox`, `lsp-iframe-sandbox-container`,
  `draggable-handle`, `resizable-handle`), pdf.js viewer
  (`loading`, `loadingIcon`, `canvasWrapper`, `scrollHorizontal`,
  `structTree`, `toggled`, `hidden`, `indeterminate`, annotation/
  XFA layer classes), photoswipe (`pswp-*`), highlight.js (`hljs-*`),
  glide (`glide__*`).
- Plugin-provided markup: plugins render arbitrary HTML/classes into
  `lsplugin` slots and can `provideStyle`.
- `logseq/custom.css` + `custom.js` — user styles may target any class;
  a class only consumed by user custom CSS still counts as "used" for
  compatibility purposes.
- DOM-parity caveat: the port intentionally mirrors cljs DOM classes, so a
  class that is dead *today* may be emitted again when the corresponding
  cljs feature is ported (graph view, PDF UI, onboarding).

## Safe-to-remove estimate

- **Now, zero risk**: `shui.css`, `ui.css`, `codemirror.lsradix.css`,
  `tabler-extension.css` (72 KiB) — nothing loads them.
- **style.css**: ~1,911 rules / ~187 KiB are fully dead under this
  analysis. Net of the dynamic-uncertainty groups, a conservative first
  removal pass (handbooks, rtc-sync, cm-s-*/CodeMirror,
  extensions__pdf-*, fontsize-ensurer, resizers, shepherd, dead tailwind
  utilities) covers roughly **150–190 KiB**.
- **Keep whole**: `tabler-icons.min.css` (runtime icon database + font),
  `inter.css` + `css/web/` fonts.

Total served CSS ≈ 880 KiB; realistic removal potential **≈220–260 KiB
(~25–30%)** after the dynamic-class second pass and a per-feature port
check. `cm-*`/`cp__*` groups are the safest large blocks; tailwind
utilities are individually tiny and should be regenerated (tailwind
content-scan against `deps/ui/src/**/*.ml` + emitted literal list) rather
than hand-pruned.
