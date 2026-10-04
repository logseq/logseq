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
| `capabilities` | `include_diagnostics?` | capability probes | adapter capability probe | native capability probe |
| `getPageUUID` | title | `getPage`, query | existing `DB.datascriptQuery` compatibility lookup | use existing APIs behind DB aliases; duplicate `getPagesByTitle` implementation removed |
| `isTitleAvailable` | title | title-holder query | query adapter | DB read |
| `findDuplicateTitles` | `normalize`, `include_recycled` | queries + grouping | query adapter | DB read |
| `inspectPage` | page UUID, `detail` | detail-specific queries | query adapter | DB read |
| `pageStats` | page UUID | fixed count queries | query adapter | DB read |
| `getBlockUUID` | page UUID | query | query adapter | DB read |
| `getBlock` | block UUID | exact entity query | single MCP adapter calls `logseq.DB.getBlock` using the existing Editor implementation and standard dispatch | production route switched; local tests pass; six read-only smoke cases pass; collapsed and property-bearing cases remain blocked pending live reads |
| `searchBlocks` | text, page scope, regex, limit | predicate query + separate count | query adapter, single attempt | DB read/query |
| `getBlockTree` | block UUID, depth/node caps | parent traversal query | query adapter | DB read |
| `findBacklinks` | target UUID | reference/tag/property queries | query adapter | DB read |
| `findOrphans` | page UUID | parent/page comparison query | query adapter | DB read |
| `getTagUUID` | title | `getTagsByName` | API tag lookup | DB read |
| `getTag` | tag UUID | UUID/title/name projection query | existing `logseq.DB.getTag` API; MCP preserves its full PageEntity fields, including UUID/title/name and richer id/ident metadata | production route switched; DB API and MCP pass-through tests pass; live validation pending |
| `getTagUsers` | tag UUID | direct `:block/tags` holder query; returns UUID/title/name/page | dedicated `logseq.DB.getTagUsers` API; excludes inherited-only holders to preserve contract | production route switched; DB API, MCP, and capability tests pass; live validation pending |
| `getPropertyIndent` | property title | property-class query | query adapter | DB read |
| `getProperyUsers` | property ident | query + value resolution | query adapter | DB read |

## Lists

| Tool | Inputs / key contract | Current reference route | First native route | Later candidate |
|---|---|---|---|---|
| `listPages` | `expand?` | existing DB list API | same exported `list_pages` API via `logseq.DB.listPages`; options and payload unchanged | production route switched; local route/API tests pass; live validation pending |
| `listJournals` | `with_counts?`, `limit?` | query; optional count indexes | query adapter | DB read |
| `listTags` | `expand?` | existing `list_tags` wrapper | same exported list API via `logseq.DB.listTags`; preserve expand option and namespaced payload | production route switched; local route and API tests pass; live validation pending |
| `listProperties` | `expand?` | existing `list_properties` wrapper | same exported list API via `logseq.DB.listProperties`; preserve expand option and namespaced payload | production route switched; local route and API tests pass; live validation pending |
| `listClosedValues` | none | reverse closed-value query | query adapter | DB read |
| `listOrphanTags` | none | missing reverse tag query | query adapter | DB read |
| `listOrphanProperties` | none | one query per property ident | query adapter | DB read |
| `listAssets` | none | discovery query; unverified | query adapter, preserve status | DB read after asset model verified |
| `listStatus` | none | status-value query | query adapter | DB read |
| `listRecycled` | none | deleted-at query | query adapter | DB read |

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
