# Native MCP Tool Map

This is the Stage 0 map from the Python reference server to the current Logseq
architecture. `compat` means the first native implementation should call the
existing Logseq API through an adapter. `native-read` and `native-write` are
later candidates, not current implementations.

## Meta and reads

| Tool | Inputs / key contract | Current reference route | First native route | Later candidate |
|---|---|---|---|---|
| `capabilities` | `include_diagnostics?` | capability probes | adapter capability probe | native capability probe |
| `getPageUUID` | title | `getPage`, query | API page lookup | DB read |
| `isTitleAvailable` | title | title-holder query | query adapter | DB read |
| `findDuplicateTitles` | `normalize`, `include_recycled` | queries + grouping | query adapter | DB read |
| `inspectPage` | page UUID, `detail` | detail-specific queries | query adapter | DB read |
| `pageStats` | page UUID | fixed count queries | query adapter | DB read |
| `getBlockUUID` | page UUID | query | query adapter | DB read |
| `getBlock` | block UUID | `getBlock` | API block lookup | DB read |
| `searchBlocks` | text, page scope, regex, limit | predicate query + separate count | query adapter, single attempt | DB read/query |
| `getBlockTree` | block UUID, depth/node caps | parent traversal query | query adapter | DB read |
| `findBacklinks` | target UUID | reference/tag/property queries | query adapter | DB read |
| `findOrphans` | page UUID | parent/page comparison query | query adapter | DB read |
| `getTagUUID` | title | `getTagsByName` | API tag lookup | DB read |
| `getTag` | tag UUID | query | query adapter | DB read |
| `getTagUsers` | tag UUID | query | query adapter | DB read |
| `getPropertyIndent` | property title | property-class query | query adapter | DB read |
| `getProperyUsers` | property ident | query + value resolution | query adapter | DB read |

## Lists

| Tool | Inputs / key contract | Current reference route | First native route | Later candidate |
|---|---|---|---|---|
| `listPages` | `with_counts?`, `limit?` | query; optional count indexes | query adapter | DB read |
| `listJournals` | `with_counts?`, `limit?` | query; optional count indexes | query adapter | DB read |
| `listTags` | none | `getAllTags` | existing API | DB read |
| `listProperties` | none | `getAllProperties` | existing API | DB read |
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
| `importPage` | target, markdown/list, replace, dry-run | batch insert + queries | importer adapter | native importer |
| `repairLinks` | optional page, creation acknowledgements/caps | update blocks + page/tag creation | importer adapter | native write layer |
| `createPage` | title, dry-run, verbose | `createPage` | compatibility adapter implemented; title preflight and UUID read-back | native mutation |
| `renamePage` | page UUID, title, verbose | `renamePage` | compatibility adapter implemented; preflight and UUID read-back | native mutation |
| `retitleOverDuplicate` | source UUID, title, suffix | two renames | page adapter | native mutation |
| `deletePage` | UUID, reference/alias acknowledgements | recycle via `deletePage` | page adapter | native mutation |
| `clearPage` | page UUID, verbose | remove top-level blocks | page/block adapter | native mutation |
| `createBlock` | parent UUID, title, dry-run, verbose | `insertBlock` | compatibility adapter implemented; verifies parent, page and content | native mutation |
| `createPageofBlocks` | page UUID, outline, dry-run, verbose | batch insert per parent | block adapter | native mutation |
| `updateBlock` | block UUID, title, dry-run, verbose | `updateBlock` | compatibility adapter implemented; content and UUID read-back | native mutation |
| `splitBlock` | UUID, exactly one offset/delimiter | create parts then update original | block adapter | native mutation |
| `moveBlock` | UUIDs, target, placement, verbose | `moveBlock` | block adapter | native mutation |
| `moveBlocks` | UUID list, target, placement, rollback flag | repeated move + order verification | block adapter | native mutation |
| `migratePage` | source/target, substring, placement, dry-run | selected `moveBlocks` | block adapter | native mutation |
| `removeBlock` | block UUID, verbose | `removeBlock` | block adapter | native mutation |
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
