(* 1:1 translations of cljs unit tests for the worker transact pipeline.

   Source: src/test/frontend/worker/pipeline_test.cljs
   cljs deftest names are kept as OCaml test names.

   Skipped cljs cases (unported dependency):
   - save-block-resolves-page-refs-in-worker-test: outliner-core/save-block!
     not ported
   - sibling-reorder-keeps-parent-revision-test: move-blocks-up-down! not
     ported
   - nested-move-keeps-old-and-new-parent-revisions-test: move-blocks! not
     ported
   - nested-delete-keeps-surviving-parent-revision-test: delete-blocks! not
     ported
   - renderer-hook-uses-explicit-resource-affected-keys-test: invoke-hooks /
     affected-keys is the db-listener surface, not this package
   - batch-import-edn-datom-format-with-shifted-builtin-eids-test,
     batch-import-edn-invalid-datom-format-does-not-change-db-test:
     :batch-import-edn op + sqlite-export not ported
   - move-block-to-library-then-delete-clears-stale-namespace-test:
     move-blocks!/delete-blocks! not ported

   Known cljs-vs-OCaml divergences surfaced by these tests (asserted where
   observable, not papered over):
   - cljs exception ex-data {:type :journal-page-protected-attr-updated
     :attr ...} becomes Worker_pipeline.Journal_protected_attr_updated
     carrying (attr, old-v, new-v, journal-day).
   - cljs with-redefs d/datoms scan counters have no OCaml equivalent; the
     reference-attrs cache tests assert the observable outcomes only.
   - cljs pins t/now for the reschedule test; OCaml computes the expected
     journal day from the real clock (commands/utc_now uses
     Date_time_util.time_ms, not overridable).
   - cljs passes pre-computed :template-blocks to the :apply-template op;
     OCaml apply_template_op derives the same block maps via
     template_children_blocks when "template-blocks" is absent, so the
     apply-template tests pass empty opts.

   *)

open Datascript

let check (name : string) (ok : bool) =
  Alcotest.(check bool) name true ok

let db_of = Datascript.db

(* cljs raw-block-title *)
let raw_block_title (db : db) (block : entity option) : string option =
  match block with
  | None -> None
  | Some b ->
      (match
         List.of_seq
           (datoms db Eavt ~e:b.id ~a:"block/title" ())
       with
       | { v; _ } :: _ -> (match v with String s -> Some s | _ -> None)
       | [] -> None)

(* cljs default-journal-page-name *)
let default_journal_page_name (journal_day : int) : string =
  Ldb.journal_title_of_day journal_day
    Date_time_util.default_journal_title_formatter
  |> Ldb.page_name_sanity_lc

(* cljs (fn [] (register pipeline) (f) (finally register identity)) *)
let with_transact_pipeline (f : unit -> 'a) : 'a =
  Db_tx.transact_pipeline_fn := Some Worker_pipeline.transact_pipeline;
  match f () with
  | r ->
      Db_tx.transact_pipeline_fn := Some (fun r -> r);
      r
  | exception e ->
      Db_tx.transact_pipeline_fn := Some (fun r -> r);
      raise e

(* cljs revision — (:block/tx-id (d/entity db (:db/id entity))) *)
let revision (db : db) (e : entity) : value option =
  match entity db (Entity_id e.id) with
  | Some e -> Ldb.value e "block/tx-id"
  | None -> None

(* cljs date-time-util/ms->journal-day *)
let ms_to_journal_day (ms : int64) : int =
  let c = Date_time.of_epoch_ms ms in
  c.year * 10000 + c.month * 100 + c.day

let ent_title (e : entity) = Db_content.block_title e

(* cljs [:db/add id attr value] *)
let add (id : entity_id) (a : attr) (v : value) : tx_op =
  Add (Entity_id id, a, v)

(* cljs {:db/id id ...attrs} *)
let ent_op (id : entity_id) (attrs : (attr * tx_value) list) : tx_op =
  Entity { db_id = Some (Entity_id id); attrs }

let ov (v : value) : tx_value = One_value v

let ref_ent_attr (r : entity_ref) : tx_value =
  One_entity { db_id = Some r; attrs = [] }

(* cljs ldb/transact! *)
let transact ?(tx_meta : tx_meta = []) (conn : conn) (ops : tx_op list)
    : tx_report =
  Db_tx.transact ~tx_meta conn ops

let uuid_of (e : entity) : string =
  match Ldb.value e "block/uuid" with
  | Some (Uuid u) -> u
  | _ -> failwith "entity has no uuid"

(* ---------- nested-insert-keeps-parent-revision-test ---------- *)
let test_nested_insert_keeps_parent_revision_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks =
                [ { default_block with
                    b_title = Some "ancestor"
                  ; b_children =
                      [ { default_block with
                          b_title = Some "parent"
                        ; b_children =
                            [ { default_block with
                                b_title = Some "target" } ] } ] } ] } ]
      ()
  in
  let db_before = db_of conn in
  let ancestor =
    Option.get (Db_test_util.find_block_by_content db_before "ancestor")
  in
  let parent =
    Option.get (Db_test_util.find_block_by_content db_before "parent")
  in
  let target =
    Option.get (Db_test_util.find_block_by_content db_before "target")
  in
  let page =
    match Ldb.ref_ent target "block/page" with
    | Some p -> p
    | None -> failwith "target has no page"
  in
  let inserted_uuid = Common_uuid.new_block_id () in
  ignore
    (with_transact_pipeline (fun () ->
         let tx_result, _ =
             Outliner_core.insert_blocks db_before
               [ [ "block/uuid", Uuid inserted_uuid
                 ; "block/title", String "inserted"
                 ; "block/page", Int page.id ] ]
               (Block_map.of_entity target)
               { Outliner_core.default_insert_opts with
                 sibling = true
               ; keep_uuid = true }
           in
           transact conn tx_result.tx_data));
  check "nested-insert-keeps-parent-revision parent"
    (revision db_before parent = revision (db_of conn) parent);
  check "nested-insert-keeps-parent-revision inserted-tx-id"
    (match entity (db_of conn) (Lookup_ref ("block/uuid", Uuid inserted_uuid)) with
     | Some e -> Ldb.value e "block/tx-id" <> None
     | None -> false);
  check "nested-insert-keeps-parent-revision ancestor"
    (revision db_before ancestor = revision (db_of conn) ancestor);
  check "nested-insert-keeps-parent-revision page"
    (revision db_before page = revision (db_of conn) page)

(* ---------- top-level-insert-keeps-page-revision-test ---------- *)
let test_top_level_insert_keeps_page_revision_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [ { default_block with b_title = Some "target" } ] } ]
      ()
  in
  let db_before = db_of conn in
  let target =
    Option.get (Db_test_util.find_block_by_content db_before "target")
  in
  let page = Option.get (Ldb.ref_ent target "block/page") in
  let inserted_uuid = Common_uuid.new_block_id () in
  ignore
    (with_transact_pipeline (fun () ->
         let tx_result, _ =
             Outliner_core.insert_blocks db_before
               [ [ "block/uuid", Uuid inserted_uuid
                 ; "block/title", String "inserted"
                 ; "block/page", Int page.id ] ]
               (Block_map.of_entity target)
               { Outliner_core.default_insert_opts with
                 sibling = true
               ; keep_uuid = true }
           in
           transact conn tx_result.tx_data));
  check "top-level-insert-keeps-page-revision page"
    (revision db_before page = revision (db_of conn) page)

(* ---------- referenced-entity-content-change-invalidates-owning-block-test
   cljs builds the fixture reports with d/with; Datascript.with_tx is the
   same non-committing transact. ---------- *)
let test_referenced_entity_content_change_invalidates_owning_block_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~properties:
        [ "logseq.property/order-list-type", Db_test_util.default_property ]
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [ { default_block with b_title = Some "ordered" } ] } ]
      ()
  in
  let block =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "ordered")
  in
  let value_uuid = Common_uuid.new_block_id () in
  let value_report =
    Datascript.with_tx (db_of conn)
      [ Entity
          { db_id = None
          ; attrs =
              [ "block/uuid", One_value (Uuid value_uuid)
              ; "block/title", One_value (String "before")
              ; "logseq.property/created-from-property",
                ref_ent_attr (Ident "logseq.property/order-list-type") ] } ]
  in
  let db_with_value = value_report.db_after in
  let value =
    match
      entity db_with_value (Lookup_ref ("block/uuid", Uuid value_uuid))
    with
    | Some v -> v
    | None -> failwith "referenced value entity missing"
  in
  let reference_report =
    Datascript.with_tx db_with_value
      [ add block.id "logseq.property/order-list-type"
          (Ref_to (Entity_id value.id)) ]
  in
  let db_before = reference_report.db_after in
  let tx_report =
    Datascript.with_tx ~tx_meta:[] db_before
      [ add value.id "block/title" (String "number") ]
  in
  let result = Worker_pipeline.transact_pipeline tx_report in
  check "referenced-entity content revises owning block"
    (revision db_before block <> revision result.db_after block)

(* ---------- referenced-entity-timestamp-change-does-not-revise-rendered-blocks-test
   ---------- *)
let test_referenced_entity_timestamp_change_does_not_revise_rendered_blocks_test
    () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [ { default_block with b_title = Some "owner" } ] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let owner =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "owner")
  in
  ignore
    (Datascript.transact_conn conn
       [ add owner.id "block/refs" (Ref_to (Entity_id page.id))
       ; add page.id "block/tx-id" (Int 10)
       ; add owner.id "block/tx-id" (Int 10) ]);
  let db_before = db_of conn in
  let tx_report =
    Datascript.with_tx ~tx_meta:[] db_before
      [ add page.id "block/updated-at"
          (Int (Int64.to_int (Date_time_util.time_ms ()))) ]
  in
  let result = Worker_pipeline.transact_pipeline tx_report in
  check "referenced-entity timestamp keeps page revision"
    (revision db_before page = revision result.db_after page);
  check "referenced-entity timestamp keeps owner revision"
    (revision db_before owner = revision result.db_after owner)

(* ---------- property-assignment-revises-block-only-test ---------- *)
let test_property_assignment_revises_block_only_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks =
                [ { default_block with
                    b_title = Some "parent"
                  ; b_children =
                      [ { default_block with b_title = Some "block" } ] } ] } ]
      ()
  in
  let db_before = db_of conn in
  let block =
    Option.get (Db_test_util.find_block_by_content db_before "block")
  in
  let parent = Option.get (Ldb.ref_ent block "block/parent") in
  let page = Option.get (Ldb.ref_ent block "block/page") in
  ignore
    (with_transact_pipeline (fun () ->
         transact conn
           [ add block.id "logseq.property/publishing-public?" (Bool true) ]));
  check "property-assignment-revises-block-only block"
    (revision db_before block <> revision (db_of conn) block);
  check "property-assignment-revises-block-only parent"
    (revision db_before parent = revision (db_of conn) parent);
  check "property-assignment-revises-block-only page"
    (revision db_before page = revision (db_of conn) page)

(* ---------- collapsed-state-revises-parent-test ---------- *)
let test_collapsed_state_revises_parent_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [ { default_block with b_title = Some "parent" } ] } ]
      ()
  in
  let db_before = db_of conn in
  let parent =
    Option.get (Db_test_util.find_block_by_content db_before "parent")
  in
  ignore
    (with_transact_pipeline (fun () ->
         transact conn [ add parent.id "block/collapsed?" (Bool true) ]));
  check "collapsed-state-revises-parent"
    (revision db_before parent <> revision (db_of conn) parent)

(* ---------- direct-page-update-revises-page-test ---------- *)
let test_direct_page_update_revises_page_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "before" }
            ; blocks = [] } ]
      ()
  in
  let db_before = db_of conn in
  let page =
    match Ldb.get_page db_before (String "before") with
    | Some p -> p
    | None -> failwith "page not found"
  in
  ignore
    (with_transact_pipeline (fun () ->
         transact conn [ add page.id "block/title" (String "after") ]));
  check "direct-page-update-revises-page"
    (revision db_before page <> revision (db_of conn) page)

(* ---------- direct-child-visibility-keeps-its-membership-owner-revision-test
   block-handler/direct-children-membership is not ported; the revision
   assertions are kept, membership assertions dropped. ---------- *)
let test_direct_child_visibility_keeps_its_membership_owner_revision_test () =
  List.iter
    (fun (label, attr, mk_value) ->
      let conn =
        Db_test_util.create_pipeline_conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page = { default_page with pg_title = Some "page1" }
                ; blocks =
                    [ { default_block with
                        b_title = Some "ancestor"
                      ; b_children =
                          [ { default_block with
                              b_title = Some "parent"
                            ; b_children =
                                [ { default_block with
                                    b_title = Some "child" } ] } ] } ] } ]
          ()
      in
      let initial_db = db_of conn in
      let ancestor =
        Option.get
          (Db_test_util.find_block_by_content initial_db "ancestor")
      in
      let parent =
        Option.get (Db_test_util.find_block_by_content initial_db "parent")
      in
      let child =
        Option.get (Db_test_util.find_block_by_content initial_db "child")
      in
      let page = Option.get (Ldb.ref_ent child "block/page") in
      let value = mk_value initial_db in
      ignore
        (Datascript.transact_conn conn
           [ Add (Entity_id page.id, "block/tx-id", Int 10)
           ; Add (Entity_id ancestor.id, "block/tx-id", Int 10)
           ; Add (Entity_id parent.id, "block/tx-id", Int 10)
           ; Add (Entity_id child.id, "block/tx-id", Int 10) ]);
      let db_before = db_of conn in
      ignore
        (with_transact_pipeline (fun () ->
             transact conn [ add child.id attr value ]));
      let hidden_db = db_of conn in
      let hidden_parent_revision = revision hidden_db parent in
      check
        (Printf.sprintf
           "direct-child-visibility %s: hiding keeps parent revision" label)
        (revision db_before parent = hidden_parent_revision);
      check
        (Printf.sprintf
           "direct-child-visibility %s: hiding keeps ancestor revision"
           label)
        (revision db_before ancestor = revision hidden_db ancestor);
      check
        (Printf.sprintf
           "direct-child-visibility %s: hiding keeps page revision" label)
        (revision db_before page = revision hidden_db page);
      ignore
        (with_transact_pipeline (fun () ->
             transact conn [ Retract (Entity_id child.id, attr, Some value) ]));
      check
        (Printf.sprintf
           "direct-child-visibility %s: showing keeps parent revision" label)
        (hidden_parent_revision = revision (db_of conn) parent))
    [ ("recycled child", "logseq.property/deleted-at",
       fun _ -> Int 1000)
    ; ("text property value", "logseq.property/created-from-property",
       fun db ->
         (match entity db (Ident "logseq.property/query") with
          | Some p -> Ref p.id
          | None -> failwith "logseq.property/query missing")) ]

(* ---------- temp-inner-mutations-enter-the-pipeline-once-at-the-final-live-commit-test
   cljs records pipeline-metas via a wrapper fn and listens for live
   reports; OCaml mirrors that with the same ref + Datascript.listen. ---- *)
let test_temp_inner_mutations_enter_the_pipeline_once_at_the_final_live_commit_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [ { default_block with b_title = Some "before" } ] } ]
      ()
  in
  let block =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "before")
  in
  let block_id = block.id in
  ignore (Datascript.transact_conn conn [ add block_id "block/tx-id" (Int 10) ]);
  let db_before = db_of conn in
  let outer_tx_meta : tx_meta =
    [ "rtc-tx?", Bool true; "with-local-changes?", Bool true ]
  in
  let original_pipeline = !Db_tx.transact_pipeline_fn in
  let pipeline_metas : tx_meta list ref = ref [] in
  let live_reports : tx_report list ref = ref [] in
  ignore
    (Datascript.listen conn "capture-formal-outer-commit"
       (fun r -> live_reports := !live_reports @ [ r ]));
  (match
     (try
        Db_tx.transact_pipeline_fn :=
          Some
            (fun (r : tx_report) ->
              pipeline_metas := !pipeline_metas @ [ r.tx_meta ];
              Worker_pipeline.transact_pipeline r);
        ignore
          (Db_tx.batch_transact_with_temp_conn ~tx_meta:outer_tx_meta conn
             (fun temp_conn ->
               ignore
                 (Db_tx.transact
                    ~tx_meta:[ "reverse?", Bool true
                             ; "skip-validate-db?", Bool true ]
                    temp_conn
                    [ add block_id "block/title" (String "reversed") ]);
               ignore
                 (Db_tx.transact
                    ~tx_meta:[ "transact-remote?", Bool true ]
                    temp_conn
                    [ add block_id "block/title" (String "remote") ]);
               ignore
                 (Db_tx.transact
                    ~tx_meta:[ "outliner-op", Keyword "rebase" ]
                    temp_conn
                    [ add block_id "block/title" (String "rebased") ])));
        `Ok
      with e -> `Exn e)
   with
   | `Ok -> ()
   | `Exn e -> raise e);
  Datascript.unlisten conn "capture-formal-outer-commit";
  Db_tx.transact_pipeline_fn := original_pipeline;
  check "temp-inner-mutations pipeline-metas"
    (!pipeline_metas = [ outer_tx_meta ]);
  check "temp-inner-mutations live-reports count"
    (List.length !live_reports = 1);
  (match !live_reports with
   | r :: _ -> check "temp-inner-mutations tx-meta" (r.tx_meta = outer_tx_meta)
   | [] -> check "temp-inner-mutations tx-meta" false);
  (match entity (db_of conn) (Entity_id block_id) with
   | Some e -> check "temp-inner-mutations title" (ent_title e = Some "rebased")
   | None -> check "temp-inner-mutations title" false);
  check "temp-inner-mutations revision changed"
    (revision db_before block <> revision (db_of conn) block);
  (match !live_reports with
   | r :: _ ->
       let current_tx =
         List.find_map
           (fun (k, v) -> if k = "db/current-tx" then Some v else None)
           r.tempids
       in
       check "temp-inner-mutations canonical revision"
         (match revision (db_of conn) block, current_tx with
          | Some (Int i), Some t -> i = t
          | _ -> false)
   | [] -> check "temp-inner-mutations canonical revision" false)

(* ---------- test-built-in-page-updates-that-should-be-reverted ---------- *)
let test_test_built_in_page_updates_that_should_be_reverted () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks =
                [ { default_block with b_title = Some "b1" }
                ; { default_block with
                    b_title = Some "b2"
                  ; b_tags = [ "tag1" ] } ] } ]
      ()
  in
  let library =
    match Ldb.get_built_in_page (db_of conn) "Library" with
    | Some p -> p
    | None -> failwith "Library built-in page missing"
  in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (* "Using built-in pages as tags" *)
  let page1 =
    match Ldb.get_page (db_of conn) (String "page1") with
    | Some p -> p
    | None -> failwith "page1 missing"
  in
  let b1 =
    match List.find_opt
            (fun e -> ent_title e = Some "b1")
            (Ldb.ref_ents page1 "block/_page")
    with
    | Some b -> b
    | None -> failwith "b1 missing"
  in
  ignore
    (transact conn
       [ ent_op b1.id
           [ "block/title", ov (String "b1 #Library")
           ; "block/tags", ref_ent_attr (Entity_id library.id) ] ]);
  check "built-in-page-as-tag library not a class" (not (Ldb.is_class library));
  (match entity (db_of conn) (Entity_id b1.id) with
   | Some b ->
       check "built-in-page-as-tag tags empty"
         (Ldb.ref_ents b "block/tags" = [])
   | None -> check "built-in-page-as-tag tags empty" false);
  (* "Updating protected properties for built-in nodes" *)
  ignore
    (transact conn
       [ ent_op library.id
           [ "block/title", ov (String "newlibrary")
           ; "db/ident", ov (Keyword "test/ident") ] ]);
  let library =
    match Ldb.get_built_in_page (db_of conn) "Library" with
    | Some p -> p
    | None -> failwith "Library gone"
  in
  check "built-in ident reverted"
    (Ldb.value library "db/ident" = None);
  check "built-in title reverted" (ent_title library = Some "Library");
  let task =
    match entity (db_of conn) (Ident "logseq.class/Task") with
    | Some t -> t
    | None -> failwith "Task class missing"
  in
  ignore
    (transact conn
       [ ent_op task.id
           [ "db/ident", ov (Keyword "logseq.class/task-new-ident")
           ; "block/title", ov (String "task") ] ]);
  (match entity (db_of conn) (Entity_id task.id) with
   | Some task ->
       check "task ident reverted"
         (Ldb.value task "db/ident" = Some (Keyword "logseq.class/Task"));
       check "task title reverted" (ent_title task = Some "Task")
   | None ->
       check "task ident reverted" false;
       check "task title reverted" false);
  ignore
    (transact conn
       [ add task.id "logseq.property.class/extends"
            (Ref_to (Ident "logseq.class/Journal")) ]);
  (match entity (db_of conn) (Entity_id task.id) with
   | Some task ->
       let exts =
         List.map
            (fun (e : entity) -> Ldb.ident_of e)
            (Ldb.ref_ents task "logseq.property.class/extends")
       in
       check "task extends reverted to Root"
         (exts = [ Some "logseq.class/Root" ])
   | None -> check "task extends reverted to Root" false);
  (* "User class extends unexpected built-in classes" *)
  (match Ldb.get_page (db_of conn) (String "tag1") with
   | Some t1 ->
       ignore
         (transact conn
            [ add t1.id "logseq.property.class/extends"
                 (Ref_to (Ident "logseq.class/Journal")) ]);
       (match entity (db_of conn) (Entity_id t1.id) with
        | Some t1 ->
            let exts =
              List.map
                 (fun (e : entity) -> Ldb.ident_of e)
                 (Ldb.ref_ents t1 "logseq.property.class/extends")
            in
            check "user class extends reverted to Root"
              (exts = [ Some "logseq.class/Root" ])
        | None -> check "user class extends reverted to Root" false)
   | None -> check "user class extends reverted to Root" false);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- ensure-query-property-on-tag-additions-test ---------- *)
let test_ensure_query_property_on_tag_additions_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks =
                [ { default_block with b_title = Some "b1" }
                ; { default_block with b_title = Some "b2" } ] } ]
      ~classes:
        [ "QueryChild",
          Db_test_util.
            { default_class with c_extends = [ "logseq.class/Query" ] } ]
      ()
  in
  let page =
    match Ldb.get_page (db_of conn) (String "page1") with
    | Some p -> p
    | None -> failwith "page1 missing"
  in
  let blocks = Ldb.ref_ents page "block/_page" in
  let find t = List.find_opt (fun e -> ent_title e = Some t) blocks in
  let b1 = Option.get (find "b1") in
  let b2 = Option.get (find "b2") in
  let query_child =
    match Ldb.get_page (db_of conn) (String "QueryChild") with
    | Some p -> p
    | None -> failwith "QueryChild missing"
  in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  ignore
    (transact conn
       [ add b1.id "block/tags" (Ref_to (Ident "logseq.class/Query")) ]);
  (match entity (db_of conn) (Entity_id b1.id) with
   | Some block ->
       (match Ldb.ref_ent block "logseq.property/query" with
        | Some q ->
            check "ensure-query tag-add query uuid"
              (Ldb.value q "block/uuid" <> None);
            check "ensure-query tag-add query title"
              (ent_title q = Some "")
        | None ->
            check "ensure-query tag-add query uuid" false;
            check "ensure-query tag-add query title" false)
   | None -> check "ensure-query tag-add query uuid" false);
  ignore
    (transact conn [ add b2.id "block/tags" (Ref_to (Entity_id query_child.id)) ]);
  (match entity (db_of conn) (Entity_id b2.id) with
   | Some block ->
       (match Ldb.ref_ent block "logseq.property/query" with
        | Some q ->
            check "ensure-query extends-query uuid"
              (Ldb.value q "block/uuid" <> None);
            check "ensure-query extends-query title"
              (ent_title q = Some "")
        | None -> check "ensure-query extends-query uuid" false)
   | None -> check "ensure-query extends-query uuid" false);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- ensure-comments-blocks-property-on-tag-additions-test ---------- *)
let test_ensure_comments_blocks_property_on_tag_additions_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks =
                [ { default_block with
                    b_title = Some "target"
                  ; b_children =
                      [ { default_block with b_title = Some "" } ] } ] } ]
      ()
  in
  let target =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "target")
  in
  let empty_block =
    match Ldb.ref_ents target "block/_parent" with
    | b :: _ -> b
    | [] -> failwith "empty child missing"
  in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     ignore
       (transact conn
          [ add empty_block.id "block/tags"
               (Ref_to (Ident "logseq.class/Comments")) ]);
     (match entity (db_of conn) (Entity_id empty_block.id) with
      | Some comments_area ->
          let ids =
            Ldb.ref_ents comments_area "logseq.property.comments/blocks"
            |> List.map (fun (e : entity) -> e.id)
          in
          check "ensure-comments-blocks targets parent"
            (ids = [ target.id ])
      | None -> check "ensure-comments-blocks targets parent" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- imported-data-rebuilds-block-refs-in-the-formal-pipeline-test ---- *)
let test_imported_data_rebuilds_block_refs_in_the_formal_pipeline_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "target" }
            ; blocks = [] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let target = Option.get (Ldb.get_page (db_of conn) (String "target")) in
  let block_uuid = Common_uuid.new_block_id () in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     ignore
       (transact
          ~tx_meta:[ "logseq.db.sqlite.export/imported-data?", Bool true ]
          conn
          [ Entity
              { db_id = Some (Temp_id "imported-block")
              ; attrs =
                  [ "block/uuid", ov (Uuid block_uuid)
                  ; "block/title",
                    ov (String (Page_ref.to_page_ref (uuid_of target)))
                  ; "block/created-at", ov (Int 1000)
                  ; "block/updated-at", ov (Int 1000)
                  ; "block/page", ref_ent_attr (Entity_id page.id)
                  ; "block/parent", ref_ent_attr (Entity_id page.id)
                  ; "block/order", ov (String "a0") ] } ]);
     (match
        entity (db_of conn) (Lookup_ref ("block/uuid", Uuid block_uuid))
      with
      | Some block ->
          let ref_uuids =
            Ldb.ref_ents block "block/refs" |> List.map uuid_of
          in
          check "imported-data-rebuilds-block-refs"
            (ref_uuids = [ uuid_of target ])
      | None -> check "imported-data-rebuilds-block-refs" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- permanent-delete-recycled-page-with-transact-pipeline-test ---- *)
let test_permanent_delete_recycled_page_with_transact_pipeline_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [ { default_block with b_title = Some "b1" } ] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let block =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "b1")
  in
  let page_uuid = uuid_of page in
  let block_uuid = uuid_of block in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     (* cljs outliner-page/delete! — recycle page *)
     ignore
       (transact ~tx_meta:[ "outliner-op", Keyword "delete-page" ] conn
          (Outliner_recycle.recycle_page_tx_data (db_of conn) page ()));
     (match
        entity (db_of conn) (Lookup_ref ("block/uuid", Uuid page_uuid))
      with
      | Some e ->
          check "permanent-delete-recycled-page recycled"
            (Outliner_recycle.recycled e)
      | None -> check "permanent-delete-recycled-page recycled" false);
     (* cljs apply-ops! :recycle-delete-permanently *)
     ignore (Outliner_recycle.permanently_delete conn page_uuid);
     check "permanent-delete-recycled-page page gone"
       (entity (db_of conn) (Lookup_ref ("block/uuid", Uuid page_uuid))
        = None);
     check "permanent-delete-recycled-page block gone"
       (entity (db_of conn) (Lookup_ref ("block/uuid", Uuid block_uuid))
        = None)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- recycle-ops-return-apply-result-test ---------- *)
let test_recycle_ops_return_apply_result_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let page_uuid = uuid_of page in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     ignore
       (transact ~tx_meta:[ "outliner-op", Keyword "delete-page" ] conn
          (Outliner_recycle.recycle_page_tx_data (db_of conn) page ()));
     check "recycle-ops restore returns true"
       (Outliner_recycle.restore conn page_uuid);
     (match
        entity (db_of conn) (Lookup_ref ("block/uuid", Uuid page_uuid))
      with
      | Some e ->
          check "recycle-ops restored" (not (Outliner_recycle.recycled e))
      | None -> check "recycle-ops restored" false);
     ignore
       (transact ~tx_meta:[ "outliner-op", Keyword "delete-page" ] conn
          (Outliner_recycle.recycle_page_tx_data (db_of conn) page ()));
     check "recycle-ops permanently-delete returns true"
       (Outliner_recycle.permanently_delete conn page_uuid);
     check "recycle-ops page gone"
       (entity (db_of conn) (Lookup_ref ("block/uuid", Uuid page_uuid))
        = None)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- permanent-delete-recycled-page-removes-blocks-parented-by-page-test ---- *)
let test_permanent_delete_recycled_page_removes_blocks_parented_by_page_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "page2" }
            ; blocks = [] } ]
      ()
  in
  let page1 = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let page2 = Option.get (Ldb.get_page (db_of conn) (String "page2")) in
  let block_uuid = Common_uuid.new_block_id () in
  let now = int_of_float (Clock.now_ms ()) in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = Some (Temp_id "parented-block")
           ; attrs =
               [ "block/uuid", ov (Uuid block_uuid)
               ; "block/title", ov (String "parented by page1")
               ; "block/created-at", ov (Int now)
               ; "block/updated-at", ov (Int now)
               ; "block/parent", ref_ent_attr (Entity_id page1.id)
               ; "block/page", ref_ent_attr (Entity_id page2.id)
               ; "block/order", ov (String "a0") ] } ]);
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     ignore
       (transact ~tx_meta:[ "outliner-op", Keyword "delete-page" ] conn
          (Outliner_recycle.recycle_page_tx_data (db_of conn) page1 ()));
     (match entity (db_of conn) (Entity_id page1.id) with
      | Some e ->
          check "parented-by-page recycled" (Outliner_recycle.recycled e)
      | None -> check "parented-by-page recycled" false);
     check "permanent-delete parented returns true"
       (Outliner_recycle.permanently_delete conn (uuid_of page1));
     check "parented block gone"
       (entity (db_of conn) (Lookup_ref ("block/uuid", Uuid block_uuid))
        = None)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- permanent-delete-recycled-block-with-transact-pipeline-test ---- *)
let test_permanent_delete_recycled_block_with_transact_pipeline_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks =
                [ { default_block with
                    b_title = Some "parent"
                  ; b_children =
                      [ { default_block with b_title = Some "child" } ] } ] } ]
      ()
  in
  let parent =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "parent")
  in
  let child =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "child")
  in
  let parent_uuid = uuid_of parent in
  let child_uuid = uuid_of child in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     ignore
       (transact ~tx_meta:[ "outliner-op", Keyword "delete-blocks" ] conn
          (Outliner_recycle.recycle_blocks_tx_data (db_of conn) [ parent ] ()));
     (match
        entity (db_of conn) (Lookup_ref ("block/uuid", Uuid parent_uuid))
      with
      | Some e ->
          check "permanent-delete-recycled-block recycled"
            (Outliner_recycle.recycled e)
      | None -> check "permanent-delete-recycled-block recycled" false);
     ignore (Outliner_recycle.permanently_delete conn parent_uuid);
     check "permanent-delete-recycled-block parent gone"
       (entity (db_of conn) (Lookup_ref ("block/uuid", Uuid parent_uuid))
        = None);
     check "permanent-delete-recycled-block child gone"
       (entity (db_of conn) (Lookup_ref ("block/uuid", Uuid child_uuid))
        = None)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- code-block-tag-addition-preserves-explicit-code-lang-test ---- *)
let test_code_block_tag_addition_preserves_explicit_code_lang_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let now = int_of_float (Clock.now_ms ()) in
  let code_block_uuid = Common_uuid.new_block_id () in
  let code_block_without_lang_uuid = Common_uuid.new_block_id () in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     ignore
       (transact conn
          [ Entity
              { db_id = Some (Temp_id "kv-latest-code-lang")
              ; attrs =
                  [ "db/ident", ov (Keyword "logseq.kv/latest-code-lang")
                  ; "kv/value", ov (String "pascal") ] } ]);
     ignore
       (transact conn
          [ Entity
              { db_id = Some (Temp_id "code-block")
              ; attrs =
                  [ "block/uuid", ov (Uuid code_block_uuid)
                  ; "block/title", ov (String "1 + 2")
                  ; "block/created-at", ov (Int now)
                  ; "block/updated-at", ov (Int now)
                  ; "block/page", ref_ent_attr (Entity_id page.id)
                  ; "block/parent", ref_ent_attr (Entity_id page.id)
                  ; "block/order",
                    ov (String (Db_order.gen_key None None))
                  ; "block/tags",
                    Many_entities
                      [ { db_id = Some (Ident "logseq.class/Code-block")
                        ; attrs = [] } ]
                  ; "logseq.property.code/lang", ov (String "calc") ] } ]);
     (match
        entity (db_of conn) (Lookup_ref ("block/uuid", Uuid code_block_uuid))
      with
      | Some block ->
          check "code-block display-type"
            (Ldb.value block "logseq.property.node/display-type"
             = Some (Keyword "code"));
          check "code-block explicit lang"
            (Ldb.string_value block "logseq.property.code/lang"
             = Some "calc")
      | None ->
          check "code-block display-type" false;
          check "code-block explicit lang" false);
     ignore
       (transact conn
          [ Entity
              { db_id = Some (Temp_id "code-block-no-lang")
              ; attrs =
                  [ "block/uuid",
                    ov (Uuid code_block_without_lang_uuid)
                  ; "block/title", ov (String "plain code")
                  ; "block/created-at", ov (Int now)
                  ; "block/updated-at", ov (Int now)
                  ; "block/page", ref_ent_attr (Entity_id page.id)
                  ; "block/parent", ref_ent_attr (Entity_id page.id)
                  ; "block/order",
                    ov (String (Db_order.gen_key None None))
                  ; "block/tags",
                    Many_entities
                      [ { db_id = Some (Ident "logseq.class/Code-block")
                        ; attrs = [] } ] ] } ]);
     (match
        entity (db_of conn)
          (Lookup_ref ("block/uuid", Uuid code_block_without_lang_uuid))
      with
      | Some block ->
          check "code-block default display-type"
            (Ldb.value block "logseq.property.node/display-type"
             = Some (Keyword "code"));
          check "code-block default lang"
            (Ldb.string_value block "logseq.property.code/lang"
             = Some "pascal")
      | None ->
          check "code-block default display-type" false;
          check "code-block default lang" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- journal-name-title-updates-throw-in-transact-pipeline-test ---- *)
let test_journal_name_title_updates_throw_in_transact_pipeline_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_journal = Some 20250203 }
            ; blocks = [] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [] } ]
      ()
  in
  let journal =
    Option.get
      (Db_test_util.find_journal_by_journal_day (db_of conn) 20250203)
  in
  let page1 = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let run_pipeline ops =
    Worker_pipeline.transact_pipeline
      (Db_tx.with_report ~tx_meta:[] (db_of conn) ops)
  in
  let expect_throw name ops =
    match
      (try `Ok (run_pipeline ops)
       with Worker_pipeline.Journal_protected_attr_updated (a, _, _, _) ->
         `Attr a)
    with
    | `Attr a -> check name (a = "block/title" || a = "block/name")
    | `Ok _ -> check name false
    | exception _ -> check name false
  in
  expect_throw "journal title map update throws"
    [ ent_op journal.id [ "block/title", ov (String "journal title changed") ] ];
  expect_throw "journal name map update throws"
    [ ent_op journal.id [ "block/name", ov (String "journal-name-changed") ] ];
  (match
     (try `Ok (run_pipeline [ add journal.id "block/title"
                                   (String "journal-title-via-datom") ])
       with Worker_pipeline.Journal_protected_attr_updated (a, _, _, _) ->
         `Attr a)
   with
   | `Attr a -> check "journal title datom add throws" (a = "block/title")
   | `Ok _ -> check "journal title datom add throws" false
   | exception _ -> check "journal title datom add throws" false);
  (match
     (try `Ok (run_pipeline [ add journal.id "block/name"
                                   (String "journal-name-via-datom") ])
       with Worker_pipeline.Journal_protected_attr_updated (a, _, _, _) ->
         `Attr a)
   with
   | `Attr a -> check "journal name datom add throws" (a = "block/name")
   | `Ok _ -> check "journal name datom add throws" false
   | exception _ -> check "journal name datom add throws" false);
  let result =
    run_pipeline [ ent_op page1.id [ "block/title", ov (String "page1-renamed") ] ]
  in
  (match entity result.db_after (Entity_id page1.id) with
   | Some e ->
       check "non-journal title allowed" (ent_title e = Some "page1-renamed")
   | None -> check "non-journal title allowed" false)

(* ---------- legacy-journal-reference-does-not-update-protected-attributes-test ---- *)
let test_legacy_journal_reference_does_not_update_protected_attributes_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_journal = Some 20260727 }
            ; blocks = [] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [ { default_block with b_title = Some "target" } ] } ]
      ()
  in
  let journal =
    Option.get
      (Db_test_util.find_journal_by_journal_day (db_of conn) 20260727)
  in
  let target =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "target")
  in
  ignore
    (Datascript.transact_conn conn
       [ Add (Ident "logseq.class/Journal",
              "logseq.property.journal/title-format", String "yyyy-MM-dd")
       ; ent_op journal.id
           [ "block/title", ov (String "2026-07-27")
           ; "block/name", ov (String "2026-07-27") ] ]);
  (* cljs gp-block/page-name->map *)
  (match
     Gp_block.page_name_to_map "2026-07-27" (db_of conn) true
       (Some "yyyy-MM-dd") ()
   with
   | None -> check "legacy-journal-reference page-name->map" false
   | Some reference ->
       Db_tx.transact_pipeline_fn :=
         Some (fun r -> Worker_pipeline.transact_pipeline r);
       (try
          let error =
            try
              ignore
                (transact conn
                   [ ent_op target.id
                       [ "block/title", ov (String "target")
                       ; "block/refs",
                         Many_entities
                           [ Block_map.to_tx_entity (db_of conn) reference ] ] ]);
              None
            with e -> Some e
          in
          (match
             Db_test_util.find_journal_by_journal_day (db_of conn) 20260727
           with
           | Some journal_after ->
               check "legacy-journal no throw" (error = None);
               check "legacy-journal title intact"
                 (ent_title journal_after = Some "2026-07-27");
               check "legacy-journal name intact"
                 (Ldb.string_value journal_after "block/name"
                  = Some "2026-07-27");
               (match entity (db_of conn) (Entity_id target.id) with
                | Some t ->
                    let ref_uuids =
                      Ldb.ref_ents t "block/refs" |> List.map uuid_of
                    in
                    check "legacy-journal ref points to journal"
                      (ref_uuids = [ uuid_of journal ])
                | None ->
                    check "legacy-journal ref points to journal" false)
           | None -> check "legacy-journal no throw" false)
        with e ->
          Db_tx.transact_pipeline_fn := Some (fun r -> r);
          raise e);
       Db_tx.transact_pipeline_fn := Some (fun r -> r))

(* ---------- create-journal-page-name-uses-default-formatter-test ---- *)
let test_create_journal_page_name_uses_default_formatter_test () =
  let conn = Db_test_util.create_pipeline_conn () in
  ignore
    (Datascript.transact_conn conn
       [ Add (Ident "logseq.class/Journal",
              "logseq.property.journal/title-format",
              String "yyyy-MM-dd EEEE") ]);
  (* cljs outliner-page/create! — create tx then transact *)
  let res =
    Outliner_page.create (db_of conn) "Dec 16th, 2024" ~journal:true ()
  in
  ignore
    (transact conn
       (Datascript.parse_tx_data_string
          (Db_transact.tx_edn res.tx_data)));
  let page_uuid = Option.get res.page_uuid in
  (match entity (db_of conn) (Lookup_ref ("block/uuid", Uuid page_uuid)) with
   | Some page ->
       (match Ldb.int_value page "block/journal-day" with
        | Some day ->
            let expected_title =
              Ldb.journal_title_of_day day "yyyy-MM-dd EEEE"
            in
            let expected_name =
              Ldb.journal_title_of_day day
                Date_time_util.default_journal_title_formatter
              |> Ldb.page_name_sanity_lc
            in
            check "create-journal title uses configured format"
              (ent_title page = Some expected_title);
            check "create-journal name uses default format"
              (Ldb.string_value page "block/name" = Some expected_name)
        | None -> check "create-journal title uses configured format" false)
   | None -> check "create-journal title uses configured format" false)

(* ---------- apply-template-today-dynamic-variable-persists-journal-ref-test
   cljs passes pre-computed :template-blocks (get-block-and-children rest +
   :logseq.property/used-template on the first child); OCaml apply_template_op
   derives the same block maps via template_children_blocks when
   "template-blocks" is absent from the op opts. ---------- *)
let test_apply_template_today_dynamic_variable_persists_journal_ref_test () =
  let today = ms_to_journal_day (Date_time_util.time_ms ()) in
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_journal = Some today }
            ; blocks = [ { default_block with b_title = Some "target block" } ] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "Templates" }
            ; blocks =
                [ { default_block with
                    b_title = Some "template root"
                  ; b_children =
                      [ { default_block with
                          b_title = Some "date <% today %>" } ] } ] } ]
      ()
  in
  let today_page =
    Option.get
      (Db_test_util.find_journal_by_journal_day (db_of conn) today)
  in
  let template_root =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "template root")
  in
  let target_block =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "target block")
  in
  Db_tx.transact_pipeline_fn := Some Worker_pipeline.transact_pipeline;
  (try
     ignore
       (Outliner_op.apply_ops conn
          (Wire.List
             [ Wire.List
                 [ Wire.Keyword "apply-template"
                 ; Wire.List
                     [ Wire.Uuid (uuid_of template_root)
                     ; Wire.Uuid (uuid_of target_block)
                     ; Wire.Map [] ] ] ])
          (Wire.Map []));
     let expected_raw =
       "date " ^ Page_ref.to_page_ref (uuid_of today_page)
     in
     (match
        Db_test_util.find_block_by_content (db_of conn) expected_raw
      with
      | Some b ->
          check "apply-template-today inserted exists" true;
          check "apply-template-today raw-title"
            (raw_block_title (db_of conn) (Some b) = Some expected_raw);
          check "apply-template-today resolved title"
            (ent_title b
             = Some
                 ("date "
                  ^ Page_ref.to_page_ref
                      (Option.get (ent_title today_page))));
          check "apply-template-today refs"
            (List.map uuid_of (Ldb.ref_ents b "block/refs")
             = [ uuid_of today_page ])
      | None ->
          check "apply-template-today inserted exists" false;
          check "apply-template-today raw-title" false;
          check "apply-template-today resolved title" false;
          check "apply-template-today refs" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- apply-template-tomorrow-dynamic-variable-creates-missing-journal-ref-test
   Same :template-blocks derivation note as the today variant. ---------- *)
let test_apply_template_tomorrow_dynamic_variable_creates_missing_journal_ref_test
    () =
  let today = ms_to_journal_day (Date_time_util.time_ms ()) in
  let tomorrow =
    ms_to_journal_day (Int64.add (Date_time_util.time_ms ()) 86_400_000L)
  in
  let journal_title_format = "yyyy-MM-dd" in
  let expected_tomorrow_title =
    Ldb.journal_title_of_day tomorrow journal_title_format
  in
  let expected_tomorrow_name = default_journal_page_name tomorrow in
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_journal = Some today }
            ; blocks = [ { default_block with b_title = Some "target block" } ] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "Templates" }
            ; blocks =
                [ { default_block with
                    b_title = Some "template root"
                  ; b_children =
                      [ { default_block with
                          b_title = Some "date <% tomorrow %>" } ] } ] } ]
      ()
  in
  let template_root =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "template root")
  in
  let target_block =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "target block")
  in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     ignore
       (transact conn
          [ Add
              ( Ident "logseq.class/Journal"
              , "logseq.property.journal/title-format"
              , String journal_title_format ) ]);
     check "apply-template-tomorrow journal absent"
       (Db_test_util.find_journal_by_journal_day (db_of conn) tomorrow
        = None);
     ignore
       (Outliner_op.apply_ops conn
          (Wire.List
             [ Wire.List
                 [ Wire.Keyword "apply-template"
                 ; Wire.List
                     [ Wire.Uuid (uuid_of template_root)
                     ; Wire.Uuid (uuid_of target_block)
                     ; Wire.Map [] ] ] ])
          (Wire.Map []));
     (match
        Db_test_util.find_journal_by_journal_day (db_of conn) tomorrow
      with
      | Some tomorrow_page ->
          check "apply-template-tomorrow journal title"
            (ent_title tomorrow_page = Some expected_tomorrow_title);
          check "apply-template-tomorrow journal name"
            (Ldb.string_value tomorrow_page "block/name"
             = Some expected_tomorrow_name);
          let expected_raw =
            "date " ^ Page_ref.to_page_ref (uuid_of tomorrow_page)
          in
          (match
             Db_test_util.find_block_by_content (db_of conn) expected_raw
           with
           | Some b ->
               check "apply-template-tomorrow inserted exists" true;
               check "apply-template-tomorrow raw-title"
                 (raw_block_title (db_of conn) (Some b) = Some expected_raw);
               check "apply-template-tomorrow resolved title"
                 (ent_title b
                  = Some
                      ("date "
                       ^ Page_ref.to_page_ref
                           (Option.get (ent_title tomorrow_page))));
               check "apply-template-tomorrow refs"
                 (List.map uuid_of (Ldb.ref_ents b "block/refs")
                  = [ uuid_of tomorrow_page ])
           | None ->
               check "apply-template-tomorrow inserted exists" false;
               check "apply-template-tomorrow raw-title" false;
               check "apply-template-tomorrow resolved title" false;
               check "apply-template-tomorrow refs" false)
      | None -> check "apply-template-tomorrow journal title" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- built-in-tag-must-not-convert-page-child-block-to-class-test ---- *)
let test_built_in_tag_must_not_convert_page_child_block_to_class_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [] } ]
      ()
  in
  let page1 = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let now = int_of_float (Clock.now_ms ()) in
  let bad_block_uuid = Common_uuid.new_block_id () in
  let new_tag_uuid = Common_uuid.new_block_id () in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     ignore
       (transact conn
          [ Entity
              { db_id = Some (Temp_id "bad-block")
              ; attrs =
                  [ "block/uuid", ov (Uuid bad_block_uuid)
                  ; "block/title", ov (String "charlie")
                  ; "block/created-at", ov (Int now)
                  ; "block/updated-at", ov (Int now)
                  ; "block/page", ref_ent_attr (Entity_id page1.id)
                  ; "block/parent", ref_ent_attr (Entity_id page1.id)
                  ; "block/order",
                    ov (String (Db_order.gen_key None None))
                  ; "block/tags",
                    Many_entities
                      [ { db_id = Some (Ident "logseq.class/Tag")
                        ; attrs = [] } ] ] } ]);
     (match
        entity (db_of conn) (Lookup_ref ("block/uuid", Uuid bad_block_uuid))
      with
      | Some block ->
          check "page-child block kept" true;
          check "page-child no ident" (Ldb.value block "db/ident" = None);
          check "page-child no extends"
            (Ldb.value block "logseq.property.class/extends" = None);
          check "page-child not a class" (not (Ldb.is_class block));
          check "page-child parent intact"
            (Ldb.ref_ids block "block/parent" = [ page1.id ]);
          check "page-child tags stripped"
            (Ldb.ref_ents block "block/tags" = [])
      | None -> check "page-child block kept" false);
     ignore
       (transact conn
          [ Entity
              { db_id = Some (Temp_id "new-tag")
              ; attrs =
                  [ "block/uuid", ov (Uuid new_tag_uuid)
                  ; "block/name", ov (String "standalone-tag")
                  ; "block/title", ov (String "standalone-tag")
                  ; "block/created-at", ov (Int now)
                  ; "block/updated-at", ov (Int now)
                  ; "block/tags",
                    Many_entities
                      [ { db_id = Some (Ident "logseq.class/Tag")
                        ; attrs = [] } ] ] } ]);
     (match
        entity (db_of conn) (Lookup_ref ("block/uuid", Uuid new_tag_uuid))
      with
      | Some tag_page ->
          check "standalone is a class" (Ldb.is_class tag_page);
          (match Ldb.ident_of tag_page with
           | Some ident ->
               check "standalone ident present" true;
               check "standalone ident ns user.class"
                 (String.length ident > 11
                  && String.sub ident 0 11 = "user.class/")
           | None -> check "standalone ident present" false);
          check "standalone extends Root"
            (List.map
               (fun (e : entity) -> Ldb.ident_of e)
               (Ldb.ref_ents tag_page "logseq.property.class/extends")
             = [ Some "logseq.class/Root" ])
      | None -> check "standalone is a class" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- tag-template-insertion-resolves-dynamic-variable-test ---- *)
let test_tag_template_insertion_resolves_dynamic_variable_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "Target Page" }
            ; blocks = [ { default_block with b_title = Some "target block" } ] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "Templates" }
            ; blocks =
                [ { default_block with
                    b_title = Some "tag template root"
                  ; b_children =
                      [ { default_block with
                          b_title = Some "auto <% current page %>" } ] } ] } ]
      ~classes: [ "DiaryEntry", Db_test_util.default_class ]
      ()
  in
  let target_block =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "target block")
  in
  let target_page =
    Option.get (Ldb.get_page (db_of conn) (String "Target Page"))
  in
  let template_root =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "tag template root")
  in
  let diary_entry =
    Option.get (Ldb.get_page (db_of conn) (String "DiaryEntry"))
  in
  ignore
    (transact conn
       [ add template_root.id "logseq.property/template-applied-to"
            (Ref_to (Entity_id diary_entry.id)) ]);
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     ignore
       (transact conn
          [ add target_block.id "block/tags" (Ref_to (Entity_id diary_entry.id)) ]);
     let expected_raw =
       "auto " ^ Page_ref.to_page_ref (uuid_of target_page)
     in
     let inserted_block =
       Db_test_util.find_block_by_content (db_of conn) expected_raw
     in
     (match inserted_block with
      | Some b ->
          check "tag-template inserted exists" true;
          check "tag-template raw-title"
            (raw_block_title (db_of conn) inserted_block = Some expected_raw);
          check "tag-template resolved title"
            (ent_title b = Some "auto [[Target Page]]");
          check "tag-template refs"
            (List.map uuid_of (Ldb.ref_ents b "block/refs")
             = [ uuid_of target_page ])
      | None ->
          check "tag-template inserted exists" false;
          check "tag-template raw-title" false;
          check "tag-template resolved title" false;
          check "tag-template refs" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- tag-template-insertion-creates-missing-journal-ref-test ---- *)
let test_tag_template_insertion_creates_missing_journal_ref_test () =
  let today = ms_to_journal_day (Date_time_util.time_ms ()) in
  let tomorrow =
    ms_to_journal_day (Int64.add (Date_time_util.time_ms ()) 86_400_000L)
  in
  let journal_title_format = "yyyy-MM-dd" in
  let expected_tomorrow_title =
    Ldb.journal_title_of_day tomorrow journal_title_format
  in
  let expected_tomorrow_name = default_journal_page_name tomorrow in
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_journal = Some today }
            ; blocks = [ { default_block with b_title = Some "target block" } ] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "Templates" }
            ; blocks =
                [ { default_block with
                    b_title = Some "tag template root"
                  ; b_children =
                      [ { default_block with
                          b_title = Some "auto <% tomorrow %>" } ] } ] } ]
      ~classes: [ "DiaryEntry", Db_test_util.default_class ]
      ()
  in
  let target_block =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "target block")
  in
  let template_root =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "tag template root")
  in
  let diary_entry =
    Option.get (Ldb.get_page (db_of conn) (String "DiaryEntry"))
  in
  ignore
    (transact conn
       [ Add (Ident "logseq.class/Journal",
              "logseq.property.journal/title-format",
              String journal_title_format)
       ; add template_root.id "logseq.property/template-applied-to"
            (Ref_to (Entity_id diary_entry.id)) ]);
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     check "tomorrow journal absent"
       (Db_test_util.find_journal_by_journal_day (db_of conn) tomorrow
        = None);
     ignore
       (transact conn
          [ add target_block.id "block/tags" (Ref_to (Entity_id diary_entry.id)) ]);
     (match
        Db_test_util.find_journal_by_journal_day (db_of conn) tomorrow
      with
      | Some tomorrow_page ->
          check "tomorrow journal title"
            (ent_title tomorrow_page = Some expected_tomorrow_title);
          check "tomorrow journal name"
            (Ldb.string_value tomorrow_page "block/name"
             = Some expected_tomorrow_name);
          let expected_raw =
            "auto " ^ Page_ref.to_page_ref (uuid_of tomorrow_page)
          in
          (match
             Db_test_util.find_block_by_content (db_of conn) expected_raw
           with
           | Some b ->
               check "tag-template journal inserted exists" true;
               check "tag-template journal raw-title"
                 (raw_block_title (db_of conn) (Some b) = Some expected_raw);
               check "tag-template journal resolved title"
                 (ent_title b
                  = Some
                      ("auto "
                       ^ Page_ref.to_page_ref
                           (Option.get (ent_title tomorrow_page))));
               check "tag-template journal refs"
                 (List.map uuid_of (Ldb.ref_ents b "block/refs")
                  = [ uuid_of tomorrow_page ])
           | None ->
               check "tag-template journal inserted exists" false;
               check "tag-template journal raw-title" false;
               check "tag-template journal resolved title" false;
               check "tag-template journal refs" false)
      | None -> check "tomorrow journal title" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- tag-template-journal-ref-survives-cli-upsert-property-history-tx-test
   cljs uses outliner-op/apply-ops! with :insert-blocks + :batch-set-property;
   OCaml runs the same three txs: insert-blocks, status property, tags. ---- *)
let test_tag_template_journal_ref_survives_cli_upsert_property_history_tx_test () =
  let today = ms_to_journal_day (Date_time_util.time_ms ()) in
  let tomorrow =
    ms_to_journal_day (Int64.add (Date_time_util.time_ms ()) 86_400_000L)
  in
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_journal = Some today }
            ; blocks = [] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "Templates" }
            ; blocks =
                [ { default_block with
                    b_title = Some "tag template root"
                  ; b_children =
                      [ { default_block with
                          b_title = Some "auto <% tomorrow %>" } ] } ] } ]
      ~classes: [ "DiaryEntry", Db_test_util.default_class ]
      ()
  in
  let today_page =
    Option.get
      (Db_test_util.find_journal_by_journal_day (db_of conn) today)
  in
  let target_block_uuid = Common_uuid.new_block_id () in
  let template_root =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "tag template root")
  in
  let diary_entry =
    Option.get (Ldb.get_page (db_of conn) (String "DiaryEntry"))
  in
  ignore
    (transact conn
       [ add template_root.id "logseq.property/template-applied-to"
            (Ref_to (Entity_id diary_entry.id)) ]);
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     let tx_result, _ =
       Outliner_core.insert_blocks (db_of conn)
            [ [ "block/uuid", Uuid target_block_uuid
              ; "block/title", String "target block" ] ]
            (Block_map.of_entity today_page)
            { Outliner_core.default_insert_opts with
              keep_uuid = true
            ; bottom = true
            ; outliner_op = Some "insert-blocks" }
        in
        ignore
          (transact ~tx_meta:[ "outliner-op", Keyword "insert-blocks" ]
             conn tx_result.tx_data);
     (* cljs :batch-set-property status done *)
     (match
        entity (db_of conn) (Lookup_ref ("block/uuid", Uuid target_block_uuid))
      with
      | Some target_block ->
          ignore
            (transact conn
               [ add target_block.id "logseq.property/status"
                    (Ref_to (Ident "logseq.property/status.done")) ]);
          ignore
            (transact conn
               [ add target_block.id "block/tags"
                    (Ref_to (Entity_id diary_entry.id)) ]);
          (match
             Db_test_util.find_block_by_content (db_of conn) "target block"
           with
           | Some target ->
               let history =
                 Ldb.ref_ents target "logseq.property.history/_block"
               in
               check "cli-upsert property history recorded"
                 (List.length history = 1)
           | None -> check "cli-upsert property history recorded" false);
          (match
             Db_test_util.find_journal_by_journal_day (db_of conn) tomorrow
           with
           | Some tomorrow_page ->
               let expected_raw =
                 "auto " ^ Page_ref.to_page_ref (uuid_of tomorrow_page)
               in
               (match
                  Db_test_util.find_block_by_content (db_of conn) expected_raw
                with
                | Some b ->
                    check "cli-upsert template refs"
                      (List.map uuid_of (Ldb.ref_ents b "block/refs")
                       = [ uuid_of tomorrow_page ])
                | None -> check "cli-upsert template refs" false)
           | None -> check "cli-upsert template refs" false)
      | None -> check "cli-upsert property history recorded" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- import-tx-skips-property-history-recording-test ---- *)
let test_import_tx_skips_property_history_recording_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [ { default_block with b_title = Some "task block" } ] } ]
      ()
  in
  let block =
    Option.get (Db_test_util.find_block_by_content (db_of conn) "task block")
  in
  let history_count () =
    List.length
      (List.of_seq
         (datoms (db_of conn) Avet ~a:"logseq.property.history/property" ()))
  in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     let before = history_count () in
     ignore
       (transact conn
          [ add block.id "logseq.property/status"
               (Ref_to (Ident "logseq.property/status.todo")) ]);
     check "import-tx baseline history"
       (history_count () = before + 1);
     let before = history_count () in
     ignore
       (transact
          ~tx_meta:[ "logseq.db.sqlite.export/imported-data?", Bool true ]
          conn
          [ add block.id "logseq.property/status"
               (Ref_to (Ident "logseq.property/status.doing")) ]);
     check "import-tx skips history" (history_count () = before)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- empty-tag-template-on-asset-allows-asset-create-test ---- *)
let test_empty_tag_template_on_asset_allows_asset_create_test () =
  let mk_conn template_children =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "Home" }
            ; blocks = [] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "Templates" }
            ; blocks =
                [ { default_block with
                    b_title = Some "asset template"
                  ; b_tags = [ "logseq.class/Template" ]
                  ; b_children = template_children } ] } ]
      ()
  in
  let run_asset_insert label template_children =
    let conn = mk_conn template_children in
    let home = Option.get (Ldb.get_page (db_of conn) (String "Home")) in
    let template_root =
      Option.get
        (Db_test_util.find_block_by_content (db_of conn) "asset template")
    in
    let asset_class =
      match entity (db_of conn) (Ident "logseq.class/Asset") with
      | Some e -> e
      | None -> failwith "Asset class missing"
    in
    let asset_uuid = Common_uuid.new_block_id () in
    ignore
      (transact conn
         [ add template_root.id "logseq.property/template-applied-to"
              (Ref_to (Entity_id asset_class.id)) ]);
    Db_tx.transact_pipeline_fn :=
      Some (fun r -> Worker_pipeline.transact_pipeline r);
    (try
       let tx_result, _ =
         Outliner_core.insert_blocks (db_of conn)
              [ [ "block/uuid", Uuid asset_uuid
                ; "block/title", String "ableton"
                ; "block/tags", Vector [ Keyword "logseq.class/Asset" ]
                ; "logseq.property.asset/type", String "png"
                ; "logseq.property.asset/size", Int 10
                ; "logseq.property.asset/checksum", String "abc123" ] ]
              (Block_map.of_entity home)
              { Outliner_core.default_insert_opts with
                keep_uuid = true
              ; bottom = true
              ; outliner_op = Some "insert-blocks" }
          in
          ignore
            (transact ~tx_meta:[ "outliner-op", Keyword "insert-blocks" ]
               conn tx_result.tx_data);
       (match
          entity (db_of conn) (Lookup_ref ("block/uuid", Uuid asset_uuid))
        with
        | Some asset ->
            check (label ^ ": asset stored") true;
            check (label ^ ": asset title")
              (ent_title asset = Some "ableton");
            check (label ^ ": asset type")
              (Ldb.string_value asset "logseq.property.asset/type"
               = Some "png");
            check (label ^ ": asset tag")
              (List.exists
                 (fun (e : entity) ->
                    Ldb.ident_of e
                    = Some "logseq.class/Asset")
                 (Ldb.ref_ents asset "block/tags"));
            let children = Ldb.ref_ents asset "block/_parent" in
            if template_children = [] then begin
              check (label ^ ": no used-template child")
                (not
                   (List.exists
                      (fun (c : entity) ->
                        Ldb.value c "logseq.property/used-template" <> None)
                      children));
              check (label ^ ": no nil-title child")
                (List.for_all
                   (fun (c : entity) -> ent_title c <> None)
                   children)
            end else begin
              (match
                 List.find_opt
                   (fun (c : entity) -> ent_title c = Some "caption")
                   children
               with
               | Some inserted ->
                   check (label ^ ": template child inserted")
                     (match
                        Ldb.ref_ent inserted
                          "logseq.property/used-template"
                      with
                      | Some t -> t.id = template_root.id
                      | None -> false)
               | None -> check (label ^ ": template child inserted" )
                         false)
            end
        | None -> check (label ^ ": asset stored") false)
     with e ->
       Db_tx.transact_pipeline_fn := Some (fun r -> r);
       raise e);
    Db_tx.transact_pipeline_fn := Some (fun r -> r)
  in
  run_asset_insert "empty-tag-template-on-asset" [];
  run_asset_insert "asset-template-with-children"
    [ Db_test_util.{ default_block with b_title = Some "caption" } ]

(* ---------- journal-tag-template-applied-on-repeating-task-reschedule-test
   cljs pins t/now to 2026-09-20 12:00; OCaml uses the real clock, so the
   expected next day is computed as today + recur-frequency (6 days). ---- *)
let test_journal_tag_template_applied_on_repeating_task_reschedule_test () =
  let scheduled_ms = Date_time_util.time_ms () in
  let expected_next_day =
    ms_to_journal_day (Int64.add scheduled_ms (Int64.of_int (6 * 86_400_000)))
  in
  (* cljs sets the repeated-task props via :build/properties; the OCaml
     equivalent sets them with plain txs below (same datoms). *)
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "Inbox" }
            ; blocks =
                [ { default_block with
                    b_title = Some "repeating task"
                  ; b_tags = [ "logseq.class/Task" ] } ] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "Templates" }
            ; blocks =
                [ { default_block with
                    b_title = Some "journal template"
                  ; b_tags = [ "logseq.class/Template" ]
                  ; b_children =
                      [ { default_block with
                          b_title = Some "journal template body" } ] } ] } ]
      ()
  in
  let task =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "repeating task")
  in
  let template_root =
    Option.get
      (Db_test_util.find_block_by_content (db_of conn) "journal template")
  in
  let journal_class =
    match entity (db_of conn) (Ident "logseq.class/Journal") with
    | Some e -> e
    | None -> failwith "Journal class missing"
  in
  let now_i = Int64.to_int scheduled_ms in
  let recur_uuid = Common_uuid.new_block_id () in
  ignore
    (Datascript.transact_conn conn
       [ Datascript.Entity
           { db_id = Some (Datascript.Temp_id "recur-freq")
           ; attrs =
               [ "block/uuid", One_value (Uuid recur_uuid)
               ; "block/page", One_value (Ref_to (Entity_id task.id))
               ; "block/parent", One_value (Ref_to (Entity_id task.id))
               ; "block/order", One_value (String "a1")
               ; "block/created-at", One_value (Int now_i)
               ; "block/updated-at", One_value (Int now_i)
               ; "logseq.property/created-from-property",
                 One_value (Ref_to (Ident "logseq.property.repeat/recur-frequency"))
               ; "logseq.property/value", One_value (Int 6) ] }
       ; ent_op task.id
           [ "logseq.property/status",
             ref_ent_attr (Ident "logseq.property/status.todo")
           ; "logseq.property/scheduled", ov (Int now_i)
           ; "logseq.property.repeat/repeated?", ov (Bool true)
           ; "logseq.property.repeat/recur-frequency",
             ref_ent_attr (Temp_id "recur-freq")
           ; "logseq.property.repeat/recur-unit",
             ref_ent_attr
               (Ident "logseq.property.repeat/recur-unit.day") ]
       ; add task.id "logseq.property.repeat/repeat-type"
            (Ref_to (Ident "logseq.property.repeat/repeat-type.double-plus"))
       ; add template_root.id "logseq.property/template-applied-to"
            (Ref_to (Entity_id journal_class.id)) ]);
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     check "reschedule next journal absent"
       (Db_test_util.find_journal_by_journal_day (db_of conn)
          expected_next_day
        = None);
     ignore
       (transact conn
          [ add task.id "logseq.property/status"
               (Ref_to (Ident "logseq.property/status.done")) ]);
     (match
        Db_test_util.find_journal_by_journal_day (db_of conn)
          expected_next_day
      with
      | Some next_journal ->
          check "reschedule journal created" true;
          check "reschedule journal tagged"
            (List.exists
               (fun (e : entity) ->
                  Ldb.ident_of e
                  = Some "logseq.class/Journal")
               (Ldb.ref_ents next_journal "block/tags"));
          (match
             List.find_opt
               (fun (c : entity) ->
                  ent_title c = Some "journal template body")
               (Ldb.ref_ents next_journal "block/_parent")
           with
           | Some inserted ->
               check "reschedule template child used-template"
                 (match
                    Ldb.ref_ent inserted "logseq.property/used-template"
                  with
                  | Some t -> t.id = template_root.id
                  | None -> false)
           | None ->
               check "reschedule template child used-template" false)
      | None -> check "reschedule journal created" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- interleaved-graphs-reuse-their-own-reference-attrs-test
   cljs counts d/datoms scans via with-redefs; no OCaml equivalent — the
   observable cache-correctness outcome is asserted. ---- *)
let test_interleaved_graphs_reuse_their_own_reference_attrs_test () =
  let conns =
    List.map
      (fun title ->
        Db_test_util.create_pipeline_conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page = { default_page with pg_title = Some title }
                ; blocks = [ { default_block with b_title = Some "block" } ] } ]
          ())
      [ "first graph"; "second graph" ]
  in
  let ids =
    List.map
      (fun conn ->
        (Option.get
           (Db_test_util.find_block_by_content (db_of conn) "block")).id)
      conns
  in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     List.iter2
       (fun conn id ->
         ignore (transact conn [ add id "block/title" (String "warm cache") ]))
       conns ids;
     List.iter2
       (fun conn id ->
         ignore
           (transact conn
              [ add id "block/title" (String "after interleaving") ]);
         (match entity (db_of conn) (Entity_id id) with
          | Some e ->
              check "interleaved-graphs title"
                (ent_title e = Some "after interleaving")
          | None -> check "interleaved-graphs title" false))
       conns ids
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)

(* ---------- ordinary-transactions-reuse-cached-reference-attrs-test ---- *)
let test_ordinary_transactions_reuse_cached_reference_attrs_test () =
  let conn =
    Db_test_util.create_pipeline_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "page1" }
            ; blocks = [ { default_block with b_title = Some "block" } ] } ]
      ()
  in
  let block_id =
    (Option.get
       (Db_test_util.find_block_by_content (db_of conn) "block")).id
  in
  Db_tx.transact_pipeline_fn := Some (fun r -> Worker_pipeline.transact_pipeline r);
  (try
     ignore (transact conn [ add block_id "block/title" (String "one") ]);
     ignore (transact conn [ add block_id "block/title" (String "two") ]);
     (match entity (db_of conn) (Ident "logseq.property/publishing-public?") with
      | Some p ->
          ignore
            (transact conn
               [ add p.id "logseq.property/public?" (Bool false) ]);
          ignore (transact conn [ add block_id "block/title" (String "three") ]);
          (match entity (db_of conn) (Entity_id block_id) with
           | Some e ->
               check "ordinary-transactions title"
                 (ent_title e = Some "three")
           | None -> check "ordinary-transactions title" false)
      | None -> check "ordinary-transactions title" false)
   with e ->
     Db_tx.transact_pipeline_fn := Some (fun r -> r);
     raise e);
  Db_tx.transact_pipeline_fn := Some (fun r -> r)


let cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "nested-insert-keeps-parent-revision-test" `Quick test_nested_insert_keeps_parent_revision_test;
    Alcotest.test_case "top-level-insert-keeps-page-revision-test" `Quick test_top_level_insert_keeps_page_revision_test;
    Alcotest.test_case "referenced-entity-content-change-invalidates-owning-block-test" `Quick test_referenced_entity_content_change_invalidates_owning_block_test;
    Alcotest.test_case "referenced-entity-timestamp-change-does-not-revise-rendered-blocks-test" `Quick test_referenced_entity_timestamp_change_does_not_revise_rendered_blocks_test;
    Alcotest.test_case "property-assignment-revises-block-only-test" `Quick test_property_assignment_revises_block_only_test;
    Alcotest.test_case "collapsed-state-revises-parent-test" `Quick test_collapsed_state_revises_parent_test;
    Alcotest.test_case "direct-page-update-revises-page-test" `Quick test_direct_page_update_revises_page_test;
    Alcotest.test_case "direct-child-visibility-keeps-its-membership-owner-revision-test" `Quick test_direct_child_visibility_keeps_its_membership_owner_revision_test;
    Alcotest.test_case "temp-inner-mutations-enter-the-pipeline-once-at-the-final-live-commit-test" `Quick test_temp_inner_mutations_enter_the_pipeline_once_at_the_final_live_commit_test;
    Alcotest.test_case "test-built-in-page-updates-that-should-be-reverted" `Quick test_test_built_in_page_updates_that_should_be_reverted;
    Alcotest.test_case "ensure-query-property-on-tag-additions-test" `Quick test_ensure_query_property_on_tag_additions_test;
    Alcotest.test_case "ensure-comments-blocks-property-on-tag-additions-test" `Quick test_ensure_comments_blocks_property_on_tag_additions_test;
    Alcotest.test_case "imported-data-rebuilds-block-refs-in-the-formal-pipeline-test" `Quick test_imported_data_rebuilds_block_refs_in_the_formal_pipeline_test;
    Alcotest.test_case "permanent-delete-recycled-page-with-transact-pipeline-test" `Quick test_permanent_delete_recycled_page_with_transact_pipeline_test;
    Alcotest.test_case "recycle-ops-return-apply-result-test" `Quick test_recycle_ops_return_apply_result_test;
    Alcotest.test_case "permanent-delete-recycled-page-removes-blocks-parented-by-page-test" `Quick test_permanent_delete_recycled_page_removes_blocks_parented_by_page_test;
    Alcotest.test_case "permanent-delete-recycled-block-with-transact-pipeline-test" `Quick test_permanent_delete_recycled_block_with_transact_pipeline_test;
    Alcotest.test_case "code-block-tag-addition-preserves-explicit-code-lang-test" `Quick test_code_block_tag_addition_preserves_explicit_code_lang_test;
    Alcotest.test_case "journal-name-title-updates-throw-in-transact-pipeline-test" `Quick test_journal_name_title_updates_throw_in_transact_pipeline_test;
    Alcotest.test_case "legacy-journal-reference-does-not-update-protected-attributes-test" `Quick test_legacy_journal_reference_does_not_update_protected_attributes_test;
    Alcotest.test_case "create-journal-page-name-uses-default-formatter-test" `Quick test_create_journal_page_name_uses_default_formatter_test;
    Alcotest.test_case "apply-template-today-dynamic-variable-persists-journal-ref-test" `Quick test_apply_template_today_dynamic_variable_persists_journal_ref_test;
    Alcotest.test_case "apply-template-tomorrow-dynamic-variable-creates-missing-journal-ref-test" `Quick test_apply_template_tomorrow_dynamic_variable_creates_missing_journal_ref_test;
    Alcotest.test_case "built-in-tag-must-not-convert-page-child-block-to-class-test" `Quick test_built_in_tag_must_not_convert_page_child_block_to_class_test;
    Alcotest.test_case "tag-template-insertion-resolves-dynamic-variable-test" `Quick test_tag_template_insertion_resolves_dynamic_variable_test;
    Alcotest.test_case "tag-template-insertion-creates-missing-journal-ref-test" `Quick test_tag_template_insertion_creates_missing_journal_ref_test;
    Alcotest.test_case "tag-template-journal-ref-survives-cli-upsert-property-history-tx-test" `Quick test_tag_template_journal_ref_survives_cli_upsert_property_history_tx_test;
    Alcotest.test_case "import-tx-skips-property-history-recording-test" `Quick test_import_tx_skips_property_history_recording_test;
    Alcotest.test_case "empty-tag-template-on-asset-allows-asset-create-test" `Quick test_empty_tag_template_on_asset_allows_asset_create_test;
    Alcotest.test_case "journal-tag-template-applied-on-repeating-task-reschedule-test" `Quick test_journal_tag_template_applied_on_repeating_task_reschedule_test;
    Alcotest.test_case "interleaved-graphs-reuse-their-own-reference-attrs-test" `Quick test_interleaved_graphs_reuse_their_own_reference_attrs_test;
    Alcotest.test_case "ordinary-transactions-reuse-cached-reference-attrs-test" `Quick test_ordinary_transactions_reuse_cached_reference_attrs_test ]
