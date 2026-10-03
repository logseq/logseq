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
each property ident before sequentially checking whether it has any values.
`listAssets` preserves the reference server's unverified attribute-name
discovery query. `listJournals` now uses a bounded query adapter and preserves
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
page by UUID. `createBlock` verifies its parent, owning page and stored content.
There are 38 registered tools: five API-backed tools and 33 compatibility data
tools.
`capabilities` reports inconclusive probes as `unknown`; write probes use
invalid arguments, and `upsertNodes` is neither probed nor reported.
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

### Stage 2: native reads

Not started. Migrate one read at a time using differential compatibility versus
native results on the same graph, normalizing only ordering and transient
identity differences.

### Stage 3: native writes

Not started. Use existing Logseq editor/worker mutation machinery, preserve
ordering invariants and acknowledgement gates, and retain verification until a
stronger guarantee is documented and tested.

### Stage 4: optimization

Not started. No caching, batching, retry redesign, schema change, or broad
worker refactor is permitted before behavioral parity.
