# UI parity audit — right sidebar, context menus, graph view, misc

Logseq master (cljs, `:3001`) vs LUI rewrite (`deps/ui` @ `devin/component-migration` `a3dc4ff1f8`, lui `315cc9f`, `:3003/?rtc-test=true`).
Screenshots: `docs/parity-shots/menus/*.png`. Both graphs seeded with 3 journal blocks.

## Root-cause finding (dominates this slice)

**deps/ui emits LUI nodes that violate required text/label props; a single invalid node poisons the emit pipeline for the whole session.**

- Protocol: `MenuItem` requires non-empty `TextValue`; `Button`/`ToggleButton` require `TextValue` or `AccessibilityLabel` (`lui_protocol.ml:1364`, `lui_web_store.ml:316`).
- `apply_operations` mutates `retained_nodes` per-op, then runs `validate_nodes` at batch end. A validation `Invalid_argument` aborts `commit_batch` **after the nodes were already retained** and the emitter advances its generation — so every later batch then also fails (`expected patch generation N, received N+1`) or re-fails on the same invalid node. One bad emit → permanent silent freeze of all UI updates until reload (`lui_web_store.ml:616` + `apply_pending_batch` in `main.js`).
- `accessibility_identifier` does **not** satisfy `AccessibilityLabel` — icon-only buttons without `~label` are invalid.

Sites verified to emit invalid nodes (each independently bricks the session):

| Site | Node emitted | Trigger |
|---|---|---|
| `popups_view.ml:582` `Ci_sub` | `menu-item` no `TextValue` (label is a child `text`, not `~text`) | block ctx menu ▸ sub |
| `popups_view.ml:590` `Ci_item` | same | every block ctx entry |
| `popups_view.ml:604` `cm_sub_item_el` | same | ctx sub-menu rows |
| `right_sidebar_view.ml:221` `hdr-` | `button` `[accessibility-identifier, padding-horizontal, grow]`, no text/label | opening any right-sidebar panel |
| `right_sidebar_view.ml:234` `more-` | icon `button` with `accessibility_identifier` but no `~label` | panel ⋯ button |
| `cmdk_view.ml:575` `clr` | icon `button`, no `~label` | ⌘K with active filter |
| `cmdk_view.ml:670` `hint_button` | `button` `[style-class]` only | ⌘K mount |

Observed live: right-click on a block runs the full chain `CTXCB → CTX → OPEN_CM → CM_POPOVER_MOUNT` then the emit batch dies with `node 469 kind=menu-item props=[data-attrs,press-enabled,style-class]: node properties conflict` → `BATCHFAIL` → subsequent `expected patch generation 8, received 9` for every later interaction. On some boots a boot-time emit already contains an invalid node, in which case the popups subtree (`Popups_view.render` / `install_listeners` — contextmenu/click/keydown/mousemove document listeners) never mounts at all and even the ⋯ page menu is dead.

Every missing menu/panel below traces back to this class of bug unless noted otherwise.

## Parity table

| Surface | master | LUI | Shots |
|---|---|---|---|
| Open page in right sidebar (⇧-click / ctx "Open in sidebar") | ✅ page panel + linked refs stack | ❌ ctx menu dead; ⇧-click opens nothing | `rsidebar-open-*` |
| Contents panel | ✅ stacks with other panels | ❌ tab exists; click emits textless `hdr-` button → panel never mounts + session poisoned | `rsidebar-contents-*` |
| Help panel | ✅ full links (Usage/Community/Dev/About/Terms) + keyboard-shortcuts sub-view | ❌ tab exists; same emit failure, body never mounts | `rsidebar-help-*` |
| Multiple right-sidebar items | ✅ panels stack vertically | ❌ can't reach (panel mount itself fails) | `rsidebar-help-master` |
| Close / collapse right sidebar | ✅ per-panel × and chevron | ⚠️ header toggle collapses to 40px rail; panel close untestable | `rsidebar-close-*` |
| Drag-resize right sidebar | ✅ `.resizer` 560→694px | ❌ sidebar body never materializes (40px = tab strip only) | `rsidebar-resize-*` |
| Block right-click menu | ✅ color row, heading row (H1–6/Hᴀ/rm), Open in sidebar, Add comment, Add reaction ▸, Set icon ▸, Copy block ref, Copy/Export as.., Cut ⌘X, Delete selected blocks, Make a Flashcard, Toggle number list, Expand/Collapse all | ❌ nothing renders; whole chain fires then emit dies on textless `menu-item` | `ctx-block-*` |
| Ctx submenus (Add reaction ▸ emoji picker etc.) | ✅ emoji picker popover (1870 emojis, search) | ❌ dead with parent menu | `ctx-submenu-master` |
| Page-title right-click | ✅ Add to Favorites / Delete page / Export page / Publish page | ❌ no menu; reveals hidden "Add icon / Set property" row only | `ctx-title-*` |
| Page-ref right-click | ✅ page preview card popup | ❌ dead (same popups path) | `ctx-pageref-master` |
| Left-sidebar item right-click | no menu in master either | — (parity) | `ctx-sidebarnav-master` |
| Graph-list right-click | no rclick menu; row ⋯ → "Open in another tab / Delete local graph" | ❌ can't reach — selector click goes to dead `#/graphs` route | `ctx-graphlist-master`, `allgraphs-*` |
| Block drag handle menu | no separate grip in web; bullet rclick = the menu | same model, but menu dead | `ctx-block-*` |
| Page menu (top-right ⋯) | ✅ Add to Favorites, Publish page, Settings, Plugins, Appearance, Recycle, Export graph, Import, Login (+Delete/Export page via title ctx) | ✅ **works** — identical items, renders via `.lui-popup-positioner`; but killed permanently once any invalid emit poisons the session | `page-menu-*` |
| Graph dropdown ("Demo" selector) | ✅ Create db graph / Import existing notes / All graphs → working All-graphs page with row ⋯ menu | ❌ no dropdown by design; click navigates `#/graphs` which is a **dead route** (empty page) | `graphlist-*`, `allgraphs-*` |
| Tabs / tab bar | none in web build (browser-level) | none | — |
| Graph view page | ✅ canvas graph w/ nodes, gear + refresh, FPS meter | ❌ "Graph view" nav item absent from left sidebar; `#/graph` dead route | `graphview-*`, `graphlist-lui` |
| Flashcards review | ✅ modal: All cards ▾ + 0/0 + "Time to create a card!" | ✅ **works** — same modal (minor layout overlap) | `flashcards-*` |
| Whiteboards | not present in web build | not present | — |
| Journal calendar / date-picker | none surfaced in web master | none | `calendar-master` |
| Sync/RTC indicator | ⋯ → Login (no cloud in this build) | ✅ cloud icon → dropdown "Online / 0 pending local changes / 0 pending server changes / More debug info / Start sync" | `rtc-icon-lui`, `page-menu-master` |
| `?` help dropdown (Shift+/) | ✅ Handbook / Keyboard shortcuts / Documentation / Bug report / Feature request / Submit feedback / Ask the community / Support forum / Release notes + version | ❌ no-op (keydown listener lives in the popups path — dead once emit poisoned) | `shortcuts*-*` |
| Keyboard-shortcuts panel (Help → Keyboard shortcuts) | ✅ cheatsheet + searchable All·116 / Custom·0 / Unset·9 / Disabled·4 | ❌ Help panel never mounts | `shortcuts-master` |
| ⌘K command palette | ✅ input + Recently updated + hint shortcuts | ❌ emits textless `hint_button` → dead + poisons session | `cmdk-*` |
| Window chrome / header | hamburger, search, home, ⋯, sidebar-toggle | hamburger, search, **cloud (RTC)**, ⋯, sidebar-toggle | `page-menu-*` |
| Left sidebar nav | Journals, Flashcards, Pages, **Graph view**, Favorites, Recent | Journals, Flashcards, Pages, Favorites, Recent — **no Graph view item** | `leftsidebar-master`, `ctx-title-lui` |
| Login/sync banners | none | none | — |

## Other findings

- LUI journal title shows an extra `#Journal` tag chip master doesn't render (`page-menu-lui` vs `page-menu-master`).
- LUI page-title right-click reveals the "Add icon / Set property" ops row (hover-only in master).
- Intermittent boot-time `''`-fingerprint `Invalid_argument` (`CreateExtension … logseq-raw-text`) still recurs on ~1-in-N reloads and contributes the same poison.

## Severity summary

- **P0 — emit poisoning is systemic**: any single schema-invalid node (7+ sites above) permanently freezes all UI updates for the session. This is the root cause behind "random" UI deadness across this and prior audits.
- **P0 — no context menus at all**: block/tag/page/sidebar right-click dead via `popups_view.ml` menu-item sites.
- **P1 — right sidebar body never mounts** (`hdr-`/`more-` buttons).
- **P1 — ⌘K dead** (`hint_button`/`clr`).
- **P1 — graph switching + graph view unreachable** (dead routes, missing nav item).
- **P2 — `?` dropdown dead** (help keydown lives in popups path).
- **P3 — minor diffs**: `#Journal` chip, RTC cloud icon (LUI-only, rtc-test), flashcards modal layout overlap.
