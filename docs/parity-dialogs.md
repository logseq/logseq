# Web UI parity audit — dialogs, settings, export/import, plugins, toasts

Slice-by-slice screenshot comparison between Logseq master (ClojureScript) and the
LUI OCaml/Melange rewrite in `deps/ui` on branch `devin/component-migration`
(@`a3dc4ff1f8`, lui pinned to `315cc9f`).

- **Master**: `master` @`22a29b30de`, shadow-cljs dev server, `http://localhost:3001/`, Logseq 2.0.2.
- **LUI**: `devin/component-migration` @`a3dc4ff1f8`, `static/` served on `http://localhost:3003/?rtc-test=true`, Logseq 2.0.1.
- Screenshots: real Chrome via Playwright, viewport 1440x900, `m-*.png` = master, `l-*.png` = LUI, in `docs/parity-shots/dialogs/`.
- Both builds opened the same Demo graph state (today's journal, no plugins installed, logged out).

## Severity summary

| # | Severity | Finding |
|---|----------|---------|
| 1 | HIGH (crash) | Settings dialog never renders — DOM batch rejects `set-prop "key" "nav-0"` (`Invalid_argument`, fatal). Blocks every Settings tab and the keymap editor. |
| 2 | HIGH (crash) | Appearance dialog never renders — same `set-prop "key" "tm-light"` rejection on the theme list items. Blocks theme list + switching. |
| 3 | HIGH | Cmd+K search results render with broken/overlapping layout (garbled row labels, two-column overlap). |
| 4 | HIGH | Marketplace plugin detail (README) crashes: `TypeError: Cannot read properties of undefined (reading 'url')` in `open_readme`. |
| 5 | HIGH | Clicking the "Demo" graph label in the sidebar navigates to a blank page instead of opening the graph dropdown; `#/graphs` renders empty. New-graph dialog, All-graphs page and graph `...` menu are unreachable. |
| 6 | MEDIUM | "Start sync" fails with `db-sync-start failed, missing-field op=list-remote-graphs`. |
| 7 | MEDIUM | Modals lack the backdrop dim — Plugins, Login, delete-confirm show the journal page undimmed behind them; the "Plugins" title overlaps the journal title. |
| 8 | MEDIUM | Export-page dialog: the six option checkboxes render with no labels; "Indentation style" label overlaps its select. |
| 9 | MEDIUM | Delete-page confirm: the Confirm button is invisible (in DOM, no visual affordance). |
| 10 | MEDIUM | Recycle page: the description line renders above the "Recycle" heading. |
| 11 | MEDIUM | Marketplace plugin cards lack icon, star count, download count and GitHub link; the Plugins/Themes tabs always read `(0)`. |
| 12 | LOW | LUI header always shows a cloud (sync) icon — even logged out — plus an extra home icon; master shows neither on the journal page. |
| 13 | LOW | Journal page shows an extra `#Journal` tag next to the title and a stray bullet dot. |
| 14 | LOW | Sidebar lacks the "Graph view" nav item that master has. |
| 15 | LOW | Login modal: Sign In button not full-width; no backdrop dim (see #7). |

Both crashes share one root cause: `list_item ~key` (and keyed theme rows) emit the
reconcile `key` as a DOM `set-prop` op, which the DOM backend rejects as an invalid
property. Keyed children appear unusable until `key` stops reaching the DOM layer.

## Per-screen comparison

| Surface | Master | LUI | Verdict |
|---------|--------|-----|---------|
| Home (journal) | m-00-home | l-00-home | Renders; extra `#Journal` tag, stray bullet, extra header icons (#12–#14) |
| `...` dots menu | m-01-dots-menu | l-01-dots-menu | Parity — same items |
| Settings | m-02-settings-general..m-06 (5 tabs) | l-02-settings, l-dir-settings | **LUI crash** — `set-prop key nav-0` (#1) |
| ↳ General tab | m-02-settings-general | — | unreachable on LUI |
| ↳ Editor tab | m-03-settings-editor | — | unreachable on LUI |
| ↳ Keymap tab + edit popover | m-04-settings-keymap, m-51-keymap-edit | — | unreachable on LUI |
| ↳ Advanced tab | m-05-settings-advanced | — | unreachable on LUI |
| ↳ Features tab | m-06-settings-features | — | unreachable on LUI |
| Themes (Appearance) | m-14-appearance | l-14-appearance | **LUI crash** — `set-prop key tm-light` (#2) |
| Plugins modal | m-10-plugins | l-10-plugins | Opens; no backdrop dim, cards lack icons/stats, tab counts `(0)` (#7, #11) |
| ↳ Marketplace tab | m-43-marketplace | l-43-marketplace | Loads plugin cards on both |
| ↳ Themes tab | m-45-themes-tab | l-44-themes-tab | Loads theme cards on both; LUI lacks icons/stats |
| ↳ Plugin README detail | m-46-plugin-detail | l-46-plugin-detail | **LUI crash** — `open_readme` undefined `url` (#4) |
| Export page | m-11-export-page | l-11-export-page | Opens; option checkboxes unlabeled/clipped (#8) |
| ↳ Copy to clipboard | m-32-copy-toast | l-32-copy-toast | Parity — button label flips to "Copied to clipboard!" on both |
| Export graph | m-12-export-graph | l-12-export-graph | Parity — same 5 formats + Schedule backup tile |
| Import page | m-13-import | l-13-import | Parity — same 5 import options |
| Page context menu (right-click title) | m-70-block-ctx | l-70-block-ctx | Parity — identical items |
| Delete page confirm | m-60-delete-page | l-60-delete-page | Renders; Confirm button invisible (#9); no backdrop (#7) |
| ESC to close | m-40-esc-closed | l-40-esc-closed | Parity — ESC dismisses the dialog on both |
| Recycle | m-41-recycle | l-41-recycle | Renders; heading/description order swapped (#10) |
| Login | m-42-login | l-42-login | Renders; button sizing + backdrop diffs (#7, #15) |
| Help (`?`) menu + version | m-52-help | l-52-help | Parity — same items; version 2.0.2 vs 2.0.1 (build diff) |
| Sidebar | m-20-sidebar | l-20-sidebar | Renders; missing "Graph view"; shortcut chips visible on LUI |
| Graph dropdown (click "Demo") | m-21-graph-menu | l-21-graph-menu | **LUI broken** — navigates to blank `#/graphs` (#5) |
| New graph dialog | m-22-new-graph | — | unreachable on LUI (#5) |
| All graphs + `...` menu | m-23-all-graphs, m-50-graph-menu | l-dir-all-graphs | **LUI blank** page (#5); delete confirm untested (item greyed on master) |
| Cmd+K palette | m-15-cmdk | l-15-cmdk | Opens on both |
| Cmd+K results | m-16-cmdk-results | l-16-cmdk-results | **LUI broken** — overlapping layout (#3) |
| Sync (cloud icon) | — | l-53-cloud | LUI shows a sync popover while logged out; master hides the icon (#12) |
| ↳ More debug info | — | l-55-sync-debug | Shows raw `{:rtc-state :close ...}` map (debug view) |
| ↳ Start sync | — | l-54-rtc-dialog | Fails: `missing-field op=list-remote-graphs` (#6) |
| Toast notifications | m-30/m-31/m-71 | l-30/l-31/l-71 | No floating toast observed on either (`.lui-toast-viewport` vs `.ui__toaster-viewport` exist but stayed empty for Add-to-Favorites / copy) |
| Bad route | — | l-dir-export | LUI renders a "Page Not Found" page |

## Blocked / not exercised

- Every Settings tab's controls, keyboard-shortcut editor, theme list + switching — blocked by crash #1/#2.
- New-graph dialog, open/add existing graph, graph remove confirmation — blocked by #5 (master's "Delete local graph" is greyed out for the current graph, so the confirmation dialog could not be captured even on master).
- Per-format export result content — journal page is empty, so the export textarea was empty on both builds.
- Import file pickers and import progress bars — native file dialogs, not driven.
- Plugin install flow and per-plugin settings — no plugins installed on either build; Install buttons unexercised.
- Real file-sync/RTC dialog — LUI start-sync fails (#6); master requires login.

## Notes

- LUI console warnings observed: `warning: lui-store button requires text or an accessibility label` (x3) on the shell toolbar.
- LUI direct routes `#/settings`, `#/import`, `#/plugins` render nothing (blank) or crash, though their in-app entries work; `#/graphs` is blank; `#/export` 404s.
- Earlier 404s (`/css/tailwindcss`, `css/icons/*.svg`) did not reappear after re-syncing to `a3dc4ff1f8`.
