# deps/ui component-kind migration spec

Goal: all view code uses `Lui_elements` component kinds + typed props.
The `dom`/`logseq-<tag>` DOM extension layer is deleted wholesale.
Extensions only survive for genuinely platform-specific pieces (editor
surface, split/dock, pdf/media).

## Shared visual ownership

Component appearance is owned by the shared layer, not by per-platform
stylesheets: `Ui_theme` resolves the active design-token snapshot
(canvas/panel/foreground/accent/selected/border/ring + typography,
spacing, radius, density) and `Ui_components` recipes (result row,
section header, badge, dialog, menu item, …) emit typed props through
LUI. Platform adapters only translate those props — they do not own a
second copy of the design.

- Web: typed props land as real styles; `~style_class` keeps only
  app-semantic hook classes (`ui__*`, `cp__*`, `ls-*`) that e2e tests,
  imperative queries, or SDK callers select on.
- Native host: consumes ONLY natively-expressible typed props — no
  CSS parsing, no `var()`/`calc()` resolution, no selector machinery.
  Decoration that has no prop channel stays adapter-side as
  `ocaml_host/` host hooks.
- Web-only decoration with no prop channel (`::selection`, keyframe
  animations, font stacks, `transform`, breakpoints, `dvh` units,
  descendant-hover rules) stays adapter-side in
  `resources/css/lui-overlay.css` behind the same hook classes.

## tag → kind mapping

| `~tag` (dom) | LUI kind | Notes |
|---|---|---|
| `div` + `flex` | `row` | horizontal |
| `div` + `flex flex-col` | `column` | vertical |
| `div` + `flex-wrap` | `row`/`column` + `~columns` | wrapping via columns |
| `div` + `grid` | `grid`/`columns` | |
| `div` plain container | `box` | no semantic container |
| `div` + overflow-*-scroll | `scroll` | `~orientation` |
| `div` absolute/stacked | `stack`/`overlay`/`edge_inset` | |
| `span`/`raw-text`/`strong`/`sup`/`small`/`code`/`p`/`pre` | `text`/`paragraph`/`heading` | `~value`/`~text` |
| `button` | `button` | `~text`/`~variant`/`~disabled`/`~on_press` |
| `a` | `link` | `~url`/`~text` |
| `input[type=text/search]` | `input`/`text_field`/`search_field` | `~placeholder`/`~text`/`~on_input`/`~on_submit` |
| `input[type=checkbox]` | `checkbox` | `~checked`/`~on_toggle` |
| `input[type=radio]` | `radio`/`radio_group` | |
| `textarea` | `textarea` | |
| `select`/`option` | `select` + `menu_item` | |
| `i`(ti-*)/`svg`(tabler) | `icon` | `~name:(`app "…")` + app_icons registration |
| `kbd` | `kbd` | |
| `img` | `image`/`file_image` | `~image`/`~source` |
| `ul`/`li` | `list`/`list_item` | |
| `hr`/`divider` | `divider` | `~orientation` |

## class → typed props

Layout/structure goes through typed props as the sole channel;
`~style_class` keeps only app semantic classes (ui__toast, cp__* —
whether or not a stylesheet rule references them; rule-less hooks are
kept for e2e/imperative selectors). Utility classes
(flex/gap-2/p-3/w-full/text-sm…) are deleted during migration, not
preserved — the web backend applies typed props as real styles
(gap/padding/width/flex/align land on the DOM style), and native
layouts from the same props:

| class prefix | typed prop |
|---|---|
| `gap-N` `gap-x-N` `gap-y-N` | `~gap` |
| `p-N px-N py-N` | `~padding`/`~padding_horizontal`/`~padding_vertical` |
| `w-full h-full flex-1` | cross axis stretches by default — write nothing; main axis fill is `~grow:1.` |
| `w-N h-N min-w-*/max-w-*` | `~width`/`~height`/`~min_width`/`~max_width` etc. (int pt) |
| `items-*` | `~cross` (`items-center`→`` `center ``) |
| `justify-*` | `~main` (`justify-between`→`` `space_between ``) |
| pure decoration (color/radius/font-size…) | resolve through `Ui_theme` tokens and emit via recipe typed props; only natively-inexpressible leftovers keep an adapter-side rule (`lui-overlay.css` / `logseq_ext.rs` hook class) |

Values are integer pt. When unsure, skip the translation and keep the
style_class only.

## Reactive conventions

**Direct calls to `dyn` / `Lui_elements.dyn` are forbidden** — `dyn` is
only the `lui_ppx` expansion target, not user API. The full reactive
vocabulary is four forms:

| Scenario | Form |
|---|---|
| value/text/class/prop change | `~p:(reactive f s)` (prop position) |
| model → whole-subtree re-emit | `[ reactive f s ]` (children position, optional `~equal:eq`) |
| signal-driven mount/unmount | `if_ ~test:s child` |
| signal-driven list | `keyed ~source:s ~key ~cmp ~mount` |

The default comparator is `(=)`; write `~equal:eq` only for a custom
comparison granularity. `own` (derived-signal scope ownership) has been
lowered into `Lui_elements.dyn/if_/keyed` itself, so ppx expansion
inherits it automatically — call sites need not care.

## Event mapping

| dom form | LUI form |
|---|---|
| `~events:"click" ~on_dom_event:(fun n _ -> if n="click" then f ())` | `~on_press:(fun _ -> f ())` |
| `~events:"contextmenu"` | `context_menu` kind or delete (platform behavior) |
| `~events:"change input"` on input | `~on_input`/`~on_toggle` |
| `~events:"keydown submit"` | `~on_submit`; raw keydown has no equivalent |
| mouseover/mouseout/pointer* | delete (DOM-specific, no cross-platform equivalent) |
| click on containers | `Ui.pressable ~on_press …` (see below) |

Container kinds (row/column/box/scroll/stack) have no `~on_press`
parameter — wrap with the `Ui_parts.pressable` combinator:

```ocaml
Ui_parts.pressable ~on_press:(fun _ -> f ()) (row ~key ~style_class:cls children)
```

## Other conventions

- `~key` stays as-is; `~id`/`data-ref`/`#ref` → `~accessibility_identifier`
- "render nothing" → `spacer ~key:"…" []` (anchor node); conditional
  mounting uses `if_ ~test`
- **Prefer plain OCaml `if`/`List.map` for structure** — use
  `reactive`/`if_`/`keyed` only when the branch condition or list
  membership hangs off a signal (needs to re-emit structure on publish);
  static conditions or mount-time evaluation are just plain `if` /
  conditionally built lists — clearer.
- **A reactive subtree inside children `reactive`/`if_` is almost
  always wrong** — when the inner change is just a property
  (icon/text/value), demote it to `~prop:(reactive ...)`; nest only
  when the subtree shape itself genuinely changes. Example: the eye
  button must not rebuild on `visible`; `~icon:(reactive
  (fun vis -> if vis then `app "eye-off" else `eye) visible)` suffices
- `fragment` usage unchanged (Logseq_el's own/signal ownership
  carries it — the dom() family is deleted;
  call sites need not care)
- `~text` → `text ~value:"…"`; `~html` → children elements
- `aria-label` → `~label` (the a11y name parameter on button etc.)
- `~icon` / embedded button icons: `button ~icon:`x` ~icon_placement:`leading`

## attrs mapping / deletion

| attr | Disposition |
|---|---|
| `aria-label` `aria-*` | `~accessibility_label` / `~accessibility_identifier` |
| `id` `data-testid` `data-ref` `#ref` | `~accessibility_identifier` (or `~key`) |
| `placeholder` `value` `checked` `href` `target` `src` `type` `autofocus` `name` `for` `autocomplete` `title` | corresponding typed props on the kind |
| `tabindex` `role` | carried by kind semantics → delete |
| `style` inline CSS | delete — translate to typed props or a stylesheet class |
| `data-*` app markers | `~accessibility_identifier` or delete |
| `~html` | delete — rewrite as children elements |
| `draggable` | dnd is handled by `swipe_actions`/platform mechanisms → delete |

## icons

`Icons.raw`/`Icons.font`/`dom ~tag:"i"`/`dom ~tag:"svg"` →
`icon ~name:<icon>`; name rules:

- names in the `Lui_elements.icon` builtin set (x/check/search/
  settings/chevron-*… 45 of them) → `~name:`x` used directly
- other tabler names → `~name:(`app "<tabler-name>")`: the `app:`
  prefix goes through the app icon registry — on web the `app_icons`
  map fed to `Lui_web.create_with_extensions` (`Icons.app_icons ()`
  generates svg data URIs from icon_tabler_data); on the OCaml host
  the same tabler-children.json ships in `ocaml_host`; on Swift the
  tabler
  ttf/svg assets
- **`ti ti-*` font classes are deleted**: the icon kind renders
  svg/mask itself, and a font glyph would be double-rendered through
  the mask. Sizing/extra classes (ls-icon-sm etc.) stay in
  `~style_class`

Inline svg paths (custom non-tabler paths like rotating_arrow) →
`~name:(`app "…")` with the path registered into app_icons; the
svg/path child nodes are deleted.

## Forbidden

- `~attrs` JSON escape hatch — translate everything to typed props or delete
- `~html` innerHTML — rewrite as children
- `~events` DOM event strings — use kind event props / `register_press`
- `~id` DOM id — `~accessibility_identifier`
- `mock-text`/`block-editor` and other **classes consumed as query
  handles by imperative code** — their lookup logic is handled together
  with the editor surface extension; migrate the view layer first and
  switch imperative references to `accessibility_identifier`/node ids
  one by one

## editor surface (platform-specific → extension)

The `editor_wrapper`/`editor_inner`/`mock_text` triple plus the inner
textarea is the editor surface (editable region + caret mirror for
popup positioning). It is platform-specific — collapse it into a
single `logseq-editor` extension node, and each host implements its
own editable surface inside the extension:

- web: the extension still mounts the DOM structure internally
  (textarea + caret mirror); imperative_dom switches from class/id
  queries to direct indexing by extension node id
- OCaml native host: a real editing control (native text-input sink
  or a custom block editor surface)
- SwiftUI: native TextEditor/UITextView bridge

`#ref`/`data-ref`/`.editor-inner`/`.mock-text`/`.block-editor` — the
imperative query handles — are folded into the extension: the view
layer no longer carries DOM handles, and the imperative side locates
by node id + `#ref` snapshot (same channel as dom-op).

### Absorption checklist (imperative side)

Entry points in `web_dom.ml`/`dom_ext.ml`/`editor_dom.ml` that query
by class/id become direct addressing by extension node id:

- `mock_text_el`/`build_mock_text` (caret mirror: one span per
  grapheme, `mock-text_<i>` ids, `\n` → "0"+`<br>`) — the web
  extension keeps maintaining this mirror DOM internally; the
  `caret_popup_pos` measuring is unchanged, only the entry point
  changes from a `.editor-inner .mock-text` query to direct access by
  editor node id
- `focus`/`set-selection-range`/`set-value`/`set-text-content` —
  the dom-op ref changes from `{#ref: id}` class/id queries to
  `{node-id: n}` direct access on the editor extension node; each
  host dispatches the op to its own editing surface
- `scroll-into-view`/`scroll-row-into-view` — already covered by the
  dom-op channel (native scroll tracking implemented)
- `.editor-inner`/`.block-editor`/`editor-wrapper` classes — gone
  from the view layer; the web extension keeps the same class names
  on its internal DOM to feed `lui-editor.css`, native never consumes
  them

### web extension render shape

```
logseq-editor (extension node, ~ref addressing)
└── <div class="editor-wrapper flex flex-1 w-full" id=...>
    └── <div class="editor-inner flex flex-1 block-editor">
        ├── children… (block content surface)
        └── <div class="mock-text" style="…hidden abs…"></div>
```

The DOM structure is identical to today — imperative DOM lookup
changes how the editor is *found*, not what happens after; CSS,
mirror, and caret logic are untouched. The native side (OCaml host/
SwiftUI)
reads from the same extension node: `focus`/selection ops → the
native editing control; measure → node_bounds.

## Acceptance

Per migration package (one directory):
1. `dune build` with zero warnings
2. zero `dom`/`Logseq_dom` references (`rg "dom ~"` returns nothing)
3. web visual spot-check (style_class preserved; unchanged CSS means
   parity holds automatically)

## NSH native sidebar policy

For `NshHost`, the native chrome now uses the LUI Split backed directly by NSH's
ResizablePanelGroup and ResizablePanels. It does not author the former 3-point
capture bands, offsets or 300ms split transitions. NSH owns capture, native local
resize state, default handle geometry and motion. The Web and other native-host
branches keep their existing split options and callbacks.

The left dock continues to save absolute widths under
`ls-left-sidebar-width-px`. The right dock continues to save its fraction under
`ls-right-sidebar-width`; its NSH Split requests an absolute first-panel size
and converts the native absolute completion back using the **measured content
width**, rather than the window width. For example, in an 800-point content host,
a first panel ending at 480 points saves a right fraction of 0.4, even when the
window is 1000 points wide. A positive completed native expansion opens the
corresponding application sidebar. A native close preserves the last nonzero
stored size so the toggle can restore it.

The right Split's real flexible host is measured through the existing
`dom_measure_rect` / `measure-node` / `node-rect` service. Its first Split mounts
only after a genuine measurement arrives; later measurements update props on the
retained panes. One pending request is retired on replacement or scope disposal,
and late replies cannot change a newer instance. Window and PDF geometry changes
request coalesced measurements without polling. A resize completion requests
fresh geometry before updating persistence. The PDF viewer remains in the layout;
its active sibling can consume space, which is why viewport arithmetic is
insufficient. The native below 640-point reveal retains its existing breakpoint,
fixed sidebar and shade; explicit zero pane minima let the native panel close.
Mobile and Web continue to use their existing paths.

NSH omits the former Go telemetry bar, panel and toggle because their provider
consumes `go_heap_bytes`, `go_runtime_bytes` and other MyGo-only samples. NSH
requests to invoke that provider reject explicitly. Other hosts retain the dev
tool. No product content or PDF view is hidden to simplify sidebar width math.

Native startup host code 6 now selects `NshHost`, and native extension schemas
include that host for macOS, Linux and Windows. This declares profile identity;
it does **not** implement the NSH extension widgets or services. The current
Logseq bridge exports a different seven-argument startup ABI from LUI's generic
three-argument desktop bridge and lacks other required exports. The NSH loader,
platform-service port (including measurement), and native extension rendering
remain separate blocking work. This source adapter does not establish that the
Logseq application can launch on NSH.

Source regressions are added to the existing sidebar drive for pixel/fraction
persistence, open/close restoration, actual-content units, replacement cancellation
and disposed-owner replies. No Dune file is changed. The implementation agent ran
source checks only; compilation, execution and real desktop qualification remain
with the main session after the bridge and service boundaries are ported.

### NSH standalone inline-flex groups

NSH renders standalone horizontal groups with its native Row. The sidebar
shortcut hint, table tag chip, settings shortcut group and flashcard selector do
not participate in an inline text flow, so their NSH producers now use the Row
layout without authoring CSS `display=inline-flex`. Web and maintained non-NSH
hosts retain the existing inline-flex element and display property.

Use `Ui_parts.inline_flex_row (row ~gap:4 children)` for an existing standalone
Row that should keep inline-flex display on other hosts. Use
`Ui_parts.inline_flex_group ~key children` when replacing a standalone
`box ~key ~display:\`inline_flex children`: it mounts a Row on NSH and preserves
the previous Box elsewhere. Both paths mount each child once and preserve its
keys and ordinary property bindings.

The command palette's responsive action hints retain the 768-point visibility
threshold. Above it, NSH uses the existing Row's native layout; below it, the
same retained Row has `display=none`. Web keeps inline-flex/none. These changes
do not add general inline text-flow support to NSH; genuine mixed text runs
must continue through a text-capable renderer.
