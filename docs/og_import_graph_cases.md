# OG Import Graph Cases

This file tracks file-graph-to-DB import issue classes and the regression cases fixed or covered by tests.

## db-test Import Issue Classes

GitHub `logseq/db-test` issues with the `import` label were audited on 2026-06-24. The file-graph importer cases fall into these classes:

- Block identity and references: #213, #226, #340, #426, #525, #641, #679, #684, #748, #927, #931.
- Journal and page references: #61, #77, #191, #192, #588, #906.
- Legacy properties, tasks, queries, and config: #176, #193, #195, #198, #220, #250, #289, #290, #300, #318, #341, #406, #446, #521, #537, #539, #540, #601, #732, #733, #936.
- Markdown and Org parsing fidelity: #434, #523, #582.
- Assets, PDFs, and highlights: #196, #358, #923.
- Tags, namespaces, aliases, and backlinks: #7, #134, #136, #197, #210, #460, #680, #724.
- Import UX, graph lifecycle, or non-file-graph import paths: #177, #216, #827.

## Fixed and Covered Cases

### Legacy journal filename refs

- Source issue: #906.
- Case: an OG page links to an imported journal file by file-style names such as `[[2026_04_01]]`, including when the source file is processed before the target journal file.
- Expected import behavior: resolve the file-style name to the DB journal page for that imported file, point `:block/refs` at the journal entity, and avoid creating an ordinary page named `2026_04_01`.
- Regression test: `logseq.graph-parser.exporter-test/import-legacy-journal-file-name-refs-as-journals`.

### Missing block refs

- Source issues: #213, #340, #679, #748, #927.
- Case: imported content contains block refs whose target block is absent from the selected file graph.
- Expected import behavior: remove the missing block ref from imported content and `:block/refs`, preserve blocks whose title becomes empty, and do not leave placeholder entities.
- Regression tests: `logseq.graph-parser.exporter-test/import-removes-pre-block-marker-and-missing-block-refs` and `logseq.graph-parser.exporter-test/export-doc-files-propagates-missing-block-ref-cleanup-report`.

### Forward block refs

- Source issues: #850, #927.
- Case: a block references a target block that appears in a later imported file.
- Expected import behavior: preserve the reference after all files import.
- Regression test: `logseq.graph-parser.exporter-test/import-removes-pre-block-marker-and-missing-block-refs`.

### Duplicated block ids

- Generated edge case.
- Case: two imported blocks contain the same `id::` value.
- Expected import behavior: keep the first block id, assign a new id to later duplicates, and keep the imported graph valid.
- Regression test: `logseq.graph-parser.exporter-test/import-repairs-duplicated-block-ids`.

### Generated Markdown file graphs

- Generated edge case.
- Case: deterministic random Markdown graphs contain multiple pages and journals with mixed task markers, page refs, missing page refs, block refs, missing block refs, duplicated ids, broken ids, temporal markers, tags, page properties, block properties, namespaces, aliases, missing asset links, tables, code fences, and nested blocks.
- Expected import behavior: import the whole file graph without throwing, keep the generated block corpus, repair invalid identity/ref data through the normal import path, and keep the imported DB valid.
- Regression tests: `logseq.graph-parser.exporter-test/import-generated-markdown-file-graph` and the local `^:integration` fuzz test `logseq.graph-parser.exporter-test/import-generated-markdown-file-graph-fuzz`.

### Recursive block refs

- Generated edge case.
- Case: a block title references the same block id.
- Expected import behavior: rebuild refs without adding a recursive self-reference.
- Regression test: `logseq.outliner.pipeline-test/db-rebuild-block-refs-removes-recursive-self-ref`.

### Missing pages

- Generated edge case.
- Case: imported content references a page that is not otherwise present in the selected file graph.
- Expected import behavior: create the referenced ordinary page once and point refs at it. Legacy journal filename refs resolve to journal pages only when the corresponding journal file is part of the import set.
- Regression tests: `logseq.graph-parser.exporter-test/import-creates-missing-ordinary-page-refs` and `logseq.graph-parser.exporter-test/import-legacy-journal-file-name-refs-as-journals`.

### Mixed repeated deadline and scheduled timestamps

- Source issue: #318.
- Case: one imported task has both `DEADLINE` and `SCHEDULED`, with a repeat cookie on one of them.
- Expected import behavior: keep both temporal dates, keep the repeat metadata attached to the repeated temporal property, and ensure the `repeat-type` built-in property exists so the imported DB validates.
- Regression test: `logseq.graph-parser.exporter-test/import-repeated-deadline-and-scheduled`.

### Linked external PDF annotations

- Source issue: #923.
- Case: an OG graph links a PDF with a `file:///...pdf` URL instead of copying the PDF under `assets/`, while the annotation EDN and `hls__*.md` files are stored under the graph by decoded filename.
- Expected import behavior: create an external Asset node for the linked PDF, keep the `file://` URL in asset metadata, import the PDF annotations, and point annotation blocks at the external Asset.
- Regression test: `logseq.graph-parser.exporter-test/import-linked-file-pdf-annotations`.

### Missing local PDF asset links

- Generated edge case.
- Case: imported Markdown links a local PDF under `assets/`, but the target file is absent from the selected file graph.
- Expected import behavior: report the unresolved link through `ignored-assets`, continue importing without noisy stderr output, and keep the imported DB valid.
- Regression test: `logseq.graph-parser.exporter-test/import-missing-local-pdf-asset-link-is-ignored-quietly`.

### Large flat files

- Source issue: #931.
- Case: a large imported file has tens of thousands of top-level blocks.
- Expected import behavior: build block txs and tx indexes eagerly enough to avoid lazy-sequence stack overflows, transact the file, and validate the imported graph.
- Regression test: `logseq.graph-parser.exporter-test/import-large-flat-file-without-stack-overflow`.

### Empty imported files

- Source issue: #582.
- Case: an Org or Markdown file graph contains an empty or one-byte journal/doc file, as in the `org-import.zip` fixture attached to #582.
- Expected import behavior: omit absent `:block/refs` values instead of transacting nil, continue importing the rest of the graph, and keep the imported DB valid.
- Regression test: `logseq.graph-parser.exporter-test/import-empty-journal-file`.
