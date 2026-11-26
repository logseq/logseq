# LUI Desktop Parity Notes

This document records UX/UI differences between the experimental native SDL/Metal desktop host and the web app on the same `refactor/lui` revision, plus the follow-up fixes verified in this branch.

Audit baseline: `refactor/lui` @ `a5dd20796628acacc0ac2467ffa31b8169b3ebaa` (`2026-11-26 01:15:38 +0800`).

## Scope and setup

- Web: `static/` served at `http://localhost:3010/`, Chrome with an isolated profile.
- Native: direct macOS SDL/Metal host `deps/ui/_build/default/ocaml_host/logseq_native.exe`, launched with isolated graph/UI-state roots, `LUI_GPU=metal`, and the matching native DB worker.
- Both menu paths were smoke-tested: the default native NSMenu path and `LOGSEQ_NATIVE_MENUS=0` overlay-menu path.
- Both windows were sized to approximately 1575x1080 during the initial comparison. Initial captures used light theme; later captures used dark theme after theme-switch testing.
- Fresh isolated graphs were used. No existing user graph was mutated. Exact content parity was impossible after interactive editing because the seeded text necessarily diverged.
- Setup artifact only: the first web boot failed because `static/js/db-worker.js` had not been built. After `pnpm db-worker:build`, the web app booted normally. This is not counted as a parity finding.
- Login and RTC were intentionally skipped in the follow-up pass.
- The LUI pin in this branch uses `1776c6f7d03e2da38f75f48bf22e62ce11cfe975`, a compatibility backport of the merged [lui#411](https://github.com/logseq/lui/pull/411), [lui#412](https://github.com/logseq/lui/pull/412), and [lui#415](https://github.com/logseq/lui/pull/415) fixes onto the previously pinned LUI API. Current LUI `main` also contains the first two fixes and the upstream popup-exit renderer fix, but its typed-slot API migration is separate work.

## Intentional desktop differences

These differences are deliberate desktop-host behavior. They should not be counted as parity defects unless the product decision changes.

| Area | Native desktop behavior | Web behavior | Status |
| --- | --- | --- | --- |
| Navigation history controls | The native desktop header always mounts back/forward buttons, matching packaged desktop-app chrome. | Browser web hides these buttons because the browser already provides navigation chrome; the web implementation mounts them only for Electron. | Intentional |
| Native performance bar | The native desktop host shows a bottom performance bar with FPS availability and a metrics-dialog control. | The web app has no equivalent visible bottom performance bar. | Intentional |

## Runtime-verified issues fixed in this branch

| Severity | Surface | Original native behavior | Fix | Runtime verification |
| --- | --- | --- | --- | --- |
| Critical | Journal editing / empty block | Clicking the empty journal block blanked the journal content area. The native log reported `shrink is unsupported by backend profile`. | LUI now accepts `shrink` and focus-within observation on generic native hosts ([lui#411](https://github.com/logseq/lui/pull/411)). | Pass: clicking the empty block kept the journal visible and allowed typing. No shrink/focus-within/flush errors remained. |
| High | Caret placement by mouse | Clicking inside a non-empty block entered edit mode but typed text appended at the end rather than the clicked offset. | The same LUI runtime admission removed the flush failure that interrupted editing behavior. | Pass: inserting `X` into `12345` produced `123X45`. |
| High | `[[` page-reference autocomplete | Quick-add autocomplete was invisible. | Native overlay ordering was corrected so popups render above dialogs. | Pass: `[[J` showed `Journal` and `New page J`. |
| High | `#` tag autocomplete | Quick-add tag autocomplete was invisible. | Same overlay ordering fix. | Pass: `#J` showed `New tag J` and the inline-tag hint. |
| Medium | Slash-menu layering | The slash menu was dimmed/obscured underneath the quick-add modal/backdrop. | Same overlay ordering fix. | Pass: slash entries rendered bright/opaque above the modal. |
| High | Plugins dialog | Page menu → Plugins was a runtime no-op. | The LUI focus-within runtime rejection was removed. | Pass: Plugins opened with Installed/Marketplace tabs. |
| High | Export graph dialog | Page menu → Export graph was a runtime no-op. | The LUI focus-within runtime rejection was removed. | Pass: the export dialog opened with SQLite/assets/EDN/Markdown/public-pages/debug-transit choices. |
| Medium | Block context menu UX | Native initially used large component-menu rows and omitted compact swatches/heading options/shortcut hints. | Native now uses the same legacy menu implementation as web for block context menus. | Pass: compact swatches, heading rows, submenu arrows, and shortcut hints appeared. |
| Low | Document/window title | Native window title remained `Logseq Native (Experimental)` across routes. | The shared document-title setter is wired to the host window title, and startup uses `Logseq`. | Pass: cold start was `Logseq`; routes included `Pages`, journal date, and block-zoom title `Child one`. |
| Low | Help/version details | Help popup omitted the revision line. | The OCaml version generator now embeds the short Git revision. | Pass: Help showed `Logseq 2.0.2` and `Revision: a5dd20796`. |
| Low | Right-sidebar Contents disclosure | Expanded Contents showed a right-pointing/collapsed-looking arrow. | Hosts without CSS transform support swap to the downward disclosure icon. | Pass: expanded Contents showed a downward-looking disclosure. |
| High | Import file picker | Clicking SQLite import produced no picker; logs had `dom-op open-file-picker unsupported`. | The native host implements `open-file-picker` and returns `files-picked`; LUI shell file dialogs now support SDL hosts ([lui#412](https://github.com/logseq/lui/pull/412)). | Pass: a real macOS picker appeared, a selected `/tmp` SQLite file advanced the import flow, and invalid input reached expected validation failure. |
| High | Export completion | Clicking export produced no save panel; logs had `dom-op download-text/binary unsupported`. | The native host implements save-panel downloads for text and base64 binary payloads; LUI shell file dialogs now support SDL hosts. | Pass: Export EDN showed a modal save panel and wrote an 88,819-byte `/tmp/logseq-export-test.edn`. |
| Medium | Sidebar chrome and typography | Native sidebars did not continue their background through the top strip, center-header controls could be blocked by the leading overlay, and sidebar text used an unresolved size. | Native chrome ownership and concrete sidebar typography now match the web shell more closely. | Pass: real SDL/Metal validation covered sidebar backgrounds, center-header clicks, menu icons, and graph-selector typography. |
| Medium | Menu/select/list interaction states | Menu hover could invert to unreadable white-on-white states, select rows had mismatched height/check placement, and flashcards could use inconsistent selection colors. | Shared menu/select row metrics and muted hover/selected/trigger state colors were aligned with master behavior. | Pass: browser probes verified 32px preferred-date-format rows and the corrected state treatment. |
| Medium | Selection toolbar Copy | Clicking Copy copied the blocks but left selection mode active. | Toolbar Copy now clears block selection immediately, matching master; keyboard Copy still preserves selection. | Pass: browser probe changed the selected-block count from 2 to 0 after clicking Copy. |
| High | Enter-created middle-block bullet | Pressing Enter between blocks could hide the new empty block bullet while editing. | Empty middle blocks now retain the bullet while edited, matching master. | Pass: browser runtime validation. |
| High | First-click math editing | Clicking rendered math on web treated rendered-output coordinates as raw-source positions, causing wrong placement or a stall; native raw TeX needed different handling. | Web-rendered math ignores rendered click coordinates for source hit-testing while native keeps raw-TeX click placement. | Pass: web first-click editing and real SDL/Metal second-line placement passed; native non-edit block math also preserves multiline raw TeX lines. |
| Medium | Tag-chip removal | The hover remove control used mismatched icon geometry and had flickering/small hit targets. | The chip now uses master's 13px x icon, root-only hover tracking, and a wider press target. | Pass: web and real SDL/Metal validation. |
| Medium | Asset-editing host stability | Repeated references to the same native asset reused uuid-only reload keys, so editing around them could crash with `Invalid_argument("duplicate reload key among siblings")`. | Native asset containers no longer assign uuid-only reload keys. Local image decoding/sizing was fixed separately in this branch. | Pass: real SDL/Metal validation rendered repeated same-asset references and edited around them without crashing. |
| High | Local image assets | Native asset blocks produced raw filesystem paths that the image loader refused, so uploaded PNGs and PDF area captures rendered blank/textually. Large images could also overflow the journal width. | Local asset paths now use canonical `file://` resource URLs and block images use the horizontal container-relative frame, so images decode and scale proportionally to the journal content width. | Pass: real SDL/Metal validation rendered PNG/PDF area captures inline without image-loader errors and kept large captures inside the journal width. |
| High | Native FPS and journal input latency | Software/Cocoa/GL presentation frames were not counted, Metal could remain at zero FPS, input latency samples were cleared before an input-driven frame painted, and asynchronous edit updates could wait for the next frame deadline. | The host now counts non-skipped surface presentations across backends, keeps input latency measurement until the dirty input frame is painted, and prioritizes pending-input frames instead of quantizing them to the frame deadline. | Pass: real SDL/Metal validation showed finite FPS and correct typing; measured input-to-presented-frame p95 improved from 17.6ms to 10.8ms without extra GPU submissions. |
| Medium | Built-in query disclosure | Built-in journal queries used static chevrons and instant mount/unmount rather than master foldable animation. | They now use shared foldable structure, 200ms grid/opacity animation on web, rotating caret, hover visibility, and delayed unmount; hosts without CSS animations collapse immediately. | Pass: browser recording showed progressive expansion/collapse, stable rapid toggles, caret rotation, and interactive results. |
| High | View toolbar popup dismissal | Filter/sort/view-type/more popups closed and immediately reopened when their trigger was pressed again. | These anchored toolbar popups now opt into trigger toggling instead of unconditional reopen. | Pass: browser validation for all four triggers, outside dismissal, and item selection. |
| High | Popup/dialog/menu exit icons | Icons disappeared early or became black blocks while surfaces exited. | The merged LUI exit-icon retention backport is consumed through the compatibility pin ([lui#415](https://github.com/logseq/lui/pull/415)). | Pass: real SDL/Metal graph-menu and search-dialog exit frames retained icons without black blocks. |
| High | Math/KaTeX rendering | Native math rendered as readable source text rather than typeset KaTeX. | Native now embeds KaTeX through the trusted QuickJS runtime, flattens KaTeX layout commands in OCaml, rasterizes text/rules/stretchy SVG art through the host image pipeline, and falls back to raw source only for invalid or out-of-bounds input. | Pass: real SDL/Metal validation showed inline `x^2` and centered display fraction/square-root math, click-to-edit raw TeX, Escape round-trip, invalid-input fallback, and web/native ink metrics within roughly 6%. |

## Remaining confirmed gaps or architectural differences

| Severity | Area | Current native behavior | Status |
| --- | --- | --- | --- |
| Medium | Accessibility tree | macOS accessibility inspection exposes only native window chrome and menu-bar items; application content is absent from the accessibility tree. | Confirmed architectural gap. No small parity patch was attempted. |
| Medium | Code editing | Code blocks expose the native plain-text editing path rather than web CodeMirror behavior; runtime smoke did not show CodeMirror chrome or syntax highlighting. | Confirmed architectural/capability difference, although the exact editing hit-test UX remains uncertain. |
| Medium | Query block layout | `/query` inserted a query UI and `+ Filter` opened the operator menu, but the inserted query layout was visibly broken: black rectangle-like fragments obscured text and controls were compressed. | Runtime-confirmed rendering failure; exact parity classification is uncertain because no paired web capture was taken. |
| Medium | Structured block clipboard | Native has no structured block clipboard reader; writing structured blocks degrades to plain text. | Source-confirmed capability gap. Plain multi-block copy/paste passed runtime smoke. |
| Medium | Plugin runtime beyond opening the dialog | Native reports no installed plugins, toolbar items, palette commands, marketplace actions/settings, or plugin README support. | Source-confirmed capability gap. Opening the Plugins dialog itself is fixed. |
| Medium | Multi-window support | Native windows are process-isolated rather than multiple SDL windows inside one host process. All Graphs now exposes `Open in new window`, which launches another native host process with the target graph deep link; both windows share the per-graph db-worker daemon. Shared native preferences use a cross-process lock plus read-modify-write merge so concurrent windows do not overwrite each other's keys. Deleting a graph broadcasts `local-graph-gone` through the shared daemon so other attached windows remove that graph and navigate away instead of remaining editable. | Runtime pass on macOS: two native windows opened the same graph, edits from both windows appeared in the shared journal, closing one window left the other alive, and external HTTP links still used the system browser. Caveat: there is not yet a dedicated File → New Window menu command. |
| Medium | Sidebar typography | Native sidebar row spacing and left alignment are close to web; the earlier unresolved-size mismatch was fixed in this branch. Residual font rasterization/weight differences may remain because native text rendering differs from browser text rendering. | Mostly fixed; residual rasterization differences are uncertain. |
| Medium | Asset/media richness | PDF assets intentionally open a self-drawn native viewer on the left on macOS with PDFKit rendering, page navigation, zoom, scrolling, text highlights and area highlights. PDF popout windows are an intentional process-isolated multi-window design: the toolbar popout action opens a dedicated PDF process while the parent keeps its embedded viewer; closing or docking that popout returns to the parent. Multiple simultaneous PDF windows are intentional and share the graph daemon/master-compatible annotation data. Normal-clicking another PDF intentionally replaces the embedded PDF, while mod+click intentionally opens that PDF directly in a new window. On macOS the annotation menu uses a real AppKit `NSMenu`; Linux keeps the in-host fallback. Linux/Windows use the same viewer contract through a dynamically loaded PDFium adapter; the Linux x86_64 release bundles pinned PDFium `chromium/8179` and Linux runtime validation passed for loading, rendering, and selection geometry, while Windows full SDL-host runtime validation and packaging remain blocked by the missing native Windows host target. PNG upload and local image rendering now pass for PNG/PDF area captures, including proportional journal-width scaling. MP4/WAV upload plumbing copied files but native media playback still does not render, and PNG export/copy reports unsupported. | PDF viewer/annotation creation, placement, popout windows, macOS annotation menus, Linux PDFium validation, and local image rendering improved in this branch; the Windows native host target/packaging, media playback, and image export/copy remain gaps. |
| Medium | Custom CSS | Native custom-CSS functions are no-ops. | Source-confirmed capability gap. |
| Low | Markdown-to-HTML conversion | Native `markdown_to_html` returns input unchanged. | Source-confirmed capability gap; visual impact uncertain. |
| Low | Confirmation dialogs | Native `confirm` always returns false. | Source-confirmed capability gap; affected flows untested. |
| Low | Selection ranges | Native host `set-selection-range` only handles select-all-like ranges and ignores other ranges. | Source-confirmed implementation limitation; user impact uncertain. |
| Low | Online status | Native `online()` is hard-coded true. | Source-confirmed; runtime untested. |
| Low | Share/public URLs | Native has no public origin/pathname, so generated share URLs degrade to graph fragments. | Source-confirmed; user impact depends on host/share design. |
| Medium | Math/KaTeX fidelity | Native math is bitmap/raster output rather than browser text layout. Common inline/display math now matches web closely, but horizontal spacing for complex constructs can diverge, bitmap math is not selectable/copyable as text, click-to-edit caret placement cannot yet map bitmap coordinates back to exact source offsets, and unsupported or out-of-bounds input falls back to raw TeX. | Improved in this branch; residual renderer fidelity limitation. |
| Low | CSS animation/transform behavior | Native disables CSS-transform icons and CSS animations. | Source-confirmed platform limitation; specific visual impact uncertain. |
| Low | Comments | Native comments use raw textarea-style editing/input rather than the full editor surface; comment scrolling is stubbed. | Source-confirmed implementation difference; UX impact untested. |
| Low | Content layout/wide mode | Native uses fixed content widths and hard-coded padding/margins; web uses CSS container classes, wide-mode state, and bottom padding. | Source-confirmed implementation difference; visual impact only partially verified. |

## Additional runtime smoke results after the fixes

Passed:

- Shift-Tab outdent.
- Multi-block selection and selection toolbar.
- Plain multi-block copy/paste preserving nested structure.
- Block drag/drop, with one caveat that an end-drop attempt did not reorder before a second drop succeeded.
- Block zoom through bullet click.
- Cmd+Enter TODO cycling.
- Property picker/editing, with confusing intermediate commit/display feedback.
- `#Task` table opening and Status cell editing from `Doing` to `Done`.
- Direct Unicode rendering/input for `😀` and `中文` (this is not real IME composition proof).
- Default macOS NSMenu smoke, including `View → Toggle Left Sidebar`.
- `LOGSEQ_NATIVE_MENUS=0` overlay-menu smoke, including block context menu → `Open in sidebar`.
- Import SQLite picker plumbing through file selection; an intentionally invalid SQLite file reached the expected `Import failed` validation.
- Export EDN save-panel plumbing and file writing.

Uncertain or caveated:

- Keyboard-focus restoration after a macOS open panel: immediately after the picker closed, one automated typing attempt did not enter text even though the input looked focused; after explicitly clicking the input, typing worked. This is uncertain because automation timing may contribute.
- Property value commit/display feedback is confusing; the value eventually appeared, but the exact commit timing/gesture needs product-level UX review.
- Code-block hit testing/editing may be a UX issue beyond the known plain-text-vs-CodeMirror architecture difference.
- Search palette footer text may differ because tips are randomized per mount; do not treat the original footer-text difference as a defect without a controlled comparison.
- Page menu item differences (`Copy page URL`, publishing visibility) may be intentional host capability differences.
- Quick-add focus/draft edge case after closing Help while quick add was open remains low-confidence and convoluted.
- The export dialog still shows web-centric File System Access API text in native even though native save panels now work.
- The web run exposed a separate modal-close regression: after closing quick add with Escape, an inert/invisible layer appeared to intercept sidebar clicks until reload. This is a web issue, not a native parity gap.


Follow-up runtime results:

- Failed: MP4/WAV upload plumbing copied files into isolated assets, but neither media type rendered; native image loading refused local `.mp4`/`.wav` asset paths.
- Failed: custom CSS text entry accepted `body { background: red !important; }`, but no visual change occurred.
- Passed with caveat: block context-menu ArrowDown/Enter opened `Open in sidebar`; Escape required two presses.
- Failed: math remained raw `x^2`; calculator showed only a shell without evaluation; `{{youtube abcdef12345}}` rendered only `?`.
- Passed: fixed caret placement, quick-add autocomplete/slash layering, compact context menu, open panels, and save-panel presentation remained working in the follow-up run.

## Surfaces that appeared parity-passing in runtime comparison

- Fresh journal home/startup layout, allowing for host chrome and intentional desktop deltas.
- Left sidebar open state, navigation sections, Favorites/Recent structure, graph selector menu.
- Search palette structure and Journal search results.
- Right-sidebar open state and Contents/Help tabs after the disclosure fix.
- Settings dialog structure, General and Editor panes, theme thumbnails, and dark-theme switching.
- Tag page/table rendering.
- All Pages and All Graphs tables/routes.
- Import surface/options.
- Empty Flashcards state.
- Help menu and Handbook content.
- Once a native editor was genuinely focused: ASCII typing, `é`, Enter/new block, Tab indent, Escape commit, undo, and redo.

## Surfaces not tested or only partially tested

- Real IME composition for Chinese/Japanese/Korean. Direct Unicode injection is not IME proof; the follow-up host environment only had ABC input enabled.
- Structured clipboard edge cases, cut/paste, paste types beyond the passing plain block copy/paste smoke.
- Advanced query editor and actual query execution/filter completion.
- Image lightbox (PNG rendering failed before lightbox could be reached).
- Custom user macros and built-in macro matrix beyond the tested YouTube embed macro.
- Plugin marketplace installation/actions.
- RTC/synced-graph status and login flow (explicitly skipped).
- Full macOS native menu command coverage beyond smoke-tested commands.
- Directory import completion. The host now recursively enumerates picked directories for root-relative files, but no valid directory-import fixture was run.
- Broader table sorting/filtering/grouping beyond status-cell editing.
- Block context-menu keyboard behavior beyond the verified ArrowDown highlight, Enter activation, and two-Escape close path; other keys/submenu traversal remain untested in the real host.

## Evidence inventory

Runtime evidence is under `/tmp` because these are test artifacts rather than repository files:

- `/tmp/logseq-native-web-parity` — original paired audit report, screenshots, recording, and logs.
- `/tmp/logseq-native-fix-verify` — empty-block/caret/Plugins/Export dialog verification.
- `/tmp/logseq-native-fix-verify-overlay` — quick-add autocomplete and slash-menu layering verification.
- `/tmp/logseq-native-fix-verify-small` — context menu, disclosure, window-title verification.
- `/tmp/logseq-native-untested-smoke` — broad editing/menu/table smoke report and screenshots.
- `/tmp/logseq-native-fileops-verify2` — file picker/download verification, recording, screenshots, and exported EDN artifact.
- `/tmp/logseq-native-remaining-smoke` — partial asset/query smoke report, follow-up media/CSS/macro/sidebar report, annotated recording, screenshots, crash logs, and evidence archives.
- `/tmp/logseq-native-multiwindow` — process-isolated multi-window verification reports, recordings, screenshots, process evidence, and host logs.
