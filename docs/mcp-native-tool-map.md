# Native MCP Tool Map

This map records native tool behavior, current Logseq API routes, and
validation status. All MCP graph operations must call `logseq.DB.*` API
functions; those APIs may delegate internally to Editor/OG implementations.
Stage 3 audits and validates write routes rather than replacing them with
direct editor, worker, or DataScript mutations.

All Stage 2 rows require a defined raw/expanded output contract, current DB
schema and canonical entity-classification coverage, namespace-aware dispatch,
focused local checks, and read-only live same-graph parity checks through Claude
Desktop or an explicitly authorized direct MCP client.
Candidate implementation, local validation, live validation, and production
switching are separate statuses; getBlock evidence does not validate other rows.

## Meta and reads

| Tool | Inputs / key contract | Behavior | Current Logseq API route | Status / next step |
|---|---|---|---|---|
| `capabilities` | `include_diagnostics?`, `probe_writes?` | capability probes | existing metadata exports are routed through `logseq.DB.getAppInfo` and `logseq.DB.checkCurrentIsDbGraph`; read-only by default | latest same-graph safe-mode run passed on 2.0.1 after DB namespace routing; 21 reads available, 6 invalid-argument reads unknown but independently live-passed, 23 write-dependent tools skipped, 0 write methods probed; `createPage` remains unprobed |
| `datascriptQuery` | `query`, optional `inputs`; required `question`, `checked_tools`, `reason`, `reads`, `expected_size` for approval | gated read-only last resort | unchanged `logseq.DB.datascriptQuery` query and positional inputs, after fresh MCP form approval; Logseq's own read-only behavior | local approval/refusal/no-retry/audit, result-shape/UTF-8 limits, general DataScript and bridge tests pass; client without form support fails closed; 1000-row/65536-byte output envelope, `truncated`; live approval and deployment pending |
| `getContentCapabilities` | none; DB-only, no graph-type argument | new post-migration read-only discovery | `logseq.DB.getContentCapabilities` uses the application's existing plugin metadata, command and renderer registries; shared API export/standard DB dispatch, not direct App calls from MCP | local API privacy/bounds/no-callback, parser syntax, MCP route/error and actual SDK protocol tests pass; SDK typecheck passes; known built-in formats plus bounded plugin descriptions, status, repository hints, command labels and renderer keys; MCP adds supported/partial/unknown creation guidance; no visual verification, live deployment pending |
| `getPage` | page name | full page with child blocks | existing `get_page_data` export via `logseq.DB.getPageData`; no duplicate getter | production route switched; local route/capability checks pass; same-graph DB-route recheck passed with the recorded UUID/title and four blocks |
| `getPageUUID` | title | `getPage`, query | existing `DB.datascriptQuery` compatibility lookup | use existing APIs behind DB aliases; duplicate `getPagesByTitle` implementation removed; same-graph live read passed for both recorded fixture titles |
| `isTitleAvailable` | title | exact-title holders across entity kinds, including recycled markers | dedicated `logseq.DB.getTitleHolders`; MCP classifies page/tag/property/block and preserves `held_by` | production route switched; local tests pass; same-graph live held/available checks passed |
| `findDuplicateTitles` | `normalize`, `include_recycled` | Page/Tag title inventory plus usage/alias queries and grouping | `logseq.DB.getTitleInventory` supplies the complete Page/Tag candidate set; MCP retains normalization, grouping, ranking, and downstream queries | production route switched for inventory; local tests pass; same-graph exact-mode read passed (39 titles, no collisions) |
| `inspectPage` | page UUID, `detail` | page plus selected blocks, tags, properties, or declarations | dedicated `logseq.DB.inspectPage` API; retains the detail envelope and query-shaped entity keys | API implemented; local tests pass; same-graph live reads passed for all six details |
| `pageStats` | page UUID | fixed counts, subtree/alias/reference/property analysis | dedicated `logseq.DB.getPageStats` API owns the read-only DB aggregation and preserves the response/diagnostic contract | production route switched; local tests pass; same-graph live read passed (9 own blocks, 8 with content, no refs/orphans) |
| `getBlockUUID` | page UUID | flat descendant list with order, parent/page references, and cross-page ancestry | dedicated `logseq.DB.getPageBlockUUIDs` API preserves the parent traversal and output fields | production route switched; acronym dispatch fixed (`UUIDs` now resolves to `uuids`); local tests and same-graph 9-descendant read passed |
| `getBlock` | block UUID | exact entity query | single MCP adapter calls `logseq.DB.getBlock` using the existing Editor implementation and standard dispatch | production route switched; local tests pass; all eight same-graph cases pass, including collapsed and property-bearing blocks |
| `searchBlocks` | `searchTerm` | existing Logseq search API with snippets disabled | same exported `search` function through `logseq.DB.search` standard dispatch; preserve native result shape and do not add unsupported filters | production route switched; local tests pass; same-graph marker search passed |
| `getBlockTree` | block UUID, depth/node caps | expanded tree with bounded depth/node count, page/missing distinction, cycle guard | dedicated `logseq.DB.getBlockTree` owns traversal and bounds while preserving the response envelope | production route switched; local tests pass; same-graph bounded marker read passed |
| `findBacklinks` | target UUID | separate refs, tag-holder, and property-value groups; counts overlap | dedicated `logseq.DB.getBacklinks` owns the three relation queries and preserves the grouped response/diagnostic | API implemented; local tests pass; same-graph reads returned 0 for fixture page and `testtag`, consistent with inspected graph |
| `findOrphans` | page UUID | parent ancestry with mismatching stored page; preserves orphan rows | reuses `logseq.DB.getPageBlockUUIDs`; MCP filters by owning page UUID and preserves diagnostic | production route switched; local tests pass; same-graph read and pageStats/getBlockUUID cross-checks found 0 true orphans |
| `getTagUUID` | title | `getTagsByName` | existing `logseq.DB.getTagsByName`; MCP preserves all ambiguous UUID candidates | production route switched; local tests pass; same-graph `testtag` lookup passed |
| `getTag` | tag UUID | UUID/title/name projection query | existing `logseq.DB.getTag` API; MCP preserves its full PageEntity fields, including UUID/title/name and richer id/ident metadata | production route switched; local tests pass; same-graph `testtag` read passed |
| `getTagUsers` | tag UUID | direct `:block/tags` holder query; returns UUID/title/name/page | dedicated `logseq.DB.getTagUsers` API; excludes inherited-only holders to preserve contract | production route switched; local tests pass; same-graph checks confirmed `testtag` has no holders and `MCP Smoke RefTag` has one |
| `getPropertyIndent` | property title | exact-title property query; ambiguity candidates retained | dedicated `logseq.DB.getPropertiesByTitle` returns all matching property definitions; MCP preserves the existing ident/type/ambiguity envelope | API implemented; local tests pass; same-graph test property resolved to the expected exact ident and type |
| `getProperyUsers` | exact property ident | literal values and resolved value entities | `logseq.DB.getPropertyUsers` owns holder lookup and entity resolution; public tool name and response stay unchanged | production route switched; local tests pass; same-graph existing property holder/value read passed |

## Lists

| Tool | Inputs / key contract | Behavior | Current Logseq API route | Validation status |
|---|---|---|---|---|
| `listPages` | `expand?` | existing DB list API | same exported `list_pages` API via `logseq.DB.listPages`; options and payload unchanged | production route switched; same-graph reads passed; 68 pages before and after |
| `listJournals` | `with_counts?`, `limit?` | journal-day candidates, descending sort, limit; optional count indexes | `logseq.DB.getJournalCandidates` supplies the same candidate fields; MCP retains sort/limit/count behavior | production route switched for candidates; local tests pass; same-graph Oct 3-5 reads and zero counts passed |
| `listTags` | `expand?` | existing `list_tags` wrapper | same exported list API via `logseq.DB.listTags`; preserve expand option and namespaced payload | production route switched; local tests pass; same-graph result of 21 tags unchanged |
| `listProperties` | `expand?` | existing `list_properties` wrapper | same exported list API via `logseq.DB.listProperties`; preserve expand option and namespaced payload | production route switched; local tests pass; same-graph property listing passed |
| `listClosedValues` | none | property/value pairs from `:block/closed-value-property` | dedicated `logseq.DB.getClosedValues` preserves the two-entity row shape | production route switched; local tests pass; same-graph built-in value sets returned |
| `listOrphanTags` | none | exact Tag entities with no direct reverse tag holders | dedicated `logseq.DB.getOrphanTags` preserves the entity fields and unused-tag semantics | production route switched; local tests pass; same-graph orphan results cross-checked against holders and backlinks |
| `listOrphanProperties` | none | qualified property idents with no data holders | dedicated `logseq.DB.getOrphanProperties` combines property inventory and used attribute idents; preserves `{ident, title, type}` | production route switched; local tests pass; same-graph results cross-checked against `getProperyUsers` |
| `listAssets` | none | registered asset metadata records | `logseq.DB.listAssets` queries entities tagged with `:logseq.class/Asset`, excludes recycled assets, and returns UUID/title/type/size/checksum/external URL/file name in stable UUID order | local API/MCP metadata, filtering, empty-graph and error tests; live empty inventory and updated schema passed on 2026-10-06; populated inventory verified locally only; database inventory, not filesystem existence or unregistered-file discovery |
| `listStatus` | none | entity/status-value pairs | dedicated `logseq.DB.getStatusRows` returns the query rows; MCP tool name and tuple shape stay unchanged | production route switched; local tests pass; same-graph empty result accepted |
| `listRecycled` | none | all entities with `:logseq.property/deleted-at` | dedicated `logseq.DB.listRecycled` preserves deleted page and block records | production route switched; local tests pass; one recycled outline page unchanged before/after |

## Writes and verification

Every row below means: validate identifiers, snapshot affected state where
needed, perform the existing API operation, read back, compare, and preserve
the full/terse response behavior. Batch writes remain non-atomic.

| Tool | Inputs / key contract | Behavior | Current Logseq API route and local evidence | Remaining gates |
|---|---|---|---|---|
| `importPage` | target, markdown/list, replace, dry-run | batch insert + queries | `logseq.DB.createPage` + `insertBatchBlock` (and `removeBlock` for replace); verbatim inventory/read-back, dry-run-no-call, API-error-unverified, and live nested-content/read-back tests pass | keep API routes |
| `repairLinks` | optional page, creation acknowledgements/caps | update blocks + page/tag creation | `logseq.DB.updateBlock` + `createPage`/`createTag`; relation read-back, ambiguity, idempotency, explicit-creation, dry-run/cap, global-scan, API-error-unverified, live existing/missing-page/tag rewrites pass | generated missing-page target remains active by user decision to preserve existing view references; keep API routes |
| `createPage` | title, dry-run, verbose | `createPage` | `logseq.DB.getTitleHolders` + `logseq.DB.createPage`; collision refusal, UUID read-back, dry-run, API-error, and live unique-page create/read tests pass | keep API route |
| `renamePage` | page UUID, title, verbose | `renamePage` | `logseq.DB.renamePage`; same-UUID read-back, collision-no-write, API-error-before-readback, and live rename/read tests pass | recycled-page behavior not separately live-tested; keep API route |
| `retitleOverDuplicate` | source UUID, title, suffix | two renames | two `logseq.DB.renamePage` calls; recycled-holder identity, partial-rename recovery, API-error undo-guidance, and live two-page identity/parking tests pass | other holder guards not separately live-tested; keep API route |
| `deletePage` | UUID, reference/alias acknowledgements | recycle via `deletePage` | `logseq.DB.deletePage`; alias/reference no-write gates, same-UUID recycling, API-error-stays-live, and live recycle/listRecycled tests pass | keep API route |
| `clearPage` | page UUID, verbose | remove top-level blocks | DB queries + `logseq.DB.removeBlock`; metadata/property-subtree preservation, nested-page refusal, API-error-keeps-content, minimal live clear, and fresh three-block live clear pass | initial multi-block clear returned unverified once but did not reproduce; monitor |
| `createBlock` | parent UUID, title, dry-run, verbose | `insertBlock` | `logseq.DB.insertBlock`; parent/page/content, dry-run-no-write, API-error, and live disposable-graph create/read tests pass | keep API route |
| `createEmbed` | parent UUID, target UUID, dry-run, verbose | new native capability | `logseq.DB.createEmbed`; normal editor/outliner linked-block insertion, derived refs, page/block target, ancestor refusal, live-schema dry-run, MCP error propagation, persisted-target verification, and no-retry read-back failure tests | user confirmed Claude Desktop embed workflow on 2026-10-06; assistant independently verified live dry run only |
| `listEmbeds` | optional owning-page UUID, target UUID, limit (1-1000, default 100) | new native capability | `logseq.DB.listEmbeds`; read-only active-embed discovery with explicit target UUID/type/title, combined filters, returned count and truncation | local API/MCP tests pass; user confirmed Claude Desktop embed workflow; assistant did not perform live writes |
| `createPageofBlocks` | page UUID, outline, dry-run, verbose | batch insert per parent | `logseq.DB.insertBatchBlock`; indentation prevalidation, nested parent/page verification, dry-run-no-insert, API-error-unverified, and live three-block/two-batch/read tests pass | keep API route |
| `updateBlock` | block UUID, title, dry-run, verbose | `updateBlock` | `logseq.DB.updateBlock`; success/read-back, dry-run-no-write, API-error, and live same-UUID update/read-back tests pass | keep API route |
| `splitBlock` | UUID, exactly one offset/delimiter | create parts then update original | `logseq.DB.insertBlock` + `moveBlock` + `updateBlock`; delimiter/offset, verify-before-truncate, API-error-preserves-original, and live three-part order/read tests pass | keep API routes |
| `moveBlock` | UUIDs, target, placement, verbose | `moveBlock` | `logseq.DB.moveBlock`; child/last-child placement, page ownership, descendant refusal, API-error-unverified, and live `before`/`after`/`child`/`last-child` tests pass | `before` once returned unverified but passed on diagnostic rerun; monitor |
| `moveBlocks` | UUID list, target, placement, rollback flag | repeated move + order verification | repeated `logseq.DB.moveBlock`; preflight, supplied order, API-error partial-progress, local best-effort all-or-nothing rollback, and live order-preserving move tests pass | Live rollback requires fault injection; do not induce a real mutation failure on the graph. Other placement variants remain untested live; keep API route |
| `migratePage` | source/target, substring, placement, dry-run | selected `moveBlocks` | `logseq.DB.moveBlock` via `moveBlocks`; literal top-level dry-run, source-remainder, and API-error-stays-at-source tests pass | live `last-child` migration passed twice; one initial unverified placement result did not reproduce; monitor |
| `removeBlock` | block UUID, verbose | `removeBlock` | `logseq.DB.removeBlock`; incomplete-inventory refusal, subtree absence, API-error recovery-inventory, and live temporary-block removal/absence tests pass | live-write evidence for other removeBlock targets not separately validated; keep API route |
| `creatTag` | title, options, verbose | `createTag` | `logseq.DB.createTag`; generated identity, title-collision-no-write, API-error-before-readback, and live tag-create/read tests pass | keep API route |
| `deleteTag` | UUID, detach/reparent acknowledgements | `deletePage` + reference checks | `logseq.DB.deletePage`; detach/child acknowledgements, deletion/reference cleanup, API-error-before-cleanup, and live deletion/title-no-longer-resolves tests pass | keep API route |
| `addTag` | target UUID, tag UUID, verbose | `addBlockTag` | `logseq.DB.addBlockTag`; invalid-input, relation, page-identity, API-error-before-readback, and live sole-holder tests pass | keep API route |
| `removeTag` | target UUID, tag UUID, verbose | `removeBlockTag` | `logseq.DB.removeBlockTag`; invalid-input, relation, other-tag, page-identity, API-error-before-readback, and live zero-holder-after-detach tests pass | keep API route |
| `createProperty` | title, schema, options, verbose | `upsertProperty` | `logseq.DB.upsertProperty`; assigned ident/type read-back, invalid-title, returned-error envelope, and live unique-definition tests pass | keep API route |
| `deleteProperty` | ident, value-loss acknowledgement | `removeProperty` + value cleanup | `logseq.DB.removeProperty` + `removeBlock`; acknowledgement, cleanup, invalid-ident, API-error-before-cleanup, and live zero-holder deletion tests pass | keep API route |
| `addProperty` | target UUID, ident, value, options, verbose | `upsertBlockProperty` | `logseq.DB.upsertBlockProperty`; false/literal values, materialization, duplicate-many, API-error-before-readback, and live literal/node-reference value read-back tests pass | keep API route |
| `removeProperty` | target UUID, ident, verbose | `removeBlockProperty` | `logseq.DB.removeBlockProperty`; target-only removal, no-op detection, invalid-ident, API-error-before-readback, and live zero-holder removal tests pass | keep API route |

## Explicit compatibility notes

- A page is a block for target operations, but page identity and page-scoped
  queries must remain distinct.
- Properties are keyed by `:db/ident`, not UUID, and writes are restricted to
  the plugin namespace.
- `searchBlocks` accepts `searchTerm` and preserves Logseq's native search
  response. Do not assume additional filters, count fields or case semantics;
  do not automatically repeat a timed-out search.
- `moveBlock` placement distinguishes `child` from `last-child`; order is
  verified because `:block/order` is not a normal direct write.
- `deletePage`, `deleteTag`, `deleteProperty`, `clearPage`, and `removeBlock`
  retain acknowledgement and evidence requirements.
- `listAssets` now returns asset records rather than attribute-name strings.
  It inventories non-recycled Asset-class entities, not files on disk; remote
  or missing local files and null metadata must not be interpreted as verified files.
- The registered native names include `creatTag` and `getProperyUsers`.
  Preserve these public spellings unless a contract change is explicitly agreed.
