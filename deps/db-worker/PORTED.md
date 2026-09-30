# Ported upstream baseline

The OCaml code in this directory is a 1:1 port of the ClojureScript
db worker and its deps as of:

    master 50e184962fb5e28f20c0ec34013284ecd09db8db
    fix: hide library blocks and collapse nested pages (#13349)

Post-base upstream commits already merged into the port (worker/outliner
dependency cone, master SHAs):

    faa16f71a3  fix: preserve outliner insert identities during sync replay (#13316)
    d58ff17169  fix: only allow normal pages to be moved into the Library page (#13384)
    65cce5de07  fix: drag and paste of page-embed nodes (#13359)
    43a540f350  fix: register namespace root in Library when moving a page under a page (#13397)
    94bb8b1e32  fix: backfill created-at when stamping page updated-at (#13416)
    1e07062b83  fix: bump page updated-at on insert, move, and delete (#13402)
    fdde4679b7  fix: drop stale journal refs when clearing datetime values (#13417)
    8e321ad70f  refactor: split sync tx upload into named pipeline stages (#13365)
    96b806f899  perf: skip full-graph validate on MCP upsertNodes (#1265) (#13388)
    9fee91ada5  refactor: extract leaf domains from editor handler into editor/ namespaces (#13368)
    be8150ad0b  refactor: extract post-import finalize passes from exporter (#13367)
    d7a4acab01  fix: defer db-worker-node graph open until first create-or-open-db (#13391)
    4d61669fe6  fix: keep asset queue alive when one asset download fails (#13315)
    3e640478bc  fix: keep eager db-worker-node graph open for cli-owned servers (#13394)
    2c2f607bf4  enhance: show no-cards-due state with practice-again in flashcards (#13410)
    a2ad020091  fix: include custom status/priority values in query filter suggestions (#13412)
    db6872b6f1  fix: scope class-declared property defaults to class members (#13414)
    8edb86a2fa  fix(db-sync): heal stale local checksum on graph open via covered commit (#13415)
    8e11118390  fix: show property title instead of db-ident in query builder (#13420)
    b7558934aa  fix: isolate query render errors so editing /query with incomplete syntax doesn't crash (#13419)
    1b58ccff8b  fix(outliner): dedupe repeated new-page refs in one insert
    a802e6b03f  fix(outliner): dedupe class refs by title
    3c17bf397e  fix(outliner): match class tags by title in ref remapping
    2ef453b73a  refactor: extract ref dedup fold from resolve-page-refs
    16c4ed1a04  refactor: share title-aware tag-ref matching between save and insert
    3fdabc0810  fix: show selected values in node property pickers (#13521)
    fdfd7758a3  fix: keep '++' repeat anchored to original date across month-end clamp
    82e2717796  fix: refuse renaming a page to a case variant of another page
    74b61250e3  fix: keep recycle parent until both sides restore
    829fb85cca  fix: use local days for scheduled and deadline range
    53db271a4b  fix: refuse converting namespaced pages to properties
    cda0f025a5  fix(repeat): keep date repeats on the right day
    79a5201bad  fix(views): order leftover eids by eid in unlimited index walk
    5391127cb8  perf(views): sort small sets without a row limit
    1f1589e02f  fix(outliner): do not revert many to one on undo (#13526)
    c4d837fce5  fix(undo): restore deleted pages with inner refs
    e2ca31b906  fix(undo): restore deleted blocks with inner refs
    5803194cdd  fix(undo): keep newest entries when stack is full
    5442f36335  fix(undo): don't reuse a property in page replay
    49610e9f0e  fix(undo): restore up/down moves into an embed
    8a4e6c6aa7  fix(undo): restore a property with its value block
    dc370d9fd8  fix(undo): restore a deleted tag named like a page
    e1e8da3da6  fix(undo): order restored blocks at their target
    59e9843841  fix(undo): restore all moved blocks in page order
    1ee906b817  fix(undo): restore scattered blocks moved up/down
    fff75ea17d  perf(db): set WAL synchronous=NORMAL (#13491)
    8c3438d4ce  perf(sync): keep checksum only on remote graphs
    ec0549993d  perf(sync): compute page-tag eids once per db
    dd4c6439b9  perf(sync): hash checksum fields without vectors
    57a8caf564  perf(sync): check checksum eligibility on datoms
    354a428b0f  fix(sync): keep value replacements in one request

When diffs against the baseline reference these, the OCaml side already
carries them (canonicalize-insert-ops, Library move restriction,
page-embed paste-link, upsertNodes scoped validate + page-id assert).

When master moves, diff the cljs sources against this commit to find
what must be re-ported:

    git diff 50e184962fb5e28f20c0ec34013284ecd09db8db..origin/master -- \
      src/main/frontend/worker deps/db deps/outliner \
      deps/graph-parser deps/common deps/db-sync deps/publishing

Every ported OCaml file cites its cljs source namespace in the header
comment — use it to map a cljs diff to the OCaml file that needs the
same change.

## datascript-ocaml engine pin

The engine follows `logseq/datascript-ocaml#main` (opam pin). Baseline
for this port state:

    c9cc0b7 fix tempid group order + memoize schema_attr lookups
            (includes 5a5d3fb index-order restore verification/heal)

When the engine pin moves, re-run `dune build @runtest` plus
`test_export_native.exe` — export/import roundtrip is the most
sensitive suite to engine changes.
