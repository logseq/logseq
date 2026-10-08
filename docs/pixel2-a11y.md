# Pixel2 parity — keyboard navigation + accessibility audit

Round-2 a11y audit for branch `devin/component-migration`. Each keyboard
flow and aria contract in the LUI web app (`deps/ui`) was compared
against master's cljs implementation (shui/radix + base-ui) and standard
a11y expectations.

## What the platform already guarantees

The pinned LUI web backend (`lui#6f70d10`) supplies most primitives, so
the audit's real question was whether view code uses the right kinds and
props:

- `dialog`/`sheet` kinds: `role=dialog` + `aria-modal` + `tabindex=-1`,
  modal layer events; `~autofocus` focuses the element after mount.
- `menu`/`dropdown_menu`/`popover` kinds: `role=menu`/`listbox`,
  `aria-expanded`/`aria-haspopup` on triggers, activedescendant plumbing.
- `toolbar`/`tabs`/`tree`/`button_group`/`breadcrumb`/`pagination` kinds:
  roving tabindex + arrow-key focus movement + typeahead.
- `menu_item`/`checkbox`/`radio`/`switch_`/`select`/`combobox` kinds: real
  interactive elements with correct roles.
- `toast` kind: `role=status`; `alert` kind: `role=alert`.
- `text`/`table_cell`/`timeline_item` with `~on_press`: `role=button` +
  `tabindex=0` + Enter/Space → Press.

## Audit table

| Surface / check | Master (cljs) | LUI before audit | Status |
|---|---|---|---|
| Dialog Tab/Shift+Tab trap | radix FocusScope wraps inside content | `Dialogs_state.trap_tab` wraps first/last focusable, pulls focus in from body | parity |
| Dialog focus on open | radix focuses `[autofocus]` else content | deferred focus `[autofocus]` else content `tabindex=-1` | parity |
| Dialog focus return on close | radix restores pre-dialog focus | nothing — focus dropped to body | **fixed** (`dialogs_state.return_focus`) |
| Dialog `role`/`aria-modal`/label | base-ui emits `role=dialog aria-modal` + labelledby title | only cmdk shell had `role=dialog`; confirm had `role=alertdialog` | **fixed** (generic, prompt, e2ee, cmdk + labelledby ids) |
| Alert-dialog initial focus | focuses the confirm action | nothing focused (focus stayed on trigger) | **fixed** (`~autofocus` on Confirm) |
| Dialog Escape | closes topmost layer only | deferred-0ms Escape respecting `ev_default_prevented`, layered with popup stack | parity |
| cmdk input focus | `:auto-focus true` | imperative `S.focus_input` retry loop | parity (different mechanism, same effect) |
| cmdk arrows/Enter/Escape/⌘K | cmdk `move_hl`/run/close | identical document keydown (`cmdk_view`) | parity |
| cmdk list items | `div[data-cmdk-item]` attr-driven highlight, not DOM-focusable | same attr-driven model | parity |
| Dropdown menus arrows/Enter/Escape | radix roving `tabindex`, Home/End, typeahead | `popups_view menu_keydown`: roving tabindex + `data-highlighted`, Arrow/Home/End wrap, Enter clicks, Esc closes | parity |
| Menu items role/tabindex | `role=menuitem tabindex=-1` | imperative `Menu_item.item_attrs` sets both; `menu_item` kind in `popover ~role:\`menu` keeps its own `role=option` | parity (see exceptions) |
| Menu `aria-checked` | `menuitemcheckbox` + `aria-checked` | `~data_attrs` overrides in `nav_edit_menu`/left sidebar | parity |
| Popover dismiss (outside/Esc) | base-ui nonblocking layer | LUI layer registry → `~on_dismiss` | parity |
| Sidebar nav items | `<a.item href>` — Tab-focusable | pressable `box` rows — not Tab-focusable | exception (below) |
| Sidebar group headers (.hd collapse) | `div` click target (not focusable in master either) | pressable row | parity |
| Icon-only buttons | `aria-label` via `:title` | `~label` on every `button` audited (close, eye toggle, selection bar, graph actions) | parity |
| Enter/Space on interactive divs | real elements only | `button`/`menu_item`/`list_item` kinds are real `<button>`; text-pressable gets role=button+tabindex+keydown | parity |
| Toolbar roving tabindex | base-ui toolbar | `toolbar` kind attaches roving focus; no app toolbar uses a plain-row substitute | parity |
| Focus visibility | `:focus-visible` outlines in shared stylesheet | same stylesheet classes | parity |
| Properties select / icon picker / views popup | arrow-key grids, Enter/Escape | dedicated handlers per surface (verified in `properties_*`, `icon_picker`, `views_popup`) | parity |

## Fixes landed

1. **Focus return on modal close** (`src/dialogs/dialogs_state.ml`).
   `set` now records `document.activeElement` when the layer stack goes
   empty→non-empty and refocuses it (deferred, `isConnected`-guarded)
   when the last layer unmounts — radix FocusScope behavior. Previously
   closing settings/import/etc. dropped keyboard focus to `<body>`.

2. **`role`/`aria-modal`/`aria-labelledby` on every dialog surface**
   (`src/dialogs/dialogs_view.ml`, `src/dialogs/ui_requests.ml`,
   `src/cmdk/cmdk_view.ml`). The generic `.ui__dialog-content`, the
   prompt layer, the e2ee password modal, and the cmdk shell now emit
   `role=dialog` + `aria-modal=true` + `aria-labelledby` pointing at a
   stable title id (`~accessibility_identifier`). The alert dialog
   gained `aria-labelledby` when it has a title. Screen readers
   previously announced these as unlabelled generic containers.

3. **Initial focus inside confirm dialogs** (`src/dialogs/dialogs_view.ml`).
   The Confirm button now has `~autofocus:true`, matching master's alert
   dialog which focuses the confirm action on open. Before, focus stayed
   on the page under the modal.

## Remaining exceptions

- **Sidebar nav rows are pressable `box` elements, not `<a>`** — master's
  `a.item[href]` is Tab-focusable and opens in a new tab on ⌘-click; the
  port is click/Enter-by-arrow-menu only. A real `link` kind changes the
  DOM shape (icon/content wrapper spans) and full `href` navigation
  would bypass the in-app router; needs either routed `link` kinds or a
  platform pressable-with-role solution. Same for right-sidebar deck
  headers and page-history entries.
- **`menu_item` kind inside `popover ~role:\`menu` keeps `role=option`**
  (listbox semantics) rather than `menuitem`; the platform assigns the
  role from dropdown context. Master uses `menuitem`/`menuitemcheckbox`.
  Checked items already override via `~data_attrs`; a platform-level
  role fix in lui would be cleaner than per-item overrides.
- **Menus don't move DOM focus on open.** Arrow keys work immediately
  (document-level handler drives the highlight + roving tabindex), but
  focus stays on the trigger until the first arrow press. Master moves
  focus into the menu on open. Cosmetic for sighted users; screen
  readers get the item semantics only after an arrow press.
- **cmdk focus is imperative** (`S.focus_input` retry + selection-range
  restore) rather than `~autofocus`, because the input is remounted on
  move-mode switches — same end state as master's `:auto-focus true`.
- **e2ee modal (`ui_requests`) has no focus trap of its own**; it shares
  the dialogs host stack so `trap_tab`/`return_focus` cover it, but its
  content is a `box` without `tabindex=-1` fallback focus. Rare worker
  path; polish if it becomes a user-visible flow.

## Verification

- `cd deps/ui && OPAMSWITCH=5.5.0 opam exec -- dune build @all` — clean.
- `node _build/default/test/ui_test/test/test_main.js` — 1546 checks,
  0 failures.
