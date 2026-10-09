# Native MCP Migration Specification

## Reference

The behavioral reference is `mcp-logseq-db`. Its public contract is the 50
registered tools listed in [mcp-native-tool-map.md](mcp-native-tool-map.md).
The Python implementation, its tests, and live reliability tests are
authoritative when the prose documentation differs from code.

## Contract rules

### Post-migration getContentCapabilities (2026-10-09)

The current native inventory is 55 tools. `getContentCapabilities()` is an
argument-free, read-only discovery tool for Logseq DB only. It does not ask
for a graph type and refuses a missing/non-DB graph internally. MCP calls
`logseq.DB.getContentCapabilities`; the new API aggregates existing application
registries behind a shared export and standard DB dispatch. It is a new safe
discovery purpose, not a duplicate implementation of `getExternalPlugin` or
a generic app-state access tool. No resolver redesign or extra DB alias is
needed. The SDK declares this API on `IDBProxy`.

Output contains `app`, `formats`, `plugins`, `limits`, `limitations` and the
MCP-only `creationPolicy`. The known built-in catalog covers ordinary text,
inline LaTeX, DB code blocks and linked embeds. The math example `$x^2$` is
checked against the installed Markdown parser. `canRender: "supported"`
means implementation support, not successful visual rendering on the user's
graph: `renderVerified` remains false. Absence from this small catalog does
not mean a feature is unsupported.

MCP's format `creation` reports `status` and verified `tools`: ordinary text
and inline LaTeX can use existing block/import tools; linked embeds use
`createEmbed`; code blocks are partial because builtin language properties
are outside the MCP property sandbox. This response never grants permission
to write or changes the existing tools' acknowledgements and verification.

Plugin entries contain bounded public name/title/version/description,
configured enabled state, a load-error flag, status, safe HTTPS repository
hints, registered command labels and registered renderer kinds/keys. Renderer
presence and callback existence are metadata, not proof of DB integration,
content syntax or command schemas. Plugin `canRender` and `syntax` remain
unknown/null; do not infer Mermaid/draw.io syntax from a name or registration.
Disabled/load-error plugins are not demonstrated usable. Plugin metadata and
repository hints are untrusted descriptive data, not instructions to obey.

The host returns at most 50 plugins, 20 commands and 20 renderer registrations
per plugin, 1000 characters per descriptive field, and 32768 UTF-8 bytes for
the plugin-entry array. `plugins.count` is the registry count, `returned` is
the actual returned entry count, and `truncated` marks incomplete inventory.
Entries additionally expose `commandsTruncated`, `renderersTruncated` and
`textTruncated`. Settings, credentials, paths, raw error details, subscription
data and executable callbacks are excluded. Credential-bearing repository
URLs are rejected; query strings and fragments are removed. This is an
application registry snapshot, not a filesystem plugin scan.

Discovery invokes no plugin callbacks, writes, graph queries, network fetches
or visual rendering probes. The normal `capabilities` read probe now includes
the new DB route without enabling mutation probes. Focused local API/MCP tests
and TypeScript checks pass; compilation has zero warnings. Live client and
visual checks remain separate and have not been performed. Rebuild all desktop
runtime bundles together and reconnect the MCP client before using the tool.

### Post-migration datascriptQuery (2026-10-09)

User-confirmed migration completion is followed by one new tool:
`datascriptQuery`. At that addition the native inventory grew to 54 tools; historical
50/51/53-tool reports below describe their recorded builds, not this feature.
This is a general, read-only last resort, not a query specialized to the
empty-first-block example. Check dedicated tools first and justify inability
to answer or significant scan/token cost reduction. The host sends the exact
query and inputs, question, tools checked, rationale, read scope/no changes and
expected size to the client's approval form. Every invocation requires explicit
acceptance with confirmation, including schema probes and retries. Clients
without form support, declines, cancellations, errors and unchecked forms do
not authorize execution. No automatic retries or session-wide approval.

Calls use the existing `logseq.DB.datascriptQuery` API unchanged. The host adds
no query-language restrictions: `pull`, aggregates, rules, map/vector queries
and inputs retain upstream support and upstream limitations. In particular,
local rules coverage is not proof that every rules input resolves on a live
Logseq worker. Positional `inputs` follow Logseq's normal resolution behavior;
UUID values may require an EDN `#uuid` string rather than a plain UUID string.
No API implementations, DB schema or mutation routes were changed.

The output envelope is `{result, row_count, truncated, limits}`. Relation and
collection results retain complete rows up to 1000 rows and 65536 UTF-8 bytes
of serialized envelope text. Scalars and tuples retain their shape as one row;
an oversized single row is omitted as `result: null`, `row_count: 0`,
`truncated: true`. False, zero and untruncated null results are preserved.
Caps do not bound DB execution, full internal results or transport framing.
There is no automatic pagination. Writes require existing verified tools and
separate authorization.

Audit entries in Logseq's file-backed Electron log include an invocation UUID,
timestamp, exact query/inputs, request context, approval decision and outcome.
These logs may contain graph data: treat them as private when sharing reports.
The Claude Desktop stdio extension relays forms and decisions, and refuses
clients without form support. Rebuild/reinstall the extension and reconnect
after deploying the new desktop build.

Focused local ClojureScript tests and the bridge test pass; test compilation
has zero warnings. Live approval UX and graph-worker execution are not yet
validated. No live queries or graph writes were performed for this feature.

### Retained migration contracts

- Keep tool names, argument names, defaults, nullable values, and response
  fields during the compatibility stage.
- Preserve validation distinctions: invalid input, not found, ambiguous,
  rejected, transport failure, and read-back mismatch are different outcomes.
- Treat a successful API return as insufficient evidence for a write.
- Preserve `verified`, `verified_state`, observed/previous entities, diagnostic,
  terse `verbose=false` responses, and structured error envelopes.
- Preserve non-atomic batch operations and do not retry ambiguous writes.
- Preserve explicit acknowledgements for reference rewrites, alias loss,
  detach/reparent, value loss, and destructive deletion.

## Tool contract index

The complete per-tool input, route, validation, verification, edge-case, and
migration status table is maintained in [mcp-native-tool-map.md](mcp-native-tool-map.md).
The implementation-level contract is summarized by category here:

| Category | Tools | Validation and verification |
|---|---|---|
| Meta | `capabilities` | Report probe states and optional diagnostics. |
| Content discovery | `getContentCapabilities` | DB-only, no arguments, safe bounded application metadata and renderer registrations; rendering support and MCP creation support are separate; no plugin execution or writes. |
| Page reads | `getPageUUID`, `isTitleAvailable`, `findDuplicateTitles`, `inspectPage`, `pageStats` | Titles may be ambiguous; page UUIDs are exact; recycled pages do not resolve as live pages. |
| Block reads | `getBlockUUID`, `getBlock`, `searchBlocks`, `getBlockTree`, `findBacklinks`, `findOrphans` | UUID validation; search is case-sensitive, bounded, and single-attempt. |
| Tag reads | `getTagUUID`, `getTag`, `getTagUsers` | UUID/title distinction; ambiguous tag titles return candidates. |
| Property reads | `getPropertyIndent`, `getProperyUsers` | Idents are strict attribute names; values may be literals or references. |
| Lists | `listPages`, `listJournals`, `listTags`, `listProperties`, `listClosedValues`, `listOrphanTags`, `listOrphanProperties`, `listAssets`, `listStatus`, `listRecycled` | Preserve optional count envelopes, caps and recycled filtering; listAssets now inventories registered asset metadata, not filesystem availability. |
| Page writes | `importPage`, `repairLinks`, `createPage`, `renamePage`, `retitleOverDuplicate`, `deletePage`, `clearPage` | Read-back required; title clashes, aliases, references, and partial imports retain their current semantics. |
| Block writes | `createBlock`, `createPageofBlocks`, `updateBlock`, `splitBlock`, `moveBlock`, `moveBlocks`, `migratePage`, `removeBlock` | UUID validation; placement/order and partial batch results are observable and verified. |
| Tag writes | `creatTag`, `deleteTag`, `addTag`, `removeTag` | Namespace/entity validation; detach and child-reparent acknowledgements remain required. |
| Property writes | `createProperty`, `deleteProperty`, `addProperty`, `removeProperty` | `:db/ident` keys, plugin namespace restriction, property type/cardinality, and value-loss acknowledgement remain required. |

## Stage status

### Stage 0: reconnaissance

Status: documentation created; Python baseline is clean and the Logseq build
and lint stages pass. The aggregate test task has a pre-existing Windows
failure in `logseq.api.plugin-test`.

Deliverables:

- architecture and ownership map
- complete tool map
- reference contract index
- baseline test record

Baseline observations:

- The existing Logseq MCP server is in `src/electron/electron/mcp_server.cljs`
and uses Streamable HTTP sessions.
- Existing tool registration delegates to API methods through `api-fn`.
- `logseq.api.db` provides DB-worker-backed datascript queries.
- `logseq.api.db-based` provides existing editor/DB API operations for blocks,
pages, tags, and properties.
- `bb` is installed as Babashka `1.13.223`; OpenJDK `17.0.10` is also installed.
- The Chocolatey Clojure package is installed, but exposes `clojure` as a
PowerShell alias rather than a child-process executable. Logseq's Babashka
task therefore still reports `Cannot resolve program: clojure`.
- After adding user-level launchers and running from Git Bash, linting, carve,
translation validation, namespace checks, and ClojureScript compilation pass.
The exact selected test subset reports 11 failures in `logseq.api.plugin-test`:
Windows path separators (`\\` versus `/`) and plugin fixture contents. The
remaining selected tests pass.
- `Set-Location mcp-logseq-db; python -m pytest -q` passes: 403 tests.

### Stage 1: compatibility implementation

In progress. The first adapter seam is implemented in
`src/electron/electron/mcp_compat.cljs`; the six existing MCP tools now route
through it without changing their API method names or argument shapes, and
`getPageUUID` now uses a parameterized DB query to reject ambiguous or
recycled-page matches; `getTagUUID` uses the existing tag lookup route with
the same ambiguity contract, and `getTag` uses an exact UUID query constrained
to the Tag class. `getPropertyIndent` now uses the Property class to resolve a
single `:db/ident` without guessing, and `getBlock` uses an exact UUID query
that rejects page entities. `getTagUsers` now queries all page and block
holders for an exact tag UUID. `listOrphanTags` uses the Tag class and reverse
`:block/_tags` relation to list unused tags. `listOrphanProperties` validates
each property ident before checking whether it has any values. `listAssets`
now uses `logseq.DB.listAssets` instead of the reference server's attribute-name
probe. This intentionally changes its output from strings to asset records:
`uuid`, `title`, `type`, `size` (bytes), `checksum`, `external_url`, and
`external_file_name`. It inventories non-recycled `:logseq.class/Asset` entities
in stable UUID order; missing metadata is null. It neither scans the filesystem
nor verifies/downloads files, and unregistered files are outside its scope.
Local tests cover local/external assets, recycled exclusion, missing optional
metadata, empty inventory, false-positive property names, and API errors.
On 2026-10-06 a direct read-only MCP check confirmed the corrected advertised
description and 53-tool inventory; `listAssets` returned an empty array on the
current graph. Nonempty asset metadata was verified in local fixtures only.
Historical probe validation below refers to the old behavior, not this inventory.
`listJournals` now uses a bounded query adapter and preserves
the optional four-query count envelope. `pageStats` now reports bounded page
counts, nested-page/orphan classification, and alias relations. `inspectPage`
now supports page, blocks, tags, properties, declared, and all detail levels.
`upsertNodes` remains excluded from MCP because it is outside the reference
tool contract and performs unverified batch writes. `findDuplicateTitles` now
reports and ranks read-only groups, preserving alias protection and recycled-
page handling. `getProperyUsers` reports literal and resolved property values
for an exact ident. `createProperty` verifies the returned ident and stored
type; its capability probe uses a namespace-invalid title that is rejected
before any write. `deleteProperty` requires value-loss acknowledgement and
verifies removal before sweeping orphaned value blocks. `removeProperty`
clears one value with read-back verification while retaining the definition.
`addProperty` checks the writable namespace and type, deduplicates repeated
many-values, and verifies the stored value. `creatTag` refuses page/tag title
collisions and verifies the identity Logseq assigns. `deleteTag` requires
holder-detach and child-reparent acknowledgement and verifies deletion;
`addTag` verifies the target's tag relation and preserves page identity;
`removeTag` verifies removal while preserving other tags and page identity.
`createPage` checks title availability before writing and verifies the created
page by UUID. `createBlock` verifies its parent, owning page and stored content;
`updateBlock` verifies title changes on the original UUID. `renamePage`
preflights title availability and verifies the original page UUID. `moveBlock`
checks cycle safety and verifies parent, page, descendants, and placement.
`removeBlock` inventories a bounded subtree before deletion and verifies every
UUID is absent afterward. `splitBlock` validates every part and verifies tail
sibling placement before truncating the original. `moveBlocks` preflights the
selection, stops on failed verification, and reports best-effort rollback;
it currently composes `moveBlock`, using more reads than the optimized reference.
`migratePage` previews literal top-level selection and reads the source after moving.
There are 53 unique registered tools: all 50 Python reference names plus the
retained native `getPage` API route, `createEmbed`, and `listEmbeds` (five API-backed and 48 compatibility data tools).
`createEmbed(parent_uuid, target_uuid)` routes through `logseq.DB.createEmbed`
and the normal editor/outliner insertion path. It supports page and block targets,
rejects self/ancestor targets, and verifies the persisted UUID, link, derived
reference, parent, and owning page. `dry_run` performs only identifier and ancestry
reads; the write API remains responsible for graph/type/recycled validation.
Dry-run ancestry uses the structural `:block/parent` relation, not a ref pull of
`:block/parent+` (which is not a ref attribute in the live graph). Lookup errors
are surfaced before comparing IDs. A live dry run between the separate embed
host/target pages passed on 2026-10-06 with zero embeds before and after.
Default capability checks skip the embed write route. Local API and MCP tests
pass. On 2026-10-06 the user confirmed the embed workflow works in Claude Desktop.
That is user-reported live verification; the assistant independently performed
only the read-only dry-run check described above, not live create/remove writes.
Repeatable regression scope: page/block embeds, links/refs and placement,
backlinks, self/ancestor refusal, and removal without deleting the targets.
`listEmbeds` is read-only and accepts optional `page_uuid`, `target_uuid`, and
`limit` (default 100, maximum 1000). Page scope means the stored owning page,
not recursive nested-page ancestry; both filters are combined. The result contains
`embeds`, returned-row `count`, and `truncated`. Recycled embed blocks and embeds
on recycled pages are excluded. The target is not expanded.
Block-bearing reads expose an additive `embed` descriptor with `target_uuid`,
`target_type` (`page` or `block`), and `target_title`, alongside the original link.
This applies to page/block enumeration, trees, page inspection, backlinks,
tag/property-user inventories, status rows, and recycled inventories.
`getBlock` preserves its standard API result and resolves target metadata only
for linked blocks through `logseq.DB.datascriptQuery`; a missing target is marked
with `target_type: "missing"`. `getPage` retains structural children, including
nested embeds. Neither tree reader expands embedded target content.
`pageStats.empty_blocks` excludes embeds, so embeds count toward `content_blocks`.
Page-only lists remain page metadata; text search is not an embed inventory.
Use `listEmbeds` for embed discovery and `getBlock` to inspect a search match.
To remove an embed, pass its own UUID to `removeBlock`, not the target UUID.
An unverified creation can still have written a block; inspect before retrying.
Reliability regressions cover the live non-reference `parent+` schema and the MCP
error envelope, not just mocked entity maps. Missing read-back entities, links,
refs, or correct placement remain unverified and never trigger an automatic retry.
A returned read-back API error or rejected verification request is an MCP error
with the possible created embed UUID and explicit `listEmbeds` inspection guidance;
insertion is not repeated. Transport-failure fault injection covers this boundary.
The six remaining handlers are implemented: guarded recycling, metadata-preserving
clearing, duplicate-title parking, validated outlines, escaped imports, and exact
reference repair with independently acknowledged and capped page/tag creation.
Native differences: `clearPage` refuses nested pages; destructive inventories and
repair are bounded.
For repair text, page links use UUIDs while tags use verified existing titles;
tag relations are then verified by UUID, allowing native text normalization.
Electron compilation passes with zero warnings. On 2026-10-03 the focused
compatibility suite passes 99 tests and 431 assertions with zero failures/errors.
The previous misattributed non-DB rejection was traced to Promesa 11.0.678:
an exception in one handler on its shared resolved-null promise contaminates
later queued handlers. `capabilities` now returns explicit rejected promises
for unsupported/non-DB graphs instead of throwing in that shared callback path.
A concurrent rejection/independent-read regression covers this mitigation.
The dependency itself has not been globally patched or upgraded; other throwing
handlers sharing a promise remain a dependency-level risk for follow-up.
The user reports the live tools are working. Live verification is performed by
Claude Desktop separately from this local suite; retain its report and ledger
as evidence. Passing this gate does not automatically complete the broader
Stage 1 matrix or advance the migration plan.
`capabilities` reports inconclusive probes as `unknown`. By default it probes
read methods only and marks write-dependent methods `unknown` with
`basis: "not-probed"`; `probe_writes: true` explicitly opts into mutation
probes on a disposable graph. `createPage` remains unprobed, and `upsertNodes`
is neither probed nor reported.
Entry criteria still outstanding:

1. Both baselines have valid, recorded results.
2. Native schemas and domain handlers are designed from the tool map.
3. Compatibility adapter functions have focused tests.

Exit criteria:

- all 50 tools are registered with matching schemas
- reads and writes preserve Python behavior
- every write is read-back verified
- native unit and live graph tests pass
- no Python process or external relay is required

### Stage 2: API-backed native reads

Scope correction: MCP must call `logseq.DB.*`, but existing Editor APIs are
valid implementations behind that namespace. This project must not duplicate
or optimize existing Logseq getters. The custom raw block query and duplicate
`getPagesByTitle` API, exports, SDK entry, candidate, comparison flag, and
implementation-only tests have been removed. Useful compatibility-reader
regression coverage remains.

There are no changes to the existing getter, DB API implementation, API export
registry, or SDK proxy mechanism. The SDK interface exposes `DB.getBlock` with
the existing Editor signature; standard dispatch reaches the existing
`get_block` export. No special resolver, duplicate export, or custom SDK wrapper
is needed.

The single `electron.mcp-compat/get-block` adapter calls `logseq.DB.getBlock` with a validated UUID and
`includeChildren: false`, `includePage: true`. It retains the Editor response,
including default casing and child references, inside the MCP found/page/missing
envelope. It does not strip fields or change the underlying API to force parity.
Tests exercise the existing getter with DataScript-backed worker read stubs
and retain identifier/error/mismatched-UUID checks. The separate native module,
query-based getBlock implementation, and comparison switch have been removed.
The old comparison-launch instructions are superseded; the tool now has one
registered implementation and does not inspect `LOGSEQ_MCP_COMPARE_GETBLOCK`.

The existing `getPageBlockUUIDs` route initially failed live dispatch because
`getPageBlockUUIDs` was normalized to `get_page_block_uui_ds`, while the exported
method is `get_page_block_uuids`. The MCP server's method normalizer now preserves
the `UUIDs` acronym, with a focused regression test. No additional DB getter or
export was introduced.

`getPage` now calls the existing `get_page_data` export through
`logseq.DB.getPageData`, preserving its page-name argument and result/error
envelope without duplicating the CLI implementation. Local route, capability,
and SDK checks pass. Its same-graph DB-route recheck returned the retained
fixture's expected UUID/title and four blocks without modifying the graph.

On 2026-10-05 Claude completed a same-graph read-only sweep: all 28 read tools
PASS, with no FAIL and no writes. The corrected `getBlockUUID` retry returned
nine descendants. The graph remained unchanged (68 pages, 21 tags, one recycled
page); the earlier page count of 62 was a miscount. Orphan-tag/property results
were cross-checked through their holder tools. The UUID-titled tag, duplicate-
title pages, recycled outline, and Oct 4 blocks were left untouched.

Claude's latest `capabilities` retry passed on Logseq 2.0.1 after graph/version
metadata moved to DB-namespaced dispatch. It reported 21 read routes available.
Six reads remained `unknown` because invalid probe arguments returned not-found
or null, but each passed its independent live read. Twenty-three write-dependent
tools were skipped, zero write methods were probed, and `createPage` was not
probed. `listAssets` returned an empty array but remains an explicitly
unverified discovery probe, not a complete asset inventory.

The initial read-only run skipped `capabilities` because its probes could invoke
mutation routes. The safe default now probes read methods and reports
write-dependent methods as `unknown/not-probed`; local tests cover the default
and explicit opt-in modes. The prior same-graph safe-mode check passed before
the following namespace adjustment.
The graph/version metadata checks now use `logseq.DB.getAppInfo` and
`logseq.DB.checkCurrentIsDbGraph`, which dispatch to the existing exports. This
namespace adjustment passes local capability tests, and Claude's same-graph
safe-mode retry confirms the DB routes without probing writes.

Focused local checks pass, including compilation, resolver normalization, and
the `getBlockUUID` MCP adapter test. The full `electron.mcp-compat-test`
namespace stalled in a test-only run; do not report the full namespace as
passing. Earlier collapsed and property-bearing `getBlock` cases remain
unverified unless separately reported; historical raw-prototype results below
do not validate the current integration.

#### Historical Raw-Prototype Evidence: 2026-10-03

The results below describe the removed raw getter, not the current Editor alias.
Its former promotion and benchmark are superseded and must not be used as
validation or performance evidence for the alias. The ledger is retained because
the user-approved graph fixtures still exist; cleanup was not authorized.

The rebuilt desktop had DB graph `logseq_db_test` open and
`LOGSEQ_MCP_COMPARE_GETBLOCK=1`. Direct MCP initialization succeeded with the
normal 51-tool inventory and no `upsertNodes`. Direct SDK checks passed twice;
the user then supplied matching Claude results after reconnecting. No graph
writes were performed by these checks.

| Case | Ledger UUID / input | Result |
|---|---|---|
| Top-level childless marker | `6ac118d5-c740-4ec5-a529-4984cdeead35` | PASS: expected content; parent/page id 201 |
| Nested block `one` | `6ac12669-2335-4f23-b85d-0b5f8a81899b` | PASS: expected content; parent id 210, page id 201 |
| Top-level parent with children | `6ac12678-47c8-4013-972e-799b6a8911e2` | PASS: expected content; parent/page id 201 |
| Fixture page | `6ac118d2-4349-4903-8dee-b83ec2131cad` | PASS: found false, block null, page-not-block reason |
| Previously verified deleted block | `6ac11e38-f4a9-4679-83d2-674b9e8de7a5` | PASS: found false, block null, no page reason |
| Malformed input | `not-a-uuid` | PASS: `Unexpected API error: Entity query requires a UUID` |
| Collapsed block | `6ac1b92b-2864-4816-bb94-51501e1e2139` | PASS: collapsed true; parent/page id 201 |
| Property-bearing block | `6ac1b92c-35dc-414f-a5e5-1aedaecb1df8` | PASS: parent id 256, page id 201; raw value reference and independently resolved value |

Successful valid reads in comparison mode establish complete-envelope equality
for those cases. Returned block fields, ordering, parent and page references
matched the ledger. Children are deliberately not expanded; a parent-block
response alone does not independently prove its child inventory.

Earlier connector errors were connection blockers, not read mismatches: the
running server received stale-session requests while it had no initialized MCP
transports. A fresh direct session worked, and Claude subsequently reconnected.
The collapsed/property cases were initially blocked. The user subsequently
approved two new blocks and, after property discovery found no reusable plugin
definition, separately approved one new test property. All new entities are
retained; no existing block/page was edited or deleted and no cleanup occurred.

Approved fixture ledger:

- Collapsed parent: `6ac1b92b-2864-4816-bb94-51501e1e2139`, entity id 256.
- Property-bearing child: `6ac1b92c-35dc-414f-a5e5-1aedaecb1df8`, entity id 257,
  parent id 256; its value entity is id 258.
- Property definition: `:plugin.property._test_plugin/MCPGetBlockProperty20261004022547531`,
  entity id 255; verified value `mcp-getblock-property-20261004022547531`.

The existing collapse API did not persist a flag for the off-screen fixture
because its collapsability check depends on rendered child-state. Only the
new fixture was then collapsed through Logseq's standard outliner operation,
not a direct DataScript write. Read-back confirmed the stored flag before the
comparison passed. This setup finding was not repaired as part of getBlock.

Raw DB API output retains the namespaced property key; the existing MCP
serialization emits its short name. Both compatibility and native MCP reads
match that representation. The property value was independently resolved with
`getProperyUsers` using the full ident. Namespace preservation in MCP output is
a separate contract issue, not silently changed by this promotion.

After the former raw-getter promotion, the full MCP suite passed 109 tests / 486 assertions and
Electron compiled without warnings. The registered native handler and
`LOGSEQ_MCP_COMPARE_GETBLOCK=0` were verified in the live Electron runtime;
fresh MCP sessions then passed all eight cases on the native-only route.
The flag was changed in the then-current process without a desktop restart.
These checks do not validate the subsequent Editor alias. Current routing is
described above; the former native-only launch instructions no longer apply.

A separate read-only local benchmark checked equal raw responses over the shared
HTTP `/api` renderer/worker bridge, using three warm-up pairs and twenty measured
alternating pairs per block across three existing blocks. Across sixty measured
reads per implementation, median latency was 6.73 ms for `DB.getBlock` versus
14.37 ms for the compatibility query; p95 was 9.45 ms versus 21.33 ms. This is
local warmed API latency, not full MCP latency or a production performance
guarantee. Comparison mode still runs both reads.

A separate MCP-level read-only baseline on 2026-10-06 measured the full local
Streamable HTTP `getBlock` route on the retained marker UUID: five warmups,
thirty timed calls, 19.60 ms median, 21.61 ms p95, and a 1,201-byte response.
This is a single-process local sample, not comparable to the API-only benchmark
above, a Python baseline, or a production SLA. It establishes no optimization
target by itself; no writes were made.

The Stage 2 acceptance rules in `plan.md` apply to every read candidate:
verify the current DB model, define raw versus expanded output and value/reference
semantics, preserve identifiers/order/bounds/false values, test namespace-aware
DB dispatch and errors, and require focused local and live parity evidence.
Existing suitable DB APIs need validation rather than automatic rewrites.
Other reads have not been validated by the getBlock tests; they remain pending
their own evidence. Writes, caching, batching, and compatibility removal remain
outside this candidate.

### Stage 3: API-routed write validation

The MCP write adapters already call graph operations through `logseq.DB.*`
functions. Stage 3 audits and validates that route; it does not replace API
calls with direct editor, worker, or DataScript mutations. Existing APIs remain
the canonical mutation boundary and may delegate internally to Logseq's
editor/property handlers and graph worker.

Checkpoint: the static route audit maps all 23 graph-mutating tools to
`logseq.DB.*` functions. Focused local tests have been run for the routes and
safeguards recorded in the write section of `mcp-native-tool-map.md`; stale
title-holder and tag-user test mocks found during the audit were corrected.
The registered data-tool wrapper now marks returned API errors and thrown IPC
exceptions with `isError: true`; a focused test exercises the actual
`createProperty` and `updateBlock` adapters through that wrapper. Additional
`createBlock` and `updateBlock` tests confirm API errors stop before read-back.
`deletePage`'s API-error test confirms a refused recycle remains unverified and
leaves the page live; `deleteTag` rejects an API error before cleanup queries.
`deleteProperty` rejects an API error before sweeping orphan value blocks;
`createTag`, `addTag`, and `removeTag` reject before their post-write read-backs.
`addProperty` and `removeProperty` reject API errors before post-write read-back.
`moveBlock` reports an API error as unverified when the source retains its
original parent; `removeBlock` returns the still-present subtree as recovery
inventory when deletion fails.
`moveBlocks` reports partial progress and the unattempted remainder on API
failure; its local all-or-nothing test confirms best-effort parentage rollback,
not original sibling-position restoration. `splitBlock` preserves the original
content and skips truncation if a tail move returns an API error. `migratePage`
remains unverified and keeps the selected block at source when its move API
fails.
`createPage` rejects an API error before UUID read-back.
`renamePage` rejects an API error before its post-rename read-back.
`retitleOverDuplicate` preserves its partial-rename undo guidance when the
second rename API call fails.
`createPageofBlocks` returns an unverified result with the batch API error and
unexpected-inventory diagnostic.
`importPage` likewise reports an unverified inventory and leaves the target
unchanged when batch insertion fails.
`clearPage` returns unverified and keeps page content when a block-removal API
call fails.
`repairLinks` leaves failed placeholders unchanged and reports them as
unverified when a block rewrite API call errors.
Focused local API-error tests now cover all 23 graph-mutating routes, with the
route-specific outcome recorded in the tool map. These failures are injected
through mocked or in-memory API behavior.

One live API-backed flow passed on the user-confirmed disposable DB graph. The
51-tool inventory matched and the retained fixture identity was confirmed. A
temporary child block (`6ac43171-02c3-45b4-b2b7-cf7969e881c4`) was created,
read back, updated on the same UUID, read back again, removed, and confirmed
missing. No write-capability probes were enabled, and no other graph entities
were changed.

A second live flow created page `6ac432be-edbe-449f-9b3b-1f9020a9b50c`, read it
back, renamed it on the same UUID, and recycled it. `listRecycled` confirmed the
UUID afterward. The recycled page is a retained test artifact, consistent with
`deletePage` semantics; no write-capability probes were enabled.

A live `retitleOverDuplicate` flow created two temporary empty pages, moved the
requested title to the source UUID, verified the other UUID under the parked
title, then recycled and verified both pages. No pre-existing page was changed.

A live move flow created four temporary sibling blocks, verified `moveBlock`
placement after an anchor, then reordered two blocks through `moveBlocks` and
verified the requested order. All four blocks were removed and their temporary
page recycled. Separate live controls verified `moveBlock` before and
last-child sibling placement and child nesting; an initial before attempt was
unverified but a later order-capturing run passed. `moveBlocks` all-or-nothing
rollback remains untested live.

A first live `migratePage` attempt selected one of two source blocks and
returned unverified because `last-child` placement did not verify. Its pages
were recycled and both generated UUIDs were confirmed absent. The isolated
direct last-child controls and several fresh `migratePage` retries passed: the
matching block landed at target, the nonmatch remained at source, and generated
blocks/pages were cleaned up. The discrepancy has not reproduced; retain the
failed attempt in the record and monitor it rather than counting it as a pass.

A live `splitBlock` flow split one temporary block into three siblings, read
back titles `one`, `two`, and `three` in the expected UUID order, removed the
three generated blocks, and recycled the page.

A live `importPage` flow imported a three-entry parent/child/sibling outline
into a temporary page, verified all titles and page/parent relationships,
removed the child before its parent and sibling, and recycled the page.

A live `repairLinks` flow rewrote one placeholder in a temporary page to the
UUID of the confirmed existing fixture page, verified one update with no
missing targets, removed the temporary block, and recycled the page. No page or
tag creation was enabled in this repair flow.

A live missing-tag repair used explicit tag-creation acknowledgement, created
one tag and rewrote the placeholder. The temporary block was removed, the tag
was deleted after its holder count reached zero, and the page was recycled.

A second `repairLinks` flow used explicit page-creation acknowledgement to
create a missing target and rewrite the temporary placeholder. The source
block/page were cleaned up. Recycling the generated target page was refused
because built-in “Linked references” and “Unlinked references” holders retain
`:logseq.property/view-for` values for it. The page
`6ac43d02-a0d5-4b31-8836-68066968b4fd` (`MCP Stage3 Repair Target
e439c64f069b48148a0d16826a5f515a`) remains active; do not set
`acknowledge_reference_rewrite` without explicit user approval. The user chose
to leave this generated page active and preserve both existing references.

A live tag lifecycle created a temporary page and tag, verified the tag UUID,
attached the tag as the page's sole holder, removed the relation and verified
zero holders, deleted the tag and confirmed its title no longer resolved, then
recycled the temporary page. A prior attempt stopped on an incorrect response
shape assertion; read-back confirmed its generated tag was also absent with no
holders.

A live property lifecycle created a unique plugin definition and temporary
page, set and read back the value (including its resolved `value_entity`),
removed the value, confirmed zero holders, deleted the definition, confirmed the
title no longer resolved, and recycled the page. A prior attempt used the raw
entity ID instead of `value_entity.title`; its generated definition was
confirmed absent during cleanup.

A live `node` reference-property flow used a generated target page's numeric
entity ID, verified both the stored value and resolved `value_entity` ID/title,
removed the relation and property definition, and recycled both pages. A
`page` schema attempt was rejected by Logseq before property creation; both
generated pages were recycled.

A third flow live-tested `createPageofBlocks`: the corrected newline outline
created three descendants in two batch calls, and `getBlockUUID` returned all
three. An earlier single-line outline attempt created one block and was also
cleaned up. Both outline-test pages (`6ac4340e-d299-40c5-a570-8f97c4edf072` and
`6ac434a0-ab3d-481e-8b12-9c834785c6f4`) are recycled, and `getBlockUUID`
confirmed zero descendants for both. `clearPage` returned unverified on the
first multi-block call, but an identity-checked cleanup retry, a minimal live
clear, and a later fresh multi-block clear passed; the first-call discrepancy
has not reproduced. Keep the initial result documented and monitor it; no
current live clearPage mismatch remains.

One combined multi-var async run misattributed a rename collision rejection to
two dry-run tests; those tests pass individually. Do not count that combined
run as passing validation.

For each write tool, record its API function(s), verify DB namespace dispatch,
and test validation, dry-run and acknowledgement gates, ordering or partial
failure behavior, API errors, and read-back verification. Add or expose a DB API
only when no suitable existing function supports the MCP contract; reuse
existing implementations rather than duplicating mutation logic. Live write
checks require an explicitly approved disposable graph and remain separate
from local validation. The API-routed write audit and focused local validation
are complete for the 23 graph-mutating tools. Remaining untested live variants
and non-reproduced anomalies are listed in the tool map and plan; production
switching remains a separate explicit decision.

### Claude Desktop full run: 20261006-1104-k7q3

The user supplied a PARTIAL end-to-end report on 2026-10-06: all 53 tools
were called, 61 cases recorded, and cleanup completed without modifying
pre-existing data. Live page/tag sets returned to 51/18; twelve run-created
pages remain recycled because MCP cannot purge them. This is user-reported
evidence, not an independently repeated run or packaged-build certification.

| Case | Finding | Local correction / remaining gate |
|---|---|---|
| K-05, K-04 | Batch parent/child overlap was accepted; descendant-target move relied on an engine no-op | Recursive reverse-parent pulls now use actual block/parent edges for both guards and descendant verification. No-mutation regression passes without parent+ schema; exact pull accepted in a live read-only check. Fresh live guard retests required. |
| C-06, C-13 | Before placement inserted at the start of the parent, not next to a non-first target; after was skipped live | Existing move API now inserts before via the previous sibling, using top insertion only for the first target. Local before/after, first-sibling and cross-parent tests pass. Fresh live before/after retests required. |
| B-05 | Nested getPage and duplicate-title UUIDs serialized as ClojureScript objects | Page serialization converts UUIDs recursively; title inventory emits strings. Standard getBlock child lookup pairs are retained intentionally. |
| F-04 | Embed link was counted as both a ref and a property-value backlink | Structural link is excluded from property-value groups; one-embed total regression passes. Separate actual relations can still contribute overlapping holders. |
| G-02 | Empty migration preview was verified=true | Empty and nonempty dry runs now return verified=false; a real empty no-op can remain verified=true. |
| K-10 | Recycled title holder was labelled live | Holder classification now handles the SDK's colon-prefixed deleted-at key. |
| H-02 | Successful/idempotent repair always warned about unresolved placeholders | Diagnostic is conditional on actual unresolved names or unverified writes. |
| E-02 | property_values did not count values set on Host | This field counts inbound property-value references to the page. Tool description clarified; own value blocks may contribute to content_blocks. |
| B-02 | Empty seed blocks varied between pages | Not established as corruption. Continue comparing observed baseline/deltas rather than assuming a seed count. |
| J-02 | Reported uploads were not visible as Asset-class members | Populated/external/recycled asset cases remain BLOCKED. Confirm the files are registered Asset blocks in the same connected graph via the UI before rerunning. No upload repair or live asset writes were performed. |

Local corrections do not turn the original failing cases into live PASS results.
An intermediate recursive-rule query was rejected by native input resolution;
it was replaced, not counted as a passing check. The final reverse-parent pull
was independently accepted on a retained report page with zero graph writes.
Keep the original report and cleanup ledger. Rerun K-05/K-04 and C-06/C-13
on fresh approved fixtures; preserve the recycled pages and do not reuse their
held titles. Other untested variants listed in the report remain uncovered.

### Stable desktop testing

The recovery-screen investigation captured `TypeError: Failed to fetch` in the
renderer `:app` React boundary, originating in `frontend.persist-db.remote`.
Hot reload repeatedly stopped graph workers; logs also contain Windows socket
error 10055, so the original fetch failure is not attributed solely to reloads.
A fresh launch additionally exposed mixed artifacts: Electron expected
`44c5d3a827-dirty` while the Node worker reported `44c5d3a827`. Rebuilding app,
browser worker, Node worker, and Electron together resolved that mismatch.

The smoke runner now defaults to stable mode: stop old watching, compile all
four runtimes together, build webpack, start the HTTP server without source
watchers, verify the served bundle, then launch the compiled desktop. `-Watch`
explicitly opts into development hot reload; do not use it during live tests.
`-BuildOnly` rebuilds without launching. Graceful-close refusal aborts before
forcing app termination. No graph reindexing or cleanup is part of recovery.

This prevents the known watcher/build-mismatch mechanism, not every network or
worker failure. Never edit or partially rebuild runtime artifacts during a
stable test session. Pause mutations and reconcile state after any interruption.
The clean test graph's built-in pages, two empty journals, and twelve recycled
run pages match the cleanup report; an empty-looking UI after cleanup is expected.

### Stage 4: optimization

Not started. No caching, batching, retry redesign, schema change, or broad
worker refactor is permitted before behavioral parity.
