# LUI UX parity status

The paired-audit baseline is upstream master **`2a0dce92`**; the latest fetch is
**`d85d8f6a`**. Settings, references and properties/icon child branches are now
integrated. Their follow-up repairs and local editor/shell repairs still need
combined-build browser acceptance. New upstream asset/clipboard changes have
not been fully audited. Source/test completion is not browser acceptance. This
is a residual register, not a list of every historical finding. Update or remove
rows after paired verification.

The final Table74 report on `911d2442` passes built-in writes, E13 collapse,
Meta+Enter task cycling, footnotes, N9 foreground and first-block focus.
Those paired results supersede the earlier browser-pending notes below for
those exact scenarios; they do not close other findings in the same area.

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
| Query table header | The header-overlay width remains different with the current typed table/overlay surface. |
| Overdue | Browser-native title tooltip. |
| Picker checkbox label | Exact label typography: weight/line-height 400/20 versus 500/14. |
| Journals loading | Repeating loading pulse; transition support does not provide keyframe/repeating animation. |
| PAT expiration | Native date input chrome, segmented entry and min/max affordances. The typed calendar is not exact native-input parity. |
| Unpacked plugins | LUI web cannot load unpacked plugins, so the unpacked hint/badge and reload control are not provided. |
| Native plugin logs | Native host has no plugin logger; web installed-card logging still needs live verification. |
| Plugin thumbnails | Master replaces failed remote images with its folder SVG. The typed image kind exposes load notifications but no error event, so that failure fallback is not supported yet. |

## 3. Not yet aligned (known, pending)

### Open implementation or investigation

| Area / finding | Remaining work |
|---|---|
| Table72 persisted seed duplicates | The canonical UUID repair prevents new duplicates but does not remove incorrectly persisted entities. Master `d85d8f6a` has no repair migration for these values: `frontend/worker/db/migrate.cljs` ends at schema 65.36 (journal repair), and `ensure-built-in-data-exists!` merges canonical entities without retracting legacy duplicates. Follow Master: do not add a cleanup migration. No live graph cleanup has been performed. |
| Editor E1 / E12 | Embedded page/block root identity, title/structure and selection count; preserve source-block ownership while including embedded roots. |
| Editor E10 | First-block cut/delete now returns to the editable page title after a successful delete; redo retains that destination. Shared regression covers normal, empty-selection and rejected-delete transitions. Browser focus acceptance remains pending. Rich/structured clipboard formats and property metadata remain unaligned; plain-text copy alone is insufficient. |
| Editor E38 | Table74 reports no insertion at playback time zero, where Master inserts `{{youtube-timestamp 0}}`. The source adapter accepts finite nonnegative seconds and the command accepts `Playback_time 0`; zero-as-absent is not established as the cause. Trace player readiness, preceding-frame selection and actual command dispatch. Existing protocol coverage includes readiness, multiple embeds, advancing/invalid time and no video. Native playback-time reporting remains unsupported. |
| Editor E40 | Native worker reproduction now matches Master's stored values: save Fixture A/B and Target C/D with 1500ms pauses, recording the two route transitions, then undo five times → Fixture A and original Target. The temporary real-outliner probe was removed; existing UI-state/save regressions remain. Router records navigation after pending saves; sidebar-only changes have separate history entries. Actual browser emission/count of those entries remains unverified, so the original integrated finding is not closed by this worker result. |
| Table73 editor shortcuts | Source repaired: document capture dispatches Meta+Enter through Cmdk services, whose web/native task callback previously called an unimplemented context-menu command rather than the shared task cycler. Meta+; pulled only an optional collapse attribute: DataScript returns nil when that attribute is absent, so the toggle treated an existing block as missing. The selector now includes db/id. Regressions cover the real host task callback and a missing stored collapse flag, alongside the existing shared-key workflows. Browser acceptance remains pending. |
| Table73 / Table74 reference previews | Table74 still failed after the async identity guard repair. A Node probe using the real web renderer follows document mousemove → 1000ms timer → fetch → preview mount: empty previews open, but a positive reference count rejects the complete patch batch because its child-text button has neither a typed text prop nor an accessible label. The count now carries its translated action label; the existing disclosure regression checks that contract. Page/block heading, content/count, empty-trigger and failed-load coverage remains. Browser acceptance remains pending. |
| Table74 named-dialog opening | Testing rebuilt `118080d112`: Login and Settings now open after the preview-count label repair. Plugins/Marketplace still rejected its patch batch: the contribution link carried unsupported `display`, followed by an unknown-node detach during recovery. Responsive display and positioning now belong to a supported row wrapper; the link retains navigation, sizing and color. A shared regression validates every emitted contribution property against its actual node kind. Rebuilt-browser acceptance remains pending. |
| Table73 footnotes | Source repaired: the return marker uses an explicit JavaScript Unicode escape instead of an OCaml byte-string literal. Definitions now keep parsed inline content and the 14px return link in one block-flow line rather than a flex row with a full-width title carrier. Unicode/navigation regressions pass; the 48px combined block height remains visually unverified. |
| Table73 N9 | Source repaired: the action hint button, not the separate Tip label, inherited the classic primary-text color (#433f38). It now uses Master's gray-12 token chain, resolving to RGB(23,23,23) in light Logseq. Browser color acceptance remains pending. |
| Table73 / Table74 N19 | The earlier source repair protects rapid initial navigation from deferred appearance focus. Table74 still fails the no-gap arrow stress sequence: LUI ends on Settings, Master on Add to Favorites. Existing recording-host appearance/navigation coverage does not establish the real host's back-to-back event ordering. |
| Calculator extra root | Global plain-Enter dispatch and newline/empty-input save-and-Escape tests do not append roots, including failed saves. The explicit Shift+Enter action appends one empty sibling. The original full CodeMirror flow remains unverified; this does not establish which event ran there. No speculative fix. |
| Table74 calculator long output | Long results wrap to 48px in LUI versus Master's approximately 23px single line. Compare retained output text and the live CodeMirror output path before changing wrapping. |
| Shell N7 | Sidebar-menu action comparison needs equivalent target classification: Master conditionally includes Open as page for page/contents or a resolved page entity. The retained pair shows different sidebar contents and LUI explicitly has a page item; unconditional removal would diverge from Master. The horizontal-origin source repair is recorded below. |
| Reference filters | Equal-count tag chips use alphabetical order instead of Master's worker order. |
| Reference filter updates | LUI immediately moves chips after selection; Master leaves stale chips. Difference retained by the child, not established as an approved intentional exception. |
| Marketplace cards | Residual title truncation, icon artwork and description wrapping. |
| Marketplace controls | Source repaired: statistics span the card's full footer instead of starting after the thumbnail. Search margins/focus opacity, 30px toolbar actions, applied filter/sort dots and the responsive muted contribution link now follow Master's source. Filter/search workflows pass on both recording hosts. Master's empty-filter search is muted (0.7 opacity), not disabled: its input has no disabled binding and remains editable. Exact spacing and combined-build appearance remain visually unverified. |
| Login | Table74 measured LUI 488×390 versus Master 490×405.97; link RGB(16,107,163) versus RGB(27,104,152). Source now includes the dialog's two border pixels in its responsive width, uses Master's accent-first link token, and models the footer paragraph's 8px vertical margins, 16px top padding and 24px line boxes without a form gap before it. Authentication logic is unchanged. Exact geometry/tone and shared dialog opening still need browser acceptance. |
| Signup validation | Native email-validity and required-field validation behavior is not aligned. Entry-screen appearance does not establish submission parity. |

### Source-repaired or reviewed, still awaiting integrated acceptance

| Area / finding | Verification still needed |
|---|---|
| Table72 seeded values | Preserve keyword syntax in deterministic property-value UUID seeds, matching Master. A real Master-created 65.36 graph grows from 190 to 200 entities before the repair; native ensure/reload now preserves every original identity and creates none. Served-build acceptance remains pending. |
| Table73 built-in writes | The first Escape/save after Tomorrow reuses a fetched ref summary whose tags contain SDK-expanded entity maps, including virtual raw-title. The worker previously transacted those maps as nested entity updates. Existing ref tags now collapse to their entity IDs, matching Master's entity-to-ID conversion rather than upserting metadata. A native Master-fixture workflow creates the journal, fetches it through the real block getter, saves that reference and checks the source link plus every built-in's physical attrs; clearing and rejected saves are covered too. Browser acceptance and attribution of the broader Table72 restoration delta remain pending. |
| Table72 Features input | Restore Master's 4px small-input top margin without changing the 200×30 control. Source/native acceptance only; browser geometry remains unverified. |
| Table72 tags selector | Isolated equal-stage checks at 1600×998 show both property-name pickers at 226×288 for `Tags`; after choosing that property, both tag-value pickers return Card/Cards for `Card` and measure 226×114 (Master 113.953px). The original comparison mixed the property-name and tag-value stages. No production cap change is needed; retain the viewport-based cap rather than a universal 288px maximum. These checks use the prior build with unchanged selector/dialog source, not combined-build acceptance of other repairs. |
| Editor E3 / E4 | CodeMirror height and fold-control visibility/geometry; current source includes padding and caret adjustments. |
| Editor E12 / E23 / E30 / E32 | Select-all save/exit, four reported menu-action cleanups, real autocomplete Tab focus traversal, and image clipping after the crash repair. |
| Editor E13 / E16 | Persisted collapse through the real Meta+; edit-key path is source-tested. Drag ownership now preserves move roots without a source selection/toolbar; indicator width and bottom origin follow Master. Browser acceptance is pending. |
| Editor E7 | Page-ref search now uses canonical worker candidates, all 33 localized NLP dates, Master fuzzy ranking/page-first ordering, entity icons and resolved titles. Whitespace and failed/empty searches are source-tested; browser acceptance is pending. |
| Editor E14 | Containing-page preview headings retain the original block insertion root. Nested reference counts support inline disclosure and Shift-click sidebar references; restored reference panes do not register invisible editing roots. UI/native gates pass. Typed preview dimensions/spacing and combined-build acceptance remain visually unverified. |
| Editor E22 | Table73 confirms caret parity: Master also uses 18px, so no caret-size change is needed. Indent, type `abc`, then undo twice passes the shared cursor round-trip workflow at offset 0. The test records real transaction cursor options and restores mocked worker history; full DB/browser undo acceptance remains pending. |
| Editor E23 | User dismissal clears a live context menu's selection/action bar. Late dismissal after command close preserves asynchronous ownership and newer selections. UI/native gates pass; integrated runtime acceptance remains pending. |
| Table72 Keymap recorder | The binding editor now auto-evaluates after 400ms, accepts nonconflicting bindings, retains explicit conflict reassignment, and distinguishes pending Escape cancellation from idle Close. Backspace removes the last binding. Footer hints and conditional Reset follow Master; successful Reset closes after feedback. Shared workflows cover persistence, cancellation, removal and storage failure. Browser acceptance remains pending. |
| Table72 Marketplace | Cards now use Master's 60px thumbnail geometry, separate icon/content columns, reserved title space, independently positioned flags/metadata/actions, and primary foreground. The grid wraps at Master's viewport breakpoints and the list uses typed viewport height/overflow. Empty marketplace filters no longer show the Installed-only placeholder. Artwork glyph fidelity, wrapping, positioning and combined-build appearance remain visually unverified; failed-image fallback is listed as SDK-limited above. |
| Table72 Set View Type | The display-type selector now uses the unpadded popover/dialog surface rather than 4px-padded menu chrome. This removes 8px from width/height while retaining the inner input/results padding. Other selectors retain their existing menu/overflow behavior. Combined-build geometry and keyboard acceptance remain unverified. |
| Table72 Property Configure | The heading now has Master's 8px vertical/horizontal padding and 0.8 opacity, adding the missing 8px before the first row without changing row metrics. Combined-build height remains visually unverified. |
| Shell N9 | Cmdk footer actions now use Master's primary-text semantic color instead of the SDK foreground token; existing label/button opacity is unchanged. Open, Create and sidebar actions share the correction. Browser color acceptance remains unverified. |
| Table72 N19 | The toolbar menu explicitly focuses the last main action on appearance, excluding the late session tail from initial focus only. ArrowDown then reaches Login and wraps to the first page action; pointer/context menus retain container focus. Mounted appearance/keyboard regression covers the sequence and empty DOM. Browser acceptance remains unverified. |
| Shell N20 | Escape body focus now runs after the deferred render and the host's deferred trigger restoration, with the closed-state guard retained. A mounted palette workflow covers normal/empty results and reopening during close using the production timer schedule and a modeled host focus-restoration boundary. Browser acceptance remains unverified. |
| Shell N3 | The navigation editor popup accounts for the positive-pixel bias of Master's one-pixel virtual reference instead of centering solely on the full trigger. The correction is scoped to this popup; its shorter action list still intentionally excludes Graph View. Browser geometry remains unverified. |
| Shell N7 | The item-trigger popup now uses a centered icon anchor with the half-pixel bias of Master's one-pixel virtual reference. Start alignment previously flipped to end near the viewport edge and negated the 9px offset, explaining the retained x=1416 rather than Master's clamped x=1467. The existing 5px surface collision padding and context-menu branch remain unchanged. Browser acceptance and equivalent-target action comparison remain pending. |
| Shell N6 / N17 | Header tooltip metadata preserves the first raw binding as well as its readable keys. Tooltips now distinguish bordered modifier combinations, separate keys and chords; titles explicitly use Master's 12px/16px and title-only opacity. Non-glowing combinations size naturally around their 20px keys and border rather than forcing the container to 20px. Placement already uses the 5px viewport inset. Browser geometry remains unverified. |
| Editor E20 / E36 | Footnote reading/anchor navigation and calculator precision/large integers are locally repaired with tests, not browser-accepted. Broader calculator grammar is not fully audited. |
| Meta+Enter | Repeated authoritative task-status cycling passes shared tests; actual browser interaction remains unverified. |
| Editor E31 | Route-only cross-page undo/redo is source-repaired and shared/native-tested, with save-before-navigation ordering and suppression of restored navigation entries. Integrated browser acceptance is pending. |
| History UI state | Sidebar open/collapse/membership and order now accompany route snapshots in UI history. Restores hydrate current content through the existing sidebar loaders, guard stale hydration and suppress recursive recording. A shared undo/redo workflow covers membership/order, collapse, empty/closed state and loader rejection. Source/UI/native gates pass; browser acceptance and E40 remain separate. |
| Shell N1 / N20 | Table72's first four Tab targets match (Add icon, Set property, Journal, Add block), without the earlier decorative `#` stop; empty-cmdk Tab focuses Open on both. Later journal/add-block traversal still needs an equivalent-target comparison. Escape-to-body is source-repaired above; fresh-built acceptance remains pending. |
| Shell N12 | Table72 recorded title-action buttons already match at y=60, 24px height, 8px inter-button gap, and RGB(133). The earlier 2px/gap/foreground finding is not reproduced by that retained pair; no speculative offset or recolor is applied. Root bounds and hover/opacity timing still need controlled acceptance. |
| Shell N14 / N19 / N24 | Help-link typography/geometry, page-menu arrow focus and sidebar Contents-tab background. |
| Shell N31 | The retained Table72 sidebar trace keeps the exact main-route fragment before/after Shift-click on both clients and shows the sidebar target afterward. The earlier main-navigation failure is not reproduced there. Current source retains capture-event handling and close-before-sidebar dispatch; no speculative additional fix. Fresh-built acceptance remains pending. |
| Reference disclosure | Re-collapse repair is source-tested; the references child's latest round did not exercise it. |
| Reference follow-ups | Filter search-row layout, View Type wording/geometry, sort-row focus, group/breadcrumb spacing/icons, empty/leaf bullets and unlinked highlighting were subsequently repaired in the references branch. Combined-build acceptance is pending. |
| Query follow-ups | Inline query builder, result indentation, Untitled query, clause chips and header height/width were repaired in the references branch. The header-overlay limitation remains listed above. |
| Property follow-ups | Configure-property summaries, icons/switches and Checkbox state mapping, Tags-picker height policy and duplicate recycle titles were subsequently repaired in the properties branch. Combined-build acceptance is pending. |
| Signed-in Settings | Account, PAT, Encryption and Collaboration layouts were source-aligned in the settings follow-up; authenticated browser acceptance is pending. |

The child reports mark R1.2/R1.3 breadcrumbs/carets, reference search/reset,
Table69 items 1/2/5–8 and the repaired Settings interactions as browser-verified
on their respective branches. They are not re-listed as open defects here;
combined-build browser regression checks remain necessary after integration.

## 4. Not live-tested

| Surface | Coverage boundary |
|---|---|
| Account flows | PAT, Encryption, Collaboration, account/plan controls and authenticated operations were source-compared, not live-tested. Account is behind a feature flag; flag-on and signed-in states remain untested. |
| Cloud graphs | Upload, authenticated listing, download and remote deletion were not live-tested. |
| Authentication submission | Signup/confirmation, forgot-password/reset submission, errors, resend and countdown states were not live-tested. Entry screens alone do not cover these operations. |
| Installed plugins | Live plugin settings/switching/saving, installation, installed-card reporting/log viewing/log actions, refresh and automatic updates were not live-tested. |
| Reference filters | Exclude/red and combined/warning states were not live-tested in the child's latest round. |
| Reference coverage | Hover isolation, the Pages section and all follow-up query/reference geometries still need paired acceptance. |
| Native scrollbar | Thumb dragging was not live-tested. |
| IME | Real composition interaction was not live-tested; shared controller tests are not native/browser acceptance. |

## Tracking sources

- Lead queue and editor continuation: Table69–71, editor E1–E40 and shell N1–N31.
- Settings child: `report.md`, branch
  `devin/1795078620-parity-settings-plugins-graphs` (`708e4748`).
- References child: `parity-refs-report.md`, branch
  `devin/1795078598-parity-refs` (`436d6ca8`).
- Properties/icons child: `parity-props-icons-report.md`, branch
  `devin/1795078707-parity-props-icons` (`8dd860e4`).
