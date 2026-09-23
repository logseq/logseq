# Exploring: markdown input for `upsert block --blocks` / `--blocks-file`

Status: implemented. Design decisions:
parse in the CLI, emit only existing outliner ops over the existing
thread-api, `key::` properties resolve against existing db properties
(unknown keys rejected), uuids always auto-generated, `#tag` must resolve
to an existing tag, whole insert in one transaction, `--dry-run`
supported, `--content` unchanged.
Date: 2026-09-23

## Proposal

Change what `upsert block --blocks <text>` and `--blocks-file <path>` accept in
create mode: markdown document text instead of a vector of EDN block maps.

Constraints set for this design:

- mldoc parsing runs **inside the CLI** (OCaml/Melange side).
- The write path uses **only already-supported outliner ops**
  (`insert-blocks`, `batch-set-property`, `create-page`, …) over the existing
  `thread-api/apply-outliner-ops` — no new ops, no new thread-apis.
- `key:: value` properties resolve to **existing db properties** (built-in
  or user-defined); a key that resolves to nothing is an error.
- `block/uuid` is always auto-generated — `id::` is not supported.
- `#tag` must resolve to an **existing tag** — unknown tags are an error.
- The whole block tree inserts in **one `insert-blocks` op** (flat list
  with `[:block/uuid …]` parent lookup-refs), inside a single
  `apply-outliner-ops` call together with property/tag ops — one
  transaction end to end.
- `--dry-run` reports the plan without writing.
- Re-running the same command duplicates blocks (no idempotency,
  accepted; `--dry-run` exists to inspect the plan first).
- `--content` keeps its current literal single-block behavior.

Today these flags carry EDN like:

```clojure
[{:block/title "Parent"
  :block/uuid #uuid "..."
  :block/children [{:block/title "Child"}]}]
```

The proposal makes them carry ordinary Logseq markdown:

```markdown
- Parent
  - Child
- Sibling with a [[Page ref]] and #tag
```

## Current contract (EDN path)

- `cli/lib/command_registry.ml` declares `blocks` ("Blocks EDN") and
  `blocks-file` ("Path to blocks EDN file") for `Upsert_block`;
  `cli/spec/commands/upsert.mli` `block_opts` carries `blocks_edn` /
  `blocks_file`.
- `cli/lib/add.ml` `read_blocks` → `parse_blocks_edn` → `block_of_value`
  recursively maps `block/title` (or `block/content`), `block/uuid`,
  `block/tags`, `block/children` plus arbitrary inline property keys into
  `Block.t` trees; `ensure_block_uuids` assigns `crypto.randomUUID` where
  missing.
- `execute_add_block` resolves target/tags/properties and `[[page]]` refs in
  titles (`resolve_blocks_title_page_refs`), then `insert_tree` emits one
  `[:insert-blocks [blocks] target-uuid opts]` op per depth level, plus
  `batch-set-property` ops for status/tags/properties — all through
  `thread-api/apply-outliner-ops`. Each `apply-outliner-ops` call is one
  atomic transaction worker-side
  (`logseq.db/batch-transact-with-temp-conn!`).
- `--blocks`/`--blocks-file` are create-mode only; without a target they land
  on today's journal page; output is `{:result [db/id ...]}` resolved by
  pulling pre-assigned uuids.

## Chosen design: mldoc in the CLI, existing ops only

```
markdown text ──Mldoc.parseJson──▶ mldoc AST (JSON)
              ──OCaml extraction──▶ Block.t tree   (same type as today)
              ──existing pipeline──▶ insert-blocks / batch-set-property ops
              ──thread-api/apply-outliner-ops──▶ db-worker
```

Downstream of `Block.t` the flow stays recognizable but the write shape
improves on today's: instead of `insert_tree` emitting one op per depth
level, the tree is **flattened to a single `insert-blocks` op** — each
block map carries its pre-assigned `:block/uuid`, `:block/level`, and
`:block/parent [:block/uuid parent-uuid]` lookup-ref (top-level blocks
point at the target). `compute-block-parent`/`resolve-page-refs` resolve
parent lookup-refs inside the same transaction — exactly how
`with-parent-and-order` output is inserted by the paste path. Ordering
comes for free: `insert-blocks` assigns orders via `gen-n-keys`
(`keep-block-order?` unset), which is sibling-scoped and therefore safe
across different parents in the flat list.

The same `apply-outliner-ops` call also carries the `batch-set-property`
ops for status/tags/`key::` properties — **the entire document lands in
one transaction** (today's EDN path needs one HTTP call per level and
leaves a partial tree on mid-write failure).

Kept pieces: `ensure_block_uuids`, `resolve_add_target`, page-ensure for
`[[refs]]`, `metadata_ops`-style property ops, `resolve_created_ids`.
Deleted pieces: `parse_blocks_edn`, `block_of_value`, `insert_tree`
per-level emission — the EDN front end is removed outright (repo policy:
one clear code path, no input-format autodetection).

### 1. Calling mldoc from the CLI

mldoc is published as the `mldoc` npm package (`^1.5.9`, same version
`deps/graph-parser` already uses) exporting the `Mldoc` object:

- `Mldoc.parseJson(content, configJson)` → outline AST as JS arrays
- `Mldoc.parseInlineJson(text, configJson)` → inline AST
- `Mldoc.getReferences(text, configJson)` → `{pages, tags, …}` extracted refs

The CLI binds these via a small `cli/lib/mldoc.ml` using `[@@mel.module
"mldoc"]` externals (same pattern as the existing `crypto`/`process`
externals in `add.ml`/`skill.ml`); `mldoc` is added to `cli/package.json`
dependencies so the Vite bundle (`static/logseq-cli.js`) includes it.

The config string follows `gp-mldoc/get-default-config` for DB graphs with
one deliberate deviation:

```json
{"toc":false,"parse_outline_only":false,"heading_number":false,
 "keep_line_break":true,"format":"Markdown","heading_to_list":false,
 "enable_drawers":true,"parse_marker":false,"parse_priority":false}
```

`parse_marker`/`parse_priority` are off like the app's DB-graph config —
`TODO`, `DEADLINE:`, `SCHEDULED:` stay literal title text (status is a
property in DB graphs, set via `--status`/property ops, not parsed from
text). `enable_drawers` is **on** — unlike the DB-graph default — because
this feature needs mldoc to emit `Property_Drawer` nodes for `key:: value`
lines; with drawers off, `key::` lines degrade to paragraph text and no
properties can be extracted. The app disables them because graph-parser
extracts file-level properties through its own path.

### 2. AST → `Block.t` extraction (the new OCaml code)

`parseJson` returns `[ast-node, pos-meta]` pairs. The extraction walks them:

- `["Heading", data]` → one block. `:level` (1-based indent level) feeds tree
  folding. The **title is sliced verbatim from the raw markdown** using
  `pos-meta` `:start_pos`/`:end_pos` — this is how `[[refs]]`, `#tags`,
  `{{macros}}`, inline markup survive untouched; no inline-AST re-rendering
  needed. Body lines belonging to the heading (src blocks, quotes,
  paragraphs) are covered by the pos range and stay in the title.
- `["Property_Drawer", props]` → `key:: value` lines belonging to the block
  they attach to → property resolution (§3); resolvable keys are consumed
  and their lines dropped from the stored title.
- Non-heading nodes before the first heading (pre-block) → ignored for v1
  (a document's leading non-block content is dropped, same as
  `extract-blocks`'s pre-block handling which creates a page-level
  `:block/pre-block?` block the CLI doesn't need).

Tree folding mirrors `gp-block/with-parent-and-order`'s frame algorithm:
flat ordered `(title, level)` list → `Block.t` with `children`; equal level
= sibling, level+1 jump = child, irregular outdent reuses the nearest
popped ancestor slot. This is the one non-trivial port; it's ~80 lines of
stack logic, not the 900-line cljs `extract-blocks` (whose logbook/macro/
timestamp/pre-block machinery doesn't apply to a DB-graph CLI insert).

Correctness risks to pin down during implementation:

- Heading pos ranges in mldoc AST can extend into following body content —
  the cljs side repairs `:end_pos` against the next heading's `:start_pos`
  before slicing; the OCaml port needs the same fixup or titles will absorb
  sibling text.
- `Src` blocks need `update-src-full-content` semantics (indentation
  stripping via `remove-indentation-spaces`) or fenced code titles come out
  misindented.

`Mldoc.getReferences(text, config)` is the ref/tag extractor of choice
(§4): it reports `pages`/`tags` from the inline AST, so `[[x]]`/`#t`
appearing inside code fences, verbatim or comment text are *not*
reported — regex scanning of raw title text (`extract_wiki_refs`) would
produce false positives there.

### 3. Properties (`key:: value`)

Every `key::` key is resolved against the graph's properties — the same
resolution the CLI already performs for `--update-properties`
(`Property.Key_ident`/name → `thread-api/pull` → `db/id` or ident):

- Key resolves (built-in like `:logseq.property/heading`, or any
  user-defined property) → `batch-set-property` op on that block's uuid via
  the existing `inline_property_assignments`/`apply_inline_property_ops`
  machinery in `upsert.ml` (which already does per-block property ops for
  EDN inline keys). The `key::` line is consumed and stripped from the
  stored title.
- Key resolves to nothing → command fails, naming the offending key
  (`Invalid_blocks` / invalid-options — fail-fast, no silent dropping).
  `id::` falls in this bucket: `block/uuid` is always assigned by
  `ensure_block_uuids`; there is no uuid-pinning input.

Markdown supplies values as **strings**, so the string is **coerced to the
resolved property's schema type** before emitting `batch-set-property` —
the schema is known once the key resolves (`:number`/`integer` → numeric
literal, `:checkbox` → `true`/`false`, `:node`/ref-valued → `[[name]]` or
uuid resolved to the entity, `:date` → journal/day or literal, text →
as-is). A value that cannot be coerced fails the command like an
unresolvable key.

Separately from `key::`, markdown title markers keep working:

| Input | Mapping |
|---|---|
| `- # text` … `- ###### text` | `:logseq.property/heading` (int 1-6) via `batch-set-property`; `#` marker stripped from stored title — paste-path parity (`frontend.format.block/extract-blocks` maps `:heading` → `:logseq.property/heading`) |

### 4. `[[refs]]` and `#tags` in markdown titles

- `[[Page]]`: extracted via `Mldoc.getReferences` `pages` (AST-level —
  no code-fence/verbatim false positives), then the existing
  ensure-page + `block/refs` flow applies (`page_ref_value` name maps →
  worker-side `resolve-page-refs` creates missing pages).
- `#tag`: `Mldoc.getReferences` `tags` → `Selector.Tag_name` → existing
  `resolve_tags` → `metadata_ops` path — **the tag must already exist;
  an unresolvable tag fails the command** (same semantics as
  `block/tags` in the EDN input). Resolved tags emit
  `batch-set-property` on `block/tags` in the same ops vector. The
  `#tag` text stays in the title (inline-tag convention).

### 5. What changes in `cli/`

- `read_blocks` returns raw markdown text (`--blocks` string or file
  contents) → `markdown_blocks_of_string` → `Block.t` tree → flattened
  insert payload.
- New flag `--dry-run` (create mode): runs parse + all resolutions
  **read-only** — `[[page]]`/tag/property lookups via `pull` only,
  `ensure_page_entity` does not fire `create-page` — and prints the
  plan: target, block count/tree preview, pages that would be created,
  tags, property assignments, errors. No `apply-outliner-ops` call is
  made.
- Deleted for this path: `parse_blocks_edn`, `block_of_value`,
  `insert_tree` per-level ops, EDN-tree reading.
  (`edn_value_of_string` stays — `--update-tags`/
  `--update-properties`/`--tags`/`--properties` remain EDN.)
- `block_opts.blocks_edn` → rename to `blocks_markdown` in
  `spec/commands/upsert.mli` (spec shape unchanged: `string option`;
  `.mli` update approved). `command_registry.ml` option docs →
  "Markdown blocks" / "Path to markdown file". Flag names
  `--blocks`/`--blocks-file` unchanged; `cli_parse.ml` unchanged.
- Update mode keeps rejecting `--blocks`/`--blocks-file`; `--content`
  unchanged (literal single-block title, existing `Block.make ~title`
  path).
- `cli/package.json`: add `"mldoc": "^1.5.9"`.

## What markdown input produces (DB graph)

| Input | Result |
|---|---|
| `- a` / `  - b` indentation | block tree via level folding → **one** `insert-blocks` op (flat list, `[:block/uuid]` parent lookup-refs) |
| `[[Page name]]` | `getReferences` pages → `block/refs` → existing page or auto-created page |
| `#tag` | `getReferences` tags → `resolve_tags` → `batch-set-property block/tags`; unknown tag → error |
| `- # heading` | `:logseq.property/heading` + stripped title |
| `key:: value` (key resolves to an existing db property) | `batch-set-property` on the block; line stripped from title |
| `key:: value` (key unknown — incl. `id::`) | `Invalid_blocks` error; `block/uuid` always auto-generated |
| `TODO`, `DEADLINE:`, `SCHEDULED:` | literal title text (DB config) |
| code fences, quotes, tables | preserved verbatim in block title |

## Decisions (resolved in review)

- **Value typing** — coerce `key::` string values to the resolved
  property's schema type (§3); uncoercible → error.
- **`--blocks` + `--update-tags`/`--update-properties`** — keep rejecting
  the combination, same as EDN mode.
- **`key::` lines in titles** — stripped from the stored title once
  consumed as properties.
- **`#tag`** — existing tags only (`resolve_tags` semantics); unknown →
  error.
- **Spec `.mli` updates** — approved as needed (`blocks_edn` →
  `blocks_markdown`).
- **Top-level `#` markdown headings** — accepted; they fold into the
  block tree via the same level rules as list items.
- **No idempotency** — accepted: every run creates fresh blocks
  (auto-generated uuids). **`--dry-run`** added so callers can preview
  the plan before writing.
- **Ref/tag extraction** — `Mldoc.getReferences` (AST-level), not
  title-text regex; code-fence/verbatim false positives eliminated.
- **Single transaction** — flat block list in one `insert-blocks` op +
  property/tag ops in the same `apply-outliner-ops` call.

## Remaining open questions

- **Large `--blocks-file`.** Markdown travels inside one transit invoke
  body; no chunking story for multi-MB files. Accepted as a v1 limitation.
- **Value-coercion edge cases** — exact scalar grammar (dates, booleans,
  ref literals `[[x]]` vs bare names) is defined at implementation time
  against `Property` schema kinds; anything ambiguous fails rather than
  guessing.
- **`--dry-run` output shape** — human-readable plan vs structured
  `{:dry-run …}` map for `--output json|edn`; define with the normal
  output-mode conventions.

## Alternatives considered and rejected

- **Worker-side parse via a new outliner op** (`insert-blocks-markdown` on
  `apply-outliner-ops`): zero new thread-apis and would reuse the cljs
  `extract-blocks` pipeline wholesale — but the directive is CLI-side
  parsing. Trade-off recorded: the OCaml port must replicate pos-meta
  slicing + level folding (~150 lines) that cljs already has.
- **Worker-side parse via a new thread-api**: violates
  `src/main/logseq/cli/AGENTS.md` ("Do not implement new `thread-api` in
  db-worker unless it is absolutely necessary") and adds a second write
  endpoint.
- **Keep EDN and add a separate `--markdown` flag**: two input formats for
  one feature; contradicts "one clear code path".
- **Link OCaml `mldoc` source under Melange**: unproven toolchain
  (angstrom/xmlm/yojson are js_of_ocaml-tested, not Melange-tested); the
  npm bundle + externals is the predictable route.

## Rough implementation outline (if approved)

1. `cli/lib/mldoc.ml` externals + `cli/package.json` dep; config literal.
2. `cli/lib/markdown_blocks.ml`: parseJson walk → `(title, level,
   key-props)` list → `Block.t` tree; `getReferences` for `[[refs]]`/`#tags`;
   wire into `read_blocks` in `add.ml`.
3. Flatten tree → one `[:insert-blocks [flat-maps] target-uuid opts]` op
   (`block/parent [:block/uuid]` lookup-refs) + `key::`/`#tag`/`status`
   `batch-set-property` ops in the same `apply-outliner-ops` call;
   `key::` → `Property.Key_ident`/name resolution → schema-coerced values;
   `#tag` → `Selector.Tag_name` → `resolve_tags`.
4. `--dry-run`: parse + resolve read-only, print plan (target, tree
   preview, pages to create, tags, props), no write call.
5. Delete `parse_blocks_edn`/`block_of_value`/`insert_tree`; rename spec
   field; update `command_registry.ml` help.
6. `cli-e2e/`: replace `--blocks` EDN cases with markdown (nesting, refs,
   tags, journal default target, property ops, error cases, `--dry-run`).
7. `docs/cli/logseq-cli.md`: update flag docs.

## Implementation notes (post-implementation deviations)

- **Option parser fix**: `is_option` in `cli/lib/cli.ml` and
  `cli/lib/cli_parse.ml` treated every `-`-leading token as an option, so
  `--blocks '- item'` rejected its own value. Options now require
  `-`/`--` followed by an ASCII letter; `- item`, `---`, `-[ ]` parse as
  values. `--dry-run` was added to both `boolean_option` lists.
- **`key::` key charset**: mldoc `try_md_property` only emits
  `Property_Drawer` for keys with no spaces and no colons — `Inline
  Note::` becomes a paragraph. Property keys with spaces/numeric-ids
  cannot be expressed as `key::`; use `--update-properties` for those.
- **`--dry-run` scope**: applies to create mode (both `--content` and
  `--blocks`); rejected in update mode (`--dry-run is only for create
  mode`). JSON/EDN output emits `{:dry-run true :ops [...] :
  would-create-pages [...]}`.
- **`block/level`**: emitted per computed depth (roots 1); the worker's
  `blocks-with-level` recalculates it from `block/parent` regardless.
- **Ref/tag extraction**: implemented via `Mldoc.getReferences` —
  `[[refs]]` and `#tags` inside code blocks or verbatim spans are not
  extracted.
