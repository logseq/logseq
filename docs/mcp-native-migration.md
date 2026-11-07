# Native MCP Specification and Validation

## Source of Truth

The native Logseq implementation, SDK, tests and current
[tool map](mcp-native-tool-map.md) are now authoritative. Use the
[native end-to-end checklist](mcp-native-e2e-test.md) for live validation.
The dated native validation records below preserve their original coverage
and limitations; they do not override the current tool contracts or reopen
completed implementation work.

## Current state

The native server registers 56 tools, including `findEntities`.
`capabilities.graph.contract_revision` is `2026-11-07.2` and identifies the
implementation. Read routing and write safeguards are implemented;
old stage labels below are not a current implementation backlog.
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
- Preserve the historical Promesa shared-promise dependency follow-up below.
  Its targeted `capabilities` mitigation did not globally patch or upgrade the
  dependency; this is not evidence of a confirmed current MCP failure.
- Preserve retained fixtures and reconcile state before retrying ambiguous
  writes. Never perform live mutations without explicit approval.

## Contract rules

### 2.0.2 contracts

The [current tool-map contracts](mcp-native-tool-map.md#current-202-contracts)
and [end-to-end cases](mcp-native-e2e-test.md#202-regression-retest) define literal
search, heading imports, repeated-title creation, MCP deletion/archive titles,
capability discovery and session behavior.
The deployment marker is `capabilities.graph.contract_revision = 2026-11-07.2`,
with `compatibility_target = 2.0.2`. These identify the active implementation.

### Structured findEntities

The current native inventory is 56 tools. `findEntities` adds framed, read-only
page/block searches for empty first outline blocks, page-scoped literal text,
live/recycled inventories and exact counts. It calls `logseq.DB.findEntities`
in the existing API structure, using fixed query forms and typed inputs through
the existing DB query API. No new worker, worker route or DB schema is introduced.

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

### Post-migration getContentCapabilities (2026-10-09)

At this addition the native inventory grew to 55 tools. `getContentCapabilities()` is an
argument-free, read-only discovery tool for Logseq DB only. It does not ask
for a graph type and refuses a missing/non-DB graph internally. MCP calls
`logseq.DB.getContentCapabilities`; the new API aggregates existing application
registries behind a shared export and standard DB dispatch. It is a new safe
discovery purpose, not a duplicate implementation of `getExternalPlugin` or
a generic app-state access tool. No resolver redesign or extra DB alias is
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

### Post-migration datascriptQuery (2026-10-09)

User-confirmed migration completion is followed by one new tool:
`datascriptQuery`. At that addition the native inventory grew to 54 tools; historical
50/51/53-tool reports below describe their recorded builds, not this feature.
This is a general, read-only last resort, not a query specialized to the
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
resolution. No API implementations, DB schema or mutation routes were changed.

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

## Historical implementation and validation records

The stage labels, test counts, live results and fixture ledgers in this section
are historical. They do not establish current deployment or live-test status.

### Stage 0: reconnaissance record

Recorded native baseline: documentation was created, and Logseq build
and lint stages passed. The aggregate test task had a pre-existing Windows
failure in `logseq.api.plugin-test`.

Deliverables:

- architecture and ownership map
- complete tool map
- native contract index
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

### Stage 1: compatibility implementation record

Native implementation record. The API adapter is implemented in
`src/electron/electron/mcp_compat.cljs`; the six existing MCP tools now route
through it without changing their API method names or argument shapes, and
`getPageUUID` now uses a parameterized DB query to reject ambiguous or
recycled-page matches; `getTagUUID` uses the existing tag lookup route with
the same ambiguity contract, and `getTag` uses an exact UUID query constrained
to the Tag class. `getPropertyIndent` now uses the Property class to resolve a
single `:db/ident` without guessing. `getBlock` validates the UUID and calls
`logseq.DB.getBlock` with children excluded and page included; it distinguishes
missing entities and pages from blocks. `getTagUsers` now queries all page and block
holders for an exact tag UUID. `listOrphanTags` uses the Tag class and reverse
`:block/_tags` relation to list unused tags. `listOrphanProperties` validates
each property ident before checking whether it has any values. `listAssets`
uses `logseq.DB.listAssets` and returns asset records:
`uuid`, `title`, `type`, `size` (bytes), `checksum`, `external_url`, and
`external_file_name`. It inventories `:logseq.class/Asset` entities in stable
UUID order, excluding only entities with their own deleted-at flag; missing
metadata is null. It does not check parent or owning-page recycling, unlike
`findEntities`. Consequently an asset preserved on a recycled page remains
listed even though its inherited `recycled` state is true. This filtering
defect prevents the inventory from representing only live assets.
It neither scans the filesystem nor verifies/downloads files, and unregistered
files are outside its scope.
For purely local assets, `external_url` and `external_file_name` are null.
Use `getBlock` with the asset UUID to inspect the owning page and additional
properties, including image dimensions. Width and height are not fields in the
`listAssets` projection.
Moving an asset with `moveBlock` preserves its UUID and metadata. Recycling
its owning page with `deletePage` preserves the asset block and metadata while
`findEntities` classifies it as recycled. UI "Delete selected blocks" permanently
removes the asset block instead of producing a recycled fixture.
`listJournals` now uses a bounded query adapter and preserves
the optional four-query count envelope. `pageStats` now reports bounded page
counts, nested-page/orphan classification, and alias relations. `inspectPage`
now supports page, blocks, tags, properties, declared, and all detail levels.
`upsertNodes` remains excluded from MCP because it is outside the registered
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
holder-detach acknowledgement when holders exist and child-reparent
acknowledgement when children exist, then verifies deletion and cleanup;
holder titles, parents, Status values and other tags are preserved.
Unused childless tags need neither acknowledgement.
`addTag` verifies the target's tag relation and preserves page identity;
`removeTag` verifies removal while preserving other tags and page identity.
`deletePage` preserves the recycled page's title, UUID and block inventory.
When only recycled pages hold a requested title, `createPage` archives those
holders under UUID-based titles before creating and verifying the new page;
live or non-page holders remain conflicts. `createBlock` verifies its parent,
owning page and stored content;
`updateBlock` verifies title changes on the original UUID. `renamePage`
preflights title availability and verifies the original page UUID. `moveBlock`
checks cycle safety and verifies parent, page, descendants, and placement.
`removeBlock` inventories a bounded subtree before deletion and verifies every
UUID is absent afterward. `splitBlock` validates every part and verifies tail
sibling placement before truncating the original. `moveBlocks` preflights the
selection, stops on failed verification, and reports best-effort rollback;
it composes the existing verified `moveBlock` route.
`migratePage` previews literal top-level selection and reads the source after moving.
The native server exposes `createEmbed` and `listEmbeds` alongside its page
and block reads.
`createEmbed(parent_uuid, target_uuid)` routes through `logseq.DB.createEmbed`
and the normal editor/outliner insertion path. It supports page and block targets,
rejects self/ancestor targets, and verifies the persisted UUID, link, derived
reference, parent, and owning page. `dry_run` performs only identifier and ancestry
reads; the write API remains responsible for graph/type/recycled validation.
Dry-run ancestry uses the structural `:block/parent` relation, not a ref pull of
`:block/parent+` (which is not a ref attribute in the live graph). Lookup errors
are surfaced before comparing IDs. Terse dry runs return `uuid: null` without
changing the graph. Default capability checks skip the embed write route.
Page and block embeds retain their target links and placement, and block embeds
appear in backlinks. Removing an embed by its own UUID removes that reference
without deleting the target.
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
as evidence. Local success does not establish coverage for untested live cases.
`capabilities` reports inconclusive probes as `unknown`. By default it probes
read methods only and marks write-dependent methods `unknown` with
`basis: "not-probed"`; `probe_writes: true` explicitly opts into mutation
probes on a disposable graph. `createPage` remains unprobed, and `upsertNodes`
is neither probed nor reported.
Ongoing native validation requirements:

1. Record relevant native build and test results.
2. Maintain native schemas and domain contracts in the tool map.
3. Cover API adapter functions with focused tests.

For current contracts and outstanding live checks, use the tool map and
end-to-end checklist rather than interpreting historical stage criteria as
current deployment status.

### Stage 2: API-backed native reads record

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

Focused local checks pass, including compilation, resolver normalization, and
the `getBlockUUID` MCP adapter test. The full `electron.mcp-compat-test`
namespace stalled in a test-only run; do not report the full namespace as
passing. Collapsed-block `getBlock` variants still require dedicated coverage;
historical raw-prototype results below do not validate the current integration.

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
above or a production SLA. It establishes no optimization
target by itself; no writes were made.

For read changes, verify the current DB model and raw versus expanded output and
value/reference semantics; preserve identifiers, ordering, bounds and false
values. Test namespace-aware DB dispatch and errors, and distinguish focused
local evidence from live parity evidence. Validate suitable existing DB APIs
rather than automatically rewriting them. `getBlock` tests do not establish
coverage for other reads.

### Stage 3: API-routed write validation record

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

`retitleOverDuplicate` moves the requested title to the source UUID and parks
the eligible empty holder under a different title, preserving both identities.
Content-bearing, non-page and alias-related holders are refused without a rename.
An eligible holder with inbound content links can be parked; its links stay
bound to that holder's UUID rather than following the transferred title.

`moveBlock` positions blocks before/after siblings or as first/last children,
including cross-parent moves. Descendant-target refusal does not mutate the
page. `moveBlocks` rejects duplicate UUIDs and parent/child selections without
writing, and preserves supplied order for before/after/last-child placement.
Controlled rollback fault injection remains open.

`migratePage` previews the selected top-level UUIDs and moves them in order,
preserving their identities and the unselected source content.

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
confirmed zero descendants for both.

One combined multi-var async run misattributed a rename collision rejection to
two dry-run tests; those tests pass individually. Do not count that combined
run as passing validation.

For each write tool, record its API function(s), verify DB namespace dispatch,
and test validation, dry-run and acknowledgement gates, ordering or partial
failure behavior, API errors, and read-back verification. Add or expose a DB API
only when no suitable existing function supports the MCP contract; reuse
existing implementations rather than duplicating mutation logic. Live write
checks require an explicitly approved disposable graph and remain separate
from local validation. The recorded API-routed write audit and focused local
validation covered 23 graph-mutating tools. See Remaining verification and
limitations above for UI fixtures, session checks and other untested variants.

### Claude Desktop full run: 20261006-1104-k7q3

The user supplied a PARTIAL end-to-end report on 2026-10-06: all 53 tools
were called, 61 cases recorded, and cleanup completed without modifying
pre-existing data. Live page/tag sets returned to 51/18; twelve run-created
pages remain recycled because MCP cannot purge them. This is user-reported
evidence, not an independently repeated run or packaged-build certification.

| Case | Behavior / constraint | Details / remaining verification |
|---|---|---|
| K-05, K-04 | Invalid move selections and descendant targets are refused | Duplicate UUIDs, parent/child overlap and descendant targets fail preflight without mutation. Ancestry follows structural block/parent edges. |
| C-06, C-13 | Sibling and cross-parent placement preserves order | Before inserts immediately before a first or non-first sibling; after inserts immediately after. Cross-parent child placement inserts first, and last-child appends. |
| B-05 | UUID serialization | Page serialization converts UUIDs recursively; title inventory emits strings. Standard getBlock child lookup pairs are retained intentionally. |
| F-04 | Backlink relation groups | Structural embed links are excluded from property-value groups. Separate actual relations can still contribute overlapping holders. |
| G-02 | Migration previews do not write | Empty and nonempty dry runs return verified=false; a real empty no-op can remain verified=true. |
| K-10 | Recycled title holders are classified separately | Holder classification reads deleted-at metadata, including the SDK's colon-prefixed key. |
| H-02 | Repair diagnostics | Warnings are conditional on actual unresolved names or unverified writes. |
| E-02 | Inbound property-value counts | property_values counts inbound property-value references to the page; own value blocks may contribute to content_blocks. |
| B-02 | Empty seed inventory | Compare observed baseline/deltas rather than assuming a fixed seed count. |
| J-02 | Asset inventory and inherited recycling | Local PNG/PDF Asset-class blocks expose type, byte size, checksum and nullable external metadata. Assets on recycled pages remain listed because inherited recycling is not filtered. External-URL coverage requires a registered fixture. |

Preserve the cleanup ledger and recycled pages. Do not reuse their held titles
unless explicitly testing recycled-title reuse. UI fixtures and other untested
variants remain listed under Remaining verification and limitations.

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

### Current implementation scope

MCP uses the existing native API boundary. `findEntities` reuses existing API
queries rather than adding worker infrastructure. Caching, retry redesign,
schema changes and broad worker refactors are not pending MCP migration tasks;
they require separate scope and evidence.
