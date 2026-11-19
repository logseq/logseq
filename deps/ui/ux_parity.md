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

Table77 on `7760653a` accepts E1 structure/range and the stored Tab/Shift+Tab
round-trip, structured-paste focus with no reaction warnings, Marketplace
control dimensions, E40, nested geometry, N19 and dialogs. These results
supersede the earlier browser-pending notes for those scenarios below.
The separate Tab stack overflow is source-repaired in `d8dfa4ed`. The final Marketplace offsets (grid 3px high,
contribution link 2.5px high) are now source-repaired without changing the
fixed list viewport or accepted control dimensions; rebuilt-browser position
verification is accepted in Table78 below, together with the overflow repair.

Table78 on `7b05cc7a` accepts the E1 console repair and the final Marketplace
offsets. Its new ordinary-block reference-count and selected-text Query
differences are source-repaired: canonical ordinary rows
request the existing reference-count resource and refresh on reference changes;
Query conversion uses the slash popup's captured editor base instead of the
replacement slash buffer. Mounted/editor regressions cover positive/empty
counts, rejected refresh, existing/blank query text, advanced conversion and
rejected conversion. Table79 accepts the badge and stored query text; execution
is addressed separately below. A clean detached
`7b05cc7a58` worktree passes the UI aggregate (6373 assertions). New asynchronous
reads exposed the views fixture's invalid default map response to config-file
requests; it now returns EDN text. The repaired UI aggregate passes with 6392
assertions and exit zero. Native tests and the native build also pass.
The Marketplace card header glyph group is source-shifted 4px right to match
the supplied Table78 coordinates, preserving its vertical position and spacing.
The selection-only embed Tab/Shift-Tab path also armed editor focus without an
editing session; it now runs the structural operation without waiting for a
nonexistent editor sink. Mounted coverage includes indent, outdent, empty
selection and rejection. The reported delayed focus-budget console line still
needs rebuilt-browser verification; its original payload has no target/session
state to establish whether this reachable defect caused that particular event.

Table79 on `f7c8599a` accepts ordinary reference badges, Marketplace header
glyphs, E1 console cleanliness through 10.5-second observation windows, and
local graph deletion for opened and unopened graphs (removal toast and durable
absence after reload). Graph deletion is accepted; no further deletion repair
was needed. Selected-text Query now stores the correct text, but its plain-text
interpretation was still missing. Query execution and the builder now share
Master's sanitization: non-DSL text becomes a quoted full-text search rather
than a bare EDN symbol. Mounted coverage checks the search clause, Filter
control, empty results, blank queries, outgoing resource and genuine errors.
The block property value's vertical inset is reduced to match the 28px property
pair. The linked-reference offset is independent: its evidence page has no
property row. Its single 28px block plus 28px add row lost Master's 60px body
minimum in the flat stream. Measured body-only spacing restores that minimum
without shifting taller or property-bearing pages. These query and geometry
repairs are accepted in Table80 below. The UI aggregate passes with 6417
assertions and exit zero; native tests and the native build pass. Native
measurement behavior is unchanged; the short-page correction uses the web
projection observer, not new native measurement plumbing.

Table80 on `1b3a4124` accepts plain-text Query Search and Filter after reload,
the 28px property row, and linked-reference positions on short (310px) and tall
(502px) pages. Empty query results still omitted Name / Created At / Updated At.
Master builds query columns even for zero results. LUI's default column builder
already supplied those columns, but query completion invoked it only through
the nonempty row-data path, and the result renderer explicitly replaced an
empty query table with a spacer. That suppression is removed. Query completion
now builds columns directly when there are no result rows, for both fetched
source and live source evaluation.
Mounted regressions reproduce the missing headers on first mount, a fresh
same-query remount, and blank-to-search evaluation; blank and rejected queries
still do not display result headers. The UI aggregate passes with 6427 assertions
and exit zero; native tests and the native build pass. This header repair is
accepted in Table81 below.

The Table80 imported-SQLite broad sweep found three further query differences.
Full-text `Imported` returned only the parent because LUI promoted search hits
to entities and removed nested matches using their canonical database parents.
Master returns search maps with scalar parent IDs; its top-level filter reads
the nested parent entity's ID, so both search hits remain. The worker now keeps
that search-map shape and filters projected results using their supplied parent
shape, while entity results retain canonical parent handling. The real-worker
regression retains the parent and child alongside hidden/current-block filtering.

Switching to List also exposed `control_wrap` looking up blank read-only rows
in an unregistered editable `ref` scope. Static rows now derive the empty-bullet
condition from their supplied sibling list, including nested children, without
consulting an editable outliner source. The supplied console trace first raises
this `Not_found`, then rejects a batch detaching an unknown node. Removing the
render exception addresses that trigger; no SDK validation or error reporting
is weakened. Mounted regressions exercise Table-to-List switching, blank child
rendering, disposal and a fresh persisted-List mount with both results, followed
by empty and rejected queries. Actual browser-store recovery from a previously
rejected batch has not been tested.

The `audit` query's `logseq.property/type` metadata was suppressed by LUI's
blanket exclusion of `logseq.*` query columns. Property type now uses its existing
property metadata or built-in translated column; Name, Tags and timestamp columns
are preserved. Column and mounted-query regressions cover this path.
The UI aggregate passes with 6437 assertions and exit zero; native tests and the
native build pass. All 84 worker render-resource tests pass. The worker aggregate
still reports the same three platform/keychain failures as the earlier Table75b
baseline (993 native cases), including `Native secrets require the OS keychain
host`; it is not an all-green worker gate. These three repairs are accepted
in Table81 below. No `static/` files or shared `:3010` server were touched.

The additional Table80 navigation sweep found that the Pages anchor inherited
the SDK's default `_blank` target. The source now explicitly supplies `_self`
with the existing All pages URL and graph ID. A mounted regression checks the
model destination and target. Table81 showed that this source-level repair was
insufficient: the rendered anchor still opened another tab. The renderer repair
and its stronger regression are described below.

The sandbox-deletion evidence exposes a completion-boundary mismatch rather
than proving an OPFS failure cause. `restore.cjs` selects Table33 NEW CP9 before
deleting T80 CP9 Sandbox, waits for the graph row to detach, then reloads after
1500ms. LUI detached that row before awaiting `unsafe-unlink-db`; Master removes
registration only after deletion resolves. LUI now retains the row and metadata
until successful worker completion, then removes them and shows the existing
toast. Pending, successful, final-graph, error-result and rejected-RPC cases are
covered. No worker pool ordering was changed. Table81 accepts graph deletion:
extra tabs opened by Pages held the sandbox graph open, keeping unlink pending
for over 20 seconds without false success. After those tabs closed, unlink
succeeded in 393ms. This resolves the earlier sandbox-deletion uncertainty.

Image link cancellation now retains `/link`, as Master's `image-link-steps`
specifies, rather than `/image-link`. Template search retains `/` and tracks its
one-character trigger instead of silently erasing the buffer while leaving the
typed `/Template` save pending. Both use the existing guarded model insertion
and save path. Shared editing regressions exercise cancellation and persisted
titles for blank blocks and commands following existing text. The Image link
fixture opens the real form directly because the drive does not install the
application's editor-command document listener. Other command execution and
existing failed-save coverage are preserved.

The follow-up UI aggregate passes with 6447 assertions and exit zero; native
tests and the native build pass. Slash cancellation remains rebuilt-browser
unverified. No browser, application web build, `static/` write or shared `:3010`
access was used.

Table81 on `93f55221` accepts full-text parent and child matches across Table,
List and Gallery, including reload; Property type columns; empty-result default
headers; and the absence of query console errors. Graph deletion is also accepted
as described above. This does not establish recovery from an already-rejected
browser patch batch.

### Table81 query grouping, date range and graph creation follow-up

The paired query entities explain the three-journal grouping difference:
Master's query already stores `group-by-property = block/page`; LUI's same UUID
does not. Table80's positive-views evidence records a successful List selection
for this same query UUID in both clients. Master persists this property when a
query is switched to List without an explicit grouping (`property/value.cljs`
`<add-property!`). LUI previously
only inferred page grouping while displaying List and lost it on return to
Table. Query List selection now writes the display type and missing page group
in one transaction, retaining the group in Table/Gallery and after reload;
explicit custom groups are not replaced. This does not make every new table
query grouped: Master does not do that. Already-created queries whose earlier
List selection lost this property must be switched to List once to persist it;
there is no speculative migration of ungrouped tables.

Between now opens one retained Start date / End date / Submit form. Each date
field opens a child calendar without disposing the form; picking a date returns
to the same form, not an immediately forced second calendar. Incomplete ranges
do not save, and a retired query cannot receive a stale date. Shared-host
regressions exercise the range and nested calendar lifecycle, including the
reported calendar-unmount timing boundary. Result updates also used to retire
the builder's reactive scope and its action guard even though the query title
remained mounted. The guard now belongs to the containing query title and source
instead; a mounted regression refreshes result data while its calendar is open and then
selects a date successfully. Attribution of the original browser timing to this
specific refresh remains unverified, as does rebuilt-browser interaction.

Signed-out graph creation now shows the existing translated Sync control when
`rtc-group?` permits it (development build or custom Sync server), matching
Master without an extra login gate. Non-eligible environments still omit it;
authenticated remote graph creation is not newly verified.

The reserved-character warning keeps Master's full description width instead
of reserving another 24px for its overlaid close control. Its title uses the
paragraph's 1.5 line height and 8px top margin; paragraph/list collapsed margins
and circle-list indentation are represented with typed layout props. The
provided screenshots have the same toast top, y=48; their content, wrapping and
bottom differ, rather than the viewport anchor. The repair remains
rebuilt-browser/visually unverified; no application web build, `static/` write or
shared `:3010` access was used.

Follow-up gates: `pnpm test:ui` reports 6473 checks with zero failures; native
experimental tests and the native experimental build pass. Known journal
diagnostics remain at their baseline 102 invalid-response lines and 52 load
failures; the native non-fatal properties diagnostic is unchanged.

The Pages path is `nav_items` to `nav_route` to `nav_link` to the typed LUI Link;
there is no alternate Pages component. The link's TargetValue maps `_self`
correctly, but the web renderer's UrlValue handler unconditionally wrote `_blank`.
It therefore overwrote an explicit target when URL application followed it,
including URL-only updates with an unchanged target. The SDK now derives target
and security relation attributes from retained URL/target properties on either
property's application or removal. URL-only links keep their existing `_blank`
default; `_self` survives URL changes. The dependency installer pins SDK
`bc4859db7a20717749c33517a0c0869663424374`.

The SDK's existing web link-actions suite now asserts attributes written by the
compiled DOM renderer, not just the abstract Link node. It covers both property
orders, graph-ID URL changes, empty URL, removals, default `_blank` security
attributes and rejected invalid targets. It fails against the prior renderer
with `_blank` instead of `_self` and passes after repair. The rendered Pages
target repair still requires rebuilt-application browser confirmation.

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
| Editor E1 | Earlier paired browser verification (Master `35f0275b` vs LUI) passes for `/Node embed` block and page embeds: the linked entity renders as the root row (title, arrow marker, reference count) with its children directly below; blockid is the linked UUID and originalblockid the linking block; content edits target originals while delete/move/indent/split target the linking block; selection highlights every occurrence; manual collapse of either occurrence updates both immediately and persists. Table77 on `7760653a` also accepts the full-flow Tab/Shift+Tab stored round-trip, expansion of only the actual collapsed target occurrence, and Shift+Down twice including the following page-embed root. Canonical relocation retains selection and outdent follows the actual enclosing ancestor. The mounted action/refresh regression covers these transitions, empty selection and rejected moves; the selection-domain regression covers duplicate roots. A remaining Tab console error is addressed separately below and awaits rebuilt-browser verification. LUI also emits `data-embed=true`. Native host built/tested but not visually verified. |
| Table76 E1 lifecycle follow-up | `a0388e08` covered visible embedded-root relocation, but a further collapse with no visible replacement could still leave selection pointing to a retired source and throw `Not_found` through `selection_forest`. Retired-source snapshots now preserve membership as unresolved, and Tab/Shift+Tab do not submit structural operations for an unavailable source or unresolved selection. The regression reproduces that exception before repair, including empty selection. Outdent is state-dependent, not a fixed return to host 208: following Master's `get-first-block-original`, an enclosing embedded ancestor supplies `parent-original`; without that ancestor, the worker outdents beside the actual data parent in source 207. The mounted regression covers both states and verifies successful structural completions. Table77 verifies the stored round-trip and selection flow; its complete console stack identifies the separate delta-splice recursion below. |
| Table77 E1 recursive delta splice | The full Tab stack identifies `RangeError: Maximum call stack size exceeded` in `node_for` / `splice_children` / `map_share`, after the worker commits the indent. The finite loader result already stops recursive links, but merging canonical UUID records while splicing repeatedly restores a recursive occurrence's enriched embed children, defeating that boundary. Splicing now carries a branch-local set of linked entity IDs, mirroring Master's `linked-block-row` / `:links`: a repeated target keeps the linking block and its own children but does not expand the linked subtree again. The initial page ID seeds the set consistently with the existing embed loader; duplicate sibling occurrences remain independent. A Melange regression reproduces the stack overflow before repair and checks finite recursive output, retained own children, duplicate occurrences, empty membership and missing-node failure afterward. Rebuilt-browser confirmation that the console error disappears remains pending. |
| Nested outliner geometry | Accepted by Table76 browser verification. Master's children container contributes 29px margin plus a 1px left border, so nested content and selection narrow by 30px per ancestor. Flat rows now put that inset on their existing containing column's padding instead of translating a full-width selected block with margin. Recursive/static children use the same fixed step, including heading/icon/numbered parents; existing bullet-guide alignment is preserved independently of the content inset. No CSS or static output changed; native visual acceptance remains pending. |
| Editor E10 | Selected-block copy/cut writes plain text, rich HTML and Chromium's `web application/logseq` payload. Same-graph paste restores hierarchy and property data; cut retains block IDs. Cut uses the same focus handoff as delete: the preceding visible block, or the editable page title when there is no predecessor. Native clipboard writes remain plain text. |
| Table75b clipboard residuals | Source repaired: successful custom-format block paste retires the editing sink and pending focus instead of entering the pasted parent, matching the paired Master fixture's BODY/no-visible-editor destination. Redo records no editing cursor. Empty/rejected replies and superseding editing sessions retain their focus; ordinary external text/Markdown paste and template insertion retain their existing completion behavior. Master's `paste-blocks` calls the scheduled `edit-last-block-after-inserted!`; its `clear-when-saved!` resets command state and does not itself universally clear editing, so the paired browser result—not a universal Master exit rule—is the acceptance target. The reaction resource was already registered: Enter publishes an optimistic row with no database ID before submitting its insertion, and row construction immediately requested its entity-backed reactions. Both warning UUIDs match the new target rows later reused for pasted parents, not the copied source UUID. Normal and static rows now wait for a canonical database ID before mounting reactions; canonical worker rows always include `db/id`. A mounted publication-order regression reproduces the premature read before the repair and verifies reactions load after canonical publication. Shared editing regressions cover successful, empty, rejected and superseded paste completion; existing reaction tests retain empty/error/removal coverage. Exact Table76 browser focus and warning acceptance remain pending; no worker warnings were suppressed. |
| Editor E38 | Fixed: the `/` command route had no `youtube-timestamp` dispatch, so it inserted nothing at any time; it now inserts `{{youtube-timestamp N}}` from `Runtime.video_timestamp`, warns while the player is pending and strips only the trigger with no video. YouTube embeds now install the iframe-API driver on render. Paired browser check (YouTube embed, signed-out Chrome): Master and LUI both insert `{{youtube-timestamp 0}}` at time zero; LUI inserted 42 and 75 after seeking. Native playback-time reporting remains unsupported. |
| Editor E40 | Accepted in Table76: the paired browser workflow now matches Master for five undo and five redo steps. Source repaired after the Table75b worker-call trace: opening Target automatically inserted its Linked references view as an undoable transaction; undo 4 removed that view instead of navigating, and redo navigation recreated it, clearing redo. The view insert carried nested `outliner-op=create-view` but lacked Master's top-level `source-outliner-op=create-view` (`handler/editor.cljs` insert-new-block metadata). All view creation now carries that source marker, matching Master for both automatic and explicit views. The existing worker filter already excludes it before pushing undo or clearing redo; no worker policy change was needed. The mounted missing-reference-view regression fails before the caller repair and passes after it, with empty/error cases preserved. A real-worker regression saves/undoes an edit, creates and recreates a persisted reference view, and verifies redo and the following undo affect the user edit while retaining the view. The earlier acknowledged-base save repair remains covered separately. The earlier mock timeline omitted automatic view creation and was removed. |
| Table73 editor shortcuts | Source repaired: document capture dispatches Meta+Enter through Cmdk services, whose web/native task callback previously called an unimplemented context-menu command rather than the shared task cycler. Meta+; pulled only an optional collapse attribute: DataScript returns nil when that attribute is absent, so the toggle treated an existing block as missing. The selector now includes db/id. Regressions cover the real host task callback and a missing stored collapse flag, alongside the existing shared-key workflows. Browser acceptance remains pending. |
| Table73–75 reference previews | Table75 confirms that block previews now open with the containing-page heading, block content and reference count after the label/UUID repairs. Remaining source repair: page icon/property actions are now shown only when the preview root is the page itself, not above a block rooted in that containing page. Page-preview actions are preserved, following Master's page/block title branch. The existing loader/lifecycle tests cover identity, root/descendants, counts, empty and rejected loads; Table75b confirms the block-preview control removal passes. |
| Table74 named-dialog opening | Login and Settings opened after the preview-count accessibility-label repair. Plugins/Marketplace previously rejected its patch batch because the contribution link carried unsupported `display`; responsive positioning now belongs to a supported row wrapper, with emitted link props covered by a shared regression. Paired rebuilt-web verification now opens Plugins/Marketplace with 263 cards, tabs, toolbar and contribution link, without patch-batch rejection. |
| Table74 Plugins shortcut | The default `t p` binding existed, but its command had no shortcut category row. Global dispatch builds its table from those rows, so it never reached the existing Plugins action. The catalog now includes Master's global-non-editing handler; shared chord tests assert Plugins and Settings named-dialog dispatch. Browser acceptance remains pending. |
| Table74 reload console | Fixed at the source: the `UNCAUGHT null` ErrorEvent was Chrome's "ResizeObserver loop completed with undelivered notifications" (its `error` is null), raised by the block virtualizer's synchronous `observeElementRect` callbacks during load/resize. `Logseq_virt` now sets `useAnimationFrameWithResizeObserver`, as the web renderer list already did. Probe with viewport changes between loads: 8/32 loads before, 0/32 after; Master 0/24. The window error listener now prints message and location when `ErrorEvent.error` is null. |
| Table73 footnotes | Source repaired: the return marker uses an explicit JavaScript Unicode escape instead of an OCaml byte-string literal. Definitions now keep parsed inline content and the 14px return link in one block-flow line rather than a flex row with a full-width title carrier. Unicode/navigation regressions pass; the 48px combined block height remains visually unverified. |
| Table73 N9 | Source repaired: the action hint button, not the separate Tip label, inherited the classic primary-text color (#433f38). It now uses Master's gray-12 token chain, resolving to RGB(23,23,23) in light Logseq. Browser color acceptance remains pending. |
| Table73–75 N19 | Source repaired after Table75 traces: the failed trials reopen within the previous menu's 150ms exit transition. LUI deliberately retains that visual subtree with `inert`; document-wide menu-item queries included its rows. Wrapping from the live Login then targeted the departing menu's first item, which cannot accept focus. Both initial focus and arrow navigation now exclude inert ancestry. A reopened-menu regression fails before the fix and passes after it, alongside rapid appearance and empty-menu coverage. Table75b browser stress acceptance passes; no SDK or timing-delay change. |
| Calculator extra root | Global plain-Enter dispatch and newline/empty-input save-and-Escape tests do not append roots, including failed saves. The explicit Shift+Enter action appends one empty sibling. The original full CodeMirror flow remains unverified; this does not establish which event ran there. No speculative fix. |
| Table74 calculator long output | Source repaired in both output paths: retained lines use typed nowrap/1.45rem line-height props with an empty-line minimum; live CodeMirror lines preserve whitespace without wrapping and use Master's 1.45rem height/line-height. Normal, long, empty and error results are covered, including repeated live replacement. Browser long-output height acceptance remains pending. |
| Shell N7 | Sidebar-menu action comparison needs equivalent target classification: Master conditionally includes Open as page for page/contents or a resolved page entity. The retained pair shows different sidebar contents and LUI explicitly has a page item; unconditional removal would diverge from Master. The horizontal-origin source repair is recorded below. |
| Reference filters | Equal-count tag chips use alphabetical order instead of Master's worker order. |
| Reference filter updates | LUI immediately moves chips after selection; Master leaves stale chips. Difference retained by the child, not established as an approved intentional exception. |
| Marketplace cards | Residual title truncation, icon artwork and description wrapping. |
| Marketplace controls | Table77 accepts the control dimensions: an 81px statistics block at Master's x position, 7px footer inset, 181x15 contribution hitbox and normal-weight Install control. Statistics retain an 18px start inset, 16px icons and 12px item padding; Install uses 13px unit line-height and 4px padding. Width remains content-sized, not fixed to an English label. The last vertical offsets are source-repaired: a 3px inset inside the Marketplace's fixed-height list viewport moves the grid without resizing the dialog or changing Installed; the absolute contribution wrapper moves down 2.5px without changing its hitbox or horizontal alignment. These position adjustments await rebuilt-browser verification. Empty filter (unmatched search) matches Master: dialog, tabs and toolbar remain, the content area is empty and the search stays editable. Search margins, toolbar actions and filter/sort dots follow Master's source. |
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
