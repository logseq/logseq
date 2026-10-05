# Native MCP Migration Specification

## Reference

The behavioral reference is `mcp-logseq-db`. Its public contract is the 50
registered tools listed in [mcp-native-tool-map.md](mcp-native-tool-map.md).
The Python implementation, its tests, and live reliability tests are
authoritative when the prose documentation differs from code.

## Contract rules

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
| Page reads | `getPageUUID`, `isTitleAvailable`, `findDuplicateTitles`, `inspectPage`, `pageStats` | Titles may be ambiguous; page UUIDs are exact; recycled pages do not resolve as live pages. |
| Block reads | `getBlockUUID`, `getBlock`, `searchBlocks`, `getBlockTree`, `findBacklinks`, `findOrphans` | UUID validation; search is case-sensitive, bounded, and single-attempt. |
| Tag reads | `getTagUUID`, `getTag`, `getTagUsers` | UUID/title distinction; ambiguous tag titles return candidates. |
| Property reads | `getPropertyIndent`, `getProperyUsers` | Idents are strict attribute names; values may be literals or references. |
| Lists | `listPages`, `listJournals`, `listTags`, `listProperties`, `listClosedValues`, `listOrphanTags`, `listOrphanProperties`, `listAssets`, `listStatus`, `listRecycled` | Preserve optional count envelopes, caps, recycled filtering, and unverified asset status. |
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
uses `logseq.DB.getAssetAttributeNames` to preserve the reference server's
unverified attribute-name discovery query; it is not a complete asset inventory.
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
There are 51 unique registered tools: all 50 Python reference names plus the
retained native `getPage` API route (five API-backed and 46 compatibility data tools).
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

Claude then ran `capabilities` three times with `probe_writes: false`; results
were stable on Logseq 2.0.1. Twenty-one read routes were available. Six read
routes remained `unknown` because invalid probe arguments returned not-found or
null, but each passed its independent live read. Twenty-three write routes were
skipped, and `createPage` was not probed. `listAssets` returned an empty array
but remains an explicitly unverified discovery probe, not a complete asset
inventory.

The initial read-only run skipped `capabilities` because its probes could invoke
mutation routes. The safe default now probes read methods and reports
write-dependent methods as `unknown/not-probed`; local tests cover the default
and explicit opt-in modes. The same-graph safe-mode capability check is complete.

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

The Stage 2 acceptance rules in `plan.md` apply to every read candidate:
verify the current DB model, define raw versus expanded output and value/reference
semantics, preserve identifiers/order/bounds/false values, test namespace-aware
DB dispatch and errors, and require focused local and live parity evidence.
Existing suitable DB APIs need validation rather than automatic rewrites.
Other reads have not been validated by the getBlock tests; they remain pending
their own evidence. Writes, caching, batching, and compatibility removal remain
outside this candidate.

### Stage 3: native writes

Not started. Use existing Logseq editor/worker mutation machinery, preserve
ordering invariants and acknowledgement gates, and retain verification until a
stronger guarantee is documented and tested.

### Stage 4: optimization

Not started. No caching, batching, retry redesign, schema change, or broad
worker refactor is permitted before behavioral parity.
