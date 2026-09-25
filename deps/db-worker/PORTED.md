# Ported upstream baseline

The OCaml code in this directory is a 1:1 port of the ClojureScript
db worker and its deps as of:

    master 50e184962fb5e28f20c0ec34013284ecd09db8db
    fix: hide library blocks and collapse nested pages (#13349)

Post-base upstream commits already merged into the port (worker/outliner
dependency cone):

    f6fc6f78ac  fix: preserve outliner insert identities during sync replay (#13316)
    062343d463  fix: only allow normal pages to be moved into the Library page (#13384)
    4608885d40  fix: drag and paste of page-embed nodes (#13359)
    43a540f350  fix: register namespace root in Library when moving a page under a page (#13397)
    94bb8b1e32  fix: backfill created-at when stamping page updated-at (#13416)
    1e07062b83  fix: bump page updated-at on insert, move, and delete (#13402)
    fdde4679b7  fix: drop stale journal refs when clearing datetime values (#13417)
    8e321ad70f  refactor: split sync tx upload into named pipeline stages (#13365)

When diffs against the baseline reference these, the OCaml side already
carries them (canonicalize-insert-ops, Library move restriction,
page-embed paste-link).

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
