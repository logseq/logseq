# Parity audit — Left sidebar + navigation

Logseq master web app (cljs, shadow-cljs @ `master`, served :3001) vs LUI-rewrite web app
(`deps/ui` @ `devin/component-migration` `a3dc4ff1f8`, lui pin `315cc9f`, served :3010,
`?rtc-test=true`).

Screenshots live in `docs/parity-shots/nav/` as `master-NN-*.png` / `lui-NN-*.png`; step
numbers match between the two capture runs where the same interaction was attempted.
Capture drivers: `scripts/parity/capture.mjs` (master) and `scripts/parity/capture-lui.mjs`
(LUI — adapted because several LUI interactions are broken, see notes).

Harness notes:

- LUI `?rtc-test=true` creates a fresh ephemeral graph per page load, so all seeding +
  captures run in one browser session.
- Seeding on LUI had to go through `window.logseq.api.create_page` /
  `append_block_in_page` / `location.hash` navigation because the cmdk palette and the
  block editor do not accept keyboard input (see P0 rows). Master was seeded through the
  real UI.
- LUI menu items render twice in the DOM (one hidden duplicate); Playwright text clicks
  need a `>> visible=true` filter. Cosmetically the menu looks correct.

Status legend: **match** = visually/behaviorally equivalent; **partial** = renders but
behavior diverges or is incomplete; **broken** = feature exists in master, fails or throws
in LUI; **missing** = feature absent in LUI; **untested** = could not be reached due to an
upstream blocker.

| feature | shots | status | severity | notes |
|---|---|---|---|---|
| Sidebar open/close toggle | 01-02 | match | — | `#left-menu` toggles `.left-sidebar-inner`; open/close render correctly. Toggle animation exists but is instant-feel vs master’s slide — cosmetic. |
| Sidebar structure / sections | 02, 06-08 | partial | P2 | `Navigations` (Journals G·J, Flashcards G·F, Pages), `Favorites`, `Recent` all render in master order. Section collapse/expand via header works (06-08). Missing vs master: no `Graph view` nav row, no search icon in topbar next to hamburger, no page icons/expand carets on list items, sidebar bottom has only the `?` help dot. |
| Journals nav entry | 25 | partial | P2 | Click navigates to home (`#/`, today’s journal) — same as master’s default; master additionally shows a journals list view which LUI does not render separately. |
| Flashcards nav entry | 25 | broken | P2 | Click is a no-op (stays on journal, URL unchanged). |
| All Pages nav entry | 28, lui-49 | broken | P1 | Click pushes `#/all-pages`, throws `MelangeError: Invalid_argument`, then silently falls back to the journal page. Master renders the full All-Pages table (columns: Page name / Backlinks / Tags / Created At / Updated At). Route is unusable. |
| Favorites — add | 09-10, lui-47, lui-48 | broken | P1 | `...` menu opens with full item list (Add to Favorites, Delete page, Export page, Publish page, Convert to Tag, Settings, Plugins, Appearance, Recycle, Export graph, Import, Login). “Add to Favorites” click registers (visible-duplicate quirk aside), but the Favorites section never renders an item — `.favorites` has no `.bd` body at all. |
| Favorites — list / remove / reorder | 30-32, 39-41 | untested | P1 | Blocked by add not populating; no `a.link-item`-equivalent elements exist in `.favorites`. |
| Recent list contents | 11-12 | broken | P1 | `.recent .lui-list` stays empty after visiting Alpha + Beta pages (hash-nav and in-app nav both tried). Master lists Baz/Beta/Alpha. Hover + context actions on recent items therefore untestable. |
| Page item hover + context actions | 11-13, 39-41 | untested | P1 | No items exist to hover/right-click (Favorites and Recent are empty). |
| Sidebar resize handle | 14-15 | broken | P2 | Drag renders the blue resizer indicator at the sidebar edge but width never changes (stays ~245px). Master resizes live. |
| Graph switcher / home button | 16-18 | broken | P1 | Clicking `Demo` in `.cp__graphs-selector` does nothing visible (master opens a dropdown: Create db graph / Import existing notes / All graphs). A home icon does appear top-right on non-home pages. |
| All graphs page + Create-new-graph | 17 | missing | P1 | `All graphs` menu item does not exist in LUI (switcher dropdown absent); the page could not be reached. Master renders “Create a new graph” + Local graphs list. |
| Breadcrumbs bar + segment clicks | 19-21 | missing | P1 | No breadcrumb bar renders above the page title (master: “Library / Foo / Bar” top-left). Blocked from deep testing: namespaced pages can’t be created (see below). |
| Namespaced page creation | 06 (toast), seed note | broken | P1 | `create_page('Foo/Bar')` throws `MelangeError: Outliner_validate.Notification` and surfaces a `Page name can't include "/"` toast. Blocks the whole namespace/breadcrumb scenario. |
| Page-ref click → navigation | 19 | partial | P2 | Navigating to a page (`#/page/<uuid>`) works and renders the page. But page-refs inside a block render raw `[[Alpha]]`/`[[Beta]]` markup (brackets visible); the rendered span is not an `<a>` and ref-click nav could not be exercised. |
| Back / forward navigation | 22-24 | broken | P1 | `history.goBack/Forward` changes the URL hash but the view does not re-render (stayed on `Alpha`). `location.hash` assignment does drive navigation (hashchange handled), so it’s specifically popstate that appears unwired. |
| Journal-date prev/next | 26-27 | broken | P2 | `g p` / `g n` produce `MelangeError: Invalid_argument` pageerrors and the view never leaves the current page. Master navigates Oct 6th → Oct 5th and back. No arrow buttons exist either (journal page shows only the title + empty block). |
| Help entry | 33 | broken | P2 | `?` button bottom-right exists (same position as master) but clicking opens nothing. Master shows Handbook / Keyboard shortcuts / Documentation / Bug report / Release notes + version menu. |
| Settings entry | 34, ev-settings | broken | P2 | `Settings` appears in the `...` menu; clicking it returns to the journal with no settings panel rendered. |
| Theme toggle (light/dark) | 35-37 | partial | P2 | `logseq.api.set_theme_mode('dark')` works — dark theme renders correctly across sidebar + page (lui-36). UI path (dots menu → Appearance) unreachable: `Appearance`/`Login` items only exist as hidden duplicate nodes that fail `visible=true` (menu may also auto-close; click could not be reliably exercised). |
| Left sidebar hidden state | 01, 42 | match | — | Hidden state matches master (collapsed to topbar, content full-width). |
| Logged-in / sync indicators | 38, 36 | partial | P3 | Cloud sync icon present top-right (parity position). `Login` item exists in `...` menu but wasn’t reachable as a visible node (hidden-duplicate issue); login dialog untested. |
| cmdk search palette (blocking) | 43-46, lui-44 | broken | P0 | `#search-button` opens the palette, but the input never receives focus — `document.activeElement` stays on the triggering button even after clicking the input directly; typed text never enters the field, Enter throws `Invalid_argument`. Escape does not close it and the `ui__dialog-overlay` (z-999, pointer-events auto, opacity 1) stays rendered forever — every subsequent click on the page times out until reload. Opening cmdk once wedges the app. |
| Block editing (blocking) | — | broken | P0 | Not a sidebar feature but blocks all UI-driven seeding: journal blocks contain no `textarea`/`input`/`contenteditable`; clicking a block does not open an editor and typing produces nothing. Seeding had to bypass the UI via `logseq.api`. |
| `...` menu | 09, lui-47 | partial | P3 | Full master-parity item list renders. Follow-ups that open panels (Settings, Appearance, Login) don’t reach their targets; Add to Favorites doesn’t populate the list. |
| Page-title hover actions | 19-state | partial | P3 | Hovering the page title row reveals `Add icon` / `Set property` buttons like master. |

## Cross-cutting notes

- `MelangeError: Invalid_argument` fires repeatedly on most non-trivial interactions
  (nav clicks, key presses, menu opens) — likely an unhandled exception path in an event
  handler; probably the same root cause family as the All Pages crash and cmdk Enter.
- `MelangeError: Outliner_validate.Notification` on namespaced `create_page` suggests
  title validation rejects `/` while the UI still surfaces a friendly toast — consistent
  error UX, just for an operation that should succeed.
- Master app captured at `master` branch with identical seed data (Alpha, Beta,
  Foo/Bar/Baz hierarchy, favorites Baz+Beta) through the real UI; all 42 checklist
  interactions succeeded there except a flaky Appearance-menu click.

## Capture reproduction

- Master: `node scripts/parity/capture.mjs http://localhost:3001/ /tmp/parity/master master`
- LUI: `node scripts/parity/capture-lui.mjs http://localhost:3010/index.html?rtc-test=true /tmp/parity/lui`
