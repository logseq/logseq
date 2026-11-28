# Native MCP Specification and Validation

## Source of Truth

The native Logseq implementation, SDK, tests and current
[tool map](mcp-native-tool-map.md) are now authoritative. Use the
[native end-to-end checklist](mcp-native-e2e-test.md) for live validation.
This document describes current behavior, implementation constraints and
remaining work, not a history of migration stages or test runs.

## Current state

The native server registers 58 tools, including `findEntities`, `suggestLinks`
and `getGraphHealth`.
`capabilities.graph.contract_revision` is `2026-11-11.1` and identifies the
implementation. Read routing and write safeguards are implemented.
See the [tool map](mcp-native-tool-map.md) for current MCP contracts and the
[native DB API reference](native-db-api.md) for connection and native arguments.

### Current behavior

`capabilities` discovers registered read routes and classifies missing probe
entities as reachable routes. Write probes are disabled by default.
`searchBlocks` returns literal, case-sensitive title matches, including quoted
text, within the native candidate envelope.

`importPage` preserves nested headings, stripped titles, parent chains and
created UUIDs. Its expected/observed counts cover imported blocks separately
from the allowed empty page seed. Nested Markdown code fences are not a reliable
code-block creation route: fences/indentation can be lost and later blocks can
be omitted. These mismatches return `verified: false`; inspect the diagnostic
and actual page before retrying.
Structured search behavior and remaining checks are described below and in
the [tool map](mcp-native-tool-map.md).

`isTitleAvailable` distinguishes free titles, live/non-page conflicts and
reusable recycled-only titles using exact stored-title matching.
`createPage` refuses exact-title conflicts without writing;
dry runs preview archives without changing holders. Reuse renames each recycled
holder to `<original title> (<UUID>)`, preserves its UUID, recycled state and
blocks, and creates a new live page with a new UUID.

A case-variant title can bypass this exact-title preflight: `isTitleAvailable` can
report an occupied variant as available, while `createPage` can resolve it to
the existing page and return `verified: true` without creating anything.
This is a collision-reporting defect, not successful creation of a new page.

`deletePage` counts built-in reference views separately from real references.
Either side of an alias relation requires `acknowledge_alias_loss`; genuine
content links separately require `acknowledge_reference_rewrite`, including
links on alias holders. Alias-only deletion needs only the alias-loss flag.
Refusals list all required acknowledgements without writing. Recycling
preserves the page's title, UUID and blocks.
Content links from blocks on already recycled pages still count as real
references and require `acknowledge_reference_rewrite`.

`inspectPage` exposes resolved alias properties. `findBacklinks` shows both
genuine content links and alias property holders in separate relation groups.
Restoring a recycled alias-holder page in the UI preserves its alias and
backlinks. The alias-loss acknowledgement is a safety gate, not a statement
that recycling always erases the relation.

`deleteTag` lists holders and refuses without writing when `acknowledge_detach`
is required but absent. Acknowledged deletion removes the tag while preserving
holder titles, parents, Status values and other tags. An unused tag without
children needs no acknowledgement. Deleted tags no longer resolve through
`getTag` or appear in `listTags`.

`repairLinks` previews without writing, rewrites existing targets to real links
and leaves unresolved placeholders intact when creation is disabled.
Missing-target creation requires the acknowledgement for each kind being
created and sufficient explicit caps; creating both pages and tags needs both
acknowledgements. `listOrphanTags` includes unused user-created and built-in tags.

`findDuplicateTitles` groups identical stored titles in exact mode. Loose mode
normalizes case, punctuation and whitespace with simple suffix heuristics,
not full plural normalization. Fuzzy mode adds edit-distance grouping.
An unreferenced empty page beside one with content can be classified
`dead_stub`; differing titles give rank 1. Multiple content-bearing members
are `genuine_split`. These read-only classifications do not authorize a merge.

`createProperty` returns canonical idents and includes `normalized_from` in
terse and verbose results when the stored title differs. Native page-name
rules apply, including rejection of titles containing `#`.

`createEmbed` supports page/block targets, refuses self/ancestor targets and
returns a null UUID without writing in a terse dry run. `listEmbeds` discovers
embeds by target; block embeds appear in backlinks. Removing an embed by its
own UUID preserves the target.

Template application produces children in source order. Applying into an empty
block can reuse that block as the first child, so not every resulting child is
a new entity. Only the first resulting child carries
`logseq.property/used-template`, referencing the original template block, not a
copy. The original template's timestamp, tag and children remain unchanged,
and the template itself is not stamped. Other resulting children have no stamp;
`used-template` is not a complete child inventory.

`moveBlock` supports before/after sibling placement, including first and
non-first siblings, and cross-parent moves. `child` inserts as the first child;
`last-child` appends. Descendant targets are refused for both child and sibling
placements without changing blocks, orders or timestamps.

`moveBlocks` rejects duplicate UUIDs and parent/child overlap without mutation.
Its placement variants preserve input order. `migratePage`
previews literal top-level matches without writing, then preserves selected
UUIDs and order during the move while leaving unselected source content in place.

`removeBlock` removes childless blocks or entire subtrees while preserving
siblings; removing an embed does not remove its target subtree. `clearPage`
removes outline blocks while preserving the page entity and verifies absence.

`renamePage` refuses title collisions and recycled pages without changes.
`retitleOverDuplicate` parks an eligible empty page and preserves both UUIDs;
content-bearing, non-page and alias-related holders are refused without renaming.
Inbound content links alone do not block parking an eligible holder. Those
links stay attached to its UUID under the parked title; they are not retargeted
to the source page receiving that title.

Stale MCP sessions return HTTP 404. After a Desktop restart, reconnect by
initializing a new session; do not automatically retry an ambiguous write.

## Remaining verification and limitations

- Complete schema comparison, formal per-tool certification and independent
  packaged/watcher-free build verification remain open. Use the
  [end-to-end checklist](mcp-native-e2e-test.md) and approved disposable fixtures
  for remaining cases.
- Idle-timeout session expiry remains untested.
- `deleteTag` child-tag reparenting requires a suitable parent/child fixture.
  The current MCP toolset has no parent-tag setter, and the current tag UI has
  no Extends or parent control; `acknowledge_child_reparent` remains untested.
- Same-case duplicate titles require a suitable fixture. Case-variant title
  checks have collision-reporting defects: `isTitleAvailable` can report an
  occupied variant as available, and `createPage` can return the existing UUID
  as verified without creating a page. Exact-title preflight and native page
  resolution disagree.
- `repairLinks` refusal when a creation cap is too low remains untested.
- Controlled rollback and other developer-only reliability fault-injection
  checks remain open. External-URL assets require a suitable registered fixture;
  MCP has no asset-creation tool.
- `listAssets` inventories registered asset entities, not filesystem
  availability. Its query excludes only assets directly marked deleted;
  inherited recycling from parents or owning pages is not filtered. Assets
  preserved on a recycled page can still appear in the inventory. Inherited
  recycling exclusion is a current filtering defect, not a missing test fixture.
  Search and structured-query output limits do not bound database execution
  time or internal scans.
- Other enabled plugin features remain unverified. The DB block-to-page
  workflow does not establish support for unrelated plugin commands or
  rendering formats.
- Unavailable approval UI, form-specific confirmation and a usable custom-rule
  input format remain open checks; a built-in rule invocation is also unverified.
  Native HTTP command validation is separate
  from MCP/UI coverage and remains outside this validation scope.
- Promesa 11.0.678 has a shared resolved-null promise hazard: an exception in
  one handler can contaminate later queued handlers. `capabilities` avoids
  throwing in that callback path by returning explicit rejected promises.
  The dependency is not globally patched or upgraded; other throwing handlers
  sharing a promise remain a dependency-level follow-up, not a confirmed
  current MCP failure.
- Collapsed-block `getBlock` variants require dedicated current-route coverage.
  Confirm the stored collapse flag when preparing fixtures; off-screen collapse
  operations can depend on rendered child-state. Use the UI when needed.
  MCP serialization shortens namespaced property keys; namespace preservation
  is a separate contract concern, not permission to change the underlying API
  response.
- Preserve retained fixtures and reconcile state before retrying ambiguous
  writes. Never perform live mutations without explicit approval.

## Contract rules

### 2.0.2 contracts

The [current tool-map contracts](mcp-native-tool-map.md#current-202-contracts)
and [end-to-end cases](mcp-native-e2e-test.md#202-regression-retest) define literal
search, heading imports, repeated-title creation, MCP deletion/archive titles,
capability discovery and session behavior.
The deployment marker is `capabilities.graph.contract_revision = 2026-11-11.1`,
with `compatibility_target = 2.0.2`. These identify the active implementation.

### Structured findEntities

The current native inventory is 58 tools. `findEntities` adds framed, read-only
page/block searches for empty first outline blocks, page-scoped literal text,
live/recycled inventories and exact counts. It calls `logseq.DB.findEntities`
in the existing API structure, using fixed query forms and typed inputs through
the existing DB query API. No new worker, worker route or DB schema is introduced.

Page searches also support `name_source:"title"|"alias"|"both"` (default
`"title"`), with opt-in `aliases` and `matched_names` fields. Omitting the title
filter in alias mode gives a paginated alias inventory. Alias matches return
distinct declaring pages; ambiguous/shared names are not silently resolved.
Existing title-only defaults and the tool count are unchanged.

See the [tool-map examples and limits](mcp-native-tool-map.md#structured-entity-search)
for the filter vocabulary, selected fields and cursor/count contracts.
Output is bounded to 1000 rows and 65536 UTF-8 response bytes, with explicit
truncation/continuation; filter complexity is bounded. These limits do not bound
database execution time or internal scans. Count output is an exact aggregate,
not a partially scanned count.

Structured lookups require normal authentication but no per-query approval.
They accept no raw query text, regex, functions or arbitrary attributes, and
do not change `datascriptQuery` approval, audit or no-retry behavior.
It finds empty first-outline blocks, excludes child-bearing blocks when
requested, and supports case-sensitive page-scoped text and selected fields.
`has_link` matches the native `:block/link` used by embeds, not ordinary
`[[page references]]`; use backlink tools for those references.
Count output returns exact totals for the requested state. Empty searches
return no matches; invalid operators are rejected. Row output supports cursor
continuation, and a graph write invalidates the old cursor. Live, recycled and
all-state inventories use the same state predicates as exact counts. Row order
follows internal entity ID, not sibling order; use `getPage` and its order keys
to inspect placement.

### suggestLinks

`suggestLinks` is a read-only MCP composition of the alias-aware `findEntities`
API, not a new native API export. It matches supplied draft text against live
page titles and direct aliases, masks common markup/code, returns exact UTF-16
spans and all candidate targets, and rereads returned names before reporting.
Matching is case-sensitive and whole-name; ambiguity never selects a write
target. The scanner is conservative, not a full renderer/parser.

Scans fail explicitly above 10000 pages, 50000 name records or 8 MiB of inventory.
Draft, raw-span and response caps also apply; no cache, raw query or graph write
is introduced. See the [link-suggestion contract](mcp-native-tool-map.md#link-suggestions)
for exact inputs, output and truncation semantics. Automated native-query and
MCP protocol fixtures are not a live Desktop graph pass.

### getGraphHealth

`getGraphHealth` defaults to exact nonblank Page/Tag title groups (including
recycled), tags without direct holders, properties without values, live alias
ambiguity and literal import placeholders. Explicit `checks` replaces the
defaults; opt-in audits cover apparently empty/unreferenced pages, parent/page
mismatches, references to directly recycled targets, and closed-choice
membership. `page_uuids` scopes only the two page audits. No native export or
raw-query route is added. `getClosedValues({include_metadata:true})` supplies
choice identity/storage metadata; default API calls retain their original
projection. SDK options and a real-query regression test cover that contract.
Health alias counts exclude the alias carrier's own title as a competitor.
Ownership checks respect nearest nested-page boundaries, including recycled
pages, and expose `expected_page_uuid`. Recycle original-page/original-parent
bookkeeping is excluded from recycled-target references; genuine self-links
and view references remain. Native APIs, `findOrphans`, `findEntities` and
`suggestLinks` retain their existing behavior.

There is no healthy/unhealthy verdict, convention-dependent missing-summary/tag
check, merge eligibility, repair, or atomic snapshot guarantee.
Built-ins, retained recycled definitions, other references and child tags can
explain findings. Samples default to 5, optionally 1-20, including nested
members. Per-response caps are 10000 rows/8 MiB; aggregate caps are 32 MiB/400
calls, with fan-out limits of 100 pages, 100 recycled targets and 50 choice
properties. These do not bound native execution or transfer. Choice checks
report unsupported storage explicitly and do not validate class-scoped
exclusions or general schema rules. Errors never become
partial reports or zero counts. Responses above 65536 UTF-8 bytes error.
See the [health contract](mcp-native-tool-map.md#graph-health-observations).
Corrected health filters still require live Desktop verification.

### getContentCapabilities

`getContentCapabilities()` is an argument-free, read-only discovery tool for
Logseq DB only. It does not ask for a graph type and refuses a missing/non-DB
graph internally. MCP calls `logseq.DB.getContentCapabilities`; the API aggregates
existing application registries behind a shared export and standard DB dispatch.
It is a safe discovery purpose, not a duplicate implementation of `getExternalPlugin`
or a generic app-state access tool. No resolver redesign or extra DB alias is
needed. The SDK declares this API on `IDBProxy`.

Output contains `app`, `formats`, `plugins`, `limits`, `limitations` and the
MCP-only `creationPolicy`. The known built-in catalog covers ordinary text,
inline LaTeX, DB code blocks and linked embeds. DB code blocks render correctly,
inline LaTeX produces typeset math, and linked embeds display their targets.
Ordinary text renders bold and italic formatting.

`canRender: "supported"` advertises implementation support. Discovery returns
`renderVerified: false` because it does not perform visual probes; this field
does not track manual rendering checks. Absence from this small catalog does
not mean a feature is unsupported.

MCP's format `creation` reports `status` and verified `tools`: ordinary text
and inline LaTeX can use existing block/import tools; linked embeds use
`createEmbed`; code blocks are partial because builtin language properties
are outside the MCP property sandbox. This response never grants permission
to write or changes the existing tools' acknowledgements and verification.
For native code blocks, create/update the text and attach the built-in Code
tag. The tag sets the code display type, not the stored language. Selecting a
language in the UI stores it; MCP property writes cannot set that built-in
property. Do not infer a language from the tag or depend on an import fence.

Built-in Status/Priority choices and their holders are readable through the
list/property tools. MCP property writes remain restricted to the caller's
namespace; setting Status in the UI also applies the built-in Task tag.

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
or visual rendering probes. The normal `capabilities` read probe includes
the DB route without enabling mutation probes. Plugin rendering and syntax
outside the DB block-to-page workflow require separate integration checks.

#### DB block-to-page plugin workflow

The block-to-page workflow creates a new page and moves the source block's
children directly under it, preserving their UUIDs, creation times and order.
The source block keeps its UUID and original page placement, becomes a
`[[page title]]` link and has no children left. The new page's backlinks include
that source block.

The children are moved, not copied or recycled; no duplicate child entities are
created. Other blocks on the source page remain unchanged.

### datascriptQuery

`datascriptQuery` is a general, read-only last resort, not a query specialized to the
empty-first-block example. Check dedicated tools first and justify inability
to answer or significant scan/token cost reduction. The host sends the exact
query and inputs, question, tools checked, rationale, read scope/no changes and
expected size to the approval UI. Every invocation requires explicit
approval, including schema probes and retries. Form-capable clients receive
MCP elicitation and must return `approve: true` with acceptance. Otherwise
Logseq Desktop shows an Approve once/Cancel dialog, with Cancel as the default.
The Desktop dialog has no confirmation checkbox.

Cancel and closing the Desktop dialog with X produce the same refusal:
`Query not approved or request cancelled; nothing was run.` Neither executes
the query or triggers a retry. Missing approval UI, errors and unconfirmed form
responses also do not authorize execution. No automatic retries or session-wide
approval; a timed-out or revised request requires fresh approval.

Calls use the existing `logseq.DB.datascriptQuery` API unchanged. The host adds
no query-language restrictions. Positional inputs resolve through the native
API. Plain UUID strings are not coerced to UUID values, so typed UUID equality
can return an empty result without error. Comparing a stringified UUID in the
query body allows text comparison without input coercion. Custom-rule inputs
can fail during native parsing after approval; a supported wire representation remains
unverified. Local DataScript rules coverage does not establish live input
resolution.

The output envelope is `{result, row_count, truncated, limits}`. Relation and
collection results retain complete rows up to 1000 rows and 65536 UTF-8 bytes
of serialized envelope text. Scalars and tuples retain their shape as one row;
an oversized single row is omitted as `result: null`, `row_count: 0`,
`truncated: true`. False, zero and untruncated null results are preserved.
Caps do not bound DB execution, full internal results or transport framing.
There is no automatic pagination. Writes require existing verified tools and
separate authorization.

Audit entries in Logseq's file-backed Electron log (`main.log`) correlate
`requested`, `approval` and accepted-query `completed`/`failed` events by one
invocation ID, with timestamps, exact query/inputs, request context and decision.
Desktop Cancel and X dismissal are logged as ordinary declines. A client/device
timeout cancels pending approval without running the query or silently retrying;
a new request needs new approval. The timeout duration belongs to the
client/transport, not a fixed tool contract.
These logs may contain graph data: treat them as private when sharing reports.
The Claude Desktop stdio extension does not advertise form elicitation, so its
queries use the Logseq Desktop approval dialog. Rebuild/reinstall the extension
and reconnect after deploying a new desktop build.

Remaining checks: form-specific confirmation and refusal when neither an MCP
form nor a Desktop approval dialog is available. An unchecked checkbox case
is not applicable to the Desktop dialog.

### Validation and write safeguards

- Preserve public tool names, argument names, defaults, nullable values and
  response fields when changing implementation routes.
- Preserve validation distinctions: invalid input, not found, ambiguous,
  rejected, transport failure, and read-back mismatch are different outcomes.
- Treat a successful API return as insufficient evidence for a write.
- Preserve `verified`, `verified_state`, observed/previous entities, diagnostic,
  terse `verbose=false` responses, and structured error envelopes.
- Preserve non-atomic batch operations and do not retry ambiguous writes.
- Preserve explicit acknowledgements for reference rewrites, alias loss,
  detach/reparent, value loss, and destructive deletion.

## Tool contract index

The complete per-tool input, route, validation, verification, edge-case and
remaining-verification table is maintained in [mcp-native-tool-map.md](mcp-native-tool-map.md).
The implementation-level contract is summarized by category here:

| Category | Tools | Validation and verification |
|---|---|---|
| Meta | `capabilities` | Report probe states and optional diagnostics. |
| Content discovery | `getContentCapabilities` | DB-only, no arguments, safe bounded application metadata and renderer registrations; rendering support and MCP creation support are separate; no plugin execution or writes. |
| Page reads | `getPage`, `getPageUUID`, `isTitleAvailable`, `findDuplicateTitles`, `inspectPage`, `pageStats` | Titles may be ambiguous; page UUIDs are exact; recycled pages do not resolve as live pages. |
| Block reads | `getBlockUUID`, `getBlock`, `searchBlocks`, `getBlockTree`, `findBacklinks`, `findOrphans` | UUID validation; search is case-sensitive, bounded, and single-attempt. |
| Structured reads | `findEntities` | Read-only structured page/block lookup and exact counts; bounded output does not bound database execution time. |
| Tag reads | `getTagUUID`, `getTag`, `getTagUsers` | UUID/title distinction; ambiguous tag titles return candidates. |
| Property reads | `getPropertyIndent`, `getProperyUsers` | Idents are strict attribute names; values may be literals or references. |
| Lists | `listPages`, `listJournals`, `listTags`, `listProperties`, `listClosedValues`, `listOrphanTags`, `listOrphanProperties`, `listAssets`, `listStatus`, `listRecycled`, `listEmbeds` | Preserve optional count envelopes, caps and recycled filtering; listAssets inventories registered asset metadata, not filesystem availability. |
| Query | `datascriptQuery` | Read-only last resort; each exact query and its inputs require explicit approval. |
| Page writes | `importPage`, `repairLinks`, `createPage`, `renamePage`, `retitleOverDuplicate`, `deletePage`, `clearPage` | Read-back required; title clashes, aliases, references, and partial imports retain their current semantics. |
| Block writes | `createBlock`, `createEmbed`, `createPageofBlocks`, `updateBlock`, `splitBlock`, `moveBlock`, `moveBlocks`, `migratePage`, `removeBlock` | UUID validation; placement/order and partial batch results are observable and verified. |
| Tag writes | `creatTag`, `deleteTag`, `addTag`, `removeTag` | Namespace/entity validation; holder detachment and child reparenting require their respective acknowledgements only when those relations exist; unused childless tags need neither. |
| Property writes | `createProperty`, `deleteProperty`, `addProperty`, `removeProperty` | `:db/ident` keys, plugin namespace restriction, property type/cardinality, and value-loss acknowledgement remain required. |

## Implementation boundaries

MCP uses Streamable HTTP sessions and routes graph operations through
`logseq.DB.*`. Existing Editor APIs are valid implementations behind that
namespace; do not duplicate getters or mutate editors, workers or DataScript
directly from MCP. Add or expose a DB API only when no suitable existing
function supports the tool contract.

The API adapter is
[`electron.mcp-compat`](../src/electron/electron/mcp_compat.cljs).
`getBlock` calls `logseq.DB.getBlock` with a validated UUID,
`includeChildren: false` and `includePage: true`, retaining the standard
Editor response inside the found/page/missing envelope. `getPage` uses
`logseq.DB.getPageData` and the existing `get_page_data` export.
Namespace-aware dispatch must preserve acronym spellings such as
`getPageBlockUUIDs` -> `get_page_block_uuids`.

`findEntities` reuses existing API queries rather than adding worker
infrastructure. `upsertNodes` is outside the registered MCP contract and
performs unverified batch writes. Caching, retry redesign, schema changes
and broad worker refactors require separate scope and evidence.

### Read and verification semantics

- Preserve identifiers, ordering, bounds, false values and raw versus expanded
  property/reference semantics when changing reads. Child references in
  `getBlock` are not an expanded child inventory.
- Embed ancestry uses structural `:block/parent` edges;
  `:block/parent+` is not a ref attribute. Surface lookup errors before
  comparing IDs. Embed dry runs perform identifier and ancestry reads; the
  write API remains responsible for graph/type/recycled validation.
- Block-bearing reads expose `embed` metadata with `target_uuid`,
  `target_type` and `target_title`; missing targets use
  `target_type: "missing"`. Tree readers retain structural children without
  expanding embedded target content. Embeds count as content, not empty
  blocks, in `pageStats`.
- `pageStats.property_values` counts inbound property-value references;
  the page's own value blocks can contribute to `content_blocks`. Compare
  observed baselines and deltas rather than assuming a fixed empty-seed count.
- `listAssets` returns registered metadata in UUID order. Image dimensions
  require `getBlock`; local assets have null external URL/file-name fields.
  Moving an asset preserves its UUID and metadata. UI "Delete selected blocks"
  permanently removes the asset block, so recycle its owning page to prepare
  an inherited-recycling fixture.
- Returned API errors and thrown IPC exceptions use MCP `isError: true`.
  Missing or mismatched read-back state remains unverified. An unverified
  write may have mutated the graph; inspect reported UUIDs before retrying.
  Embed read-back failures retain the possible created UUID and
  `listEmbeds` inspection guidance without repeating insertion.
- `moveBlocks` reports partial progress and unattempted blocks on failure.
  Best-effort rollback restores parentage, not necessarily original sibling
  positions. `splitBlock` skips original-content truncation if a tail move
  fails; partial `retitleOverDuplicate` failures retain undo guidance.
- Test namespace dispatch, validation, dry runs, acknowledgement gates,
  ordering, partial failures, API errors and read-back verification.
  Mocked/in-memory API failures do not establish live transport recovery or
  packaged-build certification.

## Stable desktop testing

The smoke runner defaults to stable mode: stop old watching, compile renderer,
browser worker, Node worker and Electron together, build webpack, start the
HTTP server without source watchers, verify the served bundle, then launch
the compiled desktop. `-Watch` opts into development hot reload; do not use
it during live tests. `-BuildOnly` rebuilds without launching.
Graceful-close refusal aborts before forcing app termination.

Matching runtime artifacts and watcher-free testing avoid build-mismatch
and hot-reload interruptions, not every network or worker failure. Never
edit or partially rebuild runtime artifacts during a stable test session.
Pause mutations and reconcile state after any interruption. Recovery does
not authorize graph reindexing, fixture deletion or cleanup.
