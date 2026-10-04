# LUI ↔ cljs interaction parity audit

Full functional/UX audit of the LUI web UI (`deps/ui`, Melange) against the
cljs master UI (`/Users/devin/repos/logseq-base`, served on :3003 during the
audit). LUI was driven in Chrome via Playwright against
`node scripts/serve-static.mjs 3001`.

Status legend:

- **parity** — verified to match cljs behavior in-browser, or verified from
  code to follow the cljs contract.
- **fixed** — was a diff; fixed on `devin/lui-parity`.
- **diff** — known remaining difference vs cljs.
- **sibling** — area owned by a sibling session (popups/selects on
  `devin/lui-popup2`, tags/properties on `devin/lui-tags`); shallow check only,
  details deferred to them.
- **n/a** — surface does not exist in cljs web or is out of scope
  (Electron-only features, plugins, RTC backend).

## Shell chrome

| Surface | cljs reference | Status | Notes |
| --- | --- | --- | --- |
| Header always visible over open left sidebar | `container.css`: `@media(min-width:640px) .cp__sidebar-left-layout { z-index: level-1 }` | **fixed** | LUI kept z-9999 at all widths, so the open sidebar covered `#left-menu`/`#search-button` — the "invisible toggle" bug. Added the sm-breakpoint media rule. |
| Left-menu button (`#left-menu`) | `header.cljs left-menu-button` | **parity** | Always rendered; toggles sidebar. |
| Search button (`#search-button`) | `header.cljs` | **parity** | Opens cmdk search. |
| Header block breadcrumb | `header.cljs block-breadcrumb` — ancestor trail only while viewing a zoomed block | **fixed** | `head-crumb` was an empty div; now renders `.breadcrumb` of `page_parents` + current block (`#/block/<uuid>` links). |
| Home button | hidden on Home route | **parity** |  |
| Toolbar dots → page menu | `dots-btn` anchored popup | **parity** | Opens `.ls-context-menu-content` with page items (favorite/export/delete/publish). **diff (minor):** Escape does not close the open menu — sibling-owned popup dismissal. |
| Right-sidebar toggle | hidden below the 640px breakpoint in cljs | **parity (desktop)**; **diff (mobile)** | Not gated on `util/sm-breakpoint?` — mobile-only diff, see Mobile section. |
| RTC indicator | `header.cljs` | **parity** (signal-driven; backend n/a) |  |
| `#skip-to-main` a11y button | container.cljs | **parity** |  |

## Left sidebar

| Surface | Status | Notes |
| --- | --- | --- |
| Open/close (button, `t l`, `mod+\`) | **parity** |  |
| Resizer drag | **fixed** | Was rendered but dead. Now: mousedown → `is-resizing-buf`/`is-active`/`is-resizing` classes, clamp [240,460]px, persists `ls-left-sidebar-width`, restores on boot — same contract as `left_sidebar.cljs` (interact.js). |
| Nav items / favorites / recent | **parity** (items render and navigate) |  |
| Mobile `:before` touch strip + `.shade-mask` overlay | **diff** | The 10px touch strip width exists (cljs `w-[10px]`), but `.shade-mask` is always `display:none` and the `is-touching` lifecycle isn't ported. |

## Right sidebar

| Surface | Status | Notes |
| --- | --- | --- |
| Open/close (`t r`, toggle button) | **parity** | Opens with seeded Contents item when empty (cljs `sidebar-add-content-when-open!`). |
| Resizer drag | **fixed** | Was dead. Now clamps ratio to `[max(0.1, 320/vw), 0.7]`, writes `#right-sidebar` inline width + `ls-right-sidebar-width` percent, `is-resizing-buf` during drag — matches `right_sidebar.cljs`. |
| Contents / block items, close item | **parity** (code-verified) |  |

## Journal + page

| Surface | Status | Notes |
| --- | --- | --- |
| Outliner ops splice-in-place | **fixed** | Enter/indent/outdent/move/delete previously remounted the whole page subtree (flicker, caret loss). `Page_loaded` now keeps `data_gen` when only `page_blocks` changed and the virtual list consumes the splice — no full refetch/remount. |
| Journal page render, today nav (`g j`, `g t`, `g n`, `g p`) | **parity** | Journal creation + navigation verified. |
| Page title, namespaced `/` breadcrumbs | **parity** | In-page `.breadcrumb` for `a/b/c` titles. |
| Zoom (bullet click → `#/block/<uuid>`) | **parity** | In-page zoom breadcrumb + new header breadcrumb. |
| Collapse caret | **parity** | `.rotating-arrow` hidden until hover over a collapsable block's `.block-main-container` (`arrow_hover` flips `control-hide→control-show`); click collapses/expands; caret stays clickable region even while hidden — cljs `*control-show?` contract. |
| Block context menu (right-click) | **parity exists, sibling** | Right-click on a block selects it and opens `.ls-context-menu-content` with block ops (Delete/Make a Flashcard/Toggle number list/Expand|Collapse all…). Item coverage vs cljs `block-context-menu-content` (copy ref/embed/url, cut/copy/paste, convert) is **sibling-owned** (popups). |
| Page-title context menu | **parity** | Right-click on title → page menu items (not on tag chips — those get the tag menu). |
| Linked / unlinked references | **parity** (code-verified) | `page_linked_refs`, `fetch_unlinked` wired. |
| Task status markers (`mod+enter`) | **diff, sibling** | `editor/cycle-todo` correctly cycles the `logseq.property/status` closed value, but the block row renders no `.block-marker` — the write is invisible. Marker rendering overlaps the sibling tags/properties work (status pill display). |

## Editor keys

All bindings below verified in-browser against a live page unless noted.
Dispatch: `editor_keys.ml` chord engine over the cljs keymap
(`keymap_data.ml`), gated by `#global` / `#block-editing-only` /
`#editor-global` / `#global-non-editing-only` qualifiers — chords correctly
ignored while editing.

| Binding | Command | Status |
| --- | --- | --- |
| `enter` | new block | **fixed + parity** (was remounting page) |
| `tab` / `shift+tab` | indent / outdent | **fixed + parity** |
| `shift+enter` (editing) | new line | **parity** |
| `shift+enter` (selection) | open in sidebar | **parity** |
| `mod+b / mod+i` | bold / italic | **parity** |
| `mod+shift+s / mod+shift+h` | strikethrough / highlight | **parity** (wired) |
| `mod+l` | insert link `[]()` | **parity** |
| `mod+o` / `mod+shift+o` | follow link / open in sidebar | **parity** |
| `mod+enter` | cycle todo | **parity** (command fires; see marker diff above) |
| `mod+.`, `mod+,` | zoom in / out | **parity** (note: macOS Chrome intercepts `mod+,` in the probe env — OS-level, not an app bug) |
| `mod+shift+up/down` | move block up/down | **parity** |
| `mod+shift+m` | move blocks to | **parity** (wired) |
| `mod+up/down`, `mod+;` | collapse/expand/toggle children | **parity** |
| `mod+z / mod+shift+z / mod+y` | undo / redo | **parity** — worker `undo-redo-undo|redo` + refresh; committed ops only (cljs parity: typing in an open buffer is not undoable) |
| `mod+a` | select parent block | **parity** |
| `mod+shift+a` | select all blocks | **parity** |
| `alt+up/down` | extend block selection | **parity** |
| `shift+up/down` | select content above/below | **parity** |
| `ctrl+l / ctrl+u / ctrl+w` | clear block / kill-line-before / kill-word | **parity** |
| `ctrl+shift+b/f` | word left/right | **parity** |
| `ctrl+space` | add comment | **parity** (wired) |
| `mod+e` | quick add | **parity** (wired) |
| `mod+p` | add property | **sibling** (dialog) |
| `p d / p s / p p / p i / p r / p t / p a` | deadline/status/priority/icon/reaction/tags/hidden-props | **parity** for `p d` (verified); rest share the same dispatch — **sibling** (property dialogs) |
| `escape` | escape editing / clear selection | **parity** (editing exit + selection clear verified) |
| `t l / t r / t s / t t / t w / t o / t n / t b / t c / t d / t i / t p / c c / c t` | sidebar/settings/theme/wide/open-blocks/number-list/brackets/cards/document/theme-color/plugins/appearance/close-top | **parity** (`t l`, `t r`, `t s`, `t t`, `t w` verified in-browser; rest share dispatch) |
| `g h / g j / g t / g n / g p / g a / g s / g f / g shift+g` | nav | **parity** (`g j`, `g t` verified) |
| `mod+k`, `mod+shift+k`, `mod+shift+p`, `mod+shift+i` | search, search-in-page, palette, themes | **parity** (`mod+k`, palette verified) |
| `mod+shift+j` | today in sidebar | **parity** |
| `mod+shift+f` | toggle favorite | **parity** |
| `mod+[`, `mod+]` | nav back/forward | **parity** |
| `mod+c mod+c` | clear right sidebar | **parity** |
| `mod+c mod+s` | rebuild search index | **parity** (wired) |
| `mod+c mod+r` | highlight recent blocks | **parity** (wired) |
| `alt+shift+c` | toggle Contents | **parity** (wired) |
| `mod+m` | publish dialog | **parity** (wired) |
| `shift+/` | help | **parity** (wired) |
| `alt+shift+g` | select graph | **parity** (wired) |
| `;;` | — | **n/a** — no cljs binding exists |

## Editor behaviors

| Surface | Status | Notes |
| --- | --- | --- |
| Slash menu `/` | **parity** | Opens `.cp__commands-slash` only at word boundary (first char of buffer/line or after whitespace) — cljs parity; mid-word `/` correctly no-ops. |
| `[[` / `((` / `#` triggers | **parity** | `Page_ref`, `Block_ref`, `Tag_search` autocompletes, gated to word boundary like cljs. Delete/backspace closes ac; whole-buffer replace keeps ac with buffer query. |
| IME composition | **parity** (code-verified) | composition guards in input path. |
| Selection action bar | **parity** | `.selection-action-bar` mounts as a popover, armed only by the pointer path (cljs `show-selection-action-bar-for-pointer!`); keyboard select-all does NOT show it — matches cljs. Outside primary-pointer mousedown clears selection; inside `.ls-block` hides the bar. |
| Block drag reorder (bullet) | **parity** (code-verified) | `.bullet-container[draggable]` + drop handling. |
| Copy/cut/paste | **parity** (wired; clipboard-permission caveat in headless probes) | `editor/copy`, `copy-text`, `cut`, `paste-text-in-one-block-at-point` wired. |

## cmdk / popups / menus / selects

| Surface | Status | Notes |
| --- | --- | --- |
| cmdk open/close/search | **parity** | `mod+k`, `mod+shift+p`; Escape closes (minor: cljs clears an active filter first before closing — cosmetic diff, sibling-owned). |
| Slash/date/template commands | **parity** | Word-boundary gating verified. |
| Context menus / selects / autocomplete dropdowns | **sibling** | `devin/lui-popup2` owns popup/select internals; item coverage and pixel details deferred. |

## Tags + properties

**sibling** — `devin/lui-tags` owns. Known overlap: the missing task-status
marker render (see Journal section) likely lives in their properties-display
scope.

## Settings / dialogs / toasts

| Surface | Status | Notes |
| --- | --- | --- |
| Settings panes (`t s`) | **parity** | Opens settings; wide-mode toggle verified to flip `ls-wide-mode` + persist. |
| Dialogs (delete-confirm, publish, etc.) | **parity** (wired) | `Dialogs_view` mounted in overlays. |
| Toasts / notifications | **parity** (wired) | `Toasts_view` mounted; `ui/clear-all-notifications` command exists. |

## Theme

| Surface | Status | Notes |
| --- | --- | --- |
| Light/dark toggle (`t t`) | **parity** | Verified class flip. |
| Wide mode (`t w`) | **parity** | `ls-wide-mode` on `#app-container-wrapper` + `wide-mode` localStorage persist; restored at boot. |
| Accent/font/document-mode restore | **parity** (code-verified, `boot.ml`) |  |

## Mobile (≤640px) — not yet ported

These are all cljs sm-breakpoint behaviors; the web UI targets desktop-first.

- Right-sidebar toggle not hidden under 640px.
- `.shade-mask` tap-to-dismiss overlay absent (element renders `display:none`).
- `is-touching` class lifecycle + left-sidebar `:before` 3rem touch strip.

## Environment caveats (probe-only, not app diffs)

- macOS Chrome intercepts `mod+,` (open Settings) — the `mod+,` zoom-out binding
  is wired but can't be exercised in the probe browser.
- Clipboard read assertions unreliable under Playwright without permissions.

## Fixes landed on `devin/lui-parity`

| Commit | Fix |
| --- | --- |
| `a90bcc7f37` | cljs keymap parity: chord engine, all bindings dispatched, editing gate |
| `cc060dd89a` | left-sidebar z-index media rule — header buttons no longer covered (invisible-toggle bug) |
| `1f2cad0ee7` | left + right sidebar resizers (drag, clamps, persistence, restore) |
| `83b2aec9a6` | header breadcrumb for zoomed blocks |
| (earlier) | delta-splice page updates — outliner ops no longer remount the page |

Gates kept green after each commit: `dune build js_app test`,
`vite build`, `node _build/default/test/ui_test/test/test_main.js` (1236
checks, 0 failures).
