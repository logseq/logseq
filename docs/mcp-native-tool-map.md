# Native MCP Tool Map

For Desktop HTTP connection, authentication, native command arguments, and
DB-compatible aliases, see the [Desktop DB Graph HTTP API Reference](./native-db-api.md).

This map describes the current 58-tool MCP implementation, its Logseq API routes,
inputs, behavior, and remaining verification. MCP graph operations call
`logseq.DB.*` API functions; those APIs may delegate internally to shared
Editor/App/CLI implementations. MCP does not directly mutate workers or the DB.

Remaining verification lists only open checks. Full schema comparison,
formal per-tool certification and independent packaged/watcher-free build
verification remain open.
Idle-timeout session expiry remains untested.

## Current 2.0.2 contracts

The server exposes 58 tools with compatibility target `2.0.2` and contract
revision `2026-11-11.1`.

- `capabilities` uses `logseq.DB.getMcpApiMethods` to read callable renderer API
  registrations. Missing-entity null results and explicit `Page "..." not found`
  or `No entity exists with exact UUID ...` errors establish route reachability.
  Unrelated session/database errors remain inconclusive, not available.
  Default write probing remains disabled. `graph.compatibility_target` identifies
  the intended compatibility target.
- `searchBlocks` preserves the native result envelope but filters its blocks to
  literal, case-sensitive title substrings. Snippets remain disabled. The native
  candidate limit and pagination are unchanged; this is not exhaustive search.
- `findEntities` adds structured read-only searches through the existing API
  query path, without raw query text or per-query approval. It supports
  Page-class pages, ordinary blocks, inherited recycling, page scope, literal
  text/structural filters, selected fields, cursor pagination and exact counts.
  Limits cap output and filter complexity, not DB execution time or scan work.
  See [examples and limits](#structured-entity-search).
- An exact title held by a live or non-page entity makes `createPage` return a no-write structured conflict with
  `status`, `created: false`, `verified: false`, and `held_by`, not MCP `isError`.
  `importPage` propagates creation conflicts without inserting content.
  When only recycled pages hold the requested title, `createPage` renames each
  to `<original title> (<UUID>)`, verifies its UUID, recycled state and block
  inventory, then creates the new page. Dry runs never rename; they return
  `status: "dry_run"` and `planned_archives` for recycled-only holders instead
  of a conflict. This previews title reuse, not archive-collision or preservation
  verification. `isTitleAvailable` reports `available: true`, `recycled: true`
  and `planned_archives` for recycled-page-only holders, while preserving
  `held_by`. Exact live or non-page title matches remain unavailable. This is a reuse plan,
  not write-time verification; internal rename/archive guards still require
  actual title vacancy. Occupied archive
  titles or failed verification stop creation; successful prior renames are
  reported in `archived_pages` and must not be blindly repeated.
- Title preflight uses exact stored-title matching, not canonical page-name
  resolution. A case-variant of a live title can be reported available by
  `isTitleAvailable`, then resolve to the existing page in `createPage` with
  `verified: true` and no write. This is a collision-reporting discrepancy;
  the existing page must not be mistaken for a newly created page.
- Heading batches explicitly pass the existing `logseq.property/heading`
  property through `insertBatchBlock`; verification still checks heading,
  title, UUID, parent, page and inventory. Import verification allows at most
  one late empty top-level seed when the baseline page inventory was empty,
  and reports expected/observed imported-block counts. Other inventory changes
  remain unverified. Nested code fences can lose fences/indentation and omit
  later blocks, returning `verified: false`. Use native Code-tagged blocks
  instead, and inspect the actual page before retrying an import.
- `deletePage` calls the existing recycle API without renaming the page,
  verifying its title, UUID and block inventory. Built-in linked/unlinked
  reference views and related alias pages are reported separately in
  `references.built_in_views` and `references.aliases`; alias attributes do not
  contribute to `references.real`. Content links on an alias holder still count.
  Either side of an alias relation requires `acknowledge_alias_loss`.
  Real content links additionally require `acknowledge_reference_rewrite`;
  alias-only deletion needs only the alias-loss acknowledgement.
  Missing approvals return `status: "refused"`, `refused: true`, and all
  `required_acknowledgements`, without `verified` or a write.
  The recycled page keeps its title until explicitly reused through `createPage`.
  Content links on recycled referrer pages still count as real references.
  UI restoration of an alias-holder page retains the alias and its backlinks;
  the alias-loss gate does not mean the relation is always erased.
- `inspectPage` exposes resolved alias properties. `findBacklinks` shows
  genuine content links and alias property holders in their respective relation
  groups. `retitleOverDuplicate` refuses holders in an alias relation without
  renaming either page.
- `retitleOverDuplicate` does not refuse an otherwise eligible holder merely
  because it has inbound content links. Parking preserves that holder's UUID,
  so those links stay with the parked page, not the source receiving its old title.
- `createProperty` describes native title/ident normalization; callers must use
  its returned canonical ident. When the stored title differs, both result
  modes include `normalized_from` with the requested title. Property titles
  must satisfy Logseq's page-name rules; titles containing `#` are rejected.
  Normalization metadata describes the completed write, not a pre-write preview.
- `createEmbed` with `verbose: false` returns only `uuid`, `verified`, and
  `diagnostic`; dry runs have a null UUID and never insert a block. Self and
  ancestor targets are refused. Page and block embeds are discoverable through
  `listEmbeds`, including its target filter; block embeds appear in backlinks.
  Removing an embed by its own UUID removes its reference without deleting the
  target. Removing the target instead leaves an empty block that `listEmbeds`
  can no longer find.
- Template application produces children in source order and can reuse an
  empty destination block as the first child. Count newly created entities
  separately from resulting children. `logseq.property/used-template` is
  stamped only on the first resulting child and references the original
  template block, not a copy. Other resulting children are not stamped;
  the original template's timestamp, tags and children remain unchanged,
  and it does not receive `used-template`.
  The property is not a complete per-child provenance inventory. First-child
  stamping applies to tag application, manual application and history replay.
- The DB block-to-page plugin workflow creates a page and moves the source
  block's children under it, preserving UUIDs, creation times and order.
  The source block retains its UUID and placement, becomes a `[[page title]]`
  link and has no children left; it appears in the new page's backlinks.
  Children are not copied or recycled, and other source-page blocks are unchanged.
- Unknown supplied MCP sessions return HTTP 404 to request reinitialization;
  missing invalid sessions remain HTTP 400. After a Desktop restart, initialize
  a new session and reconnect. Mutations are never retried.

## Meta and reads

| Tool | Inputs / key contract | Behavior | Current Logseq API route | Remaining verification |
|---|---|---|---|---|
| `capabilities` | `include_diagnostics?`, `probe_writes?` | discovers registered API routes and reachability; missing probe entities establish route availability; read-only by default, write probing disabled unless explicitly requested | `logseq.DB.getAppInfo`, `checkCurrentIsDbGraph`, and `getMcpApiMethods`, plus safe route probes | None |
| `datascriptQuery` | `query`, optional `inputs`; required `question`, `checked_tools`, `reason`, `reads`, `expected_size` for approval | read-only last resort with exact query/inputs shown; fresh MCP form or Desktop dialog approval; Desktop Cancel/X refuse identically without execution/retry; invocation-correlated audit; 1000-row/65536-byte output envelope with `truncated` | `logseq.DB.datascriptQuery` query and positional inputs, after fresh form/dialog approval | form-specific confirmation, unavailable approval UI and custom-rule input format |
| `getContentCapabilities` | none; DB-only, no graph-type argument | known built-in formats plus bounded plugin descriptions, status, repository hints, command labels and renderer keys; MCP adds supported/partial/unknown creation guidance, separate from rendering; discovery does not run visual probes | `logseq.DB.getContentCapabilities` uses the application's existing plugin metadata, command and renderer registries | other enabled plugin features |
| `getPage` | page name | full page with child blocks | `logseq.DB.getPageData` | None |
| `getPageUUID` | title | title-to-UUID lookup | fixed read-only queries through `logseq.DB.datascriptQuery` | None |
| `isTitleAvailable` | title | exact live page/tag matches are unavailable; recycled-page-only matches are reusable; case variants can incorrectly appear available because lookup is exact-title-only | `logseq.DB.getTitleHolders`; preserves `held_by`, returning `available: true` and `recycled: true` for recycled-page-only collisions | None |
| `findDuplicateTitles` | `normalize`, `include_recycled` | Page/Tag title inventory, normalization, grouping, usage/alias queries and ranking | `logseq.DB.getTitleInventory` plus `datascriptQuery` | same-case duplicate-title fixture |
| `getGraphHealth` | `sample_limit?`, `checks?`, `page_uuids?` | five default observations plus four opt-in audits, bounded examples, no writes or atomic snapshot | `getTitleInventory`, `getOrphanTags`, `getOrphanProperties`, `findEntities`; optional `getPageStats`, `getPageBlockUUIDs`, `listRecycled`, `getBacklinks`, `getClosedValues`, `getPropertyUsers`, all through `logseq.DB` | Live Desktop validation |
| `inspectPage` | page UUID, `detail` | page plus selected blocks, tags, properties, or declarations; retains the detail envelope and query-shaped entity keys | `logseq.DB.inspectPage` | None |
| `pageStats` | page UUID | fixed counts and subtree/alias/reference/property analysis | `logseq.DB.getPageStats` | None |
| `getBlockUUID` | page UUID | flat descendant list with order, parent/page references, and cross-page ancestry | `logseq.DB.getPageBlockUUIDs` | None |
| `getBlock` | block UUID | exact block read, including collapsed/property-bearing entities | `logseq.DB.getBlock` | None |
| `searchBlocks` | `searchTerm` | literal, case-sensitive title filter over bounded native candidates; handles quoted text; preserves native envelope/pagination without snippets | `logseq.DB.search` | None |
| `findEntities` | `kind`, `state?`, `name_source?`, `page_uuid?`, `where?`, `select?`, `output?`, `limit?`, `cursor?` | read-only literal/structural search without per-query approval; page title/alias matching, opt-in alias inventory and match details, selected fields, exact counts, live/recycled/all inventories and revision-bound cursors; has_link matches embeds, not ordinary page references | `logseq.DB.findEntities`; fixed query forms and typed literal inputs through existing API `<q` | None |
| `suggestLinks` | draft `text`, `limit?` | read-only title/alias link candidates with exact spans, ambiguity and markup/code masking; bounded live inventory and fresh name checks, no automatic edits | `logseq.DB.findEntities`; MCP-only text analysis, no new native API | Live Desktop validation |
| `getBlockTree` | block UUID, depth/node caps | expanded tree with bounded depth/node count, page/missing distinction and cycle guard | `logseq.DB.getBlockTree` | None |
| `findBacklinks` | target UUID | separate refs, tag-holder and property-value groups; counts may overlap | `logseq.DB.getBacklinks` | None |
| `findOrphans` | page UUID | finds blocks whose parent ancestry disagrees with their stored owning page | `logseq.DB.getPageBlockUUIDs`; MCP filters by owning page UUID | None |
| `getTagUUID` | title | resolves tags by name, preserving ambiguous UUID candidates | `logseq.DB.getTagsByName` | None |
| `getTag` | tag UUID | full tag entity with UUID/title/name and id/ident metadata | `logseq.DB.getTag` | None |
| `getTagUsers` | tag UUID | direct tag holders with UUID/title/name/page; excludes inherited-only holders | `logseq.DB.getTagUsers` | None |
| `getPropertyIndent` | property title | exact-title property definitions with ident/type and ambiguity candidates | `logseq.DB.getPropertiesByTitle` | None |
| `getProperyUsers` | exact property ident | holders, literal values and resolved value entities | `logseq.DB.getPropertyUsers` | None |

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
children; `has_link` tests `:block/link` (linked blocks/embeds).
An ordinary `[[page reference]]` does not satisfy `has_link` equality with `true`; use backlink
tools for those references.
Empty means exactly `""`, not whitespace.
Rows follow internal entity ID, not sibling order; use `getPage` order keys
for placement checks.

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
`page_title`, `parent_uuid`, `recycled`, `aliases` (pages only), and
`matched_names`; unrelated data is not pulled.
An unknown/non-Page `page_uuid` is an error and scope is valid only for blocks.

For page aliases, set `name_source: "alias"` or `"both"`; the default `"title"`
preserves ordinary title-only searches. The same literal title predicates then
test alias titles, or both the page's title and aliases. Each candidate name must
satisfy the entire filter. Results retain the declaring page's UUID/title, and
counts deduplicate pages even when multiple names match. Shared aliases return
all declaring pages, not an automatically chosen destination. Alias matching
uses direct current/legacy alias relations, not recursive alias chains.

```json
{
  "kind": "page",
  "name_source": "alias",
  "where": {"field": "title", "op": "equals", "value": "Alpha"},
  "select": ["uuid", "title", "matched_names"]
}
```

`matched_names` contains `{uuid,title,source,recycled}` records, where source is
`"title"` or `"alias"`; `aliases` contains declared `{uuid,title,recycled}`
records regardless of the title filter. Both are opt-in. The result entity's
state is filtered normally; live searches also exclude recycled alias names.
Recycled/all searches permit either state of alias names. Alias-only searches
without `where`, selecting `uuid`, `title` and `aliases`, provide a paginated
graph-wide alias inventory. Title mode with that selection also includes pages
without aliases. A title match on an alias page is still that page, not an
implicit redirect. All nested name records share the existing response byte cap.

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

## Link suggestions

`suggestLinks` analyzes supplied draft text, not stored block content:

```json
{"text":"Project Alpha needs a review.","limit":20}
```

It reads live Page-class titles and aliases through `findEntities`. Names match
literally and case-sensitively, with no adjacent Unicode letter, number, combining
mark or underscore. Blank names and names longer than 1024 UTF-16 units are not
suggested. Common Markdown links/images, wiki links, block references, macros
(including embed syntax), inline/fenced code, URLs, tags and angle-bracket markup
are masked. This conservative scanner is not Logseq's renderer or a full Markdown
parser; malformed/unclosed markup can suppress the remaining draft.

Spans are leftmost-first and non-overlapping, preferring the longest name at the
same start. Each suggestion has `start`, exclusive `end`, exact `text`,
`ambiguous`, and `candidates`. Offsets use UTF-16 code units, so JavaScript
`text.slice(start,end)` recovers the exact matched text. Each candidate contains
the target `uuid`, `title`, and `matches: [{source,name_uuid}]`, where source is
`title` or `alias`. Multiple candidate targets are never silently resolved.
As with `findEntities`, an alias entity's own title remains a candidate alongside
pages declaring it as an alias; this tool does not invent canonical redirects.

The envelope is `{suggestions,count,total_spans,truncated,offset_unit,pages_scanned,limits}`.
`total_spans` counts the non-overlapping draft spans before output truncation;
`count` counts returned suggestions. Limit defaults to 20, range 1-100. Output
is capped at 65536 UTF-8 bytes; later spans may be omitted with `truncated:true`,
but candidate lists inside a returned span are complete. A single oversized
candidate list errors instead of hiding ambiguity. There is no result cursor;
use a smaller draft to inspect omitted spans.

Drafts must be nonblank and at most 20000 UTF-16 units. Scans are capped at
10000 live pages, 50000 name records and 8 MiB of serialized inventory; at most
10000 raw matching spans are considered. Exceeding any scan/match cap errors,
not partial success. Existing per-call `findEntities` row/byte limits also apply.
Inventory cursor/revision failures propagate without a silent retry. Returned
names are reread in bounded exact-match batches; changed/missing/newly ambiguous
targets fail explicitly. No cache, raw query, graph writes or external services
are used. Suggestions do not authorize inserting links or modifying aliases.

## Graph health observations

`getGraphHealth({})` returns five default observations without writing anything.
Optional `sample_limit` is an integer from 1 to 20 (default 5). Optional `checks`
is a nonempty unique list of check names and **replaces**, rather than extends,
the defaults. Unknown arguments/checks are rejected. No raw query text, new
native API export, cache, or per-query approval is involved.

The response contains only selected `checks`, `checks_run`,
`title_entities_scanned` (null when that inventory was not needed), `page_uuids`
(null without page audits),
`consistency: "independent_reads"`, `limits`, and `diagnostic`.
Each check has `count`, `examples`, and `truncated`:

### Default checks

- `duplicate_titles`: exact, case-sensitive, nonblank stored-title groups among
  Page/Tag-class entities, including recycled entities. `count` is the group
  count; `entity_count` counts all members of those groups. Each example has
  `title`, `entity_count`, `entities` (`uuid`, `kind`, `recycled`), and its own
  `truncated` flag. The recycled flag is the native inventory's directly stored
  deletion state, not inherited recycling. Alias relationships, content,
  references and merge eligibility are not investigated.
- `tags_without_holders`: the native Tag-class inventory with no direct reverse
  `:block/tags` holders. Examples retain available `uuid`, `title`, and `ident`.
  This does not mean no other references or child tags.
- `properties_without_values`: qualified namespaced property attributes with
  no stored attribute values, as `{ident, title, type}`. Declarations alone do
  not count as stored values. Built-in and recycled definitions are not
  excluded from these native orphan inventories.
- `alias_ambiguity`: exact, case-sensitive nonblank live page titles/direct
  aliases shared by multiple declaring pages, where at least one match is an
  alias. Pure title duplicates stay in `duplicate_titles`. `count` counts
  ambiguous names; `names_examined` counts distinct inventoried names. Examples
  include `name`, `candidate_count`, sampled `candidates` (declaring UUID/title,
  sampled title/alias `matches` with `source`/`name_uuid`, `match_count`,
  `matches_truncated`) and candidate `truncated`. Long names are not silently
  skipped. A title match on the exact alias carrier UUID is not a competing
  declaration. Distinct pages claiming that alias, or an unrelated page with
  the same title, still count; no preferred target is chosen. This filtering
  is specific to health observations, not `findEntities` or `suggestLinks`.
- `unresolved_placeholders`: remaining complete literal `{{link:NAME}}` and
  `{{tag:NAME}}` markers in live ordinary blocks. `count` counts distinct
  block/kind/name combinations; `block_count` counts affected blocks and
  `occurrence_count` includes repeated markers. Examples have `block_uuid`,
  `page_uuid`, `kind`, `name`, `occurrences`, `resolution` (`missing`,
  `resolvable`, `ambiguous`), `candidate_count`, sampled candidates and their
  `truncated` flag. Resolution uses exact Page/Tag-class titles and the native
  title inventory's directly stored deletion flag, not aliases or inherited
  recycling. Resolvable markers are still reported because they remain literal
  placeholders. Code/examples are not masked; malformed/unclosed markers are
  not counted. This is not a general broken-link detector or write preflight.

### Opt-in audits

```json
{
  "checks":["empty_pages","page_ownership_mismatches"],
  "page_uuids":["00000000-0000-4000-8000-000000000001"],
  "sample_limit":5
}
```

- `empty_pages`: live Page-class pages whose native `content_blocks`, inbound
  refs/tag holders/property-value counts are all zero and which neither declare
  aliases nor are an alias of another page. Examples include UUID/title and
  own/empty/content block counts. A seeded empty block does not make a page
  nonempty, and an empty unreferenced page is not necessarily disposable.
- `page_ownership_mismatches`: structural descendants whose stored owning-page
  UUID differs from their nearest structural page ancestor. Nested pages,
  including recycled pages under Recycle, establish their own ownership boundary.
  `count` counts page/block pairs, `distinct_block_count` deduplicates blocks
  across audited pages, and examples include audited, block, stored-page and
  `expected_page_uuid` UUIDs. Missing stored-page UUIDs are not included.
  Incomplete or cyclic ancestry fails the report. Blocks can still render
  correctly; this is not repair authorization. `findOrphans` is unchanged.
- `references_to_recycled`: directly deleted pages/blocks with inbound native
  backlinks. `count` counts targets, `targets_scanned` counts all direct recycled
  entities and `reference_count` sums relation rows, not unique referrers.
  Examples include target UUID/title, reference count, sampled relation rows
  (`reference`, `tag_holder`, `property_value`) with holder/property summaries,
  and a nested `truncated` flag. Referrers may also be recycled; these are not
  automatically broken references. The `logseq.property.recycle/original-page`
  and `original-parent` property relations are bookkeeping and excluded.
  Genuine self-links and built-in view references remain included.
  Inherited-only recycling is not inventoried.
- `invalid_choice_values`: stored values of reference-valued properties that
  are not entity IDs of that property's directly non-recycled declared choices.
  `count` counts holder/value rows; examples include property ident, holder,
  raw value and resolved entity summary. Uses `getClosedValues` with opt-in
  identity/storage metadata and `getPropertyUsers`, never guesses from labels.
  `properties_scanned` counts inspected properties; unsupported non-reference
  storage is explicit in `unchecked_property_count`, sampled
  `unchecked_properties`, and `unchecked_properties_truncated`.
  `validation_complete` is false when any property was unchecked. Properties
  without any choice definitions cannot be discovered by this inventory.
  Class-scoped choices/exclusions, inherited choice recycling and general
  type/schema validation are not checked.

Optional `page_uuids` scopes **only** `empty_pages` and
`page_ownership_mismatches`. It requires at least one of those checks and 1-100
unique live Page-class UUIDs. Missing/recycled/non-Page targets error. Without
it, those audits inspect all live Page-class pages, at most 100. Other selected
checks remain graph-wide. Both page checks report `pages_scanned`; the envelope
reports the actual audited UUIDs.

Counts describe complete inventories for each read, even when examples are
truncated, subject to the explicit choice-validation coverage above.
`sample_limit` also bounds nested members, candidates, evidence and reference
rows, with their own truncation flags. There is no sample continuation cursor.

Inventories are capped at 10000 rows (including accumulated `findEntities`
pages), 50000 page/title/alias name records and 10000 distinct placeholder rows.
Each native response is capped at 8 MiB; total native responses at 32 MiB/400
calls. Fan-out caps are 100 audited pages, 100 directly recycled targets, and
50 properties with choices. These are MCP processing caps, not bounds on native
execution, scans or transfer. Existing `findEntities` per-call row/byte limits
also apply; pagination/revision failures propagate. An exceeded cap, malformed inventory or API
failure errors the whole report; there are no partial counts or silent zeros.
The response cap is 65536 UTF-8 bytes; an oversized response errors rather than
truncating names. Lower `sample_limit` or use detailed tools in that case.

The reads are not an atomic graph snapshot. Counts are observations, not
proof of graph damage or authorization to merge/delete anything. An empty
report is not a general health certification. Missing summaries/tags, missing
local asset files and lost embed-target detection are not checked. Investigate with
`findDuplicateTitles`, `listOrphanTags`, `listOrphanProperties`, `findBacklinks`,
`getTagUsers`, and `getProperyUsers` before proposing owner-approved changes.
Live Desktop validation remains outstanding.

## Lists

| Tool | Inputs / key contract | Behavior | Current Logseq API route | Remaining verification |
|---|---|---|---|---|
| `listPages` | `expand?` | page inventory with optional expanded metadata | `logseq.DB.listPages` | None |
| `listJournals` | `with_counts?`, `limit?` | journal-day candidates, descending sort and limit, with optional block counts | `logseq.DB.getJournalCandidates` plus count queries | None |
| `listTags` | `expand?` | tag inventory with optional expanded class metadata | `logseq.DB.listTags` | None |
| `listProperties` | `expand?` | property inventory with optional expanded schema metadata | `logseq.DB.listProperties` | None |
| `listClosedValues` | none | property/value pairs from `:block/closed-value-property`, including existing built-in choices | `logseq.DB.getClosedValues` | None |
| `listOrphanTags` | none | Tag-class entities with no direct reverse tag holders, including unused built-in and user-created tags | `logseq.DB.getOrphanTags` | None |
| `listOrphanProperties` | none | unused qualified property attributes as `{ident, title, type}` | `logseq.DB.getOrphanProperties` | None |
| `listAssets` | none | registered Asset-class metadata in stable UUID order; excludes only assets directly marked deleted, not assets whose parent/page is recycled; UUID/title/type/size in bytes/checksum/external URL/file name; not filesystem availability | `logseq.DB.listAssets` | external-URL asset fixture |
| `listStatus` | none | entity/status-value pairs | `logseq.DB.getStatusRows` | None |
| `listRecycled` | none | deleted page and block records carrying `:logseq.property/deleted-at` | `logseq.DB.listRecycled` | None |

## Writes and verification

Every row below means: validate identifiers, snapshot affected state where
needed, perform the existing API operation, read back, compare, and preserve
the full/terse response behavior. Batch writes remain non-atomic.

| Tool | Inputs / key contract | Behavior | Current Logseq API route | Remaining verification |
|---|---|---|---|---|
| `importPage` | target, markdown/list, replace, dry-run | inserts nested outlines with preserved heading levels, stripped titles, parent chains and UUIDs; verifies expected/observed imported-block counts separately from the allowed empty seed | `logseq.DB.createPage` + `insertBatchBlock` (and `removeBlock` for replace), plus read-back queries | None |
| `repairLinks` | optional page, creation acknowledgements/caps | dry runs do not write; rewrites existing targets; each missing-target kind requires its creation acknowledgement and sufficient caps; unresolved/ambiguous placeholders remain unchanged | `logseq.DB.updateBlock` + `createPage`/`createTag` | refusal when a creation cap is too low |
| `createPage` | title, dry-run, verbose | exact live/non-page title collisions return a no-write conflict; recycled-only holders are archived with identity/content preserved; case variants can return an existing page as verified without creating one; dry runs do not write | `logseq.DB.getTitleHolders` + `renamePage` + `createPage` | None |
| `renamePage` | page UUID, title, verbose | renames the same UUID with read-back; title collisions and recycled pages are refused without changes | `logseq.DB.renamePage` | None |
| `retitleOverDuplicate` | source UUID, title, suffix | parks an eligible empty page and renames the source by UUID; content-bearing/non-page/alias holders are refused without renaming; inbound links do not block parking and stay with the parked holder UUID; reports partial progress | two `logseq.DB.renamePage` calls | same-case multi-holder fixture |
| `deletePage` | UUID, reference/alias acknowledgements | built-in views do not block deletion; alias relations require alias-loss acknowledgement, real links separately require reference-rewrite acknowledgement; refusals write nothing; recycling preserves title/UUID/blocks | `logseq.DB.deletePage` plus reference/inventory queries | None |
| `clearPage` | page UUID, verbose | removes outline content while preserving the page entity and metadata/property subtrees; refuses nested pages and verifies absence | DB queries + `logseq.DB.removeBlock` | None |
| `createBlock` | parent UUID, title, dry-run, verbose | inserts a block and verifies parent, owning page and stored content | `logseq.DB.insertBlock` | None |
| `createEmbed` | parent UUID, target UUID, dry-run, verbose | inserts page/block linked views with derived refs; rejects self/ancestor targets; verifies UUID/link/parent/page; terse dry runs return a null UUID without inserting | `logseq.DB.createEmbed` | None |
| `listEmbeds` | optional owning-page UUID, target UUID, limit (1-1000, default 100) | active embeds with target UUID/type/title, combined filters, returned count and truncation | `logseq.DB.listEmbeds` | None |
| `createPageofBlocks` | page UUID, outline, dry-run, verbose | validates indentation, inserts per parent and verifies nested hierarchy/page ownership | `logseq.DB.insertBatchBlock` | None |
| `updateBlock` | block UUID, title, dry-run, verbose | updates text on the same UUID and verifies placement/content | `logseq.DB.updateBlock` | None |
| `splitBlock` | UUID, exactly one offset/delimiter | inserts ordered parts, verifies them, then truncates the original block | `logseq.DB.insertBlock` + `moveBlock` + `updateBlock` | None |
| `moveBlock` | UUIDs, target, placement, verbose | moves before/after siblings, as first child or as last-child, including cross-parent moves; descendant targets are refused without mutation; verifies ownership/order | `logseq.DB.moveBlock` | None |
| `moveBlocks` | UUID list, target, placement, rollback flag | duplicate UUIDs and parent/child overlap are refused without mutation; placement variants preserve input order; reports partial progress; rollback is best-effort, not atomic | repeated `logseq.DB.moveBlock` | rollback requires controlled fault injection, not live graph failures |
| `migratePage` | source/target, substring, placement, dry-run | previews literal top-level matches without writing; moves preserve UUIDs/order and leave unselected source content in place; verifies both pages | `logseq.DB.moveBlock` via `moveBlocks` | None |
| `removeBlock` | block UUID, verbose | removes a childless block or entire subtree, verifies all removed UUIDs are absent and preserves siblings; removing an embed UUID preserves its target; provides recovery inventory on errors | `logseq.DB.removeBlock` | None |
| `creatTag` | title, options, verbose | creates a unique tag and verifies its generated identity and title | `logseq.DB.createTag` | None |
| `deleteTag` | UUID, detach/reparent acknowledgements | holders require acknowledge_detach; refusal lists holders without writing; deletion preserves holder titles/parents/Status/other tags; an unused childless tag needs no acknowledgement; verifies absence/reference cleanup | `logseq.DB.deletePage` plus reference queries | child-tag reparenting requires a parent/child fixture unavailable through current MCP tools and tag UI |
| `addTag` | target UUID, tag UUID, verbose | attaches a tag and verifies the relation without changing page identity | `logseq.DB.addBlockTag` | None |
| `removeTag` | target UUID, tag UUID, verbose | removes one tag relation while preserving other tags and page identity | `logseq.DB.removeBlockTag` | None |
| `createProperty` | title, schema, options, verbose | creates a plugin property with a canonical ident; terse and verbose results include normalized_from when the stored title differs; native page-name rules apply | `logseq.DB.upsertProperty` | None |
| `deleteProperty` | ident, value-loss acknowledgement | removes a definition and its value blocks after acknowledged value-loss checks | `logseq.DB.removeProperty` + `removeBlock` | None |
| `addProperty` | target UUID, ident, value, options, verbose | assigns literal/reference values, preserves false values and verifies materialized values and many-value membership | `logseq.DB.upsertBlockProperty` | None |
| `removeProperty` | target UUID, ident, verbose | removes only the target's value while preserving the definition | `logseq.DB.removeBlockProperty` | None |

## Explicit compatibility notes

- Duplicate-title exact mode compares stored titles literally. Loose mode
  normalizes case/punctuation/whitespace with simple suffix heuristics, not
  complete plural normalization; fuzzy mode adds edit-distance matching.
  Empty unreferenced members beside content can be `dead_stub` (rank 1 for
  differing titles); multiple content-bearing members are `genuine_split`.
  Classifications are read-only guidance, not authorization to merge or delete.
- Ordinary text renders bold/italic, inline LaTeX renders typeset math, and
  native code blocks and linked embeds render their content. Adding the Code
  tag sets code display type, not a stored language; select the language in the
  UI. The built-in language property remains outside MCP's writable namespace.
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
  It excludes Asset-class entities with their own deleted-at flag but does not
  apply inherited recycling from a parent or owning page. An asset on a recycled
  page can still be listed even when `findEntities` reports `recycled: true`;
  this is a filtering defect, not an untested asset case.
  The inventory is not a filesystem check; remote or missing local files and
  null metadata must not be interpreted as verified files.
  Use `getBlock` with the asset UUID to inspect its owning page and additional
  properties such as image dimensions; dimensions are not `listAssets` fields.
- The registered MCP tool names include `creatTag` and `getProperyUsers`.
  Preserve these public spellings unless a contract change is explicitly agreed.
