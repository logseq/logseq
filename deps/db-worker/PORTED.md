# Ported upstream baseline

The OCaml code in this directory is a 1:1 port of the ClojureScript
db worker and its deps as of:

    master 50e184962fb5e28f20c0ec34013284ecd09db8db
    fix: hide library blocks and collapse nested pages (#13349)

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

    b3f5689 (on top of 1bec8d6 incremental mid-tx schema refresh +
             once-per-refresh removals fix)

When the engine pin moves, re-run `dune build @runtest` plus
`test_export_native.exe` — export/import roundtrip is the most
sensitive suite to engine changes.
