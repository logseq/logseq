# Web UI comparison: master (cljs/React) vs LUI rewrite (deps/ui, OCaml/Melange)

- MASTER: `master` @ `22a29b30de`, served at `http://localhost:3001` (shadow-cljs `:app` watch + static serve).
- LUI: `devin/component-migration` @ `1542d78eb9`, `node scripts/serve-static.mjs 3010` → `http://localhost:3010/index.html?rtc-test=true`.
- Both apps loaded a `Demo` graph seeded with identical journal blocks:
  `Alpha block **bold** [[Page One]]`, `Second `code` $x^2$ #tagone`, `Third https://example.com link`.
- All screenshots live in `docs/assets/compare/` as `<flow>-master.png` / `<flow>-lui.png`.
- Note: LUI was run with LOCAL, uncommitted workarounds for the known boot blockers
  (worker `Unix.gettimeofday` → `Time.monotonic_*`, web_dom `js_call2` Reflect.call fix,
  lui store `''`-fingerprint/link/node-validation relax, and a compiled `lui-full.css`
  linked from `static/index.html` plus audit CSS patches for `.lui-scroll`/`cp__content-wrap`/
  block columns/`.ls-table-row` sticky columns). Where a defect persists *even with*
  those patches, it is reported below. The CSS findings describe what happens without them.

## Flow comparison

| flow | status | severity | notes |
|------|--------|----------|-------|
| App shell + left sidebar | divergent | minor | Shell renders (Demo graph switcher, Navigations, Favorites, Recent, shortcut chips G J / G F). Missing "Graph view" nav item that master has. Recents populate correctly. `sidebar-state` |
| Journal render | divergent | major | Journal page renders and scrolls, but only with local CSS patches — without them `.lui-scroll` collapses to ~16px and the title renders one-char-per-line. `#Journal` tag chip floats to the far right edge instead of inline after the date. Orphan empty bullets accumulate from broken editing (see below). `journal-seeded`, `journal-state` |
| Block display + inline formatting | divergent | minor | bold/`code`/`$x^2$` katex/link/tag all render. Tag chip renders at right margin instead of inline at end of block. `[[Page One]]` shows literal `[[ ]]` brackets in BOTH apps (parity quirk, not a LUI bug). `journal-seeded` |
| Block editing | broken | blocker | Double-click opens `textarea.ed-input` (single click only selects — divergent from master's single click). **Enter creates a new block but focus drops to `body` — every subsequent keystroke is lost** (verified `document.activeElement` → BODY, `inputValue` stays empty). Retries create phantom empty blocks. Tab indents (accidentally verified). Editing is effectively unusable past the first block. |
| cmdk (mod+k) | divergent | major | The palette itself works once opened via the header search button: input, "Recently updated", Filters, result list all present. But **⌘K never opens it** — the keybinding is not wired; only the search icon click opens `ls-dialog-cmdk`. `cmdk`, `cmdk2` |
| Page-ref navigation | ok | — | Clicking `Page One` navigates to `#/page/<uuid>` and renders the page. `pageref` |
| Breadcrumbs / block zoom | broken | major | `#/block/<uuid>` route resolves and renders the breadcrumb ("Oct 6th, 2026" link), but the zoomed block's own content is empty. Bullets have no zoom handler (cannot reach zoom via UI). `blockzoom` |
| Right-click block context menu | ok | — | Full menu: H1–H6 heading toolbar, Open in sidebar ⇧Click, Add comment, Add reaction, Set icon, Copy block ref, Copy / Export as.., Cut ⌘X, Delete selected blocks, Make a Flashcard, Toggle number list, Expand/Collapse all. `ctxmenu` |
| Fold / collapse | broken | major | `.rotating-arrow` affordances render 0×0 (invisible, unclickable) on every block. "Collapse all" via the ctx menu partially works. No per-block folding possible. |
| All Pages table | divergent | major | Renders only with local patch: `.sticky-columns` wrapper takes the full row width, pushing data cells one row down into the clip zone — without the fix the table shows headers and "All 3" but zero visible rows. Column header "Updated At" missing (row data still emits a 5th column). Local filter input works (3→1 rows for "Page One"). `allpages`, `allpages2` |
| Search (global) | ok | — | Global search = cmdk palette; works via the icon (see cmdk for the ⌘K gap). All Pages local filter works. `cmdk2` |
| Settings dialogs | broken | blocker | `#/settings` route resolves but the view never renders (page stays on previous view). Booting directly into `#/settings` ends in `graph/load-error`. No settings UI reachable at all. `settings` |
| Block properties | broken | major | "Set property" opens a full-screen `lui-modal-layer` "Add or change property" dialog with a single input — but the property list never populates and typing a name yields no options. Master shows a compact popover listing all built-in properties. `setproperty` |
| Tags page | ok | — | `#tagone` click → tag page with `#Tag` chip, "Add tag property", and the `All 1` objects table listing the tagged block. `tagpage` |
| Flashcards | missing | major | Sidebar item + `ls:open-cards` dispatch exist (`sidebar_state.ml`), but clicking Flashcards opens nothing — no cards modal renders, `g f` does nothing. `flashcards` |
| Export / Import | ok | — | `#/import` renders the same import page (EDN/Markdown/SQLite options) as master. Page "..." menu exposes Export page / Export graph. `import` |
| Right sidebar | divergent | minor | Opens correctly via block ctx "Open in sidebar" (480px, Contents + Help tabs). Missing master's "Page graph" tab (Graph view isn't implemented). `rightsidebar` |
| Favorites | ok | — | Page "..." → Add to Favorites populates the sidebar Favorites section immediately. |
| Recent | ok | — | Recents populate on page visits (tagone, Page One). |
| Linked references | missing | major | Page One has a real backlink from the journal block; master shows "Linked references 1" + the block, LUI shows only "Unlinked references" with no Linked section. `pagerefs` |
| Graph view | missing | major | `#/graph` renders the placeholder "Graph view isn't available in this app yet." `graphview` |
| Page preview hover | missing | minor | Hovering `[[Page One]]` shows no preview card (master shows one). |
| Deep-linking / route boot | broken | major | Reloading directly into a non-home route (`#/settings`) ends at `graph/load-error` — the graph only loads from the default route. In-session hashchange works for `#/all-pages`, `#/page/x`, `#/graph`, `#/import`, `#/block/uuid`, but `#/settings` is a no-op and `#/journals` (cljs-style) is a 404 (LUI uses `#/all-journals`). |
| Store robustness (root cause) | broken | blocker | A single invalid node in a LUI store batch (`invalid_arg`, e.g. "button requires text or an accessibility label") aborts the batch **without advancing `retained_generation`**; every subsequent batch then fails with "expected patch generation N, received N+1" and the entire renderer dies (sidebar loader / load_journals / load_home all reject). This is why the app appeared fully dead earlier. Local workaround: log-and-continue in `lui_web_store.ml` op application, node validation, and generation check. |
| Page header menus | ok | — | "..." menu exposes Add to Favorites, Delete page, Export page, Publish page, Convert to Tag, Settings, Plugins, Appearance, Recycle, Export graph, Import, Login. |

## LUI-only capabilities

No significant LUI-exclusive UI features were found in this audit — the rewrite targets parity.
Things observed only on the LUI side (all minor/incidental):

- `rtc-test=true` boot path (RTC/test graph bootstrap) used to run without a file graph.
- Page menu exposes `Login` / `Plugins` / `Recycle` entries inline in the same dropdown where master splits them across menus.
- Shortcut hint chips (G J, G F) render in the sidebar — master shows the same, so this is parity, not exclusive.

## Top findings

1. **Editing is unusable**: Enter in a block creates the next block but drops focus to `body`, so all subsequent typing is silently lost and phantom empty blocks accumulate. (blocker)
2. **Settings is completely unreachable** — `#/settings` never renders and a direct boot into it fails with `graph/load-error`. (blocker)
3. **One bad LUI node bricks the whole renderer** — a failed store batch leaves `retained_generation` behind, so every later batch is rejected; the app collapses to a sidebar-only shell until reload. (blocker, patched locally)
4. **cmdk can't be opened by ⌘K** — the global shortcut isn't wired; only the search icon opens it. (major)
5. **Linked references never render** on a page even when backlinks exist; Graph view and Flashcards are missing entirely. (major)

Also worth noting: All Pages rows are invisible without a CSS fix (sticky-columns overlay consumes the row), fold arrows render 0×0, the block-properties picker lists nothing, block zoom shows the breadcrumb but not the block, and `#Journal`/tag chips mis-position (tag chip floats right).
