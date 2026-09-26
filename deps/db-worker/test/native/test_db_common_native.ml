(* 1:1 translations of cljs unit tests under deps/db/test/logseq/db/common/
   plus the small deps/common tests that map to ported modules.

   Sources:
   - deps/db/test/logseq/db/common/delete_blocks_test.cljs — all 13 deftests
     (delete-blocks/update-refs-history, expand-delete-blocks-tx, ldb/transact!)
   - deps/db/test/logseq/db/common/initial_data_test.cljs —
     latest-journals-stays-within-journal-day-index
   - deps/db/test/logseq/db/common/initial_data_refs_test.cljs — both deftests
   - deps/common/test/logseq/common/util/page_ref_test.cljs — page-ref?
   - deps/common/test/logseq/common/util_test.cljs — url? are-case
   - deps/common/test/logseq/common/graph_dir_test.cljs —
     repo->encoded-graph-dir-name + graph-name-whitespace-boundaries
     (the other deftests are in test_common_native.ml)

   cljs deftest names are kept as OCaml test names.

   Skipped cljs cases (unported dependency): none remaining.
   - view_test.cljs: ported to test_db_view_native.ml (all 42 deftests)

   cljs (d/transact! conn tx-maps-or-datoms) -> Datascript.transact_conn /
   transact_conn_string; cljs (ldb/transact! conn txs) -> Db_tx.transact. *)

open Datascript
open Test_shared

(* ---------- helpers ---------- *)

let now () = Int64.to_int (Time.epoch_ms_to_int64 (Time.now ()))

let retract_entity (id : entity_id) = RetractEntity (Entity_id id)

let ref_of (e : entity) = Ref e.id

let status_prop_eid db =
  (ent_of_ref_exn db (Ident "logseq.property/status")).id

(* d/transact! of the :logseq.property/status ident used by history tests *)
let add_status_ident conn =
  ignore
    (Datascript.transact_conn_string conn
       "[{:db/ident :logseq.property/status}]")

(* cljs (delete-blocks/update-refs-history @conn txs {}) *)
let update_refs_history db txs = Delete_blocks.update_refs_history db txs

let page_entity (e : entity) : entity option = Ldb.ref_ent e "block/page"

(* cljs common-initial-data/get-block-refs: ids + block aliases ->
   :block/_refs -> hidden filtered. Not in lib/, composed from ported parts. *)
let get_block_refs db (id : entity_id) : entity list =
  let with_alias =
    List.sort_uniq compare (id :: Db_view.get_block_alias db id)
  in
  let hidden = Db_view.hidden_ref_pred db id in
  List.concat_map
    (fun i ->
      match Ldb.ent_of_id db i with
      | Some e -> Ldb.ref_ents e "block/_refs"
      | None -> [])
    with_alias
  |> List.filter (fun e -> not (hidden e))

(* ---------- deps/db/test/logseq/db/common/delete_blocks_test.cljs ---------- *)

(* (deftest delete-blocks-removes-reactions ...) *)
let test_delete_blocks_removes_reactions () =
  let open Db_test_util in
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Page" };
            blocks = [ { default_block with b_title = Some "Block" } ] } ]
      ()
  in
  let block = Option.get (find_block_by_content (db_of conn) "Block") in
  let n = now () in
  let reaction_uuid = gen_uuid () in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid reaction_uuid)
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "logseq.property.reaction/emoji-id", One_value (String "+1")
               ; "logseq.property.reaction/target", One_value (ref_of block) ] } ]);
  let reaction_entity =
    List.hd (Ldb.ref_ents (ent_of_ref_exn (db_of conn) (Entity_id block.id))
               "logseq.property.reaction/_target")
  in
  let retracts = [ retract_entity block.id ] in
  let extra = update_refs_history (db_of conn) retracts in
  ignore (Datascript.transact_conn conn (retracts @ extra));
  check "delete-blocks-removes-reactions"
    (Datascript.entity (db_of conn) (Entity_id reaction_entity.id) = None)

(* (deftest delete-blocks-expands-property-value-children ...) *)
let test_delete_blocks_expands_property_value_children () =
  let open Db_test_util in
  let property_value_uuid = gen_uuid () in
  let conn =
    create_conn_with_blocks
      ~properties:
        [ "cli-http-prop",
          { default_property with p_uuid = Some "a4e5c6d7-0000-4000-8000-000000000001" } ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Page" };
            blocks =
              [ { default_block with
                  b_title = Some "Parent"
                ; b_properties =
                    [ "cli-http-prop",
                      Map
                        [ "build/property-value", Kw "block"
                        ; "block/title", Str "Property value"
                        ; "block/uuid", Uuid property_value_uuid
                        ; "build/keep-uuid?", Bool true ] ] } ] } ]
      ()
  in
  let parent = Option.get (find_block_by_content (db_of conn) "Parent") in
  let property_value =
    ent_of_ref_exn (db_of conn)
      (Lookup_ref ("block/uuid", Uuid property_value_uuid))
  in
  let txs = [ retract_entity parent.id ] in
  let expanded =
    Delete_blocks.expand_delete_blocks_tx (db_of conn) txs
      ~outliner_op:"delete-blocks"
  in
  check "delete-blocks-expands-property-value-children parent"
    (match Ldb.ref_ent property_value "block/parent" with
     | Some p -> p.id = parent.id
     | None -> false);
  check "delete-blocks-expands-property-value-children expansion"
    (List.exists
       (function
         | RetractEntity (Entity_id id) -> id = property_value.id
         | _ -> false)
       expanded)

(* fixture shared by the history tests *)
let history_fixture () =
  let open Db_test_util in
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Page" };
            blocks =
              [ { default_block with b_title = Some "Target block" }
              ; { default_block with b_title = Some "Choice value" } ] } ]
      ()
  in
  add_status_ident conn;
  conn

(* (deftest delete-blocks-removes-history-with-ref-value ...) *)
let test_delete_blocks_removes_history_with_ref_value () =
  let conn = history_fixture () in
  let db = db_of conn in
  let target = Option.get (Db_test_util.find_block_by_content db "Target block") in
  let choice = Option.get (Db_test_util.find_block_by_content db "Choice value") in
  let history_uuid = Db_test_util.gen_uuid () in
  let n = now () in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid history_uuid)
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "logseq.property.history/block", One_value (ref_of target)
               ; "logseq.property.history/property",
                 One_value (Ref (status_prop_eid db))
               ; "logseq.property.history/ref-value",
                 One_value (ref_of choice) ] } ]);
  let history_entity =
    ent_of_ref_exn (db_of conn) (Lookup_ref ("block/uuid", Uuid history_uuid))
  in
  let retracts = [ retract_entity choice.id ] in
  let extra = update_refs_history (db_of conn) retracts in
  ignore (Datascript.transact_conn conn (retracts @ extra));
  check "delete-blocks-removes-history-with-ref-value"
    (Datascript.entity (db_of conn) (Entity_id history_entity.id) = None)

(* (deftest property-history-block-updates-are-kept ...) *)
let test_property_history_block_updates_are_kept () =
  let conn = history_fixture () in
  let db = db_of conn in
  let target = Option.get (Db_test_util.find_block_by_content db "Target block") in
  let choice = Option.get (Db_test_util.find_block_by_content db "Choice value") in
  let page = Option.get (page_entity target) in
  let history_uuid = Db_test_util.gen_uuid () in
  let n = now () in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid history_uuid)
               ; "block/title", One_value (String "History entry")
               ; "block/page", One_value (Ref page.id)
               ; "block/parent", One_value (Ref page.id)
               ; "block/order", One_value (String "a0")
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "logseq.property.history/block", One_value (ref_of target)
               ; "logseq.property.history/property",
                 One_value (Ref (status_prop_eid db))
               ; "logseq.property.history/ref-value",
                 One_value (ref_of choice) ] } ]);
  let history_entity =
    ent_of_ref_exn (db_of conn) (Lookup_ref ("block/uuid", Uuid history_uuid))
  in
  let hid = Entity_id history_entity.id in
  let txs =
    [ Retract (hid, "block/title", Some (String "History entry"))
    ; Add (hid, "block/title", String "Updated history entry")
    ; Retract (hid, "block/parent", Some (Ref page.id))
    ; Add (hid, "block/parent", Ref target.id)
    ; Retract (hid, "block/order", Some (String "a0"))
    ; Add (hid, "block/order", String "b0") ]
  in
  let extra = update_refs_history (db_of conn) txs in
  ignore (Datascript.transact_conn conn (txs @ extra));
  let updated = ent_of_ref_exn (db_of conn) hid in
  check "property-history-block-updates-are-kept title"
    (Ldb.string_value updated "block/title" = Some "Updated history entry");
  check "property-history-block-updates-are-kept parent"
    (match Ldb.ref_ent updated "block/parent" with
     | Some p -> p.id = target.id
     | None -> false);
  check "property-history-block-updates-are-kept order"
    (Ldb.string_value updated "block/order" = Some "b0")

(* (deftest remote-delete-blocks-removes-history-when-owner-ref-retracted ...) *)
let test_remote_delete_blocks_removes_history_when_owner_ref_retracted () =
  let conn = history_fixture () in
  let db = db_of conn in
  let target = Option.get (Db_test_util.find_block_by_content db "Target block") in
  let choice = Option.get (Db_test_util.find_block_by_content db "Choice value") in
  let history_uuid = Db_test_util.gen_uuid () in
  let n = now () in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid history_uuid)
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "logseq.property.history/block", One_value (ref_of target)
               ; "logseq.property.history/property",
                 One_value (Ref (status_prop_eid db))
               ; "logseq.property.history/ref-value",
                 One_value (ref_of choice) ] } ]);
  let history_entity =
    ent_of_ref_exn (db_of conn) (Lookup_ref ("block/uuid", Uuid history_uuid))
  in
  let txs =
    [ Retract
        (Entity_id history_entity.id, "logseq.property.history/block",
         Some (Ref target.id)) ]
  in
  let extra = update_refs_history (db_of conn) txs in
  ignore (Datascript.transact_conn conn (txs @ extra));
  check "remote-delete-blocks-removes-history-when-owner-ref-retracted"
    (Datascript.entity (db_of conn) (Entity_id history_entity.id) = None)

(* (deftest delete-blocks-removes-new-history-for-deleted-block ...) *)
let test_delete_blocks_removes_new_history_for_deleted_block () =
  let conn = history_fixture () in
  let db = db_of conn in
  let target = Option.get (Db_test_util.find_block_by_content db "Target block") in
  let choice = Option.get (Db_test_util.find_block_by_content db "Choice value") in
  let history_uuid = Db_test_util.gen_uuid () in
  let n = now () in
  let txs =
    [ Entity
        { db_id = None
        ; attrs =
            [ "block/uuid", One_value (Uuid history_uuid)
            ; "block/created-at", One_value (Int64 (Int64.of_int n))
            ; "block/updated-at", One_value (Int64 (Int64.of_int n))
            ; "logseq.property.history/block", One_value (ref_of target)
            ; "logseq.property.history/property",
              One_value (Ref (status_prop_eid db))
            ; "logseq.property.history/ref-value",
              One_value (ref_of choice) ] }
    ; retract_entity target.id ]
  in
  let extra = update_refs_history db txs in
  ignore (Datascript.transact_conn conn (txs @ extra));
  check "delete-blocks-removes-new-history-for-deleted-block"
    (Datascript.entity (db_of conn)
       (Lookup_ref ("block/uuid", Uuid history_uuid))
     = None)

(* (deftest remote-delete-blocks-removes-new-normalized-history-when-owner-ref-retracted ...) *)
let test_remote_delete_blocks_removes_new_normalized_history () =
  let conn = history_fixture () in
  let db = db_of conn in
  let target = Option.get (Db_test_util.find_block_by_content db "Target block") in
  let choice = Option.get (Db_test_util.find_block_by_content db "Choice value") in
  let history_uuid = Db_test_util.gen_uuid () in
  let history_eid = 1000000 in
  let n = now () in
  let txs =
    [ Add (Entity_id history_eid, "block/uuid", Uuid history_uuid)
    ; Add (Entity_id history_eid, "block/created-at", Int64 (Int64.of_int n))
    ; Add (Entity_id history_eid, "block/updated-at", Int64 (Int64.of_int n))
    ; Add (Entity_id history_eid, "logseq.property.history/block", Ref target.id)
    ; Add
        (Entity_id history_eid, "logseq.property.history/property",
         Ref (status_prop_eid db))
    ; Add (Entity_id history_eid, "logseq.property.history/ref-value", Ref choice.id)
    ; Retract
        (Entity_id history_eid, "logseq.property.history/block",
         Some (Ref target.id)) ]
  in
  let extra = update_refs_history db txs in
  ignore (Datascript.transact_conn conn (txs @ extra));
  check "remote-delete-blocks-removes-new-normalized-history-when-owner-ref-retracted"
    (Datascript.entity (db_of conn)
       (Lookup_ref ("block/uuid", Uuid history_uuid))
     = None)

(* (deftest delete-page-removes-history-with-ref-value ...) *)
let test_delete_page_removes_history_with_ref_value () =
  let open Db_test_util in
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Journal" };
            blocks = [ { default_block with b_title = Some "b1" } ] };
          { page = { default_page with pg_title = Some "Page to delete" };
            blocks = [] } ]
      ()
  in
  add_status_ident conn;
  let db = db_of conn in
  let block = Option.get (find_block_by_content db "b1") in
  let page = Option.get (find_page_by_title db "Page to delete") in
  let history_uuid = gen_uuid () in
  let n = now () in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid history_uuid)
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "logseq.property.history/block", One_value (ref_of block)
               ; "logseq.property.history/property",
                 One_value (Ref (status_prop_eid db))
               ; "logseq.property.history/ref-value",
                 One_value (ref_of page) ] } ]);
  let history_entity =
    ent_of_ref_exn (db_of conn) (Lookup_ref ("block/uuid", Uuid history_uuid))
  in
  ignore (Db_tx.transact conn [ retract_entity page.id ]);
  check "delete-page-removes-history-with-ref-value"
    (Datascript.entity (db_of conn) (Entity_id history_entity.id) = None)

(* (deftest delete-property-removes-history-for-property ...) *)
let test_delete_property_removes_history_for_property () =
  let open Db_test_util in
  let conn =
    create_conn_with_blocks
      ~properties:
        [ "obsolete", { default_property with p_type = "string" } ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Page" };
            blocks = [ { default_block with b_title = Some "Target block" } ] } ]
      ()
  in
  let db = db_of conn in
  let block = Option.get (find_block_by_content db "Target block") in
  let prop = ident_ent_exn db "user.property/obsolete" in
  let history_uuid = gen_uuid () in
  let n = now () in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid history_uuid)
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "logseq.property.history/block", One_value (ref_of block)
               ; "logseq.property.history/property", One_value (ref_of prop)
               ; "logseq.property.history/scalar-value",
                 One_value (String "old") ] } ]);
  let history_entity =
    ent_of_ref_exn (db_of conn) (Lookup_ref ("block/uuid", Uuid history_uuid))
  in
  let retracts = [ retract_entity prop.id ] in
  let extra = update_refs_history (db_of conn) retracts in
  ignore (Datascript.transact_conn conn (retracts @ extra));
  check "delete-property-removes-history-for-property"
    (Datascript.entity (db_of conn) (Entity_id history_entity.id) = None)

(* (deftest delete-blocks-removes-history-for-corresponding-views ...) *)
let test_delete_blocks_removes_history_for_corresponding_views () =
  let conn = history_fixture () in
  let db = db_of conn in
  let target = Option.get (Db_test_util.find_block_by_content db "Target block") in
  let view_uuid = Db_test_util.gen_uuid () in
  let target_history_uuid = Db_test_util.gen_uuid () in
  let view_history_uuid = Db_test_util.gen_uuid () in
  let n = now () in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid view_uuid)
               ; "block/title", One_value (String "Target view")
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "logseq.property/view-for", One_value (ref_of target)
               ; "logseq.property.view/type",
                 One_value (Keyword "logseq.property.view/type.table")
               ; "logseq.property.view/feature-type",
                 One_value (Keyword "linked-references") ] }
       ; Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid target_history_uuid)
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "logseq.property.history/block", One_value (ref_of target)
               ; "logseq.property.history/property",
                 One_value (Ref (status_prop_eid db))
               ; "logseq.property.history/scalar-value",
                 One_value (String "Todo") ] }
       ; Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid view_history_uuid)
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "logseq.property.history/block",
                 One_value (Ref_to (Lookup_ref ("block/uuid", Uuid view_uuid)))
               ; "logseq.property.history/property",
                 One_value (Ref (status_prop_eid db))
               ; "logseq.property.history/scalar-value",
                 One_value (String "List") ] } ]);
  ignore (Db_tx.transact conn [ retract_entity target.id ]);
  let gone u =
    Datascript.entity (db_of conn) (Lookup_ref ("block/uuid", Uuid u)) = None
  in
  check "delete-blocks-removes-history-for-corresponding-views view" (gone view_uuid);
  check "delete-blocks-removes-history-for-corresponding-views target-history"
    (gone target_history_uuid);
  check "delete-blocks-removes-history-for-corresponding-views view-history"
    (gone view_history_uuid)

(* (deftest delete-blocks-does-not-rewrite-title-for-deleted-view ...) *)
let test_delete_blocks_does_not_rewrite_title_for_deleted_view () =
  let conn = history_fixture () in
  let db = db_of conn in
  let target = Option.get (Db_test_util.find_block_by_content db "Target block") in
  let page = Option.get (page_entity target) in
  let view_uuid = Db_test_util.gen_uuid () in
  let n = now () in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid view_uuid)
               ; "block/title", One_value (String "Unlinked references")
               ; "block/raw-title", One_value (String "Unlinked references")
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "block/page", One_value (Ref page.id)
               ; "block/parent", One_value (Ref page.id)
               ; "block/order", One_value (String "cD66")
               ; "block/refs", One_value (ref_of target)
               ; "logseq.property/view-for", One_value (ref_of target)
               ; "logseq.property.view/type",
                 One_value (Keyword "logseq.property.view/type.list")
               ; "logseq.property.view/feature-type",
                 One_value (Keyword "unlinked-references") ] } ]);
  let view =
    ent_of_ref_exn (db_of conn) (Lookup_ref ("block/uuid", Uuid view_uuid))
  in
  let retracts = [ retract_entity target.id ] in
  let extra = update_refs_history (db_of conn) retracts in
  check "delete-blocks-does-not-rewrite-title-for-deleted-view retracts view"
    (List.exists
       (function RetractEntity (Entity_id id) -> id = view.id | _ -> false)
       extra);
  check "delete-blocks-does-not-rewrite-title-for-deleted-view no title rewrite"
    (not
       (List.exists
          (function
            | Add (Entity_id id, "block/title", String "Unlinked references") ->
                id = view.id
            | _ -> false)
          extra))

(* (deftest delete-blocks-does-not-rewrite-title-for-deleted-history ...) *)
let test_delete_blocks_does_not_rewrite_title_for_deleted_history () =
  let conn = history_fixture () in
  let db = db_of conn in
  let target = Option.get (Db_test_util.find_block_by_content db "Target block") in
  let page = Option.get (page_entity target) in
  let history_uuid = Db_test_util.gen_uuid () in
  let n = now () in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid history_uuid)
               ; "block/title", One_value (String "History entry")
               ; "block/raw-title", One_value (String "History entry")
               ; "block/created-at", One_value (Int64 (Int64.of_int n))
               ; "block/updated-at", One_value (Int64 (Int64.of_int n))
               ; "block/page", One_value (Ref page.id)
               ; "block/parent", One_value (Ref page.id)
               ; "block/order", One_value (String "a0")
               ; "block/refs", One_value (ref_of target)
               ; "logseq.property.history/block", One_value (ref_of target)
               ; "logseq.property.history/property",
                 One_value (Ref (status_prop_eid db))
               ; "logseq.property.history/scalar-value",
                 One_value (String "Todo") ] } ]);
  let history =
    ent_of_ref_exn (db_of conn) (Lookup_ref ("block/uuid", Uuid history_uuid))
  in
  let retracts = [ retract_entity target.id ] in
  let extra = update_refs_history (db_of conn) retracts in
  check "delete-blocks-does-not-rewrite-title-for-deleted-history retracts history"
    (List.exists
       (function RetractEntity (Entity_id id) -> id = history.id | _ -> false)
       extra);
  check "delete-blocks-does-not-rewrite-title-for-deleted-history no title rewrite"
    (not
       (List.exists
          (function
            | Add (Entity_id id, "block/title", String "History entry") ->
                id = history.id
            | _ -> false)
          extra))

(* ---------- initial_data_test.cljs ---------- *)

(* (deftest latest-journals-stays-within-journal-day-index ...) *)
let test_latest_journals_stays_within_journal_day_index () =
  let open Db_test_util in
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_journal = Some 20240101 }; blocks = [] };
          { page = { default_page with pg_journal = Some 29990101 }; blocks = [] };
          { page = { default_page with pg_title = Some "Alias target" }; blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let future_e =
    Option.get
      (Seq.uncons
         (Datascript.datoms db Avet ~a:"block/journal-day"
            ~v:(Int64 29990101L) ()))
    |> fst
  in
  let alias = Option.get (find_page_by_title db "Alias target") in
  ignore
    (Datascript.transact_conn conn
       [ Add (Entity_id future_e.e, "block/alias", Ref alias.id) ]);
  check "latest-journals-stays-within-journal-day-index days"
    (List.map
       (fun (e : entity) -> Ldb.value e "block/journal-day")
       (List.of_seq (Ldb.get_latest_journals db))
     = [ Some (Int64 20240101L) ]);
  let j_e =
    Option.get
      (Seq.uncons
         (Datascript.datoms (db_of conn) Avet ~a:"block/journal-day"
            ~v:(Int64 20240101L) ()))
    |> fst
  in
  ignore (Db_tx.transact conn [ retract_entity j_e.e ]);
  check "latest-journals-stays-within-journal-day-index empty"
    (List.of_seq (Ldb.get_latest_journals (db_of conn)) = [])

(* ---------- initial_data_refs_test.cljs ---------- *)

(* (deftest get-block-refs-count-matches-get-block-refs-for-class-page-test ...) *)
let test_get_block_refs_count_matches_class_page () =
  let open Db_test_util in
  let conn =
    create_conn_with_blocks
      ~classes: [ "Topic", { default_class with c_title = Some "Topic" } ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Ref A" }; blocks = [] };
          { page = { default_page with pg_title = Some "Ref B" }; blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let topic_id = (ident_ent_exn db "user.class/Topic").id in
  let ref_a = Option.get (find_page_by_title db "Ref A") in
  let ref_b = Option.get (find_page_by_title db "Ref B") in
  ignore
    (Datascript.transact_conn conn
       [ Add (Entity_id ref_a.id, "block/refs", Ref topic_id)
       ; Add (Entity_id ref_b.id, "block/refs", Ref topic_id)
       ; Add (Entity_id ref_b.id, "logseq.property/hide?", Bool true) ]);
  let db = db_of conn in
  let refs = get_block_refs db topic_id in
  let count = Db_view.get_block_refs_count db topic_id in
  check "get-block-refs-count-matches-get-block-refs-for-class-page-test count"
    (count = 1);
  check "get-block-refs-count-matches-get-block-refs-for-class-page-test refs-len"
    (List.length refs = count)

(* (deftest get-block-refs-count-page-without-db-ident-test ...) *)
let test_get_block_refs_count_page_without_db_ident () =
  let open Db_test_util in
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Foo" }; blocks = [] };
          { page = { default_page with pg_title = Some "Bar" }; blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let foo = Option.get (find_page_by_title db "Foo") in
  let bar = Option.get (find_page_by_title db "Bar") in
  ignore
    (Datascript.transact_conn conn
       [ Add (Entity_id bar.id, "block/refs", Ref foo.id) ]);
  check "get-block-refs-count-page-without-db-ident-test"
    (Db_view.get_block_refs_count (db_of conn) foo.id = 1)

(* ---------- deps/common tests on ported modules ---------- *)

(* (deftest page-ref? ...) — deps/common page_ref_test.cljs *)
let test_page_ref () =
  List.iter
    (fun (x, y) -> check (Printf.sprintf "page-ref? %S" x) (Page_ref.is_page_ref x = y))
    [ "[[page]]", true
    ; "[[another page]]", true
    ; "[[some [[nested]] page]]", true
    ; "[single bracket]", false
    ; "no brackets", false ]

(* (deftest url? ...) — deps/common util_test.cljs are-case; Ns_util.url is
   the documented port of common-util/url? *)
let test_url () =
  List.iter
    (fun (x, y) -> check (Printf.sprintf "url? %S" x) (Ns_util.url x = y))
    [ "http://logseq.com", true
    ; "prop:: value", false
    ; "a:", false ]

(* graph_dir_test.cljs — repo->encoded-graph-dir-name + the
   graph-name-whitespace-boundaries deftest (the other 4 deftests are
   ported in test_common_native.ml's graph_dir_test group) *)
let test_graph_dir () =
  check "repo->encoded-graph-dir-name-encodes-special-characters foo/bar"
    (Graph_dir.repo_to_encoded_graph_dir_name "logseq_db_foo/bar"
     = Some "foo~2Fbar");
  check "repo->encoded-graph-dir-name-encodes-special-characters space"
    (Graph_dir.repo_to_encoded_graph_dir_name "logseq_db_space name"
     = Some "space name");
  List.iter
    (fun repo ->
      check
        (Printf.sprintf "whitespace key %S" repo)
        (Graph_dir.repo_to_graph_dir_key repo = Some "demo");
      check
        (Printf.sprintf "whitespace encoded %S" repo)
        (Graph_dir.repo_to_encoded_graph_dir_name repo = Some "demo");
      check
        (Printf.sprintf "same-repo? %S" repo)
        (Graph_dir.same_repo "demo" repo))
    [ "  demo  "; "  logseq_db_demo  "; "logseq_db_ demo " ];
  check "graph-name-whitespace-boundaries encode"
    (Graph_dir.encode_graph_dir_name " \tspace name/child\n "
     = "space name~2Fchild");
  check "repo->graph-dir-key blank"
    (Graph_dir.repo_to_graph_dir_key "   " = None);
  List.iter
    (fun dir ->
      check
        (Printf.sprintf "decode rejects %S" dir)
        (Graph_dir.decode_graph_dir_name dir = None))
    [ " alpha "; "   "; "~20alpha"; "alpha~20"; "%20alpha"; "alpha%20" ];
  check "decode-legacy normalizes diagnostic name"
    (Graph_dir.decode_legacy_graph_dir_name "%20old++name%20"
     = Some "old/name")

(* logseq.common.authorization — client-id-allowed? env bindings *)
let test_client_id_allowed () =
  let env =
    { Authorization.cognito_client_id = Some "primary"
    ; cognito_client_ids = Some " extra , ,other "
    ; cognito_issuer = Some "iss"
    ; cognito_jwks_url = Some "https://jwks" }
  in
  List.iter
    (fun (cid, expected) ->
      check (Printf.sprintf "client-id %s" cid)
        (Authorization.client_id_allowed env (Some cid) = expected))
    [ "primary", true; "extra", true; "other", true; "missing", false ];
  check "blank client id"
    (Authorization.client_id_allowed env (Some " ") = false);
  check "no client id" (Authorization.client_id_allowed env None = false);
  check "primary unset and additional only"
    (Authorization.client_id_allowed
       { env with cognito_client_id = None } (Some "primary")
     = false)

(* JWT exp claims are seconds; the db-worker compares them against now in
   epoch-ms. An off-by-1000x bug (comparing seconds to ms raw) marks every
   live token expired — these pin the seconds->ms normalization at parse. *)
let test_jwt_exp_seconds_vs_ms () =
  let old = !Sync_util.parse_jwt_fn in
  Fun.protect
    ~finally:(fun () -> Sync_util.parse_jwt_fn := old)
    (fun () ->
      let now_s = Sync_state.time_ms () /. 1000. in
      let stub exp_s =
        Sync_util.parse_jwt_fn :=
          fun _ -> Some (Wire.kw_map [ "exp", Wire.Float exp_s ])
      in
      stub (now_s +. 7200.);
      check "live token not expired"
        (not (Endpoint_user.expired (Some "tok")));
      check "live token not almost-expired"
        (not (Endpoint_user.almost_expired_or_expired (Some "tok")));
      check "jwt_exp_ms is exp seconds * 1000"
        (Option.map Time.epoch_ms_to_float
           (Endpoint_user.jwt_exp_ms "tok")
         = Some ((now_s +. 7200.) *. 1000.));
      stub (now_s +. 1800.);
      check "soon-expiring token not expired"
        (not (Endpoint_user.expired (Some "tok")));
      check "soon-expiring token almost-expired"
        (Endpoint_user.almost_expired_or_expired (Some "tok"));
      stub (now_s -. 60.);
      check "past-exp token expired" (Endpoint_user.expired (Some "tok"));
      Sync_util.parse_jwt_fn := (fun _ -> Some (Wire.kw_map []));
      check "no-exp token expired" (Endpoint_user.expired (Some "tok")))

let test_token_cache_exp_seconds () =
  let payload exp_s = Wire.kw_map [ "exp", Wire.Float exp_s ] in
  let now_s = Sync_state.time_ms () /. 1000. in
  Authorization.cache_token "live" (payload (now_s +. 3600.));
  Authorization.cache_token "dead" (payload (now_s -. 10.));
  check "cached live token returned"
    (Authorization.cached_token "live" (Time.now ()) <> None);
  check "cached expired token rejected"
    (Authorization.cached_token "dead" (Time.now ()) = None)

(* logseq.graph-parser.schema.mldoc — validator spot checks over the
   JSON-parsed AST domain *)
let test_mldoc_schema () =
  let ok schema v = Mldoc_schema.validate schema (Json.parse v) in
  check "pos-schema accepts"
    (ok Mldoc_schema.pos_schema {|{"start_pos":1,"end_pos":2}|});
  check "pos-schema requires keys"
    (not (ok Mldoc_schema.pos_schema {|{"start_pos":1}|}));
  check "inline Plain"
    (ok Mldoc_schema.inline_ast_schema {|["Plain","hello"]|});
  check "inline Link"
    (ok Mldoc_schema.inline_ast_schema
       {|["Link",{"url":["Page_ref","page"],"label":[],"full_text":"x","metadata":""}]|});
  check "inline rejects unknown tag"
    (not (ok Mldoc_schema.inline_ast_schema {|["Nope",1]|}));
  check "block Paragraph"
    (ok Mldoc_schema.block_ast_schema {|["Paragraph",[["Plain","hi"]]]|});
  check "nested-link is self-recursive"
    (ok Mldoc_schema.nested_link_schema
       {|{"content":"a","children":[["Label","x"],["Nested_link",{"content":"b","children":[]}]]}|});
  check "nested-link rejects bad children"
    (not
       (ok Mldoc_schema.nested_link_schema
          {|{"content":"a","children":[["Nope","x"]]}|}))

(* (deftest get-block-and-children-has-children-flag ...)
   cljs common-initial-data/get-block-and-children returns {:block :children}
   maps with :block.temp/has-children? — the same wire shape as
   Endpoint_block.get_block_and_children with children? false. *)
let test_get_block_and_children_has_children_flag () =
  let open Db_test_util in
  let gb_children_false =
    { Endpoint_block.gb_all = false
    ; Endpoint_block.gb_children = false
    ; Endpoint_block.gb_properties = []
    ; Endpoint_block.gb_render_data = None
    ; Endpoint_block.gb_root_render_data = false
    ; Endpoint_block.gb_include_collapsed_children = false
    ; Endpoint_block.gb_include_property_block = false }
  in
  let has_children_flag result =
    match result with
    | Wire.Map m -> (
        match Plain_value.map_get "block" m with
        | Some b ->
            Plain_value.map_get "block.temp/has-children?" (Wire.as_map b)
        | None -> None)
    | _ -> None
  in
  (* "Top-level block with children has :block.temp/has-children? true" *)
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "test-page" };
            blocks =
              [ { default_block with
                  b_title = Some "parent"
                ; b_children =
                    [ { default_block with b_title = Some "child1" };
                      { default_block with b_title = Some "child2" } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let parent = Option.get (find_block_by_content db "parent") in
  let parent_uuid =
    match Ldb.value parent "block/uuid" with
    | Some (Uuid u) -> u
    | _ -> ""
  in
  check "get-block-and-children-has-children-flag true"
    (has_children_flag
       (Endpoint_block.get_block_and_children db (Uuid parent_uuid)
          gb_children_false)
     = Some (Wire.Bool true));
  (* "Top-level block without children has :block.temp/has-children? false" *)
  let conn2 =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "test-page2" };
            blocks =
              [ { default_block with b_title = Some "leaf-block" } ] } ]
      ()
  in
  let db2 = db_of conn2 in
  let leaf = Option.get (find_block_by_content db2 "leaf-block") in
  let leaf_uuid =
    match Ldb.value leaf "block/uuid" with
    | Some (Uuid u) -> u
    | _ -> ""
  in
  check "get-block-and-children-has-children-flag false"
    (has_children_flag
       (Endpoint_block.get_block_and_children db2 (Uuid leaf_uuid)
          gb_children_false)
     = Some (Wire.Bool false))

(* ---------- initial_data_test.cljs (sqlite storage) ---------- *)

(* cljs use-fixtures :each — fresh tmp/graphs dir per test. *)
let graphs_dir_seq = ref 0

let fresh_graphs_dir () =
  incr graphs_dir_seq;
  let dir =
    Filename.concat (Filename.get_temp_dir_name ())
      (Printf.sprintf "logseq-initial-data-%d-%d" (Unix.getpid ())
         !graphs_dir_seq)
  in
  Unix.mkdir dir 0o755;
  let graphs_dir = Filename.concat dir "graphs" in
  Unix.mkdir graphs_dir 0o755;
  Unix.mkdir (Filename.concat graphs_dir "test-db") 0o755;
  graphs_dir

(* cljs (d/transact! conn* (sqlite-create-graph/build-db-initial-data "{}")) *)
let seed_db_initial_data conn =
  ignore
    (Datascript.transact_conn conn
       (Sqlite_create_graph.initial_tx_data ~db:(db_of conn)
          ~config_content:"{}" ()))

(* cljs (d/conn-from-datoms initial-data schema) *)
let restore_conn_of (s : Common_initial_data.initial_data) : conn =
  Datascript.conn_from_datoms ~schema:s.initial_schema s.initial_datoms

(* (deftest get-initial-data ...) — "Fetches a defined block" *)
let test_get_initial_data () =
  let graphs_dir = fresh_graphs_dir () in
  let conn' = Sqlite_cli.open_db ~graphs_dir "test-db" in
  seed_db_initial_data conn';
  ignore
    (Datascript.transact_conn conn'
       [ Entity
           { db_id = None
           ; attrs =
               [ "file/path", One_value (String "logseq/config.edn")
               ; "file/content", One_value (String "{:foo :bar}") ] } ]);
  (* Simulate getting data from sqlite and restoring it for frontend *)
  let conn = restore_conn_of (Common_initial_data.get_initial_data (db_of conn')) in
  let db = db_of conn in
  (* cljs (d/q '[:find (pull ?b [:file/path :file/content])
                :where [?b :file/content] [?b :file/path "logseq/config.edn"]])
     returns the file entity — assert path+content survive the restore. *)
  check "get-initial-data restores file block"
    (List.exists
       (fun (d : datom) ->
         match
           Seq.uncons (Datascript.datoms db Eavt ~e:d.e ~a:"file/content" ())
         with
         | Some (c, _) -> c.v = String "{:foo :bar}"
         | None -> false)
       (List.of_seq
          (Datascript.datoms db Aevt ~a:"file/path"
             ~v:(String "logseq/config.edn") ())))

(* (deftest get-initial-data-includes-property-description-datoms ...) *)
let test_get_initial_data_includes_property_description_datoms () =
  let graphs_dir = fresh_graphs_dir () in
  let conn' = Sqlite_cli.open_db ~graphs_dir "test-db" in
  seed_db_initial_data conn';
  let conn = restore_conn_of (Common_initial_data.get_initial_data (db_of conn')) in
  let db = db_of conn in
  let description =
    match Datascript.entity db (Ident "logseq.property/deadline") with
    | Some deadline -> Ldb.ref_ent deadline "logseq.property/description"
    | None -> None
  in
  let content = Option.bind description Ldb.property_value_content in
  check "get-initial-data-includes-property-description-datoms"
    (match content with
     | Some s -> Db_test_util.includes s "finish something"
     | None -> false)

(* (deftest restore-initial-data ...) *)
let test_restore_initial_data () =
  let open Db_test_util in
  let graphs_dir = fresh_graphs_dir () in
  let conn' = Sqlite_cli.open_db ~graphs_dir "test-db" in
  seed_db_initial_data conn';
  let init_tx, _block_props_tx =
    Sqlite_build.build_blocks_tx
      (Edn_util.read_string
         "{:pages-and-blocks [{:page {:block/title \"page1\"}
                              :blocks [{:block/title \"b1\"}]}]}")
  in
  (* cljs (db-test/transact! conn* init-tx) *)
  ignore
    (Db_tx.transact conn'
       (Sqlite_build.tx_ops_of_values (db_of conn') init_tx));
  (* Simulate getting data from sqlite and restoring it for frontend *)
  let conn = restore_conn_of (Common_initial_data.get_initial_data (db_of conn')) in
  check "restore-initial-data restores recently updated page"
    (find_page_by_title (db_of conn) "page1" <> None)

let cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "delete-blocks-removes-reactions" `Quick test_delete_blocks_removes_reactions;
    Alcotest.test_case "delete-blocks-expands-property-value-children" `Quick test_delete_blocks_expands_property_value_children;
    Alcotest.test_case "delete-blocks-removes-history-with-ref-value" `Quick test_delete_blocks_removes_history_with_ref_value;
    Alcotest.test_case "property-history-block-updates-are-kept" `Quick test_property_history_block_updates_are_kept;
    Alcotest.test_case "remote-delete-blocks-removes-history-when-owner-ref-retracted" `Quick test_remote_delete_blocks_removes_history_when_owner_ref_retracted;
    Alcotest.test_case "delete-blocks-removes-new-history-for-deleted-block" `Quick test_delete_blocks_removes_new_history_for_deleted_block;
    Alcotest.test_case "remote-delete-blocks-removes-new-normalized-history-when-owner-ref-retracted" `Quick test_remote_delete_blocks_removes_new_normalized_history;
    Alcotest.test_case "delete-page-removes-history-with-ref-value" `Quick test_delete_page_removes_history_with_ref_value;
    Alcotest.test_case "delete-property-removes-history-for-property" `Quick test_delete_property_removes_history_for_property;
    Alcotest.test_case "delete-blocks-removes-history-for-corresponding-views" `Quick test_delete_blocks_removes_history_for_corresponding_views;
    Alcotest.test_case "delete-blocks-does-not-rewrite-title-for-deleted-view" `Quick test_delete_blocks_does_not_rewrite_title_for_deleted_view;
    Alcotest.test_case "delete-blocks-does-not-rewrite-title-for-deleted-history" `Quick test_delete_blocks_does_not_rewrite_title_for_deleted_history;
    Alcotest.test_case "latest-journals-stays-within-journal-day-index" `Quick test_latest_journals_stays_within_journal_day_index;
    Alcotest.test_case "get-block-refs-count-matches-get-block-refs-for-class-page-test" `Quick test_get_block_refs_count_matches_class_page;
    Alcotest.test_case "get-block-refs-count-page-without-db-ident-test" `Quick test_get_block_refs_count_page_without_db_ident;
    Alcotest.test_case "page-ref?" `Quick test_page_ref;
    Alcotest.test_case "url?" `Quick test_url;
    Alcotest.test_case "graph-dir" `Quick test_graph_dir;
    Alcotest.test_case "client-id-allowed?" `Quick test_client_id_allowed;
    Alcotest.test_case "jwt-exp-seconds-vs-ms" `Quick test_jwt_exp_seconds_vs_ms;
    Alcotest.test_case "token-cache-exp-seconds" `Quick test_token_cache_exp_seconds;
    Alcotest.test_case "mldoc-schema-validate" `Quick test_mldoc_schema;
    Alcotest.test_case "get-block-and-children-has-children-flag" `Quick test_get_block_and_children_has_children_flag;
    Alcotest.test_case "get-initial-data" `Quick test_get_initial_data;
    Alcotest.test_case "get-initial-data-includes-property-description-datoms" `Quick test_get_initial_data_includes_property_description_datoms;
    Alcotest.test_case "restore-initial-data" `Quick test_restore_initial_data ]
