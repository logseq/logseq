# LUI UX parity status

Compared against upstream master **`2a0dce92`**. Branches are in flight:
verified child-branch repairs may not yet be integrated, and local editor/shell
repairs are not necessarily present in the served build. Source/test completion
is not browser acceptance. This is a residual register, not a list of every
historical finding. Update or remove rows after paired verification.

## 1. Intentional / out of scope

| Surface | Difference / scope |
|---|---|
| Graph View | Graph View and page graph view are unsupported; includes the sidebar Page graph action. |
| Journals / Pages lists | Flattened presentation is intentional. |
| Title bar | Native/browser title-bar differences are out of scope. |
| Rich-editor editing state | Reference/title/color presentation differs by design; read-mode defects are not exempt. |
| Command palette stacking | Opening cmdk closes the existing `…` menu in LUI. |
| Native node picker | Checkbox keyboard focus and Space activation differ from Master. |

## 2. SDK / platform-limited (unsupported)

These are limitations of the current typed SDK/host surface, not permission to
add raw DOM, CSS-layout, or untyped widget escape hatches.

| Surface | Unsupported parity detail |
|---|---|
| Alert backdrop | Master's 8px backdrop blur. |
| Toasts | Exact 6px radius and exit animation. |
| Table resizing | `col-resize` cursor: SDK supports default/pointer/text. The handle remains 6px versus 4px, including nested-table scrolling constraints. |
| Overdue | Browser-native title tooltip. |
| Picker checkbox label | Exact label typography: weight/line-height 400/20 versus 500/14. |
| Journals loading | Repeating loading pulse; transition support does not provide keyframe/repeating animation. |
| PAT expiration | Native date input chrome, segmented entry and min/max affordances. The typed calendar is not exact native-input parity. |
| Unpacked plugins | LUI web cannot load unpacked plugins, so the unpacked hint/badge and reload control are not provided. |
| Native plugin logs | Native host has no plugin logger; web installed-card logging still needs live verification. |

## 3. Not yet aligned (known, pending)

### Open implementation or investigation

| Area / finding | Remaining work |
|---|---|
| Editor E1 / E12 | Embedded page/block root identity, title/structure and selection count; preserve source-block ownership while including embedded roots. |
| Editor E7 | Page autocomplete candidate set and icons, including date and built-in results. |
| Editor E10 | Rich/structured clipboard formats and cut/delete focus restoration, including the previous page-title editing position. Plain-text copy alone is insufficient. |
| Editor E13 | Verify/repair Meta+; collapse/expand of the current block's children. |
| Editor E14 | Page/block hover preview header/body, reference count, spacing and dimensions. |
| Editor E16 | Drag selection, selection toolbar and drop/selection indicator parity. |
| Editor E22 | Indent, type and undo twice: caret 0 in Master versus end-of-block in the reported LUI case. |
| Editor E23 | Generic context-menu dismissal selection lifecycle beyond the four repaired actions; preserve asynchronous clipboard/delete ownership. |
| Editor E31 | Cross-page undo/redo navigation: route-state recording/restoration is in progress locally; not yet accepted. |
| Editor E38 | Video timestamp shortcut insertion, including actual current playback time. |
| Editor E40 | Cross-page five-step undo: stored `A` versus `AB` after the reported sequence. Do not assume route restoration alone fixes transaction progress. |
| Calculator extra root | Extra empty root after calculator flows is unexplained; Enter versus Escape has not been isolated. No speculative fix. |
| Shell N7 | Right-sidebar item-menu horizontal origin; reported LUI menu is approximately 51.4px too far left. |
| Reference filters | Input remains approximately 9px too low; equal-count chip ordering differs. |
| Reference filter updates | LUI immediately moves chips after selection; Master leaves stale chips. Difference retained by the child, not established as an approved intentional exception. |
| View Type menu | “View Type” versus “Set View Type” wording needs an i18n decision; popup dimensions/origin remain different. |
| Sort popup | Initial focus is on a button instead of the first sort row; small origin difference remains. |
| Reference lists | Hover isolation; unlinked highlighting/spacing and Pages section remain unaudited/unfixed. |
| Reference geometry | Linked header/group gaps, breadcrumb spacing and multi-reference rows have residual vertical drift. Child-block bullets are ringed instead of plain dots. |
| Queries | Result columns, header chips and Untitled query need coverage using a current `/Query` fixture, not deprecated `{{query}}`. |
| Configure property | Menu remains 260×270 versus about 270×335; missing Checkbox state mapping, item summaries and matching icons/switches. Opening the correct menu was repaired. |
| Title-path Tags picker | Left checkboxes work; results viewport/max-height still differs. Measurements depend on graph contents, so do not hard-code the original fixture's height. |
| Marketplace cards | Residual title truncation, icon artwork and description wrapping. |
| Marketplace controls | Contribution-link color and some spacing. |
| Login | Residual modal sizing and tone. |
| Recycle list | Deleted page title appears twice in LUI versus once in Master; new child observation, not repaired. |

### Source-repaired or reviewed, still awaiting integrated acceptance

| Area / finding | Verification still needed |
|---|---|
| Editor E3 / E4 | CodeMirror height and fold-control visibility/geometry; current source includes padding and caret adjustments. |
| Editor E12 / E23 / E30 / E32 | Select-all save/exit, four reported menu-action cleanups, real autocomplete Tab focus traversal, and image clipping after the crash repair. |
| Editor E20 / E36 | Footnote reading/anchor navigation and calculator precision/large integers are locally repaired with tests, not browser-accepted. Broader calculator grammar is not fully audited. |
| Meta+Enter | Repeated authoritative task-status cycling passes shared tests; actual browser interaction remains unverified. |
| Shell N1 / N20 | Decorative `#` Tab stop, empty-cmdk footer focus and Escape-to-body. The Escape path was reviewed, not newly browser-verified. |
| Shell N3 / N6 / N17 | Navigation-menu origin and tooltip geometry/typography. |
| Shell N9 / N12 | Cmdk Create-footer foreground and title-action offset/gap/foreground. |
| Shell N14 / N19 / N24 | Help-link typography/geometry, page-menu arrow focus and sidebar Contents-tab background. |
| Shell N31 | Cmdk Shift-click opens the sidebar without changing the main route; capture-event handling is repaired and tested, browser acceptance pending. |
| Reference disclosure | Re-collapse repair is source-tested; the references child's latest round did not exercise it. |

The child reports mark R1.2/R1.3 breadcrumbs/carets, reference search/reset,
Table69 items 1/2/5–8 and the repaired Settings interactions as browser-verified
on their respective branches. They are not re-listed as open defects here;
integration and combined-build regression checks remain necessary.

## 4. Not live-tested

| Surface | Coverage boundary |
|---|---|
| Account flows | PAT, Encryption, Collaboration, account/plan controls and authenticated operations were source-compared, not live-tested. |
| Cloud graphs | Upload, authenticated listing, download and remote deletion were not live-tested. |
| Authentication submission | Signup/confirmation, forgot-password/reset submission, errors, resend and countdown states were not live-tested. Entry screens alone do not cover these operations. |
| Installed plugins | Live plugin settings/switching/saving, installation, installed-card reporting/log viewing/log actions, refresh and automatic updates were not live-tested. |
| Reference filters | Exclude/red and combined/warning states were not live-tested in the child's latest round. |
| Native scrollbar | Thumb dragging was not live-tested. |
| IME | Real composition interaction was not live-tested; shared controller tests are not native/browser acceptance. |

## Tracking sources

- Lead queue and editor continuation: Table69–71, editor E1–E40 and shell N1–N31.
- Settings child: `report.md`, branch
  `devin/1795078620-parity-settings-plugins-graphs` (`a25149f5`).
- References child: `parity-refs-report.md`, branch
  `devin/1795078598-parity-refs`.
- Properties/icons child: `parity-props-icons-report.md`, branch
  `devin/1795078707-parity-props-icons` (`9957e658`).
