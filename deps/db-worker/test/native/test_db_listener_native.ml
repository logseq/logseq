(* 1:1 OCaml translation of
   src/test/frontend/worker/db_listener_test.cljs (15 deftests).

   Ported (3): the deftests that exercise the ported Db_listener
   surface — post-commit stage ordering and error isolation:

   - db-listener-persists-local-tx-before-broadcasting-ui-refresh
   - db-listener-reports-post-commit-failures-without-blocking-ui-sync
   - deferred-listener-failures-do-not-block-ui-sync

   Skipped (12) — unported dependencies, documented per cljs test:
   - renderer-tx-meta-keeps-only-side-effect-inputs,
     renderer-route-candidates-summarize-changed-task-and-comment-blocks:
     db-listener/renderer-tx-meta and renderer-route-candidates are not
     ported (no OCaml fns).
   - markdown-mirror-listener-enqueues-worker-mirror-work: the cljs test
     with-redefs markdown-mirror/<handle-tx-report! to spy on the call;
     the OCaml deferred handler calls Markdown_mirror.handle_tx_report
     inside Db_worker_effect.async with no injection point, so the call
     cannot be observed (and lazy effects never forced are never
     reported — see rejected-promises note).
   - db-listener-skips-search-sync-for-imported-data: no "search"
     deferred handler is registered yet (search sync unported).
   - db-listener-builds-one-render-delta-for-origin-and-broadcast,
     canonical-replacements-omit-entities-deleted-in-the-same-transaction,
     canonical-replacements-override-same-uuid-tombstones,
     imported-structural-changes-include-children-patches,
     db-listener-does-not-publish-incomplete-graph-render-deltas,
     db-listener-does-not-publish-skip-validation-render-deltas: the
     render-delta build path (build-render-delta, canonical-replacements)
     is not ported; OCaml subsumes the whole
     invoke-hooks→render-delta→broadcast pipeline behind the single
     Db_listener.main_thread_sync slot.
   - rejected-deferred-listener-promises-are-reported: cljs relies on
     promise rejection inside the deferred handler reaching the
     capture-error channel. OCaml deferred handlers run synchronously
     via Db_worker_effect.async whose effects are only forced by the
     consumer — an exception raised inside the unforced effect can never
     reach run_post_commit. No OCaml equivalent; possible divergence to
     flag if deferred effects are expected to be observed.

   Wiring differences vs cljs (kept faithful where observable):
   - cljs with-redefs db-sync/update-local-sync-checksum!,
     db-sync/handle-local-tx!, worker-pipeline/invoke-hooks,
     render-delta/build, shared-service/broadcast-to-clients! →
     OCaml injection refs Db_listener.update_checksum /
     persist_local_tx / main_thread_sync (the last subsumes the whole
     main-thread pipeline: ordering granularity is coarser — one slot
     instead of build+broadcast entries).
   - cljs reports post-commit failures via platform/post-message!
     :capture-error with {:payload {:stage ...}}; OCaml
     report_post_commit_error only writes a Worker_log entry
     "db-worker/post-commit-handler-failed" with a stage field —
     assertions read the Worker_log ring (Sync_deps.capture_error
     exists but is not invoked by db_listener — lib gap if capture-error
     delivery is expected).
   - cljs :handler-keys selects which listeners run; OCaml
     listen_db_changes always runs the fixed stages plus every
     registered deferred handler, so deferred order is
     [main-thread-sync; deferred] (cljs recorded the deferred call
     before the async broadcast — an artifact of the async pipeline,
     not semantics).

   Known lib/engine bugs hit by these tests (no workarounds — left red):
     - none at translation time.
*)

open Datascript
open Test_shared

let test_repo = "test-worker-db-listener"

(* seeded db cached once — Sqlite_export.create_conn seeds the full
   built-in ontology (~25s); conn_from_db clones share it. *)
let seeded_db : db option ref = ref None

let create_conn () : conn =
  let db =
    match !seeded_db with
    | Some d -> d
    | None ->
        let c = Sqlite_export.create_conn () in
        let d = db_of c in
        seeded_db := Some d;
        d
  in
  conn_from_db db

(* snapshots the Worker_log ring so a test can count new entries *)
let log_entries_since mark =
  List.drop mark (Worker_log.entries ())

let post_commit_failures_since mark =
  List.filter
    (fun (e : Worker_log.entry) ->
      e.message = "db-worker/post-commit-handler-failed")
    (log_entries_since mark)

let field (e : Worker_log.entry) k = List.assoc_opt k e.fields

(* installs a listener on a fresh conn and returns the stage refs'
   previous values for restore *)
let listen conn = Db_listener.listen_db_changes test_repo conn

let transact_hello conn =
  ignore
    (transact_conn_string conn
       ~tx_meta:[ "local-tx?", Bool true ]
       "[{:db/id -1 :block/title \"hello\"}]")

let hello_count conn =
  match
    Datascript.q_string (db_of conn)
      "[:find (count ?e) . :where [?e :block/title \"hello\"]]"
  with
  | [ [ Result_value (Int n) ] ] -> n
  | _ -> -1

(* (deftest db-listener-persists-local-tx-before-broadcasting-ui-refresh-test)
   cljs asserts [:persist-local-tx :build-ui-refresh :broadcast-ui-refresh];
   OCaml main_thread_sync covers build+broadcast as one slot. *)
let test_persist_before_broadcast () =
  let conn = create_conn () in
  let calls = ref [] in
  let prev_persist = !Db_listener.persist_local_tx in
  let prev_sync = !Db_listener.main_thread_sync in
  Fun.protect
    ~finally:(fun () ->
      Db_listener.persist_local_tx := prev_persist;
      Db_listener.main_thread_sync := prev_sync)
    (fun () ->
      Db_listener.persist_local_tx :=
        (fun _ _ -> calls := !calls @ [ "persist-local-tx" ]);
      Db_listener.main_thread_sync :=
        (fun _ _ _ -> calls := !calls @ [ "ui-refresh" ]);
      listen conn;
      transact_hello conn;
      check "persist before ui refresh"
        (!calls = [ "persist-local-tx"; "ui-refresh" ]))

(* (deftest db-listener-reports-post-commit-failures-without-blocking-ui-sync-test)
   doseq failed-stage over :checksum/:persist. *)
let test_post_commit_failures_dont_block () =
  List.iter
    (fun failed_stage ->
      let conn = create_conn () in
      let calls = ref [] in
      let mark = List.length (Worker_log.entries ()) in
      let prev_checksum = !Db_listener.update_checksum in
      let prev_persist = !Db_listener.persist_local_tx in
      let prev_sync = !Db_listener.main_thread_sync in
      Fun.protect
        ~finally:(fun () ->
          Db_listener.update_checksum := prev_checksum;
          Db_listener.persist_local_tx := prev_persist;
          Db_listener.main_thread_sync := prev_sync)
        (fun () ->
          Db_listener.update_checksum :=
            (fun _ _ ->
              calls := !calls @ [ "checksum" ];
              if failed_stage = "checksum" then failwith "checksum failed");
          Db_listener.persist_local_tx :=
            (fun _ _ ->
              calls := !calls @ [ "persist" ];
              if failed_stage = "persist" then failwith "persist failed");
          Db_listener.main_thread_sync :=
            (fun _ _ _ ->
              calls := !calls @ [ "build-ui-refresh"; "broadcast-ui-refresh" ]);
          listen conn;
          let raised =
            try
              transact_hello conn;
              false
            with _ -> true
          in
          check (Printf.sprintf
                   "post-commit failure escaped: %s" failed_stage)
            (not raised);
          check (Printf.sprintf "datom committed (%s)" failed_stage)
            (hello_count conn = 1);
          check
            (Printf.sprintf "one reported error (%s)" failed_stage)
            (List.length (post_commit_failures_since mark) = 1);
          check
            (Printf.sprintf "all stages ran (%s)" failed_stage)
            (!calls
             = [ "checksum"; "persist"; "build-ui-refresh"; "broadcast-ui-refresh" ])))
    [ "checksum"; "persist" ]

(* (deftest deferred-listener-failures-do-not-block-ui-sync-test)
   OCaml order: main_thread_sync then deferred handlers; the reported
   stage is the handler's registration key. *)
let test_deferred_failures_dont_block () =
  let conn = create_conn () in
  let calls = ref [] in
  let mark = List.length (Worker_log.entries ()) in
  let prev_sync = !Db_listener.main_thread_sync in
  let prev_mirror =
    Hashtbl.find_opt Db_listener.deferred_handlers "markdown-mirror"
  in
  Fun.protect
    ~finally:(fun () ->
      Db_listener.main_thread_sync := prev_sync;
      (match prev_mirror with
       | Some h -> Db_listener.register "markdown-mirror" h
       | None -> Hashtbl.remove Db_listener.deferred_handlers "markdown-mirror"))
    (fun () ->
      Db_listener.main_thread_sync :=
        (fun _ _ _ -> calls := !calls @ [ "broadcast-ui-refresh" ]);
      Db_listener.register "markdown-mirror" (fun _ _ ->
          calls := !calls @ [ "deferred-listener" ];
          failwith "deferred listener failed");
      listen conn;
      let raised =
        try
          transact_hello conn;
          false
        with _ -> true
      in
      check "post-commit failure escaped" (not raised);
      check "calls order"
        (!calls = [ "broadcast-ui-refresh"; "deferred-listener" ]);
      (match post_commit_failures_since mark with
       | [ e ] -> check "reported stage"
                    (field e "stage" = Some "markdown-mirror")
       | es ->
           check "exactly one reported error" (List.length es = 1)))

let cases =
  [ Alcotest.test_case
      "db-listener-persists-local-tx-before-broadcasting-ui-refresh-test" `Quick
      test_persist_before_broadcast
  ; Alcotest.test_case
      "db-listener-reports-post-commit-failures-without-blocking-ui-sync-test"
      `Quick test_post_commit_failures_dont_block
  ; Alcotest.test_case
      "deferred-listener-failures-do-not-block-ui-sync-test" `Quick
      test_deferred_failures_dont_block ]
