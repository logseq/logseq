# Native MCP Tool Map

For Desktop HTTP connection, authentication, native command arguments, and
DB-compatible aliases, see the [Desktop DB Graph HTTP API Reference](./native-db-api.md).

This map describes the current 56-tool MCP implementation, its Logseq API routes,
validation evidence, and outstanding verification. MCP graph operations call
`logseq.DB.*` API functions; those APIs may delegate internally to shared
Editor/App/CLI implementations. Read routing and write safeguards are implemented,
not a pending migration roadmap. MCP does not directly mutate workers or the DB.

Local contract coverage and installed-app validation are separate evidence.
Read-only same-graph parity checks and approved disposable-graph write checks
must use the connected revision; one getter's evidence does not validate others.

All tables separate API routing, validation evidence, and outstanding verification.
Live results are historical unless explicitly tied to the current revision.
Dates and versions are retained where recorded; missing metadata is not inferred.
`None recorded` means no additional per-tool gap is listed, not that the current
revision has passed live verification. The revision-wide retest requirement below
still applies. Monitoring follow-ups remain listed; keeping existing API routes is
a shared implementation constraint, not an outstanding verification task.

## Current 2.0.2 contracts

Revision `2026-11-07.2` requires fresh installed-app verification; historical
passes below do not verify these changes:

- `capabilities` uses `logseq.DB.getMcpApiMethods` to read callable renderer API
  registrations. Missing-entity null results and explicit `Page "..." not found`
  or `No entity exists with exact UUID ...` errors establish route reachability.
  Unrelated session/database errors remain inconclusive, not available.
  Default write probing remains disabled. `graph.compatibility_target` identifies
  the intended compatibility target; neither the target nor registration
  claims successful real-payload or remote validation.
- `searchBlocks` preserves the native result envelope but filters its blocks to
  literal, case-sensitive title substrings. Snippets remain disabled. The native
  candidate limit and pagination are unchanged; this is not exhaustive search.
- `findEntities` adds structured read-only searches through the existing API
  query path, without raw query text or per-query approval. It supports
  Page-class pages, ordinary blocks, inherited recycling, page scope, literal
  text/structural filters, selected fields, cursor pagination and exact counts.
  Limits cap output and filter complexity, not DB execution time or scan work.
  See [examples and limits](#structured-entity-search).
- A title held by a live or non-page entity makes `createPage` return a no-write structured conflict with
  `status`, `created: false`, `verified: false`, and `held_by`, not MCP `isError`.
  `importPage` propagates creation conflicts without inserting content.
  When only recycled pages hold the requested title, `createPage` renames each
  to `<original title> (<UUID>)`, verifies its UUID, recycled state and block
  inventory, then creates the new page. Dry runs never rename; they return
  `status: "dry_run"` and `planned_archives` for recycled-only holders instead
  of a conflict. This previews title reuse, not archive-collision or preservation
  verification. `isTitleAvailable` reports `available: true`, `recycled: true`
  and `planned_archives` for recycled-page-only holders, while preserving
  `held_by`. Live or non-page holders remain unavailable. This is a reuse plan,
  not write-time verification; internal rename/archive guards still require
  actual title vacancy. Occupied archive
  titles or failed verification stop creation; successful prior renames are
  reported in `archived_pages` and must not be blindly repeated.
- Heading batches explicitly pass the existing `logseq.property/heading`
  property through `insertBatchBlock`; verification still checks heading,
  title, UUID, parent, page and inventory. Import verification allows at most
  one late empty top-level seed when the baseline page inventory was empty,
  and reports expected/observed imported-block counts. Other inventory changes
  remain unverified.
- `deletePage` calls the existing recycle API without renaming the page,
  verifying its title, UUID and block inventory. Built-in linked/unlinked
  reference views and related alias pages are reported separately in
  `references.built_in_views` and `references.aliases`; alias attributes do not
  contribute to `references.real`. Content links on an alias holder still count.
  Missing approvals return `status: "refused"`, `refused: true`, and all
  `required_acknowledgements`, without `verified` or a write.
  The recycled page keeps its title until explicitly reused through `createPage`.
- `createProperty` describes native title/ident normalization; callers must use
  its returned canonical ident. When the stored title differs, both result
  modes include `normalized_from` with the requested title. This reports the
  completed write, not a pre-write preview.
- `createEmbed` with `verbose: false` returns only `uuid`, `verified`, and
  `diagnostic`; dry runs have a null UUID and never insert a block. Removing
  an embed's target leaves an empty block that `listEmbeds` can no longer find.
  Remove the embed by its own UUID, not its target's UUID.
- Template application intentionally stamps `logseq.property/used-template`
  only on the first inserted child. Other inserted children are not stamped;
  the property is not a complete per-child provenance inventory. This matches
  tag application, manual application, and history replay.
- Unknown supplied MCP sessions return HTTP 404 to request reinitialization;
  missing invalid sessions remain HTTP 400. Mutations are never retried.

## Meta and reads

| Tool | Inputs / key contract | Behavior | Current Logseq API route | Validation evidence | Outstanding verification |
|---|---|---|---|---|---|
| `capabilities` | `include_diagnostics?`, `probe_writes?` | registration and route-reachability discovery; read-only by default, write probing disabled unless explicitly requested | `logseq.DB.getAppInfo`, `checkCurrentIsDbGraph`, and `getMcpApiMethods`, plus safe route probes | local registration/missing-entity classification coverage; an older 2.0.1 run reported 21 reads available, 6 reads unknown but independently live-passed, and no write probes; those totals are not the current inventory | fresh installed-app registration/classification retest required; safe-mode discovery does not verify writes |
| `datascriptQuery` | `query`, optional `inputs`; required `question`, `checked_tools`, `reason`, `reads`, `expected_size` for approval | gated read-only last resort; clients without form support fail closed; 1000-row/65536-byte output envelope with `truncated` | unchanged `logseq.DB.datascriptQuery` query and positional inputs, after fresh MCP form approval; Logseq's own read-only behavior | local approval/refusal/no-retry/audit, result-shape/UTF-8 limits, general DataScript and bridge tests pass | live approval and deployment verification pending |
| `getContentCapabilities` | none; DB-only, no graph-type argument | known built-in formats plus bounded plugin descriptions, status, repository hints, command labels and renderer keys; MCP adds supported/partial/unknown creation guidance | `logseq.DB.getContentCapabilities` uses the application's existing plugin metadata, command and renderer registries; shared API export/standard DB dispatch, not direct App calls from MCP | local API privacy/bounds/no-callback, parser syntax, MCP route/error and actual SDK protocol tests pass; SDK typecheck passes | no visual verification; live deployment verification pending |
| `getPage` | page name | full page with child blocks | existing `get_page_data` export via `logseq.DB.getPageData`; no duplicate getter | production route switched; local route/capability checks pass; historical same-graph DB-route recheck passed with the recorded UUID/title and four blocks | None recorded |
| `getPageUUID` | title | title-to-UUID lookup | fixed read-only queries through `logseq.DB.datascriptQuery` | historical same-graph live read passed for both recorded fixture titles | None recorded |
| `isTitleAvailable` | title | free or reusable title; recycled-page-only holders include an archive plan | dedicated `logseq.DB.getTitleHolders`; MCP preserves `held_by`, returning `available: true` and `recycled: true` only for recycled-page-only collisions | local reuse/mixed-holder tests | fresh installed-app contract verification required |
| `findDuplicateTitles` | `normalize`, `include_recycled` | Page/Tag title inventory plus usage/alias queries and grouping | `logseq.DB.getTitleInventory` supplies the complete Page/Tag candidate set; MCP retains normalization, grouping, ranking, and downstream queries | production route switched for inventory; local tests pass; historical same-graph exact-mode read passed (39 titles, no collisions) | None recorded |
| `inspectPage` | page UUID, `detail` | page plus selected blocks, tags, properties, or declarations | dedicated `logseq.DB.inspectPage` API; retains the detail envelope and query-shaped entity keys | API implemented; local tests pass; historical same-graph live reads passed for all six details | None recorded |
| `pageStats` | page UUID | fixed counts, subtree/alias/reference/property analysis | dedicated `logseq.DB.getPageStats` API owns the read-only DB aggregation and preserves the response/diagnostic contract | production route switched; local tests pass; historical same-graph live read passed (9 own blocks, 8 with content, no refs/orphans) | None recorded |
| `getBlockUUID` | page UUID | flat descendant list with order, parent/page references, and cross-page ancestry | dedicated `logseq.DB.getPageBlockUUIDs` API preserves the parent traversal and output fields | production route switched; acronym dispatch fixed (`UUIDs` now resolves to `uuids`); local tests and historical same-graph 9-descendant read passed | None recorded |
| `getBlock` | block UUID | exact entity query | single MCP adapter calls `logseq.DB.getBlock` using the existing Editor implementation and standard dispatch | production route switched; local tests pass; all eight historical same-graph cases pass, including collapsed and property-bearing blocks | None recorded |
| `searchBlocks` | `searchTerm` | literal, case-sensitive title filter over bounded native candidates | same exported `search` function through `logseq.DB.search`, snippets disabled; retain envelope/pagination | local literal-filter and MCP protocol coverage; historical native marker search passed | current literal-filter contract requires installed-app retest |
| `findEntities` | `kind`, `state?`, `page_uuid?`, `where?`, `select?`, `output?`, `limit?`, `cursor?` | structured literal/structural search, projected rows or exact count | `logseq.DB.findEntities`; fixed query forms and typed literal inputs through existing API `<q`, with no worker infrastructure changes | local API/SDK protocol coverage | installed-app verification pending |
| `getBlockTree` | block UUID, depth/node caps | expanded tree with bounded depth/node count, page/missing distinction, cycle guard | dedicated `logseq.DB.getBlockTree` owns traversal and bounds while preserving the response envelope | production route switched; local tests pass; historical same-graph bounded marker read passed | None recorded |
| `findBacklinks` | target UUID | separate refs, tag-holder, and property-value groups; counts overlap | dedicated `logseq.DB.getBacklinks` owns the three relation queries and preserves the grouped response/diagnostic | API implemented; local tests pass; historical same-graph reads returned 0 for fixture page and `testtag`, consistent with inspected graph | None recorded |
| `findOrphans` | page UUID | parent ancestry with mismatching stored page; preserves orphan rows | reuses `logseq.DB.getPageBlockUUIDs`; MCP filters by owning page UUID and preserves diagnostic | production route switched; local tests pass; historical same-graph read and pageStats/getBlockUUID cross-checks found 0 true orphans | None recorded |
| `getTagUUID` | title | `getTagsByName` | existing `logseq.DB.getTagsByName`; MCP preserves all ambiguous UUID candidates | production route switched; local tests pass; historical same-graph `testtag` lookup passed | None recorded |
| `getTag` | tag UUID | UUID/title/name projection query | existing `logseq.DB.getTag` API; MCP preserves its full PageEntity fields, including UUID/title/name and richer id/ident metadata | production route switched; local tests pass; historical same-graph `testtag` read passed | None recorded |
| `getTagUsers` | tag UUID | direct `:block/tags` holder query; returns UUID/title/name/page | dedicated `logseq.DB.getTagUsers` API; excludes inherited-only holders to preserve contract | production route switched; local tests pass; historical same-graph checks confirmed `testtag` has no holders and `MCP Smoke RefTag` has one | None recorded |
| `getPropertyIndent` | property title | exact-title property query; ambiguity candidates retained | dedicated `logseq.DB.getPropertiesByTitle` returns all matching property definitions; MCP preserves the existing ident/type/ambiguity envelope | API implemented; local tests pass; historical same-graph test property resolved to the expected exact ident and type | None recorded |
| `getProperyUsers` | exact property ident | literal values and resolved value entities | `logseq.DB.getPropertyUsers` owns holder lookup and entity resolution; public tool name and response stay unchanged | production route switched; local tests pass; historical same-graph existing property holder/value read passed | None recorded |

## Structured entity search

`findEntities` never accepts raw Datalog, scripts, regex, custom functions or
arbitrary attributes. Existing MCP authentication remains required;
`datascriptQuery` still requires fresh explicit approval on every invocation.

Find empty first outline blocks across live pages, excluding child-bearing
blocks and linked embeds:

```json
{
  "kind": "block",
  "where": {
    "all": [
      {"field": "position", "op": "eq", "value": "first_outline_child"},
      {"field": "title", "op": "empty"},
      {"field": "has_children", "op": "eq", "value": false},
      {"field": "has_link", "op": "eq", "value": false}
    ]
  },
  "select": ["uuid", "page_uuid"]
}
```

`first_outline_child` means the earliest ordered direct child of the owning
page, with internal entity ID breaking equal-order ties. Property-value children,
built-in view children and nested Page/Journal/Tag/Property entities do not compete
for that position. `has_children` tests any direct child, not just visible outline
children; `has_link` tests `:block/link` (linked blocks/embeds), not general refs.
Empty means exactly `""`, not whitespace.

For targeted content, use `kind: "block"`, `page_uuid`, and a title filter such
as `{"field":"title","op":"contains","value":"\u2014"}`, selecting `uuid` and
`title`. Text comparisons are literal and case-sensitive; query-looking text is
still just a literal. Supported title operators are `equals`, `contains`,
`starts_with`, and `empty`. Combine predicates using nonempty `all`/`any` arrays.

For a live-plus-recycled page-title prefix inventory, use `kind: "page"`,
`state: "all"`, a `starts_with` title filter, and `select: ["uuid","title","recycled"]`.
For an exact page count use `{"kind":"page","state":"all","output":"count"}`.
Pages mean Page-class entities, not every named entity or separate Tag/Property
definitions. Blocks exclude Page/Journal/Tag/Property entities. Recycling is
inherited through parent ancestry and the owning page.

Defaults are `state: "live"`, `output: "rows"`, `limit: 50`, and
`select: ["uuid","title","page_uuid"]`. Additional selectable fields are
`page_title`, `parent_uuid`, and `recycled`; unrelated data is not pulled.
An unknown/non-Page `page_uuid` is an error and scope is valid only for blocks.

The response is `{output,matches,count,count_is_exact,truncated,next_cursor,limits}`:

- Rows are ordered by internal entity ID. `count` is the returned row count,
  not a graph-wide total; `count_is_exact` is false for row output.
- `truncated: true` includes `next_cursor`. Supply it unchanged with the same
  graph/search parameters to continue; changing only `limit` is allowed.
  Graph changes invalidate cursors, and changes during a lookup fail explicitly.
  After any repair/write, restart the search rather than continuing an old cursor.
- `output: "count"` returns the exact total with `matches: []`, `next_cursor: null`,
  `count_is_exact: true`, and `truncated: false`. It does not accept a cursor;
  `limit` and `select` apply only to row output.
- Row output is capped at 1000 rows and 65536 UTF-8 bytes of the serialized
  response. An individually oversized selected row is an error: select fewer
  fields. Filters have at most 32 nodes and depth 4 (root depth zero);
  nonempty text literals have at most 1024 characters, with empty `equals`
  also allowed.
- The API selects bounded IDs before pulling rows. These are **output limits,
  not a hard database execution-time or scan-work budget**. Exact counts and
  broad/structural searches may still scan substantial graph data internally.
- Orphan audits, deleted-target references and duplicate-title predicates are
  not part of this vocabulary. Use existing dedicated tools or separately
  approved `datascriptQuery` for unsupported questions.

## Lists

| Tool | Inputs / key contract | Behavior | Current Logseq API route | Validation evidence | Outstanding verification |
|---|---|---|---|---|---|
| `listPages` | `expand?` | existing DB list API | same exported `list_pages` API via `logseq.DB.listPages`; options and payload unchanged | production route switched; historical same-graph reads passed; 68 pages before and after | None recorded |
| `listJournals` | `with_counts?`, `limit?` | journal-day candidates, descending sort, limit; optional count indexes | `logseq.DB.getJournalCandidates` supplies the same candidate fields; MCP retains sort/limit/count behavior | production route switched for candidates; local tests pass; historical same-graph Oct 3-5 reads and zero counts passed | None recorded |
| `listTags` | `expand?` | existing `list_tags` wrapper | same exported list API via `logseq.DB.listTags`; preserve expand option and namespaced payload | production route switched; local tests pass; historical same-graph result of 21 tags unchanged | None recorded |
| `listProperties` | `expand?` | existing `list_properties` wrapper | same exported list API via `logseq.DB.listProperties`; preserve expand option and namespaced payload | production route switched; local tests pass; historical same-graph property listing passed | None recorded |
| `listClosedValues` | none | property/value pairs from `:block/closed-value-property` | dedicated `logseq.DB.getClosedValues` preserves the two-entity row shape | production route switched; local tests pass; historical same-graph built-in value sets returned | None recorded |
| `listOrphanTags` | none | exact Tag entities with no direct reverse tag holders | dedicated `logseq.DB.getOrphanTags` preserves the entity fields and unused-tag semantics | production route switched; local tests pass; historical same-graph orphan results cross-checked against holders and backlinks | None recorded |
| `listOrphanProperties` | none | qualified property idents with no data holders | dedicated `logseq.DB.getOrphanProperties` combines property inventory and used attribute idents; preserves `{ident, title, type}` | production route switched; local tests pass; historical same-graph results cross-checked against `getProperyUsers` | None recorded |
| `listAssets` | none | registered asset metadata records; database inventory, not filesystem existence or unregistered-file discovery | `logseq.DB.listAssets` queries entities tagged with `:logseq.class/Asset`, excludes recycled assets, and returns UUID/title/type/size/checksum/external URL/file name in stable UUID order | local API/MCP metadata, filtering, empty-graph and error tests; historical live empty inventory and updated schema passed on 2026-10-06; populated inventory verified locally only | populated inventory not verified live |
| `listStatus` | none | entity/status-value pairs | dedicated `logseq.DB.getStatusRows` returns the query rows; MCP tool name and tuple shape stay unchanged | production route switched; local tests pass; historical same-graph empty result accepted | None recorded |
| `listRecycled` | none | all entities with `:logseq.property/deleted-at` | dedicated `logseq.DB.listRecycled` preserves deleted page and block records | production route switched; local tests pass; historical live check found one recycled outline page unchanged before/after | None recorded |

## Writes and verification

Every row below means: validate identifiers, snapshot affected state where
needed, perform the existing API operation, read back, compare, and preserve
the full/terse response behavior. Batch writes remain non-atomic.

| Tool | Inputs / key contract | Behavior | Current Logseq API route | Validation evidence | Outstanding verification |
|---|---|---|---|---|---|
| `importPage` | target, markdown/list, replace, dry-run | batch insert + queries | `logseq.DB.createPage` + `insertBatchBlock` (and `removeBlock` for replace) | verbatim inventory/read-back, dry-run-no-call, API-error-unverified, and historical live nested-content/read-back tests pass | current heading/count verification retest required |
| `repairLinks` | optional page, creation acknowledgements/caps | update blocks + page/tag creation; generated missing-page target remains active by user decision to preserve existing view references | `logseq.DB.updateBlock` + `createPage`/`createTag` | relation read-back, ambiguity, idempotency, explicit-creation, dry-run/cap, global-scan, API-error-unverified, historical live existing/missing-page/tag rewrites pass | None recorded |
| `createPage` | title, dry-run, verbose | create; archive only recycled title holders | `logseq.DB.getTitleHolders` + `renamePage` + `createPage` | live/non-page collision refusal, UUID archive/title-reuse, block preservation, dry-run and failure diagnostics covered locally | fresh installed-app title-reuse verification required |
| `renamePage` | page UUID, title, verbose | `renamePage` | `logseq.DB.renamePage` | same-UUID read-back, collision-no-write, API-error-before-readback, and historical live rename/read tests pass | recycled-page behavior not separately live-tested |
| `retitleOverDuplicate` | source UUID, title, suffix | two renames | two `logseq.DB.renamePage` calls | recycled-holder identity, partial-rename recovery, API-error undo-guidance, and historical live two-page identity/parking tests pass | other holder guards not separately live-tested |
| `deletePage` | UUID, reference/alias acknowledgements | recycle without rename | `logseq.DB.deletePage` | real-reference/alias gates, built-in-view exclusion, title/UUID/block preservation covered locally | fresh installed-app safeguard verification required |
| `clearPage` | page UUID, verbose | remove top-level blocks | DB queries + `logseq.DB.removeBlock` | metadata/property-subtree preservation, nested-page refusal, API-error-keeps-content, historical minimal live clear and three-block live clear pass | initial multi-block clear returned unverified once but did not reproduce; monitor |
| `createBlock` | parent UUID, title, dry-run, verbose | `insertBlock` | `logseq.DB.insertBlock` | parent/page/content, dry-run-no-write, API-error, and historical live disposable-graph create/read tests pass | None recorded |
| `createEmbed` | parent UUID, target UUID, dry-run, verbose | normal editor/outliner linked-block insertion with derived refs | `logseq.DB.createEmbed` | page/block target, ancestor refusal, live-schema dry-run, MCP error propagation, persisted-target verification, and no-retry read-back failure tests; historical user-confirmed Claude Desktop embed workflow on 2026-10-06; assistant independently verified live dry run only | current terse/dry-run contract retest required |
| `listEmbeds` | optional owning-page UUID, target UUID, limit (1-1000, default 100) | read-only active-embed discovery with explicit target UUID/type/title, combined filters, returned count and truncation | `logseq.DB.listEmbeds` | local API/MCP tests pass; historical user-confirmed Claude Desktop embed workflow; assistant did not perform live writes | None recorded |
| `createPageofBlocks` | page UUID, outline, dry-run, verbose | batch insert per parent | `logseq.DB.insertBatchBlock` | indentation prevalidation, nested parent/page verification, dry-run-no-insert, API-error-unverified, and historical live three-block/two-batch/read tests pass | None recorded |
| `updateBlock` | block UUID, title, dry-run, verbose | `updateBlock` | `logseq.DB.updateBlock` | success/read-back, dry-run-no-write, API-error, and historical live same-UUID update/read-back tests pass | None recorded |
| `splitBlock` | UUID, exactly one offset/delimiter | create parts then update original | `logseq.DB.insertBlock` + `moveBlock` + `updateBlock` | delimiter/offset, verify-before-truncate, API-error-preserves-original, and historical live three-part order/read tests pass | None recorded |
| `moveBlock` | UUIDs, target, placement, verbose | `moveBlock` | `logseq.DB.moveBlock` | child/last-child placement, page ownership, descendant refusal, API-error-unverified, and historical live `before`/`after`/`child`/`last-child` tests pass | `before` once returned unverified but passed on diagnostic rerun; monitor |
| `moveBlocks` | UUID list, target, placement, rollback flag | repeated move + order verification | repeated `logseq.DB.moveBlock` | preflight, supplied order, API-error partial-progress, local best-effort all-or-nothing rollback, and historical live order-preserving move tests pass | Live rollback requires fault injection; do not induce a real mutation failure on the graph. Other placement variants remain untested live |
| `migratePage` | source/target, substring, placement, dry-run | selected `moveBlocks` | `logseq.DB.moveBlock` via `moveBlocks` | literal top-level dry-run, source-remainder, and API-error-stays-at-source tests pass; historical live `last-child` migration passed twice | one initial unverified placement result did not reproduce; monitor |
| `removeBlock` | block UUID, verbose | `removeBlock` | `logseq.DB.removeBlock` | incomplete-inventory refusal, subtree absence, API-error recovery-inventory, and historical live temporary-block removal/absence tests pass | live-write evidence for other removeBlock targets not separately validated |
| `creatTag` | title, options, verbose | `createTag` | `logseq.DB.createTag` | generated identity, title-collision-no-write, API-error-before-readback, and historical live tag-create/read tests pass | None recorded |
| `deleteTag` | UUID, detach/reparent acknowledgements | `deletePage` + reference checks | `logseq.DB.deletePage` | detach/child acknowledgements, deletion/reference cleanup, API-error-before-cleanup, and historical live deletion/title-no-longer-resolves tests pass | None recorded |
| `addTag` | target UUID, tag UUID, verbose | `addBlockTag` | `logseq.DB.addBlockTag` | invalid-input, relation, page-identity, API-error-before-readback, and historical live sole-holder tests pass | None recorded |
| `removeTag` | target UUID, tag UUID, verbose | `removeBlockTag` | `logseq.DB.removeBlockTag` | invalid-input, relation, other-tag, page-identity, API-error-before-readback, and historical live zero-holder-after-detach tests pass | None recorded |
| `createProperty` | title, schema, options, verbose | `upsertProperty` | `logseq.DB.upsertProperty` | assigned ident/type read-back, invalid-title, returned-error envelope, and historical live unique-definition tests pass | current normalization metadata retest required |
| `deleteProperty` | ident, value-loss acknowledgement | `removeProperty` + value cleanup | `logseq.DB.removeProperty` + `removeBlock` | acknowledgement, cleanup, invalid-ident, API-error-before-cleanup, and historical live zero-holder deletion tests pass | None recorded |
| `addProperty` | target UUID, ident, value, options, verbose | `upsertBlockProperty` | `logseq.DB.upsertBlockProperty` | false/literal values, materialization, duplicate-many, API-error-before-readback, and historical live literal/node-reference value read-back tests pass | None recorded |
| `removeProperty` | target UUID, ident, verbose | `removeBlockProperty` | `logseq.DB.removeBlockProperty` | target-only removal, no-op detection, invalid-ident, API-error-before-readback, and historical live zero-holder removal tests pass | None recorded |

## Explicit compatibility notes

- A page is a block for target operations, but page identity and page-scoped
  queries must remain distinct.
- Properties are keyed by `:db/ident`, not UUID, and writes are restricted to
  the plugin namespace.
- `searchBlocks` accepts `searchTerm` and preserves Logseq's native envelope,
  filtering blocks to case-sensitive literal title matches. Do not assume
  exhaustive results, extra filters or count fields; do not automatically
  repeat a timed-out search.
- `moveBlock` placement distinguishes `child` from `last-child`; order is
  verified because `:block/order` is not a normal direct write.
- `deletePage`, `deleteTag`, `deleteProperty`, `clearPage`, and `removeBlock`
  retain acknowledgement and evidence requirements.
- `listAssets` returns asset metadata records.
  It inventories non-recycled Asset-class entities, not files on disk; remote
  or missing local files and null metadata must not be interpreted as verified files.
- The registered MCP tool names include `creatTag` and `getProperyUsers`.
  Preserve these public spellings unless a contract change is explicitly agreed.
