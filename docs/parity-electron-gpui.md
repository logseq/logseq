# Electron vs GPUI host parity audit

Slice: FULL APP SHELL + FEATURE FLOWS (desktop).

- **Electron**: `logseq/logseq` @ `22a29b30de` (master), real Electron dev shell — `pnpm electron-watch` + `pnpm dev-electron-app`, renderer on :3001, cljs `db-worker-node` daemon on `~/logseq`.
- **GPUI**: `devin/component-migration` @ `df269ce79b`, `deps/ui/gpui/host/target/debug/logseq-gpui` (debug build) + OCaml `deps/db-worker` `main.exe` (`LOGSEQ_DB_WORKER_BIN`), lui pinned `315cc9f` (origin/main HEAD). Because the cljs daemon repo-locks a graph directory, GPUI ran against a byte-identical copy of the same graph under `LOGSEQ_ROOT_DIR=~/logseq-gpui` — the OCaml daemon never shares a repo lock with the running cljs daemon.
- Fixture: `Demo` sqlite graph seeded via the cljs CLI (`upsert block`): bold/italic/strikethrough/`==highlight==`/`code`, `[[Page Ref]]`, `#test-tag`, `[external](url)`, inline + display KaTeX, TODO/DONE, 3-level nesting, block properties (`seed`, `ptype`, `rating`), CJK paragraph, fenced `clojure` block, `[[Second Page]]` nav target.
- Shots: `docs/parity-shots/electron-gpui/` (`*-electron.png` / `*-gpui.png` pairs, window captures; `17-menubar-*` are full-screen shots to capture the macOS menu bar).
- GPUI version footer reads 2.0.1 vs Electron 2.0.2 (settings panel).

## Status legend

- `ok` — works / visually equivalent
- `divergent` — present on both, different behavior or rendering
- `missing` — feature absent on GPUI
- `broken` — errors / non-functional state on GPUI

## App shell

| # | Feature | electron shot | gpui shot | status | severity | notes |
|---|---------|---------------|-----------|--------|----------|-------|
| 1 | Window chrome / title | 01-app-shell-electron.png | 01-app-shell-gpui.png | divergent | minor | Electron: hidden titlebar "Logseq", traffic lights integrated into the toolbar. GPUI: standard titlebar whose title literally reads "Skip to main content" (a11y label leaking into the title). |
| 2 | Native menu bar | 17-menubar-electron.png | 17-menubar-gpui-frontmost.png | missing | major | Electron installs File/Edit/View/Window/Help menus. GPUI installs **no menu bar at all** — while `logseq-gpui` is the frontmost process, the previous app's (Electron's) menus stay on screen. No app menu, no key equivalents from menus. |
| 3 | Left sidebar | 03-sidebar-electron.png | 02-journal-gpui.png | broken | blocker | Electron: real split column that pushes content right (Navigations: Journals/Flashcards/Pages/Graph view; Favorites; Recent). GPUI: sidebar renders **transparent overlay on top of journal content** — labels overlap block text; items include Journals/Flashcards/Pages (no "Graph view"); Favorites/Recent headers present. `t l` does not toggle it. |
| 4 | Right sidebar | 05-right-sidebar-electron.png | — | missing | major | Electron opens a Contents/Page graph/Help panel via `]` button or `t r`. GPUI's `]` button is inert; no right sidebar. |
| 5 | Bottom bar / status | 02-journal-electron.png | 02-journal-gpui.png | divergent | minor | Neither has a real status bar; help `?` sits bottom-right in Electron, bottom-left in GPUI. |
| 6 | Global search entry | 13-cmdk-open-electron.png | 13-cmdk-open-gpui.png | ok | — | Topbar ⌕ opens the same palette on both. |
| 7 | Settings entry | 20-settings-electron.png | 20-settings-gpui.png | broken | major | Electron: modal dialog (General/Editor/Keymap/AI/Advanced/Features). GPUI: "…" → Settings renders the settings panel **inline at the bottom of the page flow**, scrollable but clipped; theme buttons render but see #18. |
| 8 | Boot time | (n/a) | (n/a) | divergent | — | GPUI: window opens ~0.73 s after launch, kit init ~1.06 s (host log timestamps) — dramatically faster. Electron dev cold start is tens of seconds (watch bundles + Electron launch + cljs daemon spawn). Different packaging makes this mostly informational. |

## Journal page / blocks

| # | Feature | electron shot | gpui shot | status | severity | notes |
|---|---------|---------------|-----------|--------|----------|-------|
| 9 | Bullets + indent guides | 02-journal-electron.png | 02-journal-gpui.png | missing | blocker | Electron: bullet dots + nested indentation. GPUI: **no bullets at all**, no guides; children get only a few px of indent — hierarchy nearly flat. No fold arrows per block, no drag handle, no bullet-click zoom. |
| 10 | Inline formatting `**` `*` `~~` `` ` `` | 02-journal-electron.png | 02-journal-gpui.png | divergent | major | Electron: bold/italic/strikethrough/code all styled, markers stripped. GPUI: markers stripped but **zero styling applied** — all four render as plain text. |
| 11 | `==highlight==` | 02-journal-electron.png | 02-journal-gpui.png | broken | major | Electron: yellow highlight. GPUI: literal `==highlighted text==` — markers neither stripped nor styled. |
| 12 | `[[page ref]]` display | 02-journal-electron.png | 02-journal-gpui.png | divergent | major | Electron: resolved blue link. GPUI: literal `[[Page Ref]]` text in display mode; *entering edit mode consumes the brackets and resolves the link* — display/edit disagree. |
| 13 | `#tag` | 02-journal-electron.png | 02-journal-gpui.png | divergent | minor | Electron: blue tag text + right-edge `#test-tag` pill. GPUI: plain `#test-tag` text, no pill. |
| 14 | `[text](url)` external link | 02-journal-electron.png | 02-journal-gpui.png | broken | major | Electron: blue underlined link. GPUI: **link and its text do not render at all** — block ends at `…plus`, content dropped. |
| 15 | KaTeX inline + display | 02-journal-electron.png | 02-journal-gpui.png | divergent | major | Inline `$E=mc^2$` renders styled math on GPUI; display `$$…$$` renders as plain inline text `x²+y²=z²`. Host log still emits `dom-op katex-pending unsupported` for both. |
| 16 | Fenced code block | 02-journal-electron.png | 02-journal-gpui.png | broken | major | Electron: tinted block, `1 (+ 1 2 3)` line number. GPUI: collapsible `⌄ clojure` chip + ⧄ Copy button but **code content never renders**; clicking into it reveals the raw `` ```clojure … ``` `` source. |
| 17 | Block properties | 02-journal-electron.png | 02-journal-gpui.png | divergent | major | Electron: two-column key→value rows under the block. GPUI: property names left, values pushed to a far-right column (~500px gap) — table layout broken, though data shows. |
| 18 | TODO / DONE markers | 02-journal-electron.png | 02-journal-gpui.png | ok | — | Both render keyword + title plainly (DB app shows no checkbox styling in either). |
| 19 | CJK + wrapping | 02-journal-electron.png | 02-journal-gpui.png | divergent | major | CJK glyphs render on both. GPUI **does not wrap** the paragraph — line clips at the window edge; Electron wraps. |
| 20 | Block hover affordance | 06-hover-electron.png | 06-hover-gpui.png | ok | — | No hover toolbar on either (electron shows drag bullet only). |
| 21 | Block context menu | 04-context-menu-electron.png | 04-context-menu-gpui-nothing.png | missing | major | Electron: right-click on bullet opens rich floating menu (colors, H1-H6, Open in sidebar, Add comment/reaction, Set icon, Copy block ref/URL, Cut, Delete, Flashcard…). GPUI: right-click produces **nothing** — no block context menu exists. |
| 22 | Page "…" overflow menu | 16-page-menu-electron.png | 16-page-menu-gpui.png | divergent | major | Electron: anchored floating dropdown (Favorites, Copy page URL, Delete, Export page/graph, Publish, Settings, Plugins, Appearance, Recycle, Import, Login). GPUI: same conceptual items (Add to Favorites / Delete / Export page / Publish page / Settings / Plugins / Appearance) but rendered **inline in the page flow at bottom-left**, clipped by the window edge. Confirms "menus are inline, not floating". |
| 23 | Fold / collapse | 02-journal-electron.png | 02-journal-gpui.png | missing | major | Electron: per-block fold via bullet/arrow. GPUI: only a title-level `▶` that is inert; no per-block fold affordance. |
| 24 | Drag to reorder | (n/a) | — | missing | minor | GPUI has no bullets/handles to grab; untestable and presumably absent. |

## Editing

| # | Feature | electron shot | gpui shot | status | severity | notes |
|---|---------|---------------|-----------|--------|----------|-------|
| 25 | Click-to-edit + caret | 07-editing-electron.png | 07-editing-gpui.png | divergent | major | Electron: click mounts the editor with a visible caret at click point. GPUI: click enters edit (host log `focus-retry` on the block uuid) and typing lands at caret — **but no caret/editor chrome is rendered**; the block looks identical in and out of edit mode. Caret lands at position 0 rather than the clicked position. |
| 26 | Keystroke delivery | (n/a) | (n/a) | ok | — | Old double-typing bug (`hello`→`hheelllloo`) is **fixed** — `XYZ`/`[[` insert once. |
| 27 | Enter (new/split block) | (n/a) | (n/a) | broken | blocker | Electron: Enter splits/creates a block. GPUI: Enter is a **no-op** — a new edit uuid gets focus-retry spam but no block renders or persists (verified empty after app restart). Same for typed text into that phantom state. |
| 28 | Backspace | (n/a) | (n/a) | ok | — | Deletes characters correctly on GPUI. |
| 29 | Undo (⌘Z) | (n/a) | (n/a) | broken | major | Unreliable on GPUI: 2×⌘Z failed to remove typed `XY` in one session but removed `tl`/`[[` in earlier runs. Editor undo is not dependable. |
| 30 | Slash menu `/` | 11-slash-menu-electron.png | — | missing | major | Electron: anchored popup listing BASIC/FORMAT commands. GPUI: `/` inserts a literal `/` — no menu. |
| 31 | Page-ref autocomplete `[[` | 12-pageref-autocomplete-electron.png | 12-pageref-autocomplete-gpui.png | broken | major | Electron: anchored dropdown (Today/Tomorrow/…). GPUI: suggestion list renders **detached at bottom-left** of the window, overlapping the sidebar — works but misplaced. |
| 32 | Escape → select / exit | (n/a) | (n/a) | divergent | minor | Both exit edit; GPUI shows a row highlight (selection exists), but the highlighted row stays "stuck" painted in later shots. Escape does not reliably release an invisible edit — subsequent shortcut keys get typed into the phantom editor. |
| 33 | IME / CJK input | — | — | — | — | Not tested (no input-method switching on the harness). |

## Navigation & commands

| # | Feature | electron shot | gpui shot | status | severity | notes |
|---|---------|---------------|-----------|--------|----------|-------|
| 34 | cmdk ⌘K palette open | 13-cmdk-open-electron.png | 13-cmdk-open-gpui.png | ok | — | Both open a centered floating palette; GPUI now has autofocus (old "inline bottom palette, no autofocus" fixed). |
| 35 | cmdk results | 14-cmdk-results-electron.png | 14-cmdk-results-gpui.png | divergent | minor | Same sections both (Create page / Nodes / Page Tags / Commands / Filters); GPUI results carry literal `[icon]` text and a stray `Filters5` badge layout. Electron additionally retains the last query and shows an action bar (Open ↩ / Open in sidebar ⌥↩ / Copy ref ⌘C) that GPUI lacks. |
| 36 | cmdk activation (Enter/click) | (n/a) | (n/a) | broken | blocker | Electron: Enter created+opened the "Parent" page, click works. GPUI: **Enter and click are both inert** — palette results cannot be activated at all, so cmdk navigation is impossible. |
| 37 | Command palette ⌘⇧P | 18-cmdshiftp-electron.png | — | missing | major | Electron: Commands palette with shortcut chips. GPUI: ⌘⇧P is a no-op (bound in `commands_data.ml` but never fires). |
| 38 | Back / forward | (n/a) | (n/a) | divergent | minor | Electron: ‹ › buttons + ⌘[ / ⌘] work. GPUI: ‹ button works, **⌘[ / ⌘] dead**. |
| 39 | Breadcrumbs | 15-all-pages-electron.png | 15-all-pages-gpui.png | ok | — | Both show `‹ › Pages` / breadcrumb row on aggregate views. |
| 40 | All Pages | 15-all-pages-electron.png | 15-all-pages-gpui.png | broken | major | Electron: `All 5` rows with Backlinks/Tags/Created/Updated. GPUI: header only, **zero rows** (same as earlier audit). |
| 41 | Journals aggregate | (n/a) | (n/a) | broken | major | `g j`/sidebar Journals shows only the `Oct 6th, 2026` title — no blocks — and the title/fold clicks are inert. After visiting it, going ‹ back leaves the journal page **empty** (blocks never re-render until app restart). |
| 42 | Page link navigation | 22-page-nav-electron.png | (n/a) | missing | blocker | Electron: click `[[Second Page]]` → page + linked refs. GPUI has **no working path to another page** — `[[…]]` isn't a link, cmdk results are inert, All Pages is empty. Only Journals/Pages sidebar stubs and ‹ › history exist. |
| 43 | `g`-prefix keymap | (n/a) | (n/a) | broken | major | `g j` worked once (Journals). `g a`, `g h`, `t l`, `t t`, `⌘⇧P`, `⌘[` are all no-ops — keystrokes are instead swallowed by a lingering invisible editor (`g h` once materialized a persisted `gh` block at journal end). Key routing is focus-state dependent and unreliable. |
| 44 | Page search in page (⌘⇧K) | (n/a) | (n/a) | — | — | Not exercised on either. |

## Theming & chrome details

| # | Feature | electron shot | gpui shot | status | severity | notes |
|---|---------|---------------|-----------|--------|----------|-------|
| 45 | Dark theme | 19-dark-theme-electron.png | 20-settings-gpui.png | broken | major | Electron toggles instantly (⌘⇧P → Toggle dark/light, or `t t`). GPUI: clicking **dark** flips state (button highlights, label becomes "Switch to light theme", ui-state log emits `dark-theme` classes) but **nothing re-renders dark** — theme is unapplied; `t t` itself is a no-op. |
| 46 | Icons | 03-sidebar-electron.png | 02-journal-gpui.png | divergent | major | Electron: proper icon font. GPUI: several glyphs render as missing boxes (`⌧`,`⧄`,`◇`) and cmdk results show literal `[icon]` text — icon font wiring incomplete. |
| 47 | Fonts / density | 02-journal-electron.png | 02-journal-gpui.png | divergent | minor | Different family/size/kerning; GPUI text is sparser, no anti-alias tuning evident. All GPUI text renders at one weight — no bold anywhere. |
| 48 | Popovers / dialogs | 16-page-menu-electron.png | 16-page-menu-gpui.png | broken | major | **Every** popover on GPUI (page menu, settings, autocomplete list) renders inline in the page flow instead of floating/anchored; none are dismissible by click-outside; they linger. |
| 49 | Tooltips | (n/a) | (n/a) | missing | minor | Electron shows "Home"-style tooltips on hover. GPUI shows a hover background circle but no tooltip text. |
| 50 | Scrollbars / scrolling | (n/a) | (n/a) | ok | — | Wheel/trackpad scrolling works on GPUI; thin overlay scrollbars on both. |
| 51 | Keyboard shortcuts table | 21-keymap-electron.png | (n/a) | divergent | minor | Electron Settings → Keymap lists 122 shortcuts, searchable. GPUI inline Settings exposes fewer tabs; full keymap lives in `commands_data.ml` but most bound keys don't fire (see #43). |

## Re-verification of `docs/compare-gpui-vs-electron.md`

| earlier finding | verdict now |
|---|---|
| Left sidebar renders inline not split; `t l` dead | **still broken** — sidebar is a transparent overlay over content; `t l` no-op |
| No bullets / indent guides; nested flat | **still broken** — bullets absent entirely; minimal indent |
| bold/italic/strike/highlight/code unstyled | **still broken** — `==` now even stays literal |
| `[[uuid]]` literal links | **still broken** (display mode); edit mode resolves them |
| KaTeX pending | **partially improved** — inline math now typesets; display still plain text; `katex-pending` unsupported ops still logged |
| Code fence unstyled/overlapping chip | **changed shape, still broken** — chip + Copy render but code content hidden |
| Properties mangled inline | **improved, still wrong** — now a two-column table with values far right |
| Keystrokes double (`hheelllloo`) | **fixed** — single insertions; edit commits |
| cmdk inline palette, no autofocus, Enter dead | **partially fixed** — now floating + autofocused; Enter/click still inert |
| Context menu inline at bottom | **still broken** — page menu/settings render inline; block context menu absent entirely |
| `g a/j/h/t` route OK | **regressed** — only `g j` worked this pass; others swallowed by phantom edit focus |
| `⌘[` dead; journal row click dead | **still broken** |
| All Pages zero rows (both hosts) | **gpui still zero; electron now lists rows** — no longer a shared bug |
| No fold affordance | **still missing** |
| Search returns only "Create page" | **fixed** — blocks/tags/commands all returned |
| Settings opens, dark never applies, `t t` no-op | **still broken** — settings renders inline; dark state toggles but never applies |
| Electron-side desync wedge / `.ed-input` never mounts / CLI alert | electron-side items; CLI alert gone after `static/logseq-cli.js` build; others not re-triggered this pass |
| GPUI better: fast boot, no desync, editing reaches input | **confirmed** — ~1 s to window, edits land |

## Top findings

1. **GPUI's sidebar paints as a transparent overlay over page content** instead of a split column — every journal row under x≈120 is unreadable/unclickable where they overlap. (blocker)
2. **No way to navigate on GPUI**: `[[links]]` aren't links, cmdk results ignore Enter and click, All Pages is empty, journal rows are inert — the app is effectively a read-only single-page view plus a flaky editor. (blocker)
3. **Enter does nothing in the GPUI editor** — no split, no new block, nothing persisted; keystrokes can also fall through to invisible editors (`g h` persisted a `gh` block). (blocker)
4. **No native menu bar** on GPUI — the previous app's menus remain while gpui is frontmost; no ⌘Q/⌘W/menu key equivalents. (major)
5. **All popovers are inline** (page menu, settings, autocomplete) — nothing floats/anchors; they clip at the window edge and don't dismiss on click-outside. (major)
6. **Theme state toggles but never renders dark** — dark theme is unapplied despite correct ui-state classes in the log; `t t` dead. (major)
7. **Formatting & content drops**: external `[text](url)` links vanish entirely; code-fence content hidden behind a language chip; `==highlight==` left literal; properties table misaligned; `[[…]]` literal until edit mode. (major)
8. **New since earlier audit**: cmdk is now floating+focused, search returns real results, keystroke doubling is gone, and block editing commits — but Enter/new-block, activation, and most bound shortcuts are still dead.
