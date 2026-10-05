# deps/ui component-kind migration spec

Goal: all view code uses `Lui_elements` component kinds + typed props.
The `dom`/`logseq-<tag>` DOM extension layer is deleted wholesale. Web
keeps pixel-level parity via `style_class`; Apple/GPUI ignore classes
and render native components from kind + typed props. Extensions only
survive for genuinely platform-specific pieces (editor surface,
split/dock, gpui-table, pdf/media).

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
classes that have real rules in the stylesheet). Utility classes
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
| pure decoration (color/radius/font-size…) | delete — native uses theme defaults; if web must keep the look it goes into a semantic stylesheet class |

Values are integer pt. When unsure, skip the translation and keep the
style_class only.

## Reactive conventions

**Direct calls to `dyn` / `Logseq_dom.dyn` are forbidden** — `dyn` is
only the `lui_ppx` expansion target, not user API. The full reactive
vocabulary is four forms:

| Scenario | Form |
|---|---|
| value/text/class/prop change | `~p:(reactive f s)` (prop position) |
| model → whole-subtree re-emit | `[ reactive f s ]` (children position, optional `~equal:eq`) |
| signal-driven mount/unmount | `if_ ~test_signal:s child` |
| signal-driven list | `keyed ~source_signal:s ~key ~cmp ~mount` |

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
  mounting uses `if_ ~test_signal`
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
- `fragment` usage unchanged (Logseq_dom's own/signal ownership is
  kept for now — its internals will be reworked when dom() is deleted;
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
  generates svg data URIs from icon_tabler_data); on GPUI the Rust
  host includes the same tabler-children.json; on Swift the tabler
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
- GPUI: a real editing control (gpui-component InputState editor or a
  custom block editor surface)
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
  dom-op channel (GPUI scroll_tracked + ScrollHandle implemented)
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
mirror, and caret logic are untouched. The native side (GPUI/SwiftUI)
reads from the same extension node: `focus`/selection ops → the
native editing control; measure → node_bounds.

## Acceptance

Per migration package (one directory):
1. `dune build` with zero warnings
2. zero `dom`/`Logseq_dom` references (`rg "dom ~"` returns nothing)
3. web visual spot-check (style_class preserved; unchanged CSS means
   parity holds automatically)
