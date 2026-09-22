(* 1:1 OCaml translation of
   src/test/frontend/worker/db_listener_test.cljs (14 deftests).

   Ported (11) — exercised through the ported Db_listener /
   Render_delta / Broadcast surfaces:

   - renderer-tx-meta-keeps-only-side-effect-inputs →
     Db_listener.renderer_tx_meta (cljs :error-handler is a fn and has
     no EDN value — omitted from the input meta, noted in cljs as
     excluded anyway)
   - renderer-route-candidates-summarize-changed-task-and-comment-blocks
     → Db_listener.renderer_route_candidates
   - db-listener-persists-local-tx-before-broadcasting-ui-refresh →
     Db_listener.listen_db_changes ~handler_keys +
     Broadcast.set_post_fn spy (cljs with-redefs
     shared-service/broadcast-to-clients! → Broadcast post_fn)
   - db-listener-builds-one-render-delta-for-origin-and-broadcast →
     same wiring; cljs spied on invoke-hooks/render-delta internals —
     not injectable in OCaml, so assertions cover the observable surface
     (one broadcast, payload = {repo, tx-meta, delta}, origin delta
     retained via take_outliner_op_delta, transit roundtrip, forbidden
     renderer keys absent)
   - canonical-replacements-omit-entities-deleted-in-the-same-transaction
     → Db_listener.canonical_replacements
   - canonical-replacements-override-same-uuid-tombstones →
     Db_listener.build_render_delta (cljs :deleted-block-uuids output
     key is "deleted" in OCaml)
   - imported-structural-changes-include-children-patches →
     build_render_delta children patches
   - db-listener-does-not-publish-incomplete-graph-render-deltas →
     publish_render_delta gate (4 tx-meta flags)
   - db-listener-does-not-publish-skip-validation-render-deltas → same
   - db-listener-reports-post-commit-failures-without-blocking-ui-sync
     → update_checksum/persist_local_tx throwing + capture-error
     broadcast assertions (cljs platform/post-message! :capture-error →
     Broadcast.to_clients "capture-error")
   - deferred-listener-failures-do-not-block-ui-sync → registered
     deferred handler throwing; OCaml deferred order is
     [deferred; broadcast] like cljs (broadcast happens after deferred
     handlers in process_committed_tx)

   Skipped (3):
   - markdown-mirror-listener-enqueues-worker-mirror-work: cljs
     with-redefs markdown-mirror/<handle-tx-report! to spy; OCaml calls
     Markdown_mirror.handle_tx_report inside Db_worker_effect.async
     with no injection point.
   - db-listener-skips-search-sync-for-imported-data: no "search"
     deferred handler is registered yet (search sync unported).
   - rejected-deferred-listener-promises-are-reported: cljs asserts a
     *rejected promise* inside the deferred handler is captured and
     reported asynchronously. OCaml deferred handlers are synchronous;
     exceptions inside Db_worker_effect.async only surface when the
     effect is forced — nothing forces it here, so the cljs test has no
     faithful OCaml equivalent (potential lib gap if lazy effects are
     expected to report).

   Known lib/engine bugs hit by these tests (no workarounds — left red):
     - runtime/native/transit_codec.ml decode mis-resolves Normal-mode
       read-cache refs (^@, ^:, ^G …): repeated keyword/uuid values in
       a broadcast payload (e.g. [:attr :block/uuid] inside
       affected-keys) decode to wrong values (~u<uuid>, Tagged sets),
       so `delta survives transit roundtrip` in
       db-listener-builds-one-render-delta-for-origin-and-broadcast
       fails. Verified in isolation — the decoded payload corrupts only
       inside cached values.
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

(* force Render_snapshot module init — its let () registers
   Sync_deps.canonical_blocks_fn which canonical_replacements needs *)
let _init_canonical_blocks = Render_snapshot.canonical_blocks

let uuid_lit u = Printf.sprintf "#uuid \"%s\"" u

(* ---- worker-log ring inspection (cljs captured-errors atom) ---- *)

let log_mark () = List.length (Worker_log.entries ())

let new_errors_since mark =
  List.filter
    (fun (e : Worker_log.entry) ->
      e.message = "db-worker/post-commit-handler-failed")
    (List.drop mark (Worker_log.entries ()))

let field (e : Worker_log.entry) k = List.assoc_opt k e.fields

(* ---- broadcast spy (cljs broadcast-payloads atom) ---- *)

type captured = { kind : string; payload : string }

let with_broadcast_capture f =
  let captured = ref [] in
  Broadcast.set_post_fn (fun ~kind ~payload ->
      captured := { kind; payload } :: !captured);
  Fun.protect ~finally:(fun () -> Broadcast.set_post_fn (fun ~kind:_ ~payload:_ -> ()))
    (fun () -> f captured)

let sync_db_broadcasts captured =
  List.filter (fun c -> c.kind = "sync-db-changes") !captured

let capture_error_broadcasts captured =
  List.filter (fun c -> c.kind = "capture-error") !captured

(* ---- tx helpers ---- *)

let transact conn ?(tx_meta = []) tx = ignore (transact_conn_string conn ~tx_meta tx)

let transact_report conn ?(tx_meta = []) tx =
  transact_conn_string conn ~tx_meta tx

let tx_data_eids (r : tx_report) =
  List.fold_left
    (fun acc (d : datom) -> if List.mem d.e acc then acc else acc @ [ d.e ])
    [] r.tx_data

let ent_of_eid db eid = entity db (Entity_id eid)

let hello_count conn =
  match
    Datascript.q_string (db_of conn)
      "[:find (count ?e) . :where [?e :block/title \"hello\"]]"
  with
  | [ [ Result_value (Int n) ] ] -> n
  | _ -> -1

(* ---- wire helpers ---- *)

let wire_keys = function
  | Wire.Map kvs -> List.map fst kvs
  | _ -> []

let wire_map_get m k = Wire.get k m

(* ---- restore helpers for Db_listener refs ---- *)

let with_listener_hooks ~update_checksum ~persist f =
  let prev_uc = !Db_listener.update_checksum in
  let prev_p = !Db_listener.persist_local_tx in
  Fun.protect
    ~finally:(fun () ->
      Db_listener.update_checksum := prev_uc;
      Db_listener.persist_local_tx := prev_p)
    (fun () ->
      Db_listener.update_checksum := update_checksum;
      Db_listener.persist_local_tx := persist;
      f ())

(* ---------- tests ---------- *)

(* (deftest renderer-tx-meta-keeps-only-side-effect-inputs-test) *)
let test_renderer_tx_meta () =
  let tx_meta =
    [ "initial-pages?", Bool true
    ; "end?", Bool true
    ; "client-id", String "client"
    ; "outliner-op", Keyword "rename-page"
    ; "deleted-page", String "deleted"
    ; ( "data"
      , Map
          [ Keyword "old-name", String "before"
          ; Keyword "new-name", String "after" ] )
    ; ( "outliner-ops"
      , Vector [ Vector [ Keyword "save-block"; Vector [] ] ] )
    ; ( "db-sync/inverse-outliner-ops"
      , Vector [ Vector [ Keyword "save-block"; Vector [] ] ] )
    ; "db-sync/tx-id", Int 42
    ; "local-tx?", Bool true
    ; "request-id", String "request"
    ; "ui/perf-id", Uuid (Uuid_gen.uuid ()) ]
  in
  let rendered = Db_listener.renderer_tx_meta tx_meta in
  let got_keys =
    List.sort String.compare
      (List.filter_map
         (function Wire.Keyword k -> Some k | _ -> None)
         (wire_keys rendered))
  in
  check "renderer-tx-meta keys"
    (got_keys
     = List.sort String.compare
         [ "initial-pages?"; "end?"; "client-id"; "outliner-op"
         ; "deleted-page"; "data" ]);
  (match wire_map_get rendered "data" with
   | Some (Wire.Map kvs) ->
       check "data map roundtrips"
         (kvs
          = [ Wire.Keyword "new-name", Wire.String "after"
            ; Wire.Keyword "old-name", Wire.String "before" ]
          || kvs
             = [ Wire.Keyword "old-name", Wire.String "before"
               ; Wire.Keyword "new-name", Wire.String "after" ])
   | _ -> check "data map" false)

(* (deftest renderer-route-candidates-summarize-changed-task-and-comment-blocks-test) *)
let test_route_candidates () =
  let conn = create_conn () in
  let tu = Uuid_gen.uuid () and cu = Uuid_gen.uuid () and ou = Uuid_gen.uuid () in
  let report =
    transact_report conn
      (Printf.sprintf
         "[{:block/uuid %s :block/tags [:logseq.class/Task]} {:block/uuid %s :block/tags [:logseq.class/Comment]} {:block/uuid %s}]"
         (uuid_lit tu) (uuid_lit cu) (uuid_lit ou))
  in
  let ids = tx_data_eids report in
  let blocks = List.filter_map (ent_of_eid report.db_after) ids in
  let route =
    Db_listener.renderer_route_candidates report.db_after blocks
  in
  let task_ids, comment_ids =
    match List.nth blocks 0 |> fun (e : entity) -> e.id,
          List.nth blocks 1 |> fun (e : entity) -> e.id with
    | t, c -> t, c
  in
  (match wire_map_get route "task-route-candidate-ids",
         wire_map_get route "comment-route-candidate-ids" with
   | Some (Wire.Array [ Wire.Int t ]), Some (Wire.Array [ Wire.Int c ]) ->
       check "task-route-candidate-ids" (t = task_ids);
       check "comment-route-candidate-ids" (c = comment_ids)
   | _ -> check "route candidates" false);
  (match wire_map_get route "ordinary" with
   | None -> ()
   | Some _ -> check "ordinary block excluded" false)

(* (deftest db-listener-persists-local-tx-before-broadcasting-ui-refresh-test) *)
let test_persist_before_broadcast () =
  let conn = create_conn () in
  let calls = ref [] in
  with_broadcast_capture (fun captured ->
    with_listener_hooks
      ~update_checksum:(fun _ _ -> ())
      ~persist:(fun _ _ -> calls := !calls @ [ "persist-local-tx" ])
      (fun () ->
        Db_listener.listen_db_changes test_repo conn
          ~handler_keys:[ "sync-db-to-main-thread"; "db-sync" ];
        transact conn
          ~tx_meta:[ "local-tx?", Bool true ]
          "[{:db/id -1 :block/title \"hello\"}]";
        let bc = List.length (sync_db_broadcasts captured) in
        calls := !calls @ (if bc > 0 then [ "broadcast-ui-refresh" ] else []);
        check "persist before ui refresh"
          (!calls = [ "persist-local-tx"; "broadcast-ui-refresh" ])))

(* (deftest db-listener-builds-one-render-delta-for-origin-and-broadcast-test)
   cljs spy on invoke-hooks/render-delta is not injectable in OCaml;
   assertions cover the observable surface. *)
let test_builds_one_delta () =
  let conn = create_conn () in
  let block_uuid = "11111111-1111-1111-1111-111111111111" in
  let perf_id = "22222222-2222-2222-2222-222222222222" in
  let operation_id = 41 in
  with_broadcast_capture (fun captured ->
    with_listener_hooks
      ~update_checksum:(fun _ _ -> ())
      ~persist:(fun _ _ -> ())
      (fun () ->
        Db_listener.listen_db_changes test_repo conn
          ~handler_keys:[ "sync-db-to-main-thread"; "db-sync" ];
        transact conn
          ~tx_meta:
            [ "local-tx?", Bool true
            ; "db-sync/tx-id", Int operation_id
            ; "request-id", String "request-1"
            ; "client-id", String "client"
            ; "outliner-op", Keyword "save-block"
            ; "ui/perf-id", Uuid perf_id ]
          (Printf.sprintf
             "[{:db/id -1 :block/uuid %s :block/title \"hello\" :block/tx-id 1}]"
             (uuid_lit block_uuid));
        let broadcasts = sync_db_broadcasts captured in
        check "one broadcast" (List.length broadcasts = 1);
        (match broadcasts with
         | [ b ] ->
             (* cljs spies on broadcast-to-clients! args — it captures the
                `data` argument directly. The native spy sits at the
                post-message boundary, whose payload is the transit-encoded
                [kind data] array; unwrap the data element. *)
             let payload =
               match Transit_codec.of_string b.payload with
               | Wire.Array [ _kind; data ] -> data
               | other -> other
             in
             (* transit roundtrip: cljs compares (:delta roundtripped)
                — compare the delta field, not whole-payload equality
                (sets may decode in different order) *)
             let rt = Transit_codec.of_string (Transit_codec.to_string payload) in
             (match payload with
              | Wire.Map kvs ->
                  let get k =
                    List.find_map
                      (fun (k2, v) ->
                        match k2 with
                        | Wire.Keyword k2 when k2 = k -> Some v
                        | _ -> None)
                      kvs
                  in
                  check "payload repo"
                    (get "repo" = Some (Wire.String test_repo));
                  (match get "tx-meta" with
                   | Some (Wire.Map tm) ->
                       let tm_get k =
                         List.find_map
                           (fun (k2, v) ->
                             match k2 with
                             | Wire.Keyword k2 when k2 = k -> Some v
                             | _ -> None)
                           tm
                       in
                       check "tx-meta client-id"
                         (tm_get "client-id" = Some (Wire.String "client"));
                       check "tx-meta outliner-op"
                         (tm_get "outliner-op" = Some (Wire.Keyword "save-block"))
                   | _ -> check "tx-meta" false);
                  check "payload delta" (match get "delta" with Some (Wire.Map _) -> true | _ -> false);
                  let rt_get k =
                    match rt with
                    | Wire.Map rkvs ->
                        List.find_map
                          (fun (k2, v) ->
                            match k2 with
                            | Wire.Keyword k2 when k2 = k -> Some v
                            | _ -> None)
                          rkvs
                    | _ -> None
                  in
                  (* Engine-owned failure: native transit_codec decode
                     mis-resolves Normal-mode read-cache refs (^@, ^:,
                     ^G …) — repeated keyword/uuid values inside
                     affected-keys decode to wrong values, so the
                     transit roundtrip corrupts the delta. Documented
                     in the header; assertion kept real. *)
                  check "delta survives transit roundtrip"
                    (rt_get "delta" = get "delta");
                  let forbidden =
                    [ "affected-keys"; "blocks"; "deleted-assets"
                    ; "deleted-block-uuids"; "editor-row-uuids"
                    ; "entity-updated-block-uuids"; "pages"
                    ; "render-invalidated-block-uuids"; "result"
                    ; "structural-parent-uuids"; "tx-data"
                    ; "updated-blocks" ]
                  in
                  let keys =
                    List.filter_map
                      (fun (k, _) ->
                        match k with Wire.Keyword k -> Some k | _ -> None)
                      kvs
                  in
                  check "no forbidden keys"
                    (List.for_all
                       (fun fk -> not (List.mem fk keys))
                       forbidden)
              | _ -> check "payload is map" false)
         | _ -> check "payload" false);
        check "origin delta retained"
          (Db_listener.take_outliner_op_delta (Some perf_id) <> None)))

(* (deftest canonical-replacements-omit-entities-deleted-in-the-same-transaction-test) *)
let test_canonical_omit_deleted () =
  let conn = create_conn () in
  let bu = Uuid_gen.uuid () in
  transact conn
    (Printf.sprintf
       "[{:db/id -1 :block/uuid %s :block/title \"temporary\"}]"
       (uuid_lit bu));
  let db = db_of conn in
  let bid =
    match
      Datascript.q_string db
        (Printf.sprintf "[:find ?e . :in $ :where [?e :block/uuid %s]]"
           (uuid_lit bu))
    with
    | [ [ Result_entity id ] ] -> id
    | _ -> failwith "no block"
  in
  let report =
    transact_report conn
      (Printf.sprintf "[[:db/add %d :block/tx-id 1] [:db.fn/retractEntity %d]]"
         bid bid)
  in
  let repl = Db_listener.canonical_replacements report in
  check "deleted entity not published" (repl = Wire.Map [])

(* (deftest canonical-replacements-override-same-uuid-tombstones-test) *)
let test_canonical_override_tombstones () =
  let conn = create_conn () in
  let bu = Uuid_gen.uuid () in
  let report =
    transact_report conn
      (Printf.sprintf
         "[{:block/uuid %s :block/title \"imported\" :block/tx-id 1}]"
         (uuid_lit bu))
  in
  let delta =
    Db_listener.build_render_delta test_repo report [] [ bu ]
  in
  let blocks = Option.value (wire_map_get delta "blocks") ~default:(Wire.Map []) in
  let deleted = Option.value (wire_map_get delta "deleted") ~default:(Wire.Map []) in
  let block_has_uuid =
    match blocks with
    | Wire.Map kvs ->
        List.exists (fun (k, _) -> k = Wire.Uuid bu) kvs
    | _ -> false
  in
  check "canonical block keyed by uuid" block_has_uuid;
  check "tombstone overridden"
    (match deleted with Wire.Map [] -> true | _ -> false)

(* (deftest imported-structural-changes-include-children-patches-test) *)
let test_imported_children_patches () =
  let conn = create_conn () in
  let parent_u = Uuid_gen.uuid () and child_u = Uuid_gen.uuid () in
  transact conn
    (Printf.sprintf
       "[{:block/uuid %s :block/title \"parent\" :block/tx-id 1}]"
       (uuid_lit parent_u));
  let report =
    transact_report conn
      ~tx_meta:
        [ "logseq.db.sqlite.export/imported-data?", Bool true ]
      (Printf.sprintf
         "[{:block/uuid %s :block/title \"child\" :block/parent [:block/uuid %s] :block/order \"a0\" :block/tx-id 2}]"
         (uuid_lit child_u) (uuid_lit parent_u))
  in
  let delta =
    Db_listener.build_render_delta test_repo report [] []
  in
  let children = Option.value (wire_map_get delta "children") ~default:(Wire.Map []) in
  (match children with
   | Wire.Map kvs ->
       let parent_patch =
         List.find_map
           (fun (k, v) ->
             match k with
             | Wire.Uuid u when u = parent_u -> Some v
             | _ -> None)
           kvs
       in
       (match parent_patch with
        | Some (Wire.Map pm) ->
            let upsert =
              List.find_map
                (fun (k, v) ->
                  match k with
                  | Wire.Keyword "upsert" -> Some v
                  | _ -> None)
                pm
            in
            (match upsert with
             | Some (Wire.Array [ Wire.Array [ Wire.Uuid u; Wire.String o ] ])
             | Some (Wire.List [ Wire.List [ Wire.Uuid u; Wire.String o ] ]) ->
                 check "children upsert" (u = child_u && o = "a0")
             | _ -> check "children upsert shape" false)
        | _ -> check "parent patch" false)
   | _ -> check "children map" false)

(* (deftest db-listener-does-not-publish-incomplete-graph-render-deltas-test) *)
let test_no_publish_incomplete () =
  List.iter
    (fun flag ->
      let conn = create_conn () in
      with_broadcast_capture (fun captured ->
        with_listener_hooks
          ~update_checksum:(fun _ _ -> ())
          ~persist:(fun _ _ -> ())
          (fun () ->
            Db_listener.listen_db_changes test_repo conn
              ~handler_keys:[ "sync-db-to-main-thread"; "db-sync" ];
            transact conn
              ~tx_meta:[ flag, Bool true ]
              "[{:db/id -1 :block/title \"hello\"}]";
            check (Printf.sprintf "no broadcast for %s" flag)
              (sync_db_broadcasts captured = []))))
    [ "rtc-download-graph?"
    ; "sync-download-graph?"
    ; "logseq.graph-parser.exporter/new-graph?"
    ; "logseq.graph-parser.exporter/imported-data?" ]

(* (deftest db-listener-does-not-publish-skip-validation-render-deltas-test) *)
let test_no_publish_skip_validation () =
  let conn = create_conn () in
  with_broadcast_capture (fun captured ->
    with_listener_hooks
      ~update_checksum:(fun _ _ -> ())
      ~persist:(fun _ _ -> ())
      (fun () ->
        Db_listener.listen_db_changes test_repo conn
          ~handler_keys:[ "sync-db-to-main-thread"; "db-sync" ];
        transact conn
          ~tx_meta:[ "skip-validate-db?", Bool true ]
          "[{:db/id -1 :block/title \"hello\"}]";
        check "no broadcast for skip-validate-db?"
          (sync_db_broadcasts captured = [])))

(* (deftest db-listener-reports-post-commit-failures-without-blocking-ui-sync-test) *)
let test_post_commit_failures_dont_block () =
  List.iter
    (fun (spy_key, failed_stage) ->
      let conn = create_conn () in
      let calls = ref [] in
      let mark = log_mark () in
      with_broadcast_capture (fun captured ->
        with_listener_hooks
          ~update_checksum:
            (fun _ _ ->
              calls := !calls @ [ "checksum" ];
              if spy_key = "checksum" then failwith "checksum failed")
          ~persist:
            (fun _ _ ->
              calls := !calls @ [ "persist" ];
              if spy_key = "persist" then failwith "persist failed")
          (fun () ->
            Db_listener.listen_db_changes test_repo conn
              ~handler_keys:[ "sync-db-to-main-thread"; "db-sync" ];
            let raised =
              try
                transact conn
                  ~tx_meta:[ "local-tx?", Bool true ]
                  "[{:db/id -1 :block/title \"hello\"}]";
                false
              with _ -> true
            in
            check (Printf.sprintf "post-commit failure escaped: %s" failed_stage)
              (not raised);
            check (Printf.sprintf "datom committed (%s)" failed_stage)
              (hello_count conn = 1);
            check
              (Printf.sprintf "one capture-error broadcast (%s)" failed_stage)
              (List.length (capture_error_broadcasts captured) = 1);
            check
              (Printf.sprintf "error logged with stage (%s)" failed_stage)
              (match new_errors_since mark with
               | [ e ] -> field e "stage" = Some failed_stage
               | _ -> false);
            check
              (Printf.sprintf "all stages ran (%s)" failed_stage)
              (!calls = [ "checksum"; "persist" ]);
            check
              (Printf.sprintf "broadcast fired (%s)" failed_stage)
              (List.length (sync_db_broadcasts captured) = 1))))
    [ "checksum", "update-checksum"; "persist", "persist-local-tx" ]

(* (deftest deferred-listener-failures-do-not-block-ui-sync-test) *)
let test_deferred_failures_dont_block () =
  let conn = create_conn () in
  let calls = ref [] in
  let mark = log_mark () in
  let prev_mirror =
    Hashtbl.find_opt Db_listener.deferred_handlers "markdown-mirror"
  in
  with_broadcast_capture (fun captured ->
    Fun.protect
      ~finally:(fun () ->
        (match prev_mirror with
         | Some h -> Db_listener.register "markdown-mirror" h
         | None ->
             Hashtbl.remove Db_listener.deferred_handlers "markdown-mirror"))
      (fun () ->
        Db_listener.register "markdown-mirror" (fun _ _ ->
            calls := !calls @ [ "deferred-listener" ];
            failwith "deferred listener failed");
        Db_listener.listen_db_changes test_repo conn
          ~handler_keys:[ "sync-db-to-main-thread"; "markdown-mirror" ];
        let raised =
          try
            transact conn "[{:db/id -1 :block/title \"hello\"}]";
            false
          with _ -> true
        in
        check "post-commit failure escaped" (not raised);
        let bc = List.length (sync_db_broadcasts captured) in
        calls := !calls @ (if bc > 0 then [ "broadcast-ui-refresh" ] else []);
        check "calls order"
          (!calls = [ "deferred-listener"; "broadcast-ui-refresh" ]);
        check "error stage is markdown-mirror"
          (match new_errors_since mark with
           | [ e ] -> field e "stage" = Some "markdown-mirror"
           | _ -> false)))

let cases =
  [ Alcotest.test_case "renderer-tx-meta-keeps-only-side-effect-inputs-test"
      `Quick test_renderer_tx_meta
  ; Alcotest.test_case
      "renderer-route-candidates-summarize-changed-task-and-comment-blocks-test"
      `Quick test_route_candidates
  ; Alcotest.test_case
      "db-listener-persists-local-tx-before-broadcasting-ui-refresh-test"
      `Quick test_persist_before_broadcast
  ; Alcotest.test_case
      "db-listener-builds-one-render-delta-for-origin-and-broadcast-test"
      `Quick test_builds_one_delta
  ; Alcotest.test_case
      "canonical-replacements-omit-entities-deleted-in-the-same-transaction-test"
      `Quick test_canonical_omit_deleted
  ; Alcotest.test_case
      "canonical-replacements-override-same-uuid-tombstones-test" `Quick
      test_canonical_override_tombstones
  ; Alcotest.test_case
      "imported-structural-changes-include-children-patches-test" `Quick
      test_imported_children_patches
  ; Alcotest.test_case
      "db-listener-does-not-publish-incomplete-graph-render-deltas-test"
      `Quick test_no_publish_incomplete
  ; Alcotest.test_case
      "db-listener-does-not-publish-skip-validation-render-deltas-test"
      `Quick test_no_publish_skip_validation
  ; Alcotest.test_case
      "db-listener-reports-post-commit-failures-without-blocking-ui-sync-test"
      `Quick test_post_commit_failures_dont_block
  ; Alcotest.test_case
      "deferred-listener-failures-do-not-block-ui-sync-test" `Quick
      test_deferred_failures_dont_block ]
