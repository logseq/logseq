# Native MCP Tool Map

This is the Stage 0 map from the Python reference server to the current Logseq
architecture. `compat` means the first native implementation should call the
existing Logseq API through an adapter. Candidates remain off the default
production route until their differential and live validation gates pass. The governing rule in
`plan.md` requires all MCP Logseq calls to use `logseq.DB.*`; DB-owned aliases
may temporarily delegate to Editor/OG implementations internally.

All Stage 2 rows require a defined raw/expanded output contract, current DB
schema and canonical entity-classification coverage, namespace-aware dispatch,
focused local checks, and read-only live same-graph parity checks through Claude
Desktop or an explicitly authorized direct MCP client.
Candidate implementation, local validation, live validation, and production
switching are separate statuses; getBlock evidence does not validate other rows.

## Meta and reads

| Tool | Inputs / key contract | Current reference route | First native route | Later candidate |
|---|---|---|---|---|
| `capabilities` | `include_diagnostics?`, `probe_writes?` | capability probes | read-only by default; write-dependent methods are `unknown/not-probed`; explicit mutation probes require `probe_writes: true` | PASS: three stable same-graph read-only runs on 2.0.1; 21 read routes available, 6 invalid-argument read probes unknown but independently live-passed, 23 write routes skipped; `createPage` remains unprobed |
| `getPage` | page name | full page with child blocks | existing `get_page_data` export via `logseq.DB.getPageData`; no duplicate getter | production route switched; focused local route and capability checks pass; same-graph page read passed before route switch; live recheck pending |
| `getPageUUID` | title | `getPage`, query | existing `DB.datascriptQuery` compatibility lookup | use existing APIs behind DB aliases; duplicate `getPagesByTitle` implementation removed; same-graph live read passed for both recorded fixture titles |
| `isTitleAvailable` | title | exact-title holders across entity kinds, including recycled markers | dedicated `logseq.DB.getTitleHolders`; MCP classifies page/tag/property/block and preserves `held_by` | production route switched; local tests pass; same-graph live held/available checks passed |
| `findDuplicateTitles` | `normalize`, `include_recycled` | Page/Tag title inventory plus usage/alias queries and grouping | `logseq.DB.getTitleInventory` supplies the complete Page/Tag candidate set; MCP retains normalization, grouping, ranking, and downstream queries | production route switched for inventory; local tests pass; same-graph exact-mode read passed (39 titles, no collisions) |
| `inspectPage` | page UUID, `detail` | page plus selected blocks, tags, properties, or declarations | dedicated `logseq.DB.inspectPage` API; retains the detail envelope and query-shaped entity keys | API implemented; local tests pass; same-graph live reads passed for all six details |
| `pageStats` | page UUID | fixed counts, subtree/alias/reference/property analysis | dedicated `logseq.DB.getPageStats` API owns the read-only DB aggregation and preserves the response/diagnostic contract | production route switched; local tests pass; same-graph live read passed (9 own blocks, 8 with content, no refs/orphans) |
| `getBlockUUID` | page UUID | flat descendant list with order, parent/page references, and cross-page ancestry | dedicated `logseq.DB.getPageBlockUUIDs` API preserves the parent traversal and output fields | production route switched; acronym dispatch fixed (`UUIDs` now resolves to `uuids`); local tests and same-graph 9-descendant read passed |
| `getBlock` | block UUID | exact entity query | single MCP adapter calls `logseq.DB.getBlock` using the existing Editor implementation and standard dispatch | production route switched; local tests pass; same-graph marker read passed; prior collapsed/property-bearing `getBlock` cases remain unverified |
| `searchBlocks` | text, page scope, regex, limit | existing Logseq search API with snippets disabled | same exported `search` function through `logseq.DB.search` standard dispatch; no duplicate search implementation | production route switched; local tests pass; same-graph marker search passed |
| `getBlockTree` | block UUID, depth/node caps | expanded tree with bounded depth/node count, page/missing distinction, cycle guard | dedicated `logseq.DB.getBlockTree` owns traversal and bounds while preserving the response envelope | production route switched; local tests pass; same-graph bounded marker read passed |
| `findBacklinks` | target UUID | separate refs, tag-holder, and property-value groups; counts overlap | dedicated `logseq.DB.getBacklinks` owns the three relation queries and preserves the grouped response/diagnostic | API implemented; local tests pass; same-graph reads returned 0 for fixture page and `testtag`, consistent with inspected graph |
| `findOrphans` | page UUID | parent ancestry with mismatching stored page; preserves orphan rows | reuses `logseq.DB.getPageBlockUUIDs`; MCP filters by owning page UUID and preserves diagnostic | production route switched; local tests pass; same-graph read and pageStats/getBlockUUID cross-checks found 0 true orphans |
| `getTagUUID` | title | `getTagsByName` | existing `logseq.DB.getTagsByName`; MCP preserves all ambiguous UUID candidates | production route switched; local tests pass; same-graph `testtag` lookup passed |
| `getTag` | tag UUID | UUID/title/name projection query | existing `logseq.DB.getTag` API; MCP preserves its full PageEntity fields, including UUID/title/name and richer id/ident metadata | production route switched; local tests pass; same-graph `testtag` read passed |
| `getTagUsers` | tag UUID | direct `:block/tags` holder query; returns UUID/title/name/page | dedicated `logseq.DB.getTagUsers` API; excludes inherited-only holders to preserve contract | production route switched; local tests pass; same-graph checks confirmed `testtag` has no holders and `MCP Smoke RefTag` has one |
| `getPropertyIndent` | property title | exact-title property query; ambiguity candidates retained | dedicated `logseq.DB.getPropertiesByTitle` returns all matching property definitions; MCP preserves the existing ident/type/ambiguity envelope | API implemented; local tests pass; same-graph test property resolved to the expected exact ident and type |
| `getProperyUsers` | exact property ident | literal values and resolved value entities | `logseq.DB.getPropertyUsers` owns holder lookup and entity resolution; public tool name and response stay unchanged | production route switched; local tests pass; same-graph existing property holder/value read passed |

## Lists

| Tool | Inputs / key contract | Current reference route | First native route | Later candidate |
|---|---|---|---|---|
| `listPages` | `expand?` | existing DB list API | same exported `list_pages` API via `logseq.DB.listPages`; options and payload unchanged | production route switched; same-graph reads passed; 68 pages before and after |
| `listJournals` | `with_counts?`, `limit?` | journal-day candidates, descending sort, limit; optional count indexes | `logseq.DB.getJournalCandidates` supplies the same candidate fields; MCP retains sort/limit/count behavior | production route switched for candidates; local tests pass; same-graph Oct 3-5 reads and zero counts passed |
| `listTags` | `expand?` | existing `list_tags` wrapper | same exported list API via `logseq.DB.listTags`; preserve expand option and namespaced payload | production route switched; local tests pass; same-graph result of 21 tags unchanged |
| `listProperties` | `expand?` | existing `list_properties` wrapper | same exported list API via `logseq.DB.listProperties`; preserve expand option and namespaced payload | production route switched; local tests pass; same-graph property listing passed |
| `listClosedValues` | none | property/value pairs from `:block/closed-value-property` | dedicated `logseq.DB.getClosedValues` preserves the two-entity row shape | production route switched; local tests pass; same-graph built-in value sets returned |
| `listOrphanTags` | none | exact Tag entities with no direct reverse tag holders | dedicated `logseq.DB.getOrphanTags` preserves the entity fields and unused-tag semantics | production route switched; local tests pass; same-graph orphan results cross-checked against holders and backlinks |
| `listOrphanProperties` | none | qualified property idents with no data holders | dedicated `logseq.DB.getOrphanProperties` combines property inventory and used attribute idents; preserves `{ident, title, type}` | production route switched; local tests pass; same-graph results cross-checked against `getProperyUsers` |
| `listAssets` | none | attribute-name discovery probe; explicitly unverified | `logseq.DB.getAssetAttributeNames` preserves the exact substring query and output strings; not a complete asset inventory | same-graph probe returned `[]`; status remains unverified, not a complete inventory |
| `listStatus` | none | entity/status-value pairs | dedicated `logseq.DB.getStatusRows` returns the query rows; MCP tool name and tuple shape stay unchanged | production route switched; local tests pass; same-graph empty result accepted |
| `listRecycled` | none | all entities with `:logseq.property/deleted-at` | dedicated `logseq.DB.listRecycled` preserves deleted page and block records | production route switched; local tests pass; one recycled outline page unchanged before/after |

## Writes and verification

Every row below means: validate identifiers, snapshot affected state where
needed, perform the existing API operation, read back, compare, and preserve
the full/terse response behavior. Batch writes remain non-atomic.

| Tool | Inputs / key contract | API operation | First native adapter | Later candidate |
|---|---|---|---|---|
| `importPage` | target, markdown/list, replace, dry-run | batch insert + queries | compatibility adapter implemented; parse-first validation, escaped references, verified batches and inventory delta | native importer |
| `repairLinks` | optional page, creation acknowledgements/caps | update blocks + page/tag creation | compatibility adapter implemented; exact live targets, independent creation gates and reference-relation read-back | native write layer |
| `createPage` | title, dry-run, verbose | `createPage` | compatibility adapter implemented; title preflight and UUID read-back | native mutation |
| `renamePage` | page UUID, title, verbose | `renamePage` | compatibility adapter implemented; preflight and UUID read-back | native mutation |
| `retitleOverDuplicate` | source UUID, title, suffix | two renames | compatibility adapter implemented; empty/non-alias holder guards, recycled-holder support and partial-application undo details | native mutation |
| `deletePage` | UUID, reference/alias acknowledgements | recycle via `deletePage` | compatibility adapter implemented; separate alias/reference guards and exact UUID recycling verification | native mutation |
| `clearPage` | page UUID, verbose | remove top-level blocks | compatibility adapter implemented; preserves metadata and property-value subtrees, refuses nested pages | native mutation |
| `createBlock` | parent UUID, title, dry-run, verbose | `insertBlock` | compatibility adapter implemented; verifies parent, page and content | native mutation |
| `createPageofBlocks` | page UUID, outline, dry-run, verbose | batch insert per parent | compatibility adapter implemented; complete prevalidation and per-level parent/page/content/order checks | native mutation |
| `updateBlock` | block UUID, title, dry-run, verbose | `updateBlock` | compatibility adapter implemented; content and UUID read-back | native mutation |
| `splitBlock` | UUID, exactly one offset/delimiter | create parts then update original | compatibility adapter implemented; validates all parts and verifies tail placement before truncation | native mutation |
| `moveBlock` | UUIDs, target, placement, verbose | `moveBlock` | compatibility adapter implemented; verifies parent, page, descendants and append order | native mutation |
| `moveBlocks` | UUID list, target, placement, rollback flag | repeated move + order verification | compatibility adapter implemented; sequential verified moves, nested-selection guards, 50-block cap and best-effort rollback | native mutation |
| `migratePage` | source/target, substring, placement, dry-run | selected `moveBlocks` | compatibility adapter implemented; literal top-level selection, dry-run previews and source read-back | native mutation |
| `removeBlock` | block UUID, verbose | `removeBlock` | compatibility adapter implemented; inventories bounded subtree and verifies every UUID is absent | native mutation |
| `creatTag` | title, options, verbose | `createTag` | tag adapter | native mutation |
| `deleteTag` | UUID, detach/reparent acknowledgements | `deletePage` + reference checks | tag adapter | native mutation |
| `addTag` | target UUID, tag UUID, verbose | `addBlockTag` | tag adapter | native mutation |
| `removeTag` | target UUID, tag UUID, verbose | `removeBlockTag` | compatibility adapter implemented; relation and page identity verified | native mutation |
| `createProperty` | title, schema, options, verbose | `upsertProperty` | property adapter | native mutation |
| `deleteProperty` | ident, value-loss acknowledgement | `removeProperty` + value cleanup | property adapter | native mutation |
| `addProperty` | target UUID, ident, value, options, verbose | `upsertBlockProperty` | property adapter | native mutation |
| `removeProperty` | target UUID, ident, verbose | `removeBlockProperty` | property adapter | native mutation |

## Explicit compatibility notes

- A page is a block for target operations, but page identity and page-scoped
  queries must remain distinct.
- Properties are keyed by `:db/ident`, not UUID, and writes are restricted to
  the plugin namespace.
- `searchBlocks` is case-sensitive, substring-based, separately counts matches,
  and must not retry its DB-worker predicate query.
- `moveBlock` placement distinguishes `child` from `last-child`; order is
  verified because `:block/order` is not a normal direct write.
- `deletePage`, `deleteTag`, `deleteProperty`, `clearPage`, and `removeBlock`
  retain acknowledgement and evidence requirements.
- `listAssets` remains explicitly unverified until Logseq's asset model is
  established.
- The Python reference intentionally exposes `creatTag` and
  `getProperyUsers`; the native contract must retain those names initially.
