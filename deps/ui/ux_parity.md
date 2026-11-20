# LUI UX parity status

The paired-audit baseline is upstream master **`2a0dce92`**; the latest fetch is
**`0ba402070c`**. Settings, references and properties/icon child branches are now
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
recording-host result-refresh boundary, not Web focus dismissal (see Table82
below). Result updates also used to retire
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

### Table82 popup ownership, property Configure and column order

Table82 on `61dd9feb` accepts Pages same-tab navigation, fresh and existing
query grouping, signed-out Sync eligibility, and reserved-name warning geometry.
The Between form remained broken: the supplied passive DOM trace records its
calendar mounting about 22ms after Start, disappearing about 47ms after Start,
and the range form disappearing about 211ms after Start. The prior recording
test did not exercise the Web focus-dismiss policy.

The calendar was pushed as a sibling entry in `Views_popup`, not retained below
the range form. Its Previous month button requests autofocus. The Web renderer
derives layer ownership from retained parents; its nonblocking-layer focus
handler therefore treats the calendar's focus as outside the range form and
dismisses that form. Removing Start then invalidates the calendar's anchor.
A standalone Web-renderer reproduction on an ephemeral loopback port records
`focus:Previous month`, `range-dismiss`, and `calendar-dismiss`, with no query
refresh involved. The same focus flow with the calendar retained under the
range form preserves both layers and permits date selection. This also rules
out autofocus alone as sufficient to dismiss a correctly owned child.

`views_builder.ml` now retains the selected calendar inside the range form's
subtree instead of using a second global popup entry. Date selection and child
dismissal clear only that local calendar state. Start, End, incomplete Submit,
completed Submit and stale-query guards remain covered. The strengthened
existing lifecycle regression checks two actual popover ancestors rather than
merely counting two global popup entries; it fails before this repair.

Property Configure now follows Master's UI-position eligibility: Number, Date,
Checkbox, Node, and eligible choice/positioned Text properties only, excluding
the special built-ins and class configuration properties. Plain Text, Datetime,
URL and Asset omit it. Text and Number default-value items show the existing
translated Set value description when unset, or their stored value title when
set. The synthesized Tags column follows configured property columns, restoring
Name / property / Tags on tagged/property object tables without overriding
explicit column ordering or duplicating an existing Tags column.

Verification: `pnpm test:ui` reports 6473 checks with zero failures; native
experimental tests and build pass. The isolated Web comparison reproduces the
old dismissal and selects a date with nested ownership. These are not rebuilt
application/browser acceptance: the exact integrated Start/End flow, Configure
geometry and table geometry remain visually unverified. Evidence and probe:
`/Users/devin/table82/evidence/`,
`/Users/devin/attachments/table82-between-probe.mjs`, and
`/Users/devin/attachments/table82-between-web.log`. No `static/` writes or shared
`:3010` access were used. Baseline journal diagnostics remain 102/52, with the
known non-fatal native properties diagnostic.

#### Table82 follow-up: Backlinks sorting and favorite drop placement

The All pages Backlinks column was explicitly excluded by `sortable`, so its
header never opened the existing ascending/descending menu. Master treats this
column as sortable. It now uses the shared sort menu and persistence path;
the existing sorting regression requires Backlinks eligibility.

Master's favorites use dnd-kit's `arrayMove(oldIndex, targetIndex)`, not the
pointer's position within the target row. LUI previously chose before/after
from the row midpoint, producing B,C,A when C was dragged to A's upper edge
from C,B,A. Favorite ordering now uses the target's original index: downward
moves land after the target, upward moves before it. Drop state stores only
the target identity; the obsolete half-row flag and helper argument are removed.
Existing order regressions cover both directions, adjacent moves, self/missing
identities and empty input. The persistence RPC and reload-after-success path
are unchanged.

UI gates pass with 6473 checks and zero failures; native experimental tests and
build pass. Evidence is under `/Users/devin/table82/evidence/`, including the
paired favorite-edge JSON and Master Backlinks menu screenshot. The exact
rebuilt-application menu and drag/reload workflows remain browser/visually
unverified. No `static/` writes or `:3010` access were used.

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
target repair is accepted in Table82's rebuilt-application browser comparison.

### Table83 Between journal-reference evaluation

Table83 on `bad73920` accepts the Between calendar lifecycle: Start and End
remain selectable and the range form persists. The Nov 18–20 query still
returned zero rows after reload, while Master returned the Nov 19 marker.
Paired evidence is under `/Users/devin/table83/evidence/`, including
`lui-fresh-between-after-reload.png` and
`master-fresh-between-after-reload.png`.

The title shown by the builder is not a raw-storage check. Both builders start
with journal titles; LUI's existing `save_src` → `save_block_parsed` →
`Title_refs.parse` → `resolve_page_refs` path resolves those references to the
canonical journal UUIDs. A real native save/read/query regression verifies that
the stored Nov 18/20 arguments are `00000001-2026-1118-0000-000000000000` and
`00000001-2026-1120-0000-000000000000`. Before the repair, the storage assertion
passed but evaluating that reloaded source returned no rows; title arguments
on the same journal fixture did return Nov 19. The missing step was worker
evaluation of the stored UUID references, not a second builder-only serializer.

`db_query_dsl.ml` now decodes canonical journal UUID references into journal-day
bounds. The existing title and relative-date forms, inclusive range rule and
reference-save path remain unchanged. The existing native Between test covers
the real save/read/evaluate path over Nov 17/19/21 blocks, title and UUID inputs,
an empty interval, and rejection of an invalid calendar date by the decoder.
This is a database-source reread, not a browser or disk-close/reopen test.

Verification: the focused native query-DSL group passes all 23 tests; the UI
aggregate passes 6473 checks with zero failures, and native experimental tests
and build pass. The worker aggregate still has the same three native keychain-host
platform failures recorded in Table80 (`Native secrets require the OS keychain
host`); its query-DSL group passes. Full rebuilt-application filtering and reload
remain browser/visually unverified. No `static/` writes or `:3010` access were
used. UI journal diagnostics retain their 102/52 baseline.

### Table83 tagged-template application

Table83 accepts the Property Configure menus, property-tagged column order,
Backlinks sort menu and Favorites drag placement. Its next failure applies
`T83 Useful Template` through `/Template`: the target remains blank with
`used-template`, while Master displays `T83 Template inserted child`. Evidence
is `/Users/devin/table83/evidence/lui-template-retry-after-reload.png`,
`master-content-template.png` and `lui-template-source-validation.json`.

The native worker's save-plus-apply batch already copies the tagged template's
single child into the blank target, preserves the source tree and records
`used-template`. No worker implementation or serialization change is needed.
The reproducible shared editor failure is after that copy: the blank target's
UUID is reused, but `edit_last_inserted` calls `enter_edit`, which returns early
for the already-open UUID. Its old buffer remains blank. If the slash trigger
was previously saved, a subsequent editor commit writes the blank buffer over
the copied title. Master explicitly reopens the inserted block without saving
the stale buffer in `edit-last-block-after-inserted!`.

`popups_state.ml` now acknowledges the successful preparatory save and resyncs
the unchanged originating editor before focusing the inserted block. Editor
epoch, model version, input sequence and graph/route guards preserve newer
input and reject stale completions. Empty results do not resync the editor;
rejections retain the existing write-error notification and are consumed at
the popup action boundary instead of escaping as an unhandled rejection.

The retained shared editing regression fails before the repair on the stale
buffer and post-insertion commit. It exercises the real popup/save/refresh/
focus/commit path with a simulated worker copy response, for both pristine and
previously-saved slash buffers, newer input, empty results and rejected writes.
A separate real-worker regression covers the save/apply batch, copied child,
source preservation, source reference and missing-template no-op after save.

Verification: the focused native outliner-op group passes 31 tests; the UI
aggregate passes 6480 checks with zero failures, and native experimental tests
and build pass. The worker aggregate runs 994 tests and retains the same three
platform failures as the prior Table83 log, including `Native secrets require
the OS keychain host`. The reported browser's exact post-insertion write has
not been traced; rebuilt-application picker, display and reload acceptance
remain browser/visually unverified. No `static/` writes or `:3010` access.

### Table84 creation, commands and property presentation

Table84 accepts Between filtering and tagged-template child insertion on
`141b8be5`. New evidence is under `/Users/devin/table84/evidence/`, including
the Alias and code-language picker comparisons, Math command comparisons,
`*-last-checks.json`, checkbox-default application and priority/deadline
discovery captures.

Seven application-layer repairs follow Master's source:

- Alias is a page reference. Both the value-cell picker and Set property
  dialog now offer New option for page values, using the existing create-page
  and entity-reference write paths rather than creating a string alias.
- Web and native code-language actions share the searchable select in
  `views_popup.ml`, with the existing translated Choose language placeholder.
  Selecting a filtered result retains the existing language-persistence action;
  an empty result cannot invent a mode. No build/module configuration changed.
- Math removes the command trigger and writes display-type on the current
  block, preserving its content instead of taking the sibling-insertion path.
- Recent-block highlighting defaults to `t h`, matching Master's keymap.
  The command palette and global dispatcher consume the same binding source;
  explicit user overrides remain supported. The native recorder's old Command-C
  prefix count is reduced by one because highlighting no longer has that prefix.
- Adding a single checkbox property uses scalar-default-value, including true
  and explicit false; only a missing default uses Master's false value. Batch
  selection still asks for an explicit value. Single Text and URL value-block
  creation already seeds default content; the existing many-value behavior and
  Number value-picker flow are preserved rather than blanket auto-writing defaults.
- Positioned closed choices with icons render icon-only, including priority
  and many-value choices, matching Master's positioned icon option. Panel/table
  labels and iconless fallbacks remain visible; accessible names are retained.
- Date-page links use the existing link-blue token instead of inheriting gray.
  Scheduled/deadline overdue color and surrounding time text are preserved.

Mounted regressions cover both Alias creation entry points, filtered language
selection and empty results, blank/nonempty Math conversion and rejected writes,
the rendered highlight keycaps and actual chord dispatch, checkbox true/false/no
default through the property selector, Text/URL seed content, priority label
visibility and scheduled/deadline/custom date link and overdue colors.

These are application adaptations, not SDK limitations. Full rebuilt-browser
picker, reload and exact visual acceptance remain pending; mounted/native
coverage is not browser acceptance. No `static/` writes or `:3010` access.

Verification: UI passes 6519 checks with zero failures; native experimental
tests and build pass. The worker aggregate still runs 994 tests with three
platform failures and `Native secrets require the OS keychain host`, matching
the preceding Table83 aggregate. The native recorder initially retained its
obsolete four-row Command-C expectation; updating it to the three remaining
bindings restores the native gate without changing recorder behavior.
The i18n lint command is environment-blocked before analysis: its cached
SQLite pod is x86_64 on this arm64 machine (`Exec failed, error: 86 (Bad CPU
type in executable)`). The picker reuses an existing translation key; no
dictionary text changed. UI journal diagnostics retain the 102/52 baseline.

### Master refresh through `0ba402070c`

The requested `35f0275b4f..0ba402070c` range contains exactly two commits:

| Commit | User-visible or runtime change | LUI disposition |
| --- | --- | --- |
| `4f5aa5ee84` | Upgrade `@base-ui/react` to 1.9.0, fixing a React non-modal popup focus-guard recursion on Tab | Merge the manifest/lock update; installed root resolution is 1.9.0. LUI's web menus are its own OCaml implementation, not React Base UI, so the React focus-manager implementation is not copied into LUI. |
| `0ba402070c` | Open `file:` links through native path conversion; preview local images/PDFs through Electron's assets protocol; retain encoded filename characters, Windows/UNC URLs and document suffixes | Port URL wrapping, link dispatch, image/PDF sources and the native assets resolver. Preserve the upstream preload's native path conversion APIs. |

Neither commit changes database schema or worker query/storage semantics.
The branch previously merged Master at `800398be03`, whose Master parent
and pre-refresh merge-base is `d608268212`. The merge therefore includes
64 upstream ancestry commits, not only the two commits in the requested
comparison range. Resolve modify/delete conflicts by retaining the OCaml
worker/UI/Electron implementations and removed legacy test suites, rather
than reviving their ClojureScript predecessors. Retain both the branch's
plugin entity type exports and Master's extracted plugin types. Reconcile
the dependency locks without running asset-producing installation scripts.

`Render_inline` retains a file link's URL and icon, dispatching activation
through the host opener. The web platform calls Electron's `openPath` only
when that bridge exists; browsers retain normal URL opening. Local image
and PDF preview URLs wrap the canonical file URL beneath
`assets://localhost/logseq__file/`, keeping query/fragment outside the
encoded file identity. PDF detection includes URLs with those suffixes.
`Electron_utils.resolve_asset_path` decodes the wrapper and delegates native
path conversion to Node's `fileURLToPath`; malformed wrapped resources
return Electron's `ERR_FILE_NOT_FOUND` code. Existing assets URLs and
non-Electron/native preview paths remain unchanged.

Mounted regressions cover file-link activation, rendered image sources,
PDF inflation/openers, uppercase schemes, canonical drive/UNC URLs, empty
and malformed inputs, encoded percent/hash characters and browser behavior.
The Electron regression covers one-time decoding, suffix stripping,
malformed/empty wrappers and legacy assets/UNC resolution. This does not
constitute a real Electron file load or OS copy/reveal acceptance; those
interactions remain browser/host-unverified. No `static/` writes, web bundle
build or `:3010` access is performed while the testing agent uses the assets.

Verification: UI passes 6532 checks; native experimental tests/build and
plugin SDK typechecking pass. CLI tests pass 448 cases; sync download script
tests pass 8 and Electron operation-simulation tests pass 6. The worker's
Melange groups pass 100 and 154 tests, including the new local-file resolver;
the aggregate retains exactly the preceding Table84 platform failures:
three failures in 994 native tests, with `Native secrets require the OS
keychain host`. Plugin SDK formatting reports the same eight failing files
when checking their pre-merge HEAD contents. Translation validation cannot
start because the cached go-sqlite3 pod is x86_64 despite its aarch64 cache
directory on this arm64 host (`Exec failed, error: 86 (Bad CPU type in
executable)`); no lint success is claimed.

The legacy db-sync package test first encounters Maven Central HTTP 429.
Using the documented command-local Central mirror completes compilation,
but the suite reports `FAIL in (auth-claims-jwks-error-propagates-test)` and
`Async test called done more than one time`, despite returning exit zero.
A separate detached worktree at pre-merge `5baaceaec1` reproduces the same
assertion and warning with the same mirror and installed Node dependencies;
this is not counted as a passing gate or changed as part of the file-link
port. No repository Maven configuration is modified.

## Table85: reference order, Marketplace cards and recent highlighting

Table85 compared the served `5baaceaec1` build with Master; evidence is under
`/Users/devin/table85/evidence/`. These repairs follow Master's source, not an
assumed alphabetical or universally unstable reference order.

Master's `db/common/reference.cljs/get-ref-pages-count` counts path references
before direct references and sorts descending by frequency. Equal counts retain
the frequency map's iteration order. ClojureScript's small array map retains
first-encounter order (up to eight distinct keys); larger hash maps do not promise
that order. `components/reference_filters.cljs` preserves the supplied sequence
for an empty search; fuzzy search is limited to 100, then stably sorted by count,
before selected chips are removed. There is no alphabetical tie-break. The UI
now preserves worker order, and both worker count implementations preserve
first-encounter ties, reproducing Page/tags/Ref A/Ref B/Zebra/Alpha for the
reported small group. This is not a claim that Master universally orders large
equal-frequency groups by first reference. Native regressions cover both count
APIs and empty references; shared regressions cover ordering, selection, search
limits and malformed count responses.

Marketplace descriptions now separate the 60px spacing wrapper from its
two-line-clamped, unpadded text child, matching Master's `.desc > p`. Applying
height and padding to the clamped text exposed extra lines despite the clamp.
An isolated Chrome rendering with the existing LUI stylesheet reproduces the
old overflow and verifies a 32px/two-line child with ellipsis after the repair:
`/Users/devin/attachments/table85-clamp-isolated.png`. Repository links use
Master's filled GitHub SVG path, not the outlined Tabler brand glyph. Mounted
regressions inspect the actual description props and repository icon.

Master's `state.cljs/toggle-highlight-recent-blocks!` only toggles the mode;
there is no empty-results or recent-edits eligibility check. In `header.cljs`,
the slider and Quit control are inside `rtc-indicator-visible?`: a logged-in,
RTC-eligible user, a current registered remote graph, and either its DB RTC UUID
or a matching nonempty RTC-state graph UUID are required. The LUI header now
uses that gate. Its RTC projection retains the existing broadcast's graph UUID
instead of treating any RTC state as sufficient. Signed-out/local/plain pages
therefore mount no slider and request no recent-block highlights. Eligible
pages retain the existing mounted-block selection by `block/updated-at`, strictly
newer than now minus the selected number of days (default three), with the
secondary background. Leaving the controls clears that selection and cancels
the scoped deferred refresh. Tests cover signed-out/local/no graph, missing or
mismatched RTC UUIDs, matching state, eligible mounted controls and Quit cleanup.

Verification: UI aggregate passes 6550 checks; native experimental tests and
build pass. Worker view tests pass 58 cases, including the new frequency-order
regression; worker Melange groups pass 100 and 154 tests. The aggregate retains
the same three platform failures as the upstream-refresh log: 994 native tests,
`Native secrets require the OS keychain host`. Diff whitespace checks pass.
No web bundle build, `static/` writes or `:3010` access. The isolated CSS rendering
is not rebuilt-application acceptance: filter order, the card and RTC highlighting
remain pending paired browser verification.

### Table85 follow-up: popup snapshots and converting slash commands

Master's `reference.cljs/references-aux` passes the page entity and original
`ref-pages-count` into a popup closure. `reference_filters.cljs/filter-dialog-aux`
initializes its local list from that argument and searches that same list; it
does not subscribe the open popup to new counts. `db/common/reference.cljs/get-filters`
reads the supplied page entity. Includes/Excludes sections exist for filters
already present when opening; selecting Alpha in an unfiltered popup does not
replace its original facets with a new Includes section and recomputed counts.
LUI now keeps that opening selection/count snapshot, while saving the actual
filter and refreshing the references underneath. Reopening reads the saved
selection and a fresh count resource. Mounted regressions exercise selection,
sync, reopening, empty resources and failed resources.

Converting slash actions now send one command with the recorded trigger/query
range, rather than first sending a separate insertion whose end depends on the
live caret and then a zero-width command. The command consumer removes and
schedules the cleaned source before conversion. A regression moves the caret
while the slash popup remains open: empty-host Code retains the host UUID with
no slash or sibling; typed queries are removed as well. This is a reachable
failure scenario, not a trace proving the original browser event sequence.

The built-in conversion audit follows Master's `commands.cljs` and
`handler/events.cljs/:editor/upsert-type-block`: Code/Calculator reuse an empty,
untyped host but insert after nonempty or already typed hosts. That distinction
is preserved. Quote, like Math, sets display type on the current block even
when nonempty or already typed; Quote no longer uses the Code insertion rule.
Heading, Clear heading, Normal text and numbered-list actions retain their
existing host and share trigger cleanup. Query/Advanced Query use the existing
`Run_query` action, which clears the trigger and updates the host's query
property/tag in place; their empty, nonempty and rejection regressions remain.
Existing Code/Math rejection and focus tests are retained.

Verification: UI aggregate passes 6588 checks; native experimental tests and
build pass. Worker aggregate retains the same platform cases 1, 7 and 8 as the
preceding Table85 log: 3 failures out of 994, including `Native secrets require
the OS keychain host`. Diff whitespace checks pass. Logs are under
`/Users/devin/attachments/table85-followup-{ui,native-test,native-build,worker}.log`.
Rebuilt-application Code/Quote
conversion, reload and popup visuals remain unverified. No web bundle build,
`static/` writes or `:3010` access.

## Table86: reference editing, refresh, file links and journal queries

Table86 accepts Code/Quote conversion and reload, signed-out recent-highlight
gating, Marketplace clamp/icon/geometry, initial reference facets, selection and
Shift-exclusion. Evidence is under `/Users/devin/table86/evidence/`.

Linked-reference List rows reached `Tree.block_row_static`, which explicitly
declared `data-editable=false` and rendered display content without an editor.
Source history identifies `e871bd161e` as the explicit pointer-entry blocker:
it added that attribute and the `Editor_keys.readonly_block_target` guard.
`7780c723df` also disabled content-jump editing for those rows. The static
display-only renderer predates both. The same false attribute and display-only
path are present before `7de86b98` and in `5e29f4b4`, `504f60ea` and `9385eb03`;
those suspected recent commits did not introduce this path. This is a
source-history diagnosis, not a historical built-browser bisect or proof of
which row presentation the earlier E40 acceptance exercised.

Snapshot rows now register a mount-owned outliner source, advertise editability
outside publishing, and mount the ordinary editor for the active occurrence.
Each result root has its own scope, shared by its children, so a matching UUID
elsewhere does not claim another editor. Local reference collapse and the
existing local-sibling bullet calculation remain; view disposal clears child
scopes. Mounted regressions assert root/child editability, scoped child lookup,
child editor mounting and replacement by the root editor.

Removing a filter exposed a different windowing issue: a one-row response set
`fetch_limit=1`; the next unfiltered request reused it as `initial-row-count`.
`Render_resource` converts that field into the worker's `row-limit`, retaining
the total count but returning only one row. Reference refresh now requests at
least the ordinary reference window. The regression restores both rows after a
one-row filter and covers empty and rejected responses.

Browser file links now retain their ordinary anchor without an application
press handler. The web platform recognizes Electron by the callable preload
`doAction`, matching the existing daemon capability check, rather than by the
mere presence of `window.apis`: the browser plugin shim is an event emitter
without `openPath`. Mounted tests cover absent/shim bridges, browser navigation
and media URLs, retaining the existing working Electron opener test. No native
platform opener was changed.

Today's journal now renders configured `:default-queries :journals`, including
the Home journal list and journal page route, but not older journals or sidebar
pages. Queries start collapsed, use the configured title and existing result
count translation, and reuse datalog evaluation and ordinary query-result
rendering. Built-ins receive today's date and journal title without a query
block UUID. Their result UUIDs are resolved to entity IDs for the existing
worker view-data renderer without creating a persisted query view. Empty
built-ins disappear like Master; errors replace stale results. Mounted tests
cover expansion, context/spec, result title/count, empty/error, remount and an
older journal.

The confirmed nonempty-host Node reference picker issue was in `Switch Page_ref`:
it erased the slash command but set a zero-length trigger while the input
handler still expected `[[`. The next keystroke therefore took its
missing-trigger branch and searched the entire host buffer from offset zero.
Switching now inserts balanced `[[]]` with the caret inside and retains the
two-character trigger at the original command position, following Master's
`:editor/input` plus `:editor/search-page` command. Regression cases cover empty
and nonempty hosts, initially empty suggestions, term-only worker search,
existing-node selection, prefix preservation and ghost-pair removal. Existing
search rejection coverage is retained.

The proposed block-preview regression was withdrawn after the clean-graph
retake confirmed parity. History for the requested Master range
`d608268212..0ba402070c` changes file-asset handling and zoomed-query page context
in the relevant block/page components, not the preview's root/children rule.
`page-preview-source` still resolves the selected entity/alias and mounts the
shared page renderer. No preview content/loading rule or existing preview
regression was changed for the dissimilar initial fixtures.

The subsequent same-UUID comparison identified a separate spacing difference:
Master's block breadcrumb has `my-2`, followed by the desktop page grid's 32px
gap, and the page inner ends with `mb-16`. The flattened LUI preview omitted
all three. Block previews now retain the two 8px breadcrumb margins, the 32px
section gap and the additional 64px bottom margin, without imposing a fixed
popup height or removing children/counts. Page preview title spacing is left
unchanged. Mounted web/native regressions assert the emitted section and
breadcrumb props for both roots. Rebuilt-browser geometry is still unverified:
the independent component capture could not initialize outside the complete
test harness (`caml_restore_raw_backtrace not polyfilled by Melange yet`), and a
separate Master tab did not load the fixture's graph. The temporary Master tab
was closed. No screenshot of the changed geometry is claimed.

Verification: UI aggregate passes 6622 checks; native experimental tests and
native experimental build pass. The worker aggregate retains the
same platform cases 1, 7 and 8 as the preceding Table85 follow-up log: 3 failures
out of 994, including `Native secrets require the OS keychain host`. The i18n
hardcoded-text lint cannot start: Babashka is arm64, but its cached
`go-sqlite3/0.3.13/mac_os_x/aarch64` pod is an x86_64 binary, producing
`Exec failed, error: 86 (Bad CPU type in executable)`. No dictionaries changed.

These new fixes remain rebuilt-application/browser and visually unverified;
mounted tests are not acceptance of OS file opening, browser caret/focus or
query expansion/reload. No web bundle build, `static/` writes or `:3010` access.
Logs are under `/Users/devin/attachments/table86-*`.

### Larger facet ties: identity-hash ordering, not an ID-based order

The new boundary evidence has nine visible facets: Page 5, Alpha 3, and seven
ties. Master orders the initial ties Ref D/C/B/A/Beta/Gamma/E; LUI retains
Ref A/B/C/D/E/Beta/Gamma. This difference is retained, not claimed repaired.

Master's `get-ref-pages-count` calls `frequencies` on DataScript **Entity**
objects before filtering hidden/non-page references or extracting titles.
The array-map-to-HAMT boundary counts all distinct Entity keys, not just visible
facets. The pinned DataScript fork (`3f141af97b70e1f14c65eaa119acd822ebece37e`),
`impl/entity.cljc:159`, hashes an Entity with
`db/combine-hashes(hash(eid), goog/getUid(db))`; equality likewise requires the
same database object identity. `goog/getUid(db)` is a runtime object allocation
identity, not a graph/entity ID or persisted database value. Therefore matching
entity IDs and graph contents does not determine the CLJS HAMT traversal order.
Reproducing just numeric-ID hashes or freezing the reported order would be
incorrect; inventing a synthetic CLJS database identity in the OCaml worker
would not reproduce Master's runtime allocation history. Count sorting and
small-map encounter order remain aligned. This is an application/backend
identity-order difference, not a LUI SDK limitation. No hash-order emulation or
hard-coded fixture ordering was added.

## Table87: configured journal query presentation and page previews

Table87 accepts linked-reference editing and occurrence isolation, E40 through
linked references, filter addition/removal, browser file links, nonempty Node
reference, configured-query core behavior and block-preview geometry (Master
319.6px, LUI 318px). Evidence is under `/Users/devin/table87/evidence/`.

Configured query vector titles now use the existing Hiccup renderer, including
`[:h3 "T87 Hiccup default"]` and empty vectors. String titles use inline rendering;
localized title keys and the existing missing-title fallback remain intact.
The heading is a plain foldable row rather than a ghost button, with a growing
title region and a separate right-aligned result count. Adjacent configured
queries no longer introduce extra inter-query gaps. The expanded result keeps
Master's 4px top/left inset, without an ordinary view header or divider.

Master's `components/query/result.cljs:get-group-by-page` always disables page
grouping for DB graphs, even when the query explicitly requests it. Built-in
query requests now omit `group-by-property-ident`, including the ordinary List
view's implicit page grouping. This removes the extra containing-page/date
headings without changing ordinary query/List grouping. Mounted regressions
cover the outgoing context, plain heading/count layout, Hiccup content and empty
vectors; existing collapsed/expanded, empty-result, rejection and remount checks
remain in the same suite.

The same-content page-reference evidence measures Master 610x306px versus LUI
610x206px. Master `components/page.cljs` wraps both page and block previews in
`page-inner` with desktop `gap-8` (32px) and `mb-16` (64px). The separate preview
wrapper also has 64px bottom padding (`components/block.cljs:page-preview-content`);
that padding was already present in LUI and is not doubled. Table86 restored
the inner gap/margin only for block previews. Page previews now retain them too,
restoring 96px of the observed approximately 100px deficit without a fixed
height. Page title margins remain zero; the accepted block-only breadcrumb
8px top/bottom margins remain unchanged. Existing web/native preview regressions
now require the shared section spacing for both roots.

Verification: UI aggregate passes 6628 checks; native experimental tests and
native experimental build pass. The worker aggregate retains the same platform
cases 1, 7 and 8 as Table86: 3 failures out of 994, including `Native secrets
require the OS keychain host`. Logs: `/Users/devin/attachments/table87-*`.
The new journal presentation and page-preview geometry remain visually unverified
in a rebuilt application; emitted props are not browser acceptance, and the
remaining pixel difference has not been measured after rebuilding. No web
bundle build, `static/` writes or `:3010` access.

## Table88: preview title inset, query offsets and canvas background

Table88 accepts Hiccup titles, configured-query functionality and the compact
full regression sweep on `703d4329`. Evidence is under
`/Users/devin/table88/evidence/`.

The exact preview retake isolates the remaining page-preview difference:
Master's title is a 28px `.ls-block` with 2px top/bottom padding, whereas LUI's
flattened title was 24px. `components/block.css` declares this as `py-0.5`.
The page title now retains that padding, accounting for the remaining 4px
without setting a fixed popup height. Block breadcrumbs do not acquire the
padding, preserving the previously accepted block layout.

The configured journal-query group receives the measured 4px top offset, so
its three 24px headings are expected at 310/334/358 rather than 306/330/354 in
the supplied fixture. Removing the outer custom-query 2px left margin restores
the measured section origin and full width (463/940 rather than 465/938).
The top adjustment is evidence-based; no claim is made that its original
upstream ancestor-box cause has been traced. Query execution, collapse state
and ordinary query layouts are unchanged.

Master `common.css:body` chooses `--lx-gray-01` before the classic primary
background. LUI's root background skipped it. The root now uses Master's exact
variable chain, not a hard-coded light RGB. With light Logseq, the accent token
resolves through `--rx-gray-01` (99% gray) to RGB(252,252,252), rather than the
classic white. The native body-background test retains its all-palette paint
checks and now expects the same canvas token; its previous primary-background
expectation correctly failed in light Logseq after this intentional change.

The optional 318px versus 319.625px block-preview difference is not patched.
The retake shows identical 56px result trees and 28px add rows, with the 1.625px
offset already present before the first result row. Master's breadcrumb uses
nested inline-flex labels and inherited line height; no explicit source
dimension of 1.625px was found. Its intrinsic browser baseline contribution is
not verified. A fixture-specific fractional spacer would not be a source port.

Mounted tests cover preview padding and query geometry props; the shell test
requires the canvas token. UI aggregate: 6632 checks, zero failures. Native
experimental tests and build pass. The worker aggregate retains Table87's same
platform cases 1, 7 and 8: three failures out of 994, including `Native secrets
require the OS keychain host`.

Isolated Chrome rendering of the actual before/after root token and repository
palette CSS verifies light RGB(255,255,255) to RGB(252,252,252); dark Logseq stays
RGB(0,43,54). Screenshot:
`/Users/devin/attachments/table88-canvas-light-isolated.png`.
This is token verification, not full-application visual acceptance. New journal
offsets and page-preview geometry remain rebuilt-browser unverified. No web
bundle build, `static/` writes or `:3010` access. Logs:
`/Users/devin/attachments/table88-*`.

## Table89: projected selection identity and query heading ink

Table89 accepts page-preview geometry, configured-query outer boxes, light/dark
canvas colors and E1 page-embed Tab/Shift+Tab/reload on `7b5099f8`, compared with
Master `a5cf5231d8`. Evidence is under `/Users/devin/table89/evidence/`.

Bare ArrowDown used `Editor_state.next_visible`, whose raw tree contains the
invisible embed-owner UUID immediately before the displayed linked root.
`Outliner_projection.create` replaces that owner with `rendered_block`; the
rendered row uses the linked root UUID and retains the owner in
`block_original`/`data-originalblockid`. Selecting the raw owner therefore
leaves no visible selected row: this is an identity mismatch, not an explicit
selection-clear operation. Both normal-key and command dispatch reach
`move_selection_focus`. Bare arrows now use the same projected rows as range
selection and preserve the destination occurrence scope. That scope retains
the owner mapping consumed by structural Tab/Shift+Tab operations rather than
mistaking a linked page for the host block. Non-main outliner navigation keeps
its existing scoped traversal.

The selection regression fails before repair for both block and page embeds,
including empty-page traversal. It now checks forward/backward root navigation,
owner mapping for Tab/Shift+Tab, empty embeds, the final row and unavailable
selection IDs. Existing multi-selection, range, occurrence-collapse and retired
embed tests remain unchanged. This is a source-state regression, not a replay
of the original browser event sequence.

`query-heading-ink-bounds.json` places LUI titles 1px left, and counts 1px right
and 3px down. Configured-query headings retain their accepted outer geometry
and acquire a 1px horizontal inner inset. Master `query-title` uses a separate
`text-sm` result-count span in its flex row: its line height is 20px, while the
plain heading row is 24px. The count now uses that line height in a 24px box,
instead of vertically centering its inherited line box. The horizontal inset
is evidence-based; an explicit upstream 1px padding declaration was not found.
Mounted tests require these props without changing query behavior or titles.
The expected ink shifts have not been remeasured in a rebuilt browser.

`0ba402070c..origin/master` contains exactly one commit:
`a5cf5231d8 fix: improve bottom property truncation (#12890)`. It adds natural
pill-width overflow selection, truncates the first overflowing pill, hides
later pills until expansion, remeasures after async content changes, excludes
hidden pills from keyboard focus, and adjusts expanded/multi-value styling.
Its five changed paths are block/property UI CSS, `block.cljs`, and a pure
bottom-properties layout helper/test; no schema or worker changes occur.

The branch previously merged Master. Merge `f8e9e95260` has parents `7b5099f821`
and `a5cf5231d8`; the merge-base advances from `0ba402070c` to `a5cf5231d8`
without rewriting history. Modify/delete conflicts retain the deleted legacy
ClojureScript UI/CSS; its newly introduced unused helper/test are not retained.
**The new bottom-property overflow UX is not ported by this ancestry merge.**
LUI `Properties_area.pills_view` still wraps all pills, so collapsed truncation,
expansion and hidden-pill focus behavior remain application-parity follow-up,
not an established SDK/platform limitation. The follow-up below implements it.

UI aggregate: 6643 checks, zero failures. Native experimental tests and build
pass. The worker aggregate retains Table88's same platform cases 1, 7 and 8:
three failures out of 994, including `Native secrets require the OS keychain
host`. Logs: `/Users/devin/attachments/table89-ui-final.log`,
`table89-native-test-final.log`, `table89-native-build-final.log`, and
`table89-worker.log` in the same directory.

New selection rendering and query ink remain rebuilt-browser/visually
unverified. No web bundle build, `static/` writes or `:3010` access.

### Table89 follow-up: bottom-property truncation and expansion

Master `a5cf5231d8` (#12890) measures natural pill widths, truncates the first
overflowing pill, hides subsequent pills while collapsed, and exposes translated
Expand/Collapse controls. Its expanded strip wraps and uses auto-height pills.
The supplied `/Users/devin/table89/evidence/master-bottom-overflow.json` records
32px collapsed and 103.953125px expanded; the corresponding LUI JSON and
`{master,lui}-bottom-overflow-collapsed.png` demonstrate the original two-row
layout and the long Node link covering its property-name target.

`Properties_area.pills_view` now uses typed horizontal `view_that_fits` instead
of application DOM measurement. Its first candidate contains every natural
pill without a control. The fallback reserves the control width and recursively
fits a natural pill plus the remaining strip, or a shrinking final pill without
later siblings. This keeps the number of candidates linear in the property
count. The SDK owns resize/content remeasurement and makes unselected candidates
hidden and inert. Candidate-specific owner keys keep property/picker identifiers
distinct. No SDK API, dictionary, worker or schema change is needed.

Expansion is retained outside the property-data reactive branch, so refreshes
do not reset it. Expanded values wrap independently of their empty picker
button; both property keys and numeric values keep a typed 20px line box.
The key cannot shrink into the value, and the value clips/ellipsizes inside its
own allocated space. Expanded pills have auto height and an 8px radius; the
collapsed outer row remains 32px. Controls reuse the existing
`property/expand-bottom-pills` and `property/collapse-bottom-pills` keys,
with `aria-expanded`, a stable focus target and Master's compact pill styling.
Superseded CSS flex sizing was removed in favor of typed layout props.

Mounted regressions cover collapsed fitting, distinct targets, ellipsis and
clipping, expansion, compact numeric/key sizing, refresh with missing values,
collapse and an empty property area. UI aggregate: **6651 checks, zero failures**.
Native experimental tests and build pass. Worker retains Table89's same three
platform failures (cases 1, 7, 8), including `Native secrets require the OS
keychain host`: 3 failures / 994 tests. CSS lint reports 10396 existing errors;
the only changed CSS file has exactly the same 102 diagnostics as HEAD after
normalizing line numbers. i18n lint cannot start because the cached SQLite pod
fails with `Exec failed, error: 86 (Bad CPU type in executable)` on arm64.

An isolated Chrome render of the actual recorded changed LUI tree through the
real SDK web renderer, using the supplied long title and property names at
922px width, measures **32px collapsed / 104px expanded**. It verifies one
visible collapsed pill, both expanded pills, translated Expand/Collapse
interaction, an unobscured property-key hit target, automatic control removal
when resized wide enough, and an empty area. Screenshots:
`/Users/devin/attachments/table89-bottom-{collapsed,expanded}-isolated.png`.
This is not acceptance of a rebuilt application or the native visual surface.
Live worker-driven updates, popover interaction and stateful editing across
responsive candidate switches still need integrated acceptance. No `static/`
build/write or `:3010` access occurred.

Logs: `/Users/devin/attachments/table89-bottom-ui-final.log`,
`table89-bottom-native-{test,build}-final.log`, `table89-bottom-worker.log`,
`table89-bottom-visual.log`, `table89-bottom-stylelint*.log` and
`table89-bottom-i18n.log` (all under `/Users/devin/attachments/`).

### Table90: retain bottom-pill expansion during numeric refresh

Table90 accepts embed-owner arrow navigation, Tab/Shift+Tab, journal heading
ink, bottom-property geometry, property-name activation, hidden following pills,
Expand/Collapse, responsive fitting and saved values on `dfce716e`. Its remaining
numeric-edit evidence is under `/Users/devin/table90/evidence/`: Master retains
expansion while LUI changes from 104px (116px narrow) to the collapsed 32px row.

The mounted reproduction exposes an outer ownership error: `Tree.row_sig`
retains the block shell but rebuilds `row_main` on block-record or render-cache
invalidation. Expansion allocated inside `block_below_pills` survived its own
property-data refresh, but not that enclosing content rebuild. The old fixture
mounted only the property area and therefore could not expose this path.
Expansion now belongs to the stable keyed row and is passed through `row_main`
to the property view. It remains local to each mounted occurrence rather than
being cached globally by block UUID; standalone property views retain their
local default. No geometry, fitting, worker, schema, SDK or translation changes.

The regression mounts the actual keyed block row, publishes the numeric value
88, and invokes the cache-invalidation/row-refresh pair used by the unknown-delta
worker-event branch. Before repair it fails the expansion assertion and two
subsequent refresh/collapse assertions. After repair it retains the Collapse
control, expanded height bound and displayed value. Existing collapsed, empty,
missing-value, key-target and collapse checks remain intact. The exact browser
worker payload that triggered Table90's remount was not captured; this is a
mounted reproduction of the ownership failure, not a browser event trace.

Gates: **6652 checks, zero failures**; native experimental tests and build pass.
Worker retains the preceding Table89 platform cases **[1, 7, 8]**, including
`Native secrets require the OS keychain host`: 3 failures / 994 tests.
`git diff --check` passes. Changed-state browser/narrow-layout and native visuals
remain unverified. No `static/` build/write or `:3010` access.
Logs: `/Users/devin/attachments/table90-bottom-{red-ui,ui,native-test,native-build,worker}.log`.

### Table90 property probes: numeric Submit, intrinsic fit and Node activation

The follow-up `*-property-probes.json` evidence locates expansion loss at numeric
commit, before Escape. The mounted regression now presses the numeric value,
enters 89 and dispatches **Submit**, exercising `set-block-property` through the
SDK and fake worker, cache invalidation and the real property-area refresh hook.
It checks the saved value and Collapse control without dispatching Escape.
Invalid numeric text writes nothing; empty Submit removes the value; both keep
expansion. The stable-row state repair remains in `73e39ad9`; no further state
ownership change is needed for this reproduction. The page-refresh hook is
stubbed in this unit fixture, so integrated worker/page refresh remains a
separate acceptance boundary.

Master's pill padding/gaps already match the typed 8px horizontal padding,
4px inner gap and 8px inter-pill gap. The extra intrinsic width came from LUI's
500-weight key/numeric buttons and a trailing 4px gap before an empty Node picker
button. Bottom key/numeric text now uses weight 400, numeric horizontal/vertical
padding is explicitly zero, and populated bottom Node values omit that empty
button. Inter Regular, the supplied strings and the real SDK web renderer now
produce **110.078125 / 525.4375 / 106.3125px**, exactly the three Master natural
pill widths. A **760px property area fits all three without Expand**; at 756px
Expand returns and the row remains 32px. No fixture-specific sizing was added.

Master's property `show-popup!` / `page-ref-cell-click` opens the value picker
for page-ref targets rather than supplying a redirect. Bottom Node links now
activate their existing anchored picker instead of navigating. The regression
presses the visible long Node text, checks the translated Set-property
placeholder and asserts no navigation action. Ordinary/table reference chips
retain navigation and their existing regressions. Empty Node values retain
their picker button. No new SDK API, dictionary entry or CSS change.

Gates: **6657 checks, zero failures**; native experimental tests/build pass.
The native build first encountered another Dune instance; the later run passes.
Worker retains the preceding Table90 platform failures **[1, 7, 8]**, including
`Native secrets require the OS keychain host`: 3 failures / 994 tests.
`git diff --check` passes. Isolated Chrome width verification passes; screenshots:
`/Users/devin/attachments/table90-probes-fit-{760,756}.png`.
This verifies fitting/widths, not full-app numeric editing or picker browser
acceptance; native visuals are also unverified. No `static/` build/write or
`:3010` access. Logs: `/Users/devin/attachments/table90-probes-{ui,native-test,native-build,worker,visual}.log`.

### Table91: rendered Node targets, ellipsis, controls and journal minimum

Table91 accepts expanded numeric Submit/reload and the 1092/1088 fit boundary.
The remaining Node navigation was outside the previous activation assertion:
the web renderer still emitted an `a.page-ref` around the visible text, and
`Sidebar_state.on_doc_click` independently delegates `a.page-ref, a.tag` clicks
to page navigation. Bottom Node values now render a labelled, zero-padding
ghost button with a text child and the existing anchored-picker callback.
Neither the button nor its text is a reference anchor. Ordinary/table reference
branches retain their links. Collapsed text additionally uses typed
`line_clamp:1`, `white_space:nowrap` and `text_overflow:ellipsis`; expanded text
has no line clamp. Intersecting the text with its parent's clip was insufficient
without making the text itself a single-line truncation box.

Expand/Collapse now use Master's weight **500** and **4px** icon gap, retaining
8px horizontal padding. The real SDK web renderer measures Expand at
**78.921875px**, with unchanged natural pill widths and 760/756px fitting.
Mounted regressions inspect the button kind, its text-child navigation selector,
the typed clamp and control props, and retain numeric normal/invalid/empty
Submit coverage plus picker activation without navigation.

The journal discrepancy is **not an extra gap per root**: both audits measure
28px root rows. Master `page.css` gives `.ls-page-blocks` a **60px minimum**;
`page.cljs` includes the **28px** Add row inside that region. One 28px root
therefore leaves a 4px remainder, whereas two roots leave none. Table88's fixed
4px query margin matched only the one-root case. Journals now reuse the existing
measured block-only minimum mechanism from standalone pages: the flat outliner
supplies the remaining `max(0,32 - measured_block_height)` before the queries,
separately from its existing 500px journal-section minimum. Empty journals keep
the full 60px minimum; wrapped blocks require no extra remainder. Tests cover
one/two roots, deletion/undo, empty and invalid measurements, and wrapped blocks.
This preserves the one-root position and removes 4px with two roots without
changing row spacing. The block-height measurement path is web-specific, like
the existing standalone-page minimum; native journal geometry is unverified.

Gates: **6663 checks, zero failures**; native experimental tests/build pass.
Worker retains Table90's platform cases **[1,7,8]**: 3 failures / 994 tests,
including `Native secrets require the OS keychain host`. `git diff --check`
passes. Isolated Chrome clicks on the real text span open **Set T91BottomNode**
in independent collapsed and expanded fixtures, with no page-ref ancestor or
navigation. Screenshots: `/Users/devin/attachments/table91-node-{collapsed,expanded}.png`.
At a 1088px viewport / 756px area the real renderer visibly shows the ellipsis:
`/Users/devin/attachments/table91-node-ellipsis-756.png`. Control evidence:
`/Users/devin/attachments/table91-expand-width.png`. These use the real SDK
renderer and application handlers with a scripted worker, not the rebuilt app.
Integrated journal positions and native visuals remain unverified. No `static/`
build/write or `:3010` access. Logs: `/Users/devin/attachments/table91-*.log`.

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

SDK entries mean LUI's currently exposed typed capability set. Host/platform
entries describe missing integrations or platform-specific controls separately;
neither category claims the underlying operating system can never support them.

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
| Reference filters | Table86 accepts initial order/counts and selection/exclusion. Larger-map ties differ because Master's Entity hash includes runtime database object identity; see the precise boundary analysis above. |
| Reference filter updates | Table87 accepts filter addition/removal; removal restores at least the normal result window while the popup retains its opening facet snapshot. |
| Linked-reference editing | Scoped snapshot sources now expose editable roots/children and mount the active editor. Source-history cause and mounted coverage are recorded above; rebuilt-browser editing remains unverified. |
| Configured journal queries | Today's journal now renders configured collapsed default queries with datalog results; empty/error/remount cases are covered. Rebuilt-browser acceptance remains pending. |
| Marketplace cards | Table86 accepts clamp, repository icon and geometry. Other residual title/artwork differences have not had a fresh broad audit. |
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
