(* 1:1 OCaml translation of the cljs tests that exercise the ported
   outliner modules:

   - deps/outliner/test/logseq/outliner/validate_test.cljs — the four
     validate-unique-by-name-and-tags deftests plus
     new-graph-should-be-valid (the remaining validate deftests are
     covered in test_db_native.ml's endpoint group).
   - deps/outliner/test/logseq/outliner/recycle_test.cljs — all 14
     deftests (the three apply-ops cases run via Outliner_op.apply_ops).
   - deps/outliner/test/logseq/outliner/op_test.cljs — all 8 deftests.
   - deps/outliner/test/logseq/outliner/pipeline_test.cljs — all 4
     deftests (including the db-rebuild-block-refs-fn bulk-pass
     variant).
   - deps/outliner/test/logseq/outliner/tree_test.cljs —
     blocks->vec-tree-data-preserves-caller-field-policy (both the
     default and :keep-block-tx-id? variants).
   - deps/outliner/test/logseq/outliner/property_test.cljs — the 9
     deftests not covered by test_db_native.ml's endpoint group.
   - deps/outliner/test/logseq/outliner/validate_test.cljs —
     new-graph-should-be-valid.

   Divergence note: cljs validation throws ex-info whose message is
   "Duplicate property|class|page"; the OCaml port raises
   Outliner_validate.Notification with message "Another property/tag/page
   named ...". Assertions are on the exception type and :i18n-key, which
   match cljs (:property.validation/duplicate etc.). *)

open Datascript
open Test_shared
open Db_test_util

(* ---------- helpers ---------- *)

let now () = Clock.now_ms ()

let entity_by_uuid conn uuid =
  Datascript.entity (db_of conn) (Lookup_ref ("block/uuid", Uuid uuid))

(* cljs test-helper/entity-by-uuid *)
let entity_by_uuid_exn conn uuid = Option.get (entity_by_uuid conn uuid)

(* cljs throws ex-info; OCaml raises Notification <wire payload>.
   Assert the exception type and :i18n-key (which match cljs). *)
let expect_notification name ~i18n_key (f : unit -> unit) : unit =
  match f () with
  | () -> check name false
  | exception Outliner_validate.Notification w ->
      (* cljs ex-data shape: {:type :notification :payload {:i18n-key ...}} *)
      let key =
        match Wire.get "payload" w with
        | Some p -> Wire.get "i18n-key" p
        | None -> None
      in
      check name (key = Some (Wire.Keyword i18n_key))
  | exception _ -> check name false

let ent_title (e : entity) : string option = Ldb.string_value e "block/title"

let find_page conn title = find_page_by_title (db_of conn) title

(* ---------- validate_test.cljs ---------- *)

(* cljs (outliner-validate/validate-unique-by-name-and-tags @conn title
   entity) — the OCaml port takes the entity option and an extra tag to
   conj; the cljs calls pass no extra tag. *)
let validate db new_title (entity : entity option) : unit =
  Outliner_validate.validate_unique_by_name_and_tags db new_title entity None

(* (deftest validate-block-title-unique-for-properties ...) *)
let test_validate_block_title_unique_for_properties () =
  let conn =
    create_conn_with_blocks
      ~properties:
        [ "color", { default_property with p_type = "default" };
          "color2", { default_property with p_type = "default" } ]
      ()
  in
  let db = db_of conn in
  let bg_title =
    Ldb.string_value
      (Option.get (Datascript.entity db (Ident "logseq.property/background-color")))
      "block/title"
  in
  (* "Allow user property to have same name as built-in property" *)
  validate db bg_title (Datascript.entity db (Ident "user.property/color"));
  check "validate-block-title-unique-for-properties built-in allowed" true;
  (* "Disallow duplicate user property" *)
  expect_notification "validate-block-title-unique-for-properties duplicate"
    ~i18n_key:"property.validation/duplicate"
    (fun () ->
      validate db (Some "color")
        (Datascript.entity db (Ident "user.property/color2")))

(* (deftest validate-block-title-unique-for-tags ...) *)
let test_validate_block_title_unique_for_tags () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ "Class1", default_class;
          "Class2",
          { default_class with c_extends = [ "logseq.class/Task" ] } ]
      ()
  in
  let db = db_of conn in
  (* "Disallow duplicate class names, regardless of extends" *)
  expect_notification "validate-block-title-unique-for-tags dup"
    ~i18n_key:"class.validation/duplicate"
    (fun () ->
      validate db (Some "Class1")
        (Datascript.entity db (Ident "user.class/Class2")));
  (* "Disallow duplicate class names even if it's built-in" *)
  expect_notification "validate-block-title-unique-for-tags built-in"
    ~i18n_key:"class.validation/duplicate"
    (fun () ->
      validate db (Some "Card")
        (Datascript.entity db (Ident "user.class/Class1")))

(* (deftest validate-block-title-unique-for-namespaced-pages ...) *)
let test_validate_block_title_unique_for_namespaced_pages () =
  let library_uuid = "d246c71a-3e71-42f0-928f-afe607ee5ce0" in
  let n1_uuid = "3aa1e950-5a9b-4efc-81d4-b6d89a504591" in
  let parent_ref uuid = Vec [ Kw "block/uuid"; Uuid uuid ] in
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page =
              { default_page with
                pg_title = Some "Library"; pg_uuid = Some library_uuid;
                pg_extra = [ "logseq.property/built-in?", Bool true ] };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "n1"; pg_uuid = Some n1_uuid;
                pg_extra = [ "block/parent", parent_ref library_uuid ] };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "n2";
                pg_extra = [ "block/parent", parent_ref n1_uuid ] };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "n3";
                pg_extra = [ "block/parent", parent_ref n1_uuid ] };
            blocks = [] } ]
      ()
  in
  let db = db_of conn in
  (* "Disallow duplicate namespace child" *)
  expect_notification "validate-block-title-unique-for-namespaced dup"
    ~i18n_key:"page.validation/duplicate"
    (fun () -> validate db (Some "n2") (find_page conn "n3"));
  (* "Allow namespace child if unique" *)
  validate db (Some "n4") (find_page conn "n3");
  check "validate-block-title-unique-for-namespaced unique" true

(* (deftest validate-block-title-unique-for-pages ...) *)
let test_validate_block_title_unique_for_pages () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [] };
          { page = { default_page with pg_title = Some "another page" };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "Apple"; pg_tags = [ "Company" ] };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "Another Company"; pg_tags = [ "Company" ] };
            blocks = [] };
          { page =
              { default_page with
                pg_title = Some "Banana"; pg_tags = [ "Fruit" ] };
            blocks = [] } ]
      ()
  in
  let db = db_of conn in
  (* "Disallow duplicate page with tag" *)
  expect_notification "validate-block-title-unique-for-pages tagged dup"
    ~i18n_key:"page.validation/duplicate"
    (fun () -> validate db (Some "Apple") (find_page conn "Another Company"));
  (* "Allow page with same name for different tag" *)
  validate db (Some "Apple") (find_page conn "Banana");
  check "validate-block-title-unique-for-pages other tag" true;
  (* "Disallow duplicate page without tag" *)
  expect_notification "validate-block-title-unique-for-pages untagged dup"
    ~i18n_key:"page.validation/duplicate"
    (fun () -> validate db (Some "page1") (find_page conn "another page"));
  (* "Allow class to have same name as a page" *)
  validate db (Some "Apple") (find_page conn "Fruit");
  check "validate-block-title-unique-for-pages class entity" true

(* ---------- deps/outliner/test/logseq/outliner/recycle_test.cljs ---------- *)

(* cljs (recycle-page db) *)
let recycle_page_of db = Outliner_recycle.recycle_page db

(* cljs (ldb/transact! conn tx {:outliner-op op}) *)
let ldb_transact conn ~outliner_op tx =
  ignore
    (Db_tx.transact ~tx_meta:[ "outliner-op", Keyword outliner_op ] conn tx)

let retract_recycle_page conn =
  match recycle_page_of (db_of conn) with
  | Some page ->
      ignore
        (Datascript.transact_conn conn
           [ RetractEntity (Entity_id page.id) ])
  | None -> ()

let untag_recycle_page conn =
  match recycle_page_of (db_of conn) with
  | Some page ->
      let tag = ident_ent_exn (db_of conn) "logseq.class/Page" in
      ignore
        (Datascript.transact_conn conn
           [ Retract (Entity_id page.id, "block/tags", Some (Ref tag.id)) ])
  | None -> ()

(* cljs assert-page-recycled-under-tagged-recycle *)
let assert_page_recycled_under_tagged_recycle ~name db page_id =
  let page = Option.get (Datascript.entity db (Entity_id page_id)) in
  check (name ^ " recycle exists") (Option.is_some (recycle_page_of db));
  let recycle = Option.get (recycle_page_of db) in
  check (name ^ " recycle is page") (Ldb.is_page recycle);
  check (name ^ " recycle tagged Page")
    (List.exists
       (fun (t : entity) -> t.id = (ident_ent_exn db "logseq.class/Page").id)
       (Ldb.ref_ents recycle "block/tags"));
  check (name ^ " page recycled") (Outliner_recycle.recycled page);
  check (name ^ " page parent is recycle")
    (match Ldb.ref_ent page "block/parent" with
     | Some p -> p.id = recycle.id
     | None -> false)

(* (deftest recycle-page-creates-page-tagged-recycle-when-missing ...) *)
let test_recycle_page_creates_page_tagged_recycle_when_missing () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let page_id = page.id in
  retract_recycle_page conn;
  check "recycle-page-creates-page-tagged-recycle-when-missing missing"
    (recycle_page_of (db_of conn) = None);
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page ());
  assert_page_recycled_under_tagged_recycle
    ~name:"recycle-page-creates-page-tagged-recycle-when-missing"
    (db_of conn) page_id

(* (deftest recycle-page-repairs-untagged-recycle ...) *)
let test_recycle_page_repairs_untagged_recycle () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let page_id = page.id in
  let recycle = Option.get (recycle_page_of (db_of conn)) in
  untag_recycle_page conn;
  check "recycle-page-repairs-untagged-recycle exists"
    (Option.is_some (recycle_page_of (db_of conn)));
  check "recycle-page-repairs-untagged-recycle untagged"
    (not
       (Ldb.is_page
          (Option.get
             (Datascript.entity (db_of conn) (Entity_id recycle.id)))));
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page ());
  assert_page_recycled_under_tagged_recycle
    ~name:"recycle-page-repairs-untagged-recycle" (db_of conn) page_id;
  check "recycle-page-repairs-untagged-recycle same entity"
    ((Option.get (recycle_page_of (db_of conn))).id = recycle.id)

(* (deftest restore-recycled-page-removes-recycle-parent ...) *)
let test_restore_recycled_page_removes_recycle_parent () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "b1" } ] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  ignore (Outliner_recycle.recycle_page_tx_data (db_of conn) page ());
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page ());
  ignore (Outliner_recycle.restore conn (uuid_of page));
  let page' = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  check "restore-recycled-page-removes-recycle-parent parent"
    (Ldb.ref_ent page' "block/parent" = None);
  check "restore-recycled-page-removes-recycle-parent deleted-at"
    (Ldb.value page' "logseq.property/deleted-at" = None);
  check "restore-recycled-page-removes-recycle-parent original-parent"
    (Ldb.value page' "logseq.property.recycle/original-parent" = None)

(* (deftest permanently-delete-recycled-page-removes-page-and-descendants ...) *)
let test_permanently_delete_recycled_page_removes_page_and_descendants () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "b1" } ] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let block = Option.get (find_block_by_content (db_of conn) "b1") in
  let page_uuid = uuid_of page in
  let block_uuid = uuid_of block in
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page ());
  check "permanently-delete-recycled-page-removes-page-and-descendants recycled"
    (Outliner_recycle.recycled (entity_by_uuid_exn conn page_uuid));
  check "permanently-delete-recycled-page-removes-page-and-descendants delete"
    (Outliner_recycle.permanently_delete conn page_uuid);
  check "permanently-delete-recycled-page-removes-page-and-descendants page"
    (entity_by_uuid conn page_uuid = None);
  check "permanently-delete-recycled-page-removes-page-and-descendants block"
    (entity_by_uuid conn block_uuid = None)

(* (deftest permanently-delete-recycled-page-removes-blocks-parented-by-page ...) *)
let test_permanently_delete_recycled_page_removes_blocks_parented_by_page () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [] };
          { page = { default_page with pg_title = Some "page2" };
            blocks = [] } ]
      ()
  in
  let page1 = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let page2 = Option.get (Ldb.get_page (db_of conn) (String "page2")) in
  let block_uuid = gen_uuid () in
  let n = int_of_float (now ()) in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid block_uuid)
               ; "block/title", One_value (String "parented by page1")
               ; "block/created-at", One_value (Int n)
               ; "block/updated-at", One_value (Int n)
               ; "block/parent", One_value (Ref page1.id)
               ; "block/page", One_value (Ref page2.id)
               ; "block/order", One_value (String "a0") ] } ]);
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page1 ());
  check "permanently-delete-recycled-page-removes-blocks-parented-by-page recycled"
    (Outliner_recycle.recycled
       (Option.get (Datascript.entity (db_of conn) (Entity_id page1.id))));
  check "permanently-delete-recycled-page-removes-blocks-parented-by-page delete"
    (Outliner_recycle.permanently_delete conn (uuid_of page1));
  check "permanently-delete-recycled-page-removes-blocks-parented-by-page block"
    (entity_by_uuid conn block_uuid = None)

(* (deftest permanently-delete-recycled-converted-page-removes-property-value-blocks ...) *)
let test_permanently_delete_recycled_converted_page_removes_property_value_blocks
    () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "outer" };
            blocks =
              [ { default_block with
                    b_title = Some "target";
                    b_properties = [ "default", Str "value" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let target = Option.get (find_block_by_content db "target") in
  let target_id = target.id in
  let target_uuid = uuid_of target in
  let value_id =
    List.find_map
      (function Result_value (Int i) -> Some i | _ -> None)
      (List.concat
         (Datascript.q_string
            ~inputs:[ Arg_scalar (Result_value (Int target_id)) ] db
            "[:find [?value ...] :in $ ?target :where \
             [?value :block/parent ?target] \
             [?value :logseq.property/created-from-property]]"))
  in
  let page_class = ident_ent_exn db "logseq.class/Page" in
  ignore
    (Datascript.transact_conn conn
       [ Retract (Entity_id target_id, "block/page", None)
       ; Add (Entity_id target_id, "block/name", String "target")
       ; Add (Entity_id target_id, "block/tags", Ref page_class.id) ]);
  let page =
    Option.get (Datascript.entity (db_of conn) (Entity_id target_id))
  in
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page ());
  check
    "permanently-delete-recycled-converted-page-removes-property-value-blocks delete"
    (Outliner_recycle.permanently_delete conn target_uuid);
  check
    "permanently-delete-recycled-converted-page-removes-property-value-blocks target"
    (Datascript.entity (db_of conn) (Entity_id target_id) = None);
  check
    "permanently-delete-recycled-converted-page-removes-property-value-blocks value"
    (match value_id with
     | Some vid -> Datascript.entity (db_of conn) (Entity_id vid) = None
     | None -> true)

(* (deftest gc-recycled-converted-page-removes-property-value-blocks ...) *)
let test_gc_recycled_converted_page_removes_property_value_blocks () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "outer" };
            blocks =
              [ { default_block with
                    b_title = Some "target";
                    b_properties = [ "default", Str "value" ] };
                { default_block with b_title = Some "unrelated" } ] } ]
      ()
  in
  let db = db_of conn in
  let outer = Option.get (Ldb.get_page db (String "outer")) in
  let target = Option.get (find_block_by_content db "target") in
  let unrelated = Option.get (find_block_by_content db "unrelated") in
  let target_id = target.id in
  let value_id =
    List.find_map
      (function Result_value (Int i) -> Some i | _ -> None)
      (List.concat
         (Datascript.q_string
            ~inputs:[ Arg_scalar (Result_value (Int target_id)) ] db
            "[:find [?value ...] :in $ ?target :where \
             [?value :block/parent ?target] \
             [?value :logseq.property/created-from-property]]"))
  in
  let page_class = ident_ent_exn db "logseq.class/Page" in
  ignore
    (Datascript.transact_conn conn
       [ Retract (Entity_id target_id, "block/page", None)
       ; Add (Entity_id target_id, "block/name", String "target")
       ; Add (Entity_id target_id, "block/tags", Ref page_class.id) ]);
  let page =
    Option.get (Datascript.entity (db_of conn) (Entity_id target_id))
  in
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page ?now_ms:(Some 0.) ());
  check "gc-recycled-converted-page-removes-property-value-blocks gc"
    (Outliner_recycle.gc conn ?now_ms:(Some (31. *. 24. *. 3600. *. 1000.)) ());
  check "gc-recycled-converted-page-removes-property-value-blocks target"
    (Datascript.entity (db_of conn) (Entity_id target_id) = None);
  check "gc-recycled-converted-page-removes-property-value-blocks value"
    (match value_id with
     | Some vid -> Datascript.entity (db_of conn) (Entity_id vid) = None
     | None -> true);
  check "gc-recycled-converted-page-removes-property-value-blocks outer"
    (Option.is_some (Datascript.entity (db_of conn) (Entity_id outer.id)));
  check "gc-recycled-converted-page-removes-property-value-blocks unrelated"
    (Option.is_some (Datascript.entity (db_of conn) (Entity_id unrelated.id)))

(* deleted-at carries the full epoch-ms — int_of_float once truncated it
   to int32 (Dec 1969) *)
let test_recycle_stores_full_deleted_at_ms () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let page_uuid = uuid_of page in
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page
       ~now_ms:1783612800123. ());
  let page' = entity_by_uuid_exn conn page_uuid in
  check "deleted-at stores full epoch-ms"
    (Ldb.int64_value page' "logseq.property/deleted-at"
     = Some 1783612800123L)

(* cljs stamps block/created-at+updated-at with (common-util/time-ms) — a
   plain number, never a js/Date — on every save *)
let test_insert_blocks_stores_numeric_timestamps () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "target" } ] } ]
      ()
  in
  let new_uuid = gen_uuid () in
  ignore
    (Outliner_core.insert_blocks_conn conn
       [ [ "block/uuid", Uuid new_uuid
         ; "block/title", String "fresh" ] ]
       (Block_map.of_entity
          (Option.get (find_block_by_content (db_of conn) "target")))
       { Outliner_core.default_insert_opts with keep_uuid = true } []);
  let e = entity_by_uuid_exn conn new_uuid in
  let is_numeric = function
    | Some (Datascript.Int _) | Some (Datascript.Float _) -> true
    | _ -> false
  in
  check "block/created-at stored as a plain number"
    (is_numeric (Ldb.value e "block/created-at"));
  check "block/updated-at stored as a plain number"
    (is_numeric (Ldb.value e "block/updated-at"))

(* (deftest gc-keeps-unexpired-recycled-page ...) *)
let test_gc_keeps_unexpired_recycled_page () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let page_id = page.id in
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page ?now_ms:(Some 0.) ());
  check "gc-keeps-unexpired-recycled-page no-op"
    (not
       (Outliner_recycle.gc conn ?now_ms:(Some (29. *. 24. *. 3600. *. 1000.)) ()));
  check "gc-keeps-unexpired-recycled-page kept"
    (Option.is_some (Datascript.entity (db_of conn) (Entity_id page_id)))

(* (deftest permanently-delete-recycled-block-removes-subtree-only ...) *)
let test_permanently_delete_recycled_block_removes_subtree_only () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with
                    b_title = Some "parent";
                    b_children =
                      [ { default_block with b_title = Some "child" } ] } ] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let parent = Option.get (find_block_by_content (db_of conn) "parent") in
  let child = Option.get (find_block_by_content (db_of conn) "child") in
  let parent_uuid = uuid_of parent in
  let child_uuid = uuid_of child in
  ldb_transact conn ~outliner_op:"delete-blocks"
    (Outliner_recycle.recycle_blocks_tx_data (db_of conn) [ parent ] ());
  check "permanently-delete-recycled-block-removes-subtree-only recycled"
    (Outliner_recycle.recycled (entity_by_uuid_exn conn parent_uuid));
  check "permanently-delete-recycled-block-removes-subtree-only delete"
    (Outliner_recycle.permanently_delete conn parent_uuid);
  check "permanently-delete-recycled-block-removes-subtree-only page kept"
    (Option.is_some (entity_by_uuid conn (uuid_of page)));
  check "permanently-delete-recycled-block-removes-subtree-only parent"
    (entity_by_uuid conn parent_uuid = None);
  check "permanently-delete-recycled-block-removes-subtree-only child"
    (entity_by_uuid conn child_uuid = None)

(* (deftest permanently-delete-recycled-block-removes-corresponding-view-history ...) *)
let test_permanently_delete_recycled_block_removes_corresponding_view_history
    () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "target" } ] } ]
      ()
  in
  let db = db_of conn in
  let target = Option.get (find_block_by_content db "target") in
  let target_uuid = uuid_of target in
  let view_uuid = gen_uuid () in
  let target_history_uuid = gen_uuid () in
  let view_history_uuid = gen_uuid () in
  let status_id = (ident_ent_exn db "logseq.property/status").id in
  let n = int_of_float (now ()) in
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid view_uuid)
               ; "block/title", One_value (String "target view")
               ; "block/created-at", One_value (Int n)
               ; "block/updated-at", One_value (Int n)
               ; "logseq.property/view-for", One_value (Ref target.id)
               ; "logseq.property.view/type",
                 One_value (Keyword "logseq.property.view/type.table")
               ; "logseq.property.view/feature-type",
                 One_value (Keyword "linked-references") ] }
       ; Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid target_history_uuid)
               ; "block/created-at", One_value (Int n)
               ; "block/updated-at", One_value (Int n)
               ; "logseq.property.history/block", One_value (Ref target.id)
               ; "logseq.property.history/property", One_value (Ref status_id)
               ; "logseq.property.history/scalar-value",
                 One_value (String "Todo") ] }
       ; Entity
           { db_id = None
           ; attrs =
               [ "block/uuid", One_value (Uuid view_history_uuid)
               ; "block/created-at", One_value (Int n)
               ; "block/updated-at", One_value (Int n)
               ; "logseq.property.history/block",
                 One_value
                   (Ref_to (Lookup_ref ("block/uuid", Uuid view_uuid)))
               ; "logseq.property.history/property", One_value (Ref status_id)
               ; "logseq.property.history/scalar-value",
                 One_value (String "List") ] } ]);
  ldb_transact conn ~outliner_op:"delete-blocks"
    (Outliner_recycle.recycle_blocks_tx_data (db_of conn) [ target ] ());
  check "permanently-delete-recycled-block-removes-corresponding-view-history delete"
    (Outliner_recycle.permanently_delete conn target_uuid);
  check "permanently-delete-recycled-block-removes-corresponding-view-history target"
    (entity_by_uuid conn target_uuid = None);
  check "permanently-delete-recycled-block-removes-corresponding-view-history view"
    (entity_by_uuid conn view_uuid = None);
  check "permanently-delete-recycled-block-removes-corresponding-view-history target-history"
    (entity_by_uuid conn target_history_uuid = None);
  check "permanently-delete-recycled-block-removes-corresponding-view-history view-history"
    (entity_by_uuid conn view_history_uuid = None)

(* ---------- recycle_test.cljs apply-ops-* deftests ----------

   outliner.op is ported (Outliner_op.apply_ops), so the three
   apply-ops-driven recycle deftests run end-to-end like cljs. *)

(* cljs (outliner-op/apply-ops! conn ops {}) — each op entry is
   [op-name args-vector]; the OCaml port takes a Wire list of
   [Keyword op; List|Array args]. *)
let apply_ops conn ops =
  ignore (Outliner_op.apply_ops conn (Wire.List ops) (Wire.Map []))

(* (deftest apply-ops-restore-recycled-page-removes-recycle-parent ...) *)
let test_apply_ops_restore_recycled_page_removes_recycle_parent () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "b1" } ] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let page_uuid = uuid_of page in
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page ());
  check "apply-ops-restore-recycled-page recycled"
    (Outliner_recycle.recycled (entity_by_uuid_exn conn page_uuid));
  apply_ops conn
    [ Wire.List
        [ Wire.Keyword "restore-recycled"; Wire.List [ Wire.Uuid page_uuid ] ] ];
  let page' = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  check "apply-ops-restore-recycled-page parent"
    (Ldb.ref_ent page' "block/parent" = None);
  check "apply-ops-restore-recycled-page deleted-at"
    (Ldb.value page' "logseq.property/deleted-at" = None);
  check "apply-ops-restore-recycled-page original-parent"
    (Ldb.ref_ent page' "logseq.property.recycle/original-parent" = None)

(* (deftest apply-ops-permanently-delete-recycled-page-removes-page-and-descendants ...) *)
let test_apply_ops_permanently_delete_recycled_page () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "b1" } ] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let block = Option.get (find_block_by_content (db_of conn) "b1") in
  let page_uuid = uuid_of page and block_uuid = uuid_of block in
  ldb_transact conn ~outliner_op:"delete-page"
    (Outliner_recycle.recycle_page_tx_data (db_of conn) page ());
  check "apply-ops-permanently-delete-page recycled"
    (Outliner_recycle.recycled (entity_by_uuid_exn conn page_uuid));
  apply_ops conn
    [ Wire.List
        [ Wire.Keyword "recycle-delete-permanently"
        ; Wire.List [ Wire.Uuid page_uuid ] ] ];
  check "apply-ops-permanently-delete-page page"
    (entity_by_uuid conn page_uuid = None);
  check "apply-ops-permanently-delete-page block"
    (entity_by_uuid conn block_uuid = None)

(* (deftest apply-ops-permanently-delete-recycled-block-removes-subtree-only ...) *)
let test_apply_ops_permanently_delete_recycled_block () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with
                  b_title = Some "parent";
                  b_children = [ { default_block with b_title = Some "child" } ] } ] } ]
      ()
  in
  let parent = Option.get (find_block_by_content (db_of conn) "parent") in
  let child = Option.get (find_block_by_content (db_of conn) "child") in
  let parent_uuid = uuid_of parent and child_uuid = uuid_of child in
  ldb_transact conn ~outliner_op:"delete-blocks"
    (Outliner_recycle.recycle_blocks_tx_data (db_of conn) [ parent ] ());
  check "apply-ops-permanently-delete-block recycled"
    (Outliner_recycle.recycled (entity_by_uuid_exn conn parent_uuid));
  apply_ops conn
    [ Wire.List
        [ Wire.Keyword "recycle-delete-permanently"
        ; Wire.List [ Wire.Uuid parent_uuid ] ] ];
  check "apply-ops-permanently-delete-block parent"
    (entity_by_uuid conn parent_uuid = None);
  check "apply-ops-permanently-delete-block child"
    (entity_by_uuid conn child_uuid = None)

(* ---------- validate_test.cljs new-graph-should-be-valid ----------

   (deftest new-graph-should-be-valid ...) — sweeps every built-in
   page of a fresh conn through the page/property/class validators and
   checks every class extends relationship. cljs collects
   :notification ex-data; the OCaml port raises
   Outliner_validate.Notification — collected the same way. *)
let test_new_graph_should_be_valid () =
  let conn = create_conn () in
  let db = db_of conn in
  (* "Validate pages" *)
  let page_ids =
    match Datascript.q_string db "[:find [?b ...] :where [?b :block/title] [?b :block/tags]]" with
    | [ row ] ->
        List.filter_map
          (fun r ->
            match r with
            | Result_entity id -> Some id
            | Result_value (Int id) -> Some id
            | _ -> None)
          row
    | _ -> []
  in
  let page_errors =
    List.filter_map
      (fun id ->
        match Ldb.ent_of_id db id with
        | None -> None
        | Some page -> (
            try
              let title = Ldb.string_value page "block/title" in
              Outliner_validate.validate_unique_by_name_and_tags db title
                (Some page) None;
              (match title with
               | Some t ->
                   Outliner_validate.validate_page_title t;
                   Outliner_validate.validate_page_title_characters t;
                   if Ldb.is_property page then
                     Outliner_validate.validate_property_title t
               | None -> ());
              (if Ldb.is_class page then
                 List.iter
                   (fun parent ->
                     Outliner_validate.validate_extends_property ~built_in:false db
                       parent [ page ])
                   (Ldb.ref_ents page "logseq.property.class/extends"));
              None
            with Outliner_validate.Notification _ ->
              Some id))
      page_ids
  in
  check "new-graph-should-be-valid pages" (page_errors = []);
  (* "Validate property relationships" *)
  let pairs =
    Datascript.q_string db
      "[:find ?parent ?child :where [?child :logseq.property.class/extends ?parent]]"
  in
  List.iter
    (fun row ->
      match row with
      | [ Result_entity p; Result_entity c ]
      | [ Result_value (Int p); Result_value (Int c) ] ->
          let parent = Option.get (Ldb.ent_of_id db p) in
          let child = Option.get (Ldb.ent_of_id db c) in
          check "new-graph-should-be-valid extends"
            (try
               Outliner_validate.validate_extends_property_have_correct_type
                 (Some parent) [ child ];
               true
             with _ -> false)
      | _ -> ())
    pairs

(* ---------- op_test.cljs ---------- *)

let find_block conn title =
  Option.get (find_block_by_content (db_of conn) title)

(* cljs (:logseq.property.reaction/_target block-entity) *)
let reactions_of (e : entity) : entity list =
  Ldb.ref_ents e "logseq.property.reaction/_target"

(* clojure.string/includes? *)
let str_contains s sub =
  let n = String.length s and m = String.length sub in
  let rec go i = i + m <= n && (String.sub s i m = sub || go (i + 1)) in
  go 0

(* (deftest toggle-reaction-op ...) *)
let test_toggle_reaction_op () =
  let user_uuid = gen_uuid () in
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Test" };
            blocks = [ { default_block with b_title = Some "Block" } ] } ]
      ()
  in
  let now = 1234 in
  transact_maps conn
    [ [ "block/uuid", Uuid user_uuid; "block/name", Str "user";
        "block/title", Str "user"; "block/created-at", Int now;
        "block/updated-at", Int now;
        "block/tags", Set_ [ Kw "logseq.class/Page" ] ] ];
  let block = find_block conn "Block" in
  let target_uuid = uuid_of block in
  let op () =
    apply_ops conn
      [ Wire.List
          [ Wire.Keyword "toggle-reaction"
          ; Wire.List
              [ Wire.Uuid target_uuid; Wire.String "+1"; Wire.Uuid user_uuid ] ] ]
  in
  op ();
  let block' = entity_by_uuid_exn conn target_uuid in
  let reactions = reactions_of block' in
  check "toggle-reaction-op count" (List.length reactions = 1);
  (match reactions with
   | [ reaction ] ->
       check "toggle-reaction-op reaction uuid"
         (uuid_of reaction <> "");
       check "toggle-reaction-op emoji"
         (Ldb.string_value reaction "logseq.property.reaction/emoji-id"
          = Some "+1");
       check "toggle-reaction-op created-by-ref"
         (match
            ( entity_by_uuid conn user_uuid
            , Ldb.ref_ent reaction "logseq.property/created-by-ref" )
          with
          | Some user, Some creator -> user.id = creator.id
          | _ -> false)
   | _ -> ());
  op ();
  let block'' = entity_by_uuid_exn conn target_uuid in
  check "toggle-reaction-op toggled off" (reactions_of block'' = [])

(* (deftest collapse-expand-blocks-op ...) *)
let test_collapse_expand_blocks_op () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Test" };
            blocks = [ { default_block with b_title = Some "Parent" } ] } ]
      ()
  in
  let block = find_block conn "Parent" in
  let block_uuid = uuid_of block in
  let collapse_op v =
    apply_ops conn
      [ Wire.List
          [ Wire.Keyword "collapse-expand-blocks"
          ; Wire.List
              [ Wire.List
                  [ Wire.Map
                      [ Wire.Keyword "block/uuid", Wire.Uuid block_uuid
                      ; Wire.Keyword "block/collapsed?", Wire.Bool v ] ]
              ; Wire.Map [] ] ] ]
  in
  collapse_op true;
  check "collapse-expand-blocks-op collapsed"
    (Ldb.value (entity_by_uuid_exn conn block_uuid) "block/collapsed?"
     = Some (Bool true));
  collapse_op false;
  check "collapse-expand-blocks-op expanded"
    (Ldb.value (entity_by_uuid_exn conn block_uuid) "block/collapsed?"
     = Some (Bool false))

(* (deftest resolve-indent-outdent-parent-original-test ...) *)
let test_resolve_indent_outdent_parent_original () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Test" };
            blocks = [ { default_block with b_title = Some "Original" } ] } ]
      ()
  in
  let original = find_block conn "Original" in
  (* cljs (#'outliner-op/resolve-indent-outdent-opts db
        {:parent-original {:block/uuid u}}) — the OCaml fn returns
      (parent-original-entity, remaining opts). *)
  let parent_opt, _opts =
    Outliner_op.resolve_indent_outdent_opts (db_of conn)
      (Wire.Map
         [ ( Wire.Keyword "parent-original"
           , Wire.Map [ Wire.Keyword "block/uuid", Wire.Uuid (uuid_of original) ] ) ])
  in
  check "resolve-indent-outdent-parent-original-test"
    (match parent_opt with
     | Some p -> p.id = original.id
     | None -> false)

(* (deftest apply-ops-plugin-property-sequence-test ...) *)
let test_apply_ops_plugin_property_sequence () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Test" };
            blocks = [ { default_block with b_title = Some "Block" } ] } ]
      ()
  in
  let block = find_block conn "Block" in
  let block_uuid = uuid_of block in
  let upsert_op ident typ cardinality name =
    Wire.List
      [ Wire.Keyword "upsert-property"
      ; Wire.List
          [ Wire.Keyword ident
          ; Wire.Map
              [ Wire.Keyword "logseq.property/type", Wire.Keyword typ
              ; Wire.Keyword "db/cardinality"
              , Wire.Keyword ("db.cardinality/" ^ cardinality) ]
          ; Wire.Map [ Wire.String "property-name", Wire.Keyword name ] ] ]
  in
  let set_op v =
    fun ident ->
      Wire.List
        [ Wire.Keyword "set-block-property"
        ; Wire.List [ Wire.Uuid block_uuid; Wire.Keyword ident; v ] ]
  in
  apply_ops conn
    [ upsert_op "plugin.property._test_plugin/x1" "checkbox" "one" "x1"
    ; set_op (Wire.Bool true) "plugin.property._test_plugin/x1"
    ; upsert_op "plugin.property._test_plugin/x2" "url" "one" "x2"
    ; set_op (Wire.String "https://logseq.com") "plugin.property._test_plugin/x2"
    ; upsert_op "plugin.property._test_plugin/x3" "number" "one" "x3"
    ; set_op (Wire.Int 1) "plugin.property._test_plugin/x3"
    ; upsert_op "plugin.property._test_plugin/x4" "number" "many" "x4"
    ; set_op (Wire.Int 1) "plugin.property._test_plugin/x4"
    ; upsert_op "plugin.property._test_plugin/x5" "json" "one" "x5"
    ; set_op (Wire.String "{\"foo\":\"bar\"}") "plugin.property._test_plugin/x5"
    ; upsert_op "plugin.property._test_plugin/x6" "page" "one" "x6"
    ; set_op (Wire.String "Page x") "plugin.property._test_plugin/x6"
    ; upsert_op "plugin.property._test_plugin/x7" "page" "many" "x7"
    ; set_op (Wire.String "Page y") "plugin.property._test_plugin/x7"
    ; set_op (Wire.String "Page z") "plugin.property._test_plugin/x7"
    ; upsert_op "plugin.property._test_plugin/x8" "default" "one" "x8"
    ; set_op (Wire.String "some content") "plugin.property._test_plugin/x8" ];
  let block' = entity_by_uuid_exn conn block_uuid in
  check "plugin-sequence x1"
    (Ldb.value block' "plugin.property._test_plugin/x1" = Some (Bool true));
  check "plugin-sequence x2"
    (match Ldb.ref_ent block' "plugin.property._test_plugin/x2" with
     | Some v -> ent_title v = Some "https://logseq.com"
     | None -> false);
  check "plugin-sequence x3"
    (match Ldb.ref_ent block' "plugin.property._test_plugin/x3" with
     | Some v -> Ldb.value v "logseq.property/value" = Some (Int 1)
     | None -> false);
  check "plugin-sequence x4"
    (Ldb.ref_ents block' "plugin.property._test_plugin/x4"
     |> List.filter_map (fun v -> Ldb.value v "logseq.property/value")
     = [ Int 1 ]);
  check "plugin-sequence x5"
    (Ldb.string_value block' "plugin.property._test_plugin/x5"
     = Some "{\"foo\":\"bar\"}");
  check "plugin-sequence x6"
    (match Ldb.ref_ent block' "plugin.property._test_plugin/x6" with
     | Some v -> Ldb.string_value v "block/name" = Some "page x"
     | None -> false);
  check "plugin-sequence x7"
    (Ldb.ref_ents block' "plugin.property._test_plugin/x7"
     |> List.filter_map (fun v -> Ldb.string_value v "block/name")
     |> List.sort compare
     = [ "page y"; "page z" ]);
  check "plugin-sequence x8"
    (match Ldb.ref_ent block' "plugin.property._test_plugin/x8" with
     | Some v -> ent_title v = Some "some content"
     | None -> false)

(* (deftest remove-block-property-op-rejects-lookup-ref-block-id-test ...) *)
let test_remove_block_property_op_rejects_lookup_ref_block_id () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Test" };
            blocks = [ { default_block with b_title = Some "Block" } ] } ]
      ()
  in
  let block = find_block conn "Block" in
  let block_uuid = uuid_of block in
  Outliner_property.set_block_property conn
    (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid block_uuid ])
    "logseq.property/order-list-type" (Wire.String "number");
  check "remove-block-property-op set"
    (Ldb.value (entity_by_uuid_exn conn block_uuid)
       "logseq.property/order-list-type" <> None);
  check "remove-block-property-op rejects lookup-ref"
    (try
       apply_ops conn
         [ Wire.List
             [ Wire.Keyword "remove-block-property"
             ; Wire.List
                 [ Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid block_uuid ]
                 ; Wire.Keyword "logseq.property/order-list-type" ] ] ];
       false
     with _ -> true)

(* (deftest direct-plugin-many-page-property-appends-values-test ...) *)
let test_direct_plugin_many_page_property_appends_values () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Test" };
            blocks = [ { default_block with b_title = Some "Block" } ] } ]
      ()
  in
  let block = find_block conn "Block" in
  let property_id = "plugin.property._test_plugin/x7" in
  ignore
    (Outliner_property.upsert_property conn (Some property_id)
       (Wire.Map
          [ Wire.Keyword "logseq.property/type", Wire.Keyword "page"
          ; Wire.Keyword "db/cardinality", Wire.Keyword "db.cardinality/many" ])
       ~property_name:(Some "x7") ~properties:[]);
  Outliner_property.set_block_property conn (Wire.Int block.id) property_id
    (Wire.String "Page y");
  Outliner_property.set_block_property conn (Wire.Int block.id) property_id
    (Wire.String "Page z");
  check "direct-plugin-many-page-property-appends-values-test"
    (Ldb.ref_ents (entity_by_uuid_exn conn (uuid_of block)) property_id
     |> List.filter_map (fun v -> Ldb.string_value v "block/name")
     |> List.sort compare
     = [ "page y"; "page z" ])

(* (deftest apply-template-op-resolves-dynamic-variables-test ...)

   cljs passes {:template-blocks blocks-to-insert} built from
   (ldb/get-block-and-children {:include-property-block? true}) with
   :logseq.property/used-template set on the first block; the OCaml op's
   template_children_blocks fallback replicates exactly that path when
   the opt is absent, so the wire form omits :template-blocks. The
   fallback only accepts the [:block/uuid u] lookup-ref form (cljs passes
   a raw uuid because it supplies :template-blocks explicitly). *)
let test_apply_template_op_resolves_dynamic_variables () =
  let conn =
    create_conn_with_blocks
      ~properties:
        [ "log-time", { default_property with p_type = "default" } ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Target Page" };
            blocks = [ { default_block with b_title = Some "target block" } ] };
          { page = { default_page with pg_title = Some "Templates" };
            blocks =
              [ { default_block with
                  b_title = Some "template root";
                  b_children =
                    [ { default_block with
                        b_title = Some "page is <% current page %>" };
                      { default_block with
                        b_title = Some "time block";
                        b_properties =
                          [ "log-time", Str "<%time%>" ] } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let target_page =
    Option.get (Ldb.get_page db (String "Target Page"))
  in
  let template_root = find_block conn "template root" in
  let target_block = find_block conn "target block" in
  apply_ops conn
    [ Wire.List
        [ Wire.Keyword "apply-template"
        ; Wire.List
            [ Wire.Uuid (uuid_of template_root)
            ; Wire.Uuid (uuid_of target_block)
            ; Wire.Map [] ] ] ];
  let page_var_block =
    find_block_by_content (db_of conn)
      ("page is " ^ Db_content.page_ref (uuid_of target_page))
  in
  check "apply-template-op-resolves-dynamic-variables page var"
    (page_var_block <> None);
  let time_block =
    match
      Datascript.q_string (db_of conn)
        ~inputs:
          [ Arg_scalar (Result_value (String "time block"))
          ; Arg_scalar (Result_value (String "Target Page")) ]
        "[:find [?b ...] :in $ ?title ?page-title :where \
         [?b :block/title ?title] [?b :block/page ?page] \
         [?page :block/title ?page-title]]"
    with
    | [ [ r ] ] -> (
        match r with
        | Result_entity id -> Ldb.ent_of_id (db_of conn) id
        | Result_value (Int id) -> Ldb.ent_of_id (db_of conn) id
        | _ -> None)
    | _ -> None
  in
  let time_value =
    Option.bind time_block
      (fun b -> readable_property b "user.property/log-time")
  in
  (match time_value with
   | Some (Wire.String s) ->
       check "apply-template-op-resolves-dynamic-variables time string"
         (String.trim s <> "" && not (str_contains s "<%"))
   | _ ->
       check "apply-template-op-resolves-dynamic-variables time string" false)

(* (deftest apply-ops-requires-uuid-block-ids-and-keyword-property-ids-test ...) *)
let test_apply_ops_requires_uuid_block_ids_and_keyword_property_ids () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Test" };
            blocks = [ { default_block with b_title = Some "Block" } ] } ]
      ()
  in
  let block = find_block conn "Block" in
  let block_id = block.id and block_uuid = uuid_of block in
  let property_kw = "plugin.property._test_plugin/normalized-prop" in
  ignore
    (Outliner_property.upsert_property conn (Some property_kw)
       (Wire.Map
          [ Wire.Keyword "logseq.property/type", Wire.Keyword "checkbox"
          ; Wire.Keyword "db/cardinality", Wire.Keyword "db.cardinality/one" ])
       ~property_name:(Some "normalized-prop") ~properties:[]);
  let property_id = (ident_ent_exn (db_of conn) property_kw).id in
  apply_ops conn
    [ Wire.List
        [ Wire.Keyword "set-block-property"
        ; Wire.List [ Wire.Uuid block_uuid; Wire.Keyword property_kw
                    ; Wire.Bool true ] ] ];
  check "apply-ops-requires-uuid uuid+kw accepted"
    (Ldb.value (entity_by_uuid_exn conn block_uuid) property_kw
     = Some (Bool true));
  check "apply-ops-requires-uuid int block id rejected"
    (try
       apply_ops conn
         [ Wire.List
             [ Wire.Keyword "set-block-property"
             ; Wire.List [ Wire.Int block_id; Wire.Keyword property_kw
                         ; Wire.Bool true ] ] ];
       false
     with _ -> true);
  check "apply-ops-requires-uuid int property id rejected"
    (try
       apply_ops conn
         [ Wire.List
             [ Wire.Keyword "set-block-property"
             ; Wire.List [ Wire.Uuid block_uuid; Wire.Int property_id
                         ; Wire.Bool true ] ] ];
       false
     with _ -> true)

(* ---------- pipeline_test.cljs ---------- *)

(* (deftest block-content-refs ...)

   cljs passes a hypothetical block map; the OCaml port takes an entity
   so the title is transacted onto the block first — block-content-refs
   still does the same content→matched-ids→entity resolution. *)
let test_block_content_refs () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "b1" } ] } ]
      ()
  in
  let block = find_block conn "b1" in
  transact_maps conn
    [ [ "block/uuid", Uuid (uuid_of block);
        "block/title", Str ("ref to " ^ Db_content.page_ref (uuid_of block)) ] ];
  let block' = entity_by_uuid_exn conn (uuid_of block) in
  check "block-content-refs"
    (Outliner_pipeline.block_content_refs (db_of conn) block' = [ block.id ])

(* (deftest db-rebuild-block-refs-for-query-block ...) *)
let test_db_rebuild_block_refs_for_query_block () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with
                  b_title = Some "Todo query";
                  b_tags = [ "logseq.class/Query" ];
                  b_properties =
                    [ "logseq.property/query",
                      build_property_value ~title:"(task Todo)" () ] } ] } ]
      ()
  in
  let db = db_of conn in
  let block = find_block conn "Todo query" in
  let refs = Outliner_core.rebuild_block_refs db block in
  let query_property = entity db (Ident "logseq.property/query") in
  let query_class = entity db (Ident "logseq.class/Query") in
  check "db-rebuild-block-refs-for-query-block query prop exists"
    (query_property <> None);
  check "db-rebuild-block-refs-for-query-block query class in refs"
    (match query_class with
     | Some qc -> List.mem qc.id refs
     | None -> false);
  check "db-rebuild-block-refs-for-query-block query prop not in refs"
    (match query_property with
     | Some qp -> not (List.mem qp.id refs)
     | None -> false)

(* (deftest db-rebuild-block-refs-removes-recursive-self-ref ...)

   cljs passes a pull-map with a rewritten title; same entity-only caveat
   as block-content-refs — the title is transacted onto the block first. *)
let test_db_rebuild_block_refs_removes_recursive_self_ref () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "self" } ] } ]
      ()
  in
  let block = find_block conn "self" in
  transact_maps conn
    [ [ "block/uuid", Uuid (uuid_of block);
        "block/title", Str ("self " ^ Db_content.page_ref (uuid_of block)) ] ];
  let block' = entity_by_uuid_exn conn (uuid_of block) in
  check "db-rebuild-block-refs-removes-recursive-self-ref"
    (Outliner_core.rebuild_block_refs (db_of conn) block' = [])

(* (deftest bulk-block-refs-preserve-datetime-and-content-rules ...)

   cljs uses create-conn-with-import-map (sqlite-export/build-import);
   the fixture has no upserts so create-conn-with-blocks is equivalent.
   Covers both the db-rebuild-block-refs and db-rebuild-block-refs-fn
   asserts. *)
let test_bulk_block_refs_preserve_datetime_and_content_rules () =
  (* (.getTime (js/Date. 2026 8 8 12)) — Sep 8 2026 noon UTC *)
  let timestamp = 1788868800000 in
  let conn =
    create_conn_with_blocks
      ~properties:
        [ "datetime", { default_property with p_type = "datetime" } ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with
                  b_title = Some "b1";
                  b_properties = [ "datetime", Int timestamp ] } ] } ]
      ()
  in
  let db = db_of conn in
  let block = find_block conn "b1" in
  let page = Option.get (find_page_by_title db "page1") in
  let alias_uuid = gen_uuid () and journal_uuid = gen_uuid () in
  transact_maps conn
    [ [ "block/uuid", Uuid journal_uuid; "block/title", Str "Sep 8th, 2026";
        "block/journal-day", Int 20260908;
        "block/tags", Vec [ Kw "logseq.class/Journal" ] ];
      [ "block/uuid", Uuid alias_uuid; "block/title", Str "alias" ];
      [ "block/uuid", Uuid (uuid_of block);
        "block/alias", Vec [ Vec [ Kw "block/uuid"; Uuid alias_uuid ] ];
        "block/link", Vec [ Kw "block/uuid"; Uuid (uuid_of page) ];
        "block/title",
          Str
            (Db_content.page_ref (uuid_of block) ^ " "
             ^ Db_content.page_ref alias_uuid ^ " "
             ^ Db_content.page_ref (gen_uuid ())) ] ];
  let db = db_of conn in
  let updated_block = entity_by_uuid_exn conn (uuid_of block) in
  let expected =
    List.sort_uniq compare
      [ page.id
      ; (ident_ent_exn db "block/alias").id
      ; (entity_by_uuid_exn conn journal_uuid).id
      ; (ident_ent_exn db "user.property/datetime").id ]
  in
  check "bulk-block-refs-preserve-datetime-and-content-rules"
    (List.sort_uniq compare (Outliner_core.rebuild_block_refs db updated_block)
     = expected);
  let rebuild_fn = Outliner_pipeline.db_rebuild_block_refs_fn db in
  check "bulk-block-refs-fn preserve-datetime-and-content-rules"
    (List.sort_uniq compare (rebuild_fn updated_block) = expected)

(* ---------- tree_test.cljs ----------

   (deftest blocks->vec-tree-data-preserves-caller-field-policy ...)
   covers both the default (tx-id dropped) and the renderer
   (:keep-block-tx-id? true) call shapes. *)
let test_blocks_vec_tree_data_preserves_caller_field_policy () =
  let child : pulled_entity =
    { pulled_id = 2
    ; pulled_attrs =
        [ Keyword "block/uuid", Pulled_scalar (Uuid "a0a0a0a0-0000-4000-8000-000000000002")
        ; Keyword "block/order", Pulled_scalar (String "a0")
        ; Keyword "block/parent", Pulled_scalar (Ref 1)
        ; Keyword "block/tx-id", Pulled_scalar (Int 9) ] }
  in
  let result =
    Outliner_tree.vec_tree_data ~include_root:false ~root:None ~root_id:1
      [ child ]
  in
  check "blocks->vec-tree-data vector" (List.length result = 1);
  (match result with
   | [ Wire.Map pairs ] ->
       check "blocks->vec-tree-data level"
         (Wire.get "block/level" (Wire.Map pairs) = Some (Wire.Int 1));
       check "blocks->vec-tree-data tx-id dropped"
         (Wire.get "block/tx-id" (Wire.Map pairs) = None)
   | _ -> check "blocks->vec-tree-data vector" false);
  let renderer_result =
    Outliner_tree.vec_tree_data ~include_root:false
      ~keep_block_tx_id:true ~root:None ~root_id:1 [ child ]
  in
  (match renderer_result with
   | [ Wire.Map pairs ] ->
       check "blocks->vec-tree-data keep-tx-id"
         (Wire.get "block/tx-id" (Wire.Map pairs) = Some (Wire.Int 9))
   | _ -> check "blocks->vec-tree-data keep-tx-id" false)

(* ---------- property_test.cljs remainder ---------- *)

(* cljs (db-test/readable-properties ent) :logseq.property.class/extends
   key — idents of the extends ref ents *)
let readable_extends (e : entity) : string list =
  match readable_property e "logseq.property.class/extends" with
  | Some (Wire.List xs) ->
      List.filter_map (function Wire.String s -> Some s | _ -> None) xs
  | _ -> []

(* (deftest property-with-other-position-default-bottom-rules ...)

   cljs passes property maps to property-with-other-position?; the OCaml
   Display_properties.property_with_other_position takes entities, so
   each case transacts an ident entity with the schema attrs. The block
   arg is unused (like cljs nil) — the property entity is passed. *)
let test_property_with_other_position_default_bottom_rules () =
  let conn = create_conn () in
  let prop_ent attrs =
    let uuid = gen_uuid () in
    transact_maps conn
      [ ([ "block/uuid", Uuid uuid; "block/title", Str "p";
           "block/name", Str "p" ]
         @ attrs) ];
    entity_by_uuid_exn conn uuid
  in
  let check_pos name expected attrs =
    let e = prop_ent attrs in
    check name (Display_properties.property_with_other_position e e = expected)
  in
  check_pos "property-position explicit block-left stays other" true
    [ "db/ident", Kw "user.property/p1"; "logseq.property/type", Kw "number";
      "logseq.property/ui-position", Kw "block-left" ];
  check_pos "property-position number defaults to bottom" true
    [ "db/ident", Kw "user.property/p2"; "logseq.property/type", Kw "number" ];
  check_pos "property-position default no closed values stays normal" false
    [ "db/ident", Kw "user.property/p3"; "logseq.property/type", Kw "default";
      "property/closed-values", Vec [] ];
  (* :property/closed-values [ent] in cljs reads the map key; the OCaml
     impl derives closed values from the block/_closed-value-property
     reverse ref, so a closed-value entity points at the property. *)
  let p4 =
    prop_ent
      [ "db/ident", Kw "user.property/p4"; "logseq.property/type", Kw "default" ]
  in
  transact_maps conn
    [ [ "block/uuid", Uuid (gen_uuid ()); "block/title", Str "cv";
        "block/closed-value-property", Vec [ Kw "block/uuid"; Uuid (uuid_of p4) ] ] ];
  (* re-resolve after the cv tx: lazy entities bind the db snapshot at
     creation, so p4's pre-tx snapshot cannot see the new datom *)
  let p4 = Option.get (entity_at_uuid (db_of conn) (uuid_of p4)) in
  check "property-position default with closed values is bottom"
    (Display_properties.property_with_other_position p4 p4 = true);
  check_pos "property-position url stays normal" false
    [ "db/ident", Kw "user.property/p5"; "logseq.property/type", Kw "url" ];
  check_pos "property-position explicit left stays positioned" true
    [ "db/ident", Kw "user.property/p6"; "logseq.property/type", Kw "url";
      "logseq.property/ui-position", Kw "block-left" ];
  check_pos "property-position explicit properties stays normal" false
    [ "db/ident", Kw "user.property/p7"; "logseq.property/type", Kw "number";
      "logseq.property/ui-position", Kw "properties" ];
  check_pos "property-position many node defaults to bottom" true
    [ "db/ident", Kw "user.property/p8"; "logseq.property/type", Kw "node";
      "db/cardinality", Kw "db.cardinality/many" ];
  check_pos "property-position bidirectional config stays normal" false
    [ "db/ident", Kw "logseq.property.class/enable-bidirectional?";
      "logseq.property/type", Kw "checkbox" ];
  check_pos "property-position block/tags stays normal" false
    [ "db/ident", Kw "block/tags"; "logseq.property/type", Kw "class" ];
  check_pos "property-position class/properties stays normal" false
    [ "db/ident", Kw "logseq.property.class/properties";
      "logseq.property/type", Kw "property" ];
  check_pos "property-position public? stays normal" false
    [ "db/ident", Kw "logseq.property/public?"; "logseq.property/type", Kw "checkbox" ];
  (* cljs (contains? db-property/schema-properties :logseq.property/public?) *)
  check "schema-properties contains public?"
    (List.mem "logseq.property/public?"
       (List.map snd Db_property.schema_properties_map))

(* cljs outliner-property/get-block-positioned-properties — the OCaml
   port returns idents grouped by position instead of property
   entities; asserted equivalently. *)
let positioned_idents_at db eid position =
  Render_snapshot.block_positioned_property_idents_by_position db eid
  |> List.assoc_opt position
  |> Option.value ~default:[]

(* (deftest get-block-positioned-properties-filters-non-public ...) *)
let test_get_block_positioned_properties_filters_non_public () =
  let conn = create_conn_with_blocks () in
  let db = db_of conn in
  let journal_class = ident_ent_exn db "logseq.class/Journal" in
  let idents = positioned_idents_at db journal_class.id "block-below" in
  check "get-block-positioned-properties-filters-non-public public"
    (List.for_all
       (fun ident ->
         match entity db (Ident ident) with
         | Some e -> Ldb.value e "logseq.property/public?" <> Some (Bool false)
         | None -> true)
       idents);
  check "get-block-positioned-properties-filters-non-public title-format"
    (not (List.mem "logseq.property.journal/title-format" idents))

(* (deftest get-block-positioned-properties-keeps-empty-inherited-tag-properties ...) *)
let test_get_block_positioned_properties_keeps_empty_inherited_tag_properties () =
  let conn =
    create_conn_with_blocks
      ~properties:
        [ "authors",
          { default_property with p_type = "node"; p_cardinality_many = true } ]
      ~classes:
        [ "Paper", { default_class with c_class_properties = [ "authors" ] } ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with b_title = Some "paper1"; b_tags = [ "Paper" ] } ] } ]
      ()
  in
  let db = db_of conn in
  let paper1 = Option.get (find_block_by_content db "paper1") in
  let idents = positioned_idents_at db paper1.id "block-below" in
  check "get-block-positioned-properties-keeps-empty-inherited-tag-properties"
    (List.mem "user.property/authors" idents)

(* (deftest extends-cycle ...) *)
let test_extends_cycle () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ "Class1", default_class; "Class2", default_class;
          "Class3", default_class ]
      ()
  in
  let db = db_of conn in
  let class1 = ident_ent_exn db "user.class/Class1" in
  let class2 = ident_ent_exn db "user.class/Class2" in
  let class3 = ident_ent_exn db "user.class/Class3" in
  Outliner_property.set_block_property conn (Wire.Int class1.id)
    "logseq.property.class/extends" (Wire.Int class2.id);
  Outliner_property.set_block_property conn (Wire.Int class2.id)
    "logseq.property.class/extends" (Wire.Int class3.id);
  (* cljs thrown-with-msg? #"Extends cycle" — OCaml raises
     Notification with i18n-key :class.validation/extends-cycle *)
  expect_notification "extends-cycle"
    ~i18n_key:"class.validation/extends-cycle"
    (fun () ->
      Outliner_property.set_block_property conn (Wire.Int class3.id)
        "logseq.property.class/extends" (Wire.Int class1.id))

(* (deftest extends-redundant-direct-parent-cleanup ...) *)
let test_extends_redundant_direct_parent_cleanup () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ "A", default_class; "B", default_class;
          "C", { default_class with c_extends = [ "B" ] };
          "D", { default_class with c_extends = [ "A"; "C" ] } ]
      ()
  in
  let db = db_of conn in
  let b = ident_ent_exn db "user.class/B" in
  Outliner_property.set_block_property conn (Wire.Int b.id)
    "logseq.property.class/extends"
    (Wire.Int (ident_ent_exn db "user.class/A").id);
  let d = ident_ent_exn (db_of conn) "user.class/D" in
  check "extends-redundant-direct-parent-cleanup"
    (readable_extends d = [ "user.class/C" ])

(* (deftest extends-redundant-cleanup-with-lookup-ref-parent ...) *)
let test_extends_redundant_cleanup_with_lookup_ref_parent () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ "A", default_class; "B", default_class;
          "C", { default_class with c_extends = [ "B" ] };
          "D", { default_class with c_extends = [ "A"; "C" ] } ]
      ()
  in
  let db = db_of conn in
  let b = ident_ent_exn db "user.class/B" in
  Outliner_property.set_block_property conn (Wire.Int b.id)
    "logseq.property.class/extends"
    (Wire.Array [ Wire.Keyword "db/ident"; Wire.Keyword "user.class/A" ]);
  let b' = ident_ent_exn (db_of conn) "user.class/B" in
  check "extends-redundant-cleanup-with-lookup-ref-parent B"
    (readable_extends b' = [ "user.class/A" ]);
  let d = ident_ent_exn (db_of conn) "user.class/D" in
  check "extends-redundant-cleanup-with-lookup-ref-parent D"
    (readable_extends d = [ "user.class/C" ])

(* (deftest extends-redundant-cleanup-with-keyword-vector-parents ...) *)
let test_extends_redundant_cleanup_with_keyword_vector_parents () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ "A", default_class; "B", default_class;
          "C", { default_class with c_extends = [ "A" ] };
          "D", { default_class with c_extends = [ "A"; "B" ] } ]
      ()
  in
  let db = db_of conn in
  let b = ident_ent_exn db "user.class/B" in
  Outliner_property.batch_set_property conn [ Wire.Int b.id ]
    "logseq.property.class/extends"
    (Wire.Array [ Wire.Keyword "user.class/A"; Wire.Keyword "user.class/C" ])
    ();
  let b' = ident_ent_exn (db_of conn) "user.class/B" in
  check "extends-redundant-cleanup-with-keyword-vector-parents B"
    (readable_extends b' = [ "user.class/C" ]);
  let d = ident_ent_exn (db_of conn) "user.class/D" in
  check "extends-redundant-cleanup-with-keyword-vector-parents D"
    (readable_extends d = [ "user.class/B" ])

(* (deftest extends-redundant-direct-parent-cleanup-for-root-reset ...) *)
let test_extends_redundant_direct_parent_cleanup_for_root_reset () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ "B", default_class;
          "C", { default_class with c_extends = [ "B" ] };
          "D", { default_class with c_extends = [ "logseq.class/Root"; "C" ] } ]
      ()
  in
  let db = db_of conn in
  let b = ident_ent_exn db "user.class/B" in
  Outliner_property.set_block_property conn (Wire.Int b.id)
    "logseq.property.class/extends" (Wire.Keyword "logseq.class/Root");
  let d = ident_ent_exn (db_of conn) "user.class/D" in
  check "extends-redundant-direct-parent-cleanup-for-root-reset"
    (readable_extends d = [ "user.class/C" ])

(* (deftest delete-property-value! ...) *)
let test_delete_property_value () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ "C1", default_class; "C2", default_class;
          "C3", { default_class with c_extends = [ "C1"; "C2" ] } ]
      ()
  in
  let db = db_of conn in
  Outliner_property.delete_property_value conn (Wire.Keyword "user.class/C3")
    "logseq.property.class/extends"
    (Wire.Int (ident_ent_exn db "user.class/C2").id);
  check "delete-property-value! specific value deleted"
    (readable_extends (ident_ent_exn (db_of conn) "user.class/C3")
     = [ "user.class/C1" ]);
  Outliner_property.delete_property_value conn (Wire.Keyword "user.class/C3")
    "logseq.property.class/extends"
    (Wire.Int (ident_ent_exn db "user.class/C1").id);
  check "delete-property-value! restored to Root"
    (readable_extends (ident_ent_exn (db_of conn) "user.class/C3")
     = [ "logseq.class/Root" ])


(* ---------- page_test.cljs ----------
   All 17 deftests. outliner-page/create! maps to
   Outliner_page.create_bang with a thunked Outliner_page.create (the
   :opts map becomes labelled args). outliner-page/delete! maps to
   Outliner_page.delete_conn.

   LIB BUG (reported): Outliner_page.throw_private_create_page_tag
   raises "Can't create a page with tag #<t>"
   (:class.validation/cant-create-page-with-private-tag); upstream cljs
   page.cljs throws "New page can't set built-in tags: \"<t>\""
   (:page.validation/cant-set-built-in-tags). The
   create-page-with-tag-named-tag assertions keep the cljs-expected
   message and currently fail on the mismatch.

   ENGINE BUG (reported): Outliner_page.create emits
   :block/tags [:logseq.class/Page :logseq.class/Page] (the Page tag
   twice) for a plain page. datascript-ocaml reads any 2-element
   collection whose head is an attribute name as a lookup-ref
   [attr value], so the tx throws "Lookup ref attribute should be
   marked as :db/unique" — cljs datascript resolves each element as
   an ident ref. Blocks create-namespace-pages, create-page, and
   create-page-with-existing-public-tag-reused.

   LIB BUG (reported): Db_validate.validate_db reports errors on
   lib-produced graphs — 183 grouped errors on the seed emitted by
   Sqlite_create_graph.initial_tx_data itself (including 1 on a page
   created via Outliner_page.create) — while cljs
   db-validate/validate-db returns none on a fresh graph. The
   "Graph remains valid" assertions keep the cljs expectation
   (errors = []) and fail until the lib side is fixed. *)

(* outliner-page/create! — create + transact *)
let create_page conn title ?uuid ?tags ?properties ?class_ ?journal
    ?today_journal ?split_namespace ?class_ident_namespace () =
  Outliner_page.create_bang conn title
    ~opts:(fun () ->
      Outliner_page.create (db_of conn) title ?uuid ?tags ?properties
        ?class_ ?journal ?today_journal ?split_namespace
        ?class_ident_namespace ())
    ()

(* parsed-tag — cljs (gp-block/page-name->map title nil true nil
   {:class? true}): a db-less parse produces block/type "page" and no
   :block/tags. The OCaml page_name_to_map always runs db-based, so the
   map is built directly with the same shape. *)
let parsed_tag (title : string) : Wire.t =
  Wire.Map
    [ Wire.Keyword "block/title", Wire.String title
    ; Wire.Keyword "block/name", Wire.String (Ldb.page_name_sanity_lc title)
    ; Wire.Keyword "block/uuid", Wire.Uuid (gen_uuid ())
    ; Wire.Keyword "block/type", Wire.String "page" ]

(* (set (map :block/title (:block/_parent e)))-style helpers *)
let children_titles (e : entity) : string list =
  List.filter_map ent_title (Ldb.ref_ents e "block/_parent")

let tag_idents (e : entity) : string list =
  List.filter_map Ldb.ident_of (Ldb.ref_ents e "block/tags")

(* d/q '[:find [?t-title ...] :where [?b :block/title t]
       [?b :block/tags ?t] [?t :block/title ?t-title]] — titles of tags
   on entities titled [title]. *)
let tag_titles_of_title (db : db) (title : string) : string list =
  match
    Datascript.q_string ~inputs:[ Arg_scalar (Result_value (String title)) ] db
      "[:find [?tt ...] :in $ ?t :where [?b :block/title ?t] \
        [?b :block/tags ?tag] [?tag :block/title ?tt]]"
  with
  | rows ->
      List.filter_map
        (function [ Result_value (String s) ] -> Some s | _ -> None)
        rows

let count_entities_titled (db : db) (title : string) : int =
  match
    Datascript.q_string ~inputs:[ Arg_scalar (Result_value (String title)) ] db
      "[:find [?e ...] :in $ ?t :where [?e :block/title ?t]]"
  with
  | rows -> List.length rows

(* cljs throws ex-info; OCaml raises Notification carrying a :payload
   :message — match on the message text (cljs thrown-with-msg?). *)
let exn_text (e : exn) : string =
  match e with
  | Outliner_validate.Notification w ->
      (match Wire.get "payload" w with
       | Some p ->
           (match Wire.get "message" p with
            | Some (Wire.String s) -> s
            | _ -> "")
       | None -> "")
  | Failure s | Invalid_argument s -> s
  | _ -> Printexc.to_string e

let str_contains (s : string) (sub : string) : bool =
  let ls = String.length s and lsub = String.length sub in
  let rec loop i =
    i + lsub <= ls && (String.sub s i lsub = sub || loop (i + 1))
  in
  lsub = 0 || loop 0

let throws_with (name : string) (needle : string) (f : unit -> _) : unit =
  let ok =
    (try
       ignore (f ());
       false
     with e -> str_contains (exn_text e) needle)
  in
  check name ok

(* (deftest create-class ...) *)
let test_create_class () =
  let conn = create_conn_with_blocks () in
  ignore (create_page conn "movie" ~class_:true ());
  ignore (create_page conn "Movie" ~class_:true ());
  let db = db_of conn in
  let movie_class = Option.get (Ldb.get_case_page db (String "movie")) in
  let movie_class2 = Option.get (Ldb.get_case_page db (String "Movie")) in
  check "Creates a class" (Ldb.is_class movie_class);
  check "Creates another class with a different case sensitive name"
    (Ldb.is_class movie_class2);
  check "The two classes are not the same" (movie_class.id <> movie_class2.id)

(* (deftest create-namespace-pages ...) *)
let test_create_namespace_pages () =
  let conn =
    create_conn_with_blocks
      ~properties:[ "user.property/property1",
                      { default_property with p_type = "default" } ]
      ~classes:[ "class1", default_class ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [] } ]
      ()
  in
  (* Basic valid workflows *)
  let _, child_uuid = create_page conn "foo/bar/baz" ~split_namespace:true () in
  let child_page = entity_by_uuid_exn conn (Option.get child_uuid) in
  let _, child_uuid2 =
    create_page conn "foo/bar/baz2" ~split_namespace:true ()
  in
  let child_page2 = entity_by_uuid_exn conn (Option.get child_uuid2) in
  let _, child_uuid3 =
    create_page conn "c1/c2" ~split_namespace:true ~class_:true ()
  in
  let child_page3 = entity_by_uuid_exn conn (Option.get child_uuid3) in
  let db = db_of conn in
  let library = Option.get (Ldb.get_built_in_page db "Library") in
  let bar = Option.get (Ldb.get_page db (String "bar")) in
  check "Namespace (non-class) pages are added to the Library page"
    (children_titles library = [ "foo" ]);
  check "Child pages are created under the same parent"
    (children_titles bar = [ "baz"; "baz2" ]);
  check "Child page with new parent has correct parents"
    ((match Ldb.ref_ent child_page "block/parent" with
      | Some p ->
          (match Ldb.ref_ent p "block/parent" with
           | Some gp -> [ ent_title gp; ent_title p ]
           | None -> [])
      | None -> [])
     = [ Some "foo"; Some "bar" ]);
  let parents_uuids (e : entity) : string list =
    List.filter_map Entity_view.uuid
      (Entity_view.get_page_parents (Entity_view.of_entity e))
  in
  check "Child page with existing parents has correct parents"
    (parents_uuids child_page = parents_uuids child_page2);
  check "Child class with new parent has correct parents"
    (sort_uniq
       (List.filter_map ent_title (Db_class.get_classes_parents [ child_page3 ]))
     = [ "Root Tag"; "c1" ]);
  ignore (create_page conn "foo/class1/baz3" ~split_namespace:true ());
  check
    "Using an existing class page in a multi-parent namespace doesn't \
     allow a page to have a class parent and instead creates a new page"
    (sort_uniq (tag_titles_of_title (db_of conn) "class1")
     = [ "Page"; "Tag" ]);
  (* Child pages with same name and different parents *)
  ignore (create_page conn "vim/keys" ~split_namespace:true ());
  ignore (create_page conn "emacs/keys" ~split_namespace:true ());
  let db = db_of conn in
  let keys_parents =
    match
      Datascript.q_string db
        "[:find ?pn :where [?b :block/title \"keys\"] \
          [?b :block/parent ?p] [?p :block/title ?pn]]"
    with
    | rows ->
        sort_uniq
          (List.filter_map
             (function
               | [ Result_value (String s) ] -> Some s
               | _ -> None)
             rows)
  in
  check "Two child pages with same name exist and have different parents"
    (keys_parents = [ "emacs"; "vim" ]);
  (* Invalid workflows *)
  throws_with "Page can't have a class parent" "Cannot create"
    (fun () -> create_page conn "class1/page" ~split_namespace:true ());
  throws_with "Page can't have a property parent" "Cannot create"
    (fun () -> create_page conn "property1/page" ~split_namespace:true ());
  throws_with "Class can't have a property parent" "Cannot create"
    (fun () ->
       create_page conn "property1/class" ~split_namespace:true ~class_:true ())

(* (deftest create-page ...) *)
let test_create_page () =
  let conn = create_conn_with_blocks () in
  let _, page_uuid = create_page conn "fooz" () in
  let page = entity_by_uuid_exn conn (Option.get page_uuid) in
  check "Page created correctly" (ent_title page = Some "fooz");
  throws_with "Page can't have '/'n title" "can't include \"/\""
    (fun () -> create_page conn "foo/bar" ());
  throws_with "Page can't have '#' in title" "can't include \"#\""
    (fun () -> create_page conn "foo#bar" ());
  throws_with "Page can't have leading '#' in title" "can't include \"#\""
    (fun () -> create_page conn "#tagstyle" ())

(* (deftest create-page-with-tag-named-tag ...) *)
let test_create_page_with_tag_named_tag () =
  let conn = create_conn_with_blocks () in
  let db = db_of conn in
  let built_in_tag = ident_ent_exn db "logseq.class/Tag" in
  throws_with "Creating a page with #Tag must not create a user Tag class"
    "New page can't set built-in tags"
    (fun () -> create_page conn "Foo" ~tags:[ parsed_tag "Tag" ] ());
  check "Page is not created when #Tag is rejected"
    (find_page_by_title db "Foo" = None);
  let db = db_of conn in
  let tag_after = ident_ent_exn db "logseq.class/Tag" in
  check "built-in Tag id unchanged" (built_in_tag.id = tag_after.id);
  check "built-in Tag ident unchanged"
    (Ldb.ident_of tag_after = Some "logseq.class/Tag");
  check "built-in Tag stays built-in" (Ldb.built_in tag_after);
  check "Built-in Tag class is not duplicated"
    (count_entities_titled db "Tag" = 1);
  check "Graph remains valid"
    ((Db_validate.validate_db db).errors = [])

(* (deftest create-page-with-existing-public-and-new-tags ...) *)
let test_create_page_with_existing_public_and_new_tags () =
  let conn = create_conn_with_blocks () in
  let _, foo_uuid = create_page conn "Foo" ~tags:[ parsed_tag "Task" ] () in
  let foo = entity_by_uuid_exn conn (Option.get foo_uuid) in
  let _, bar_uuid = create_page conn "Bar" ~tags:[ parsed_tag "Movie" ] () in
  let bar = entity_by_uuid_exn conn (Option.get bar_uuid) in
  let db = db_of conn in
  let movie = Option.get (find_page_by_title db "Movie") in
  check "Public built-in #Task is reused instead of duplicated"
    (List.mem "logseq.class/Task" (tag_idents foo));
  check "one Task entity" (count_entities_titled db "Task" = 1);
  check "A new user tag is still created" (Ldb.is_class movie);
  check "New tags must not keep file-graph :block/type from a db-less parse"
    (Ldb.value movie "block/type" = None);
  check "Bar tagged with the new class"
    (List.mem (Option.get (Ldb.ident_of movie)) (tag_idents bar));
  check "Graph remains valid after creating a page with a new tag"
    ((Db_validate.validate_db db).errors = [])

(* (deftest create-page-with-public-tag-reuses-existing-page ...) *)
let test_create_page_with_public_tag_reuses_existing_page () =
  let conn = create_conn_with_blocks () in
  let _, foo_uuid = create_page conn "Foo" ~tags:[ parsed_tag "Task" ] () in
  let _, foo_uuid2 = create_page conn "Foo" ~tags:[ parsed_tag "Task" ] () in
  check "A second create of Foo #Task returns the existing page"
    (foo_uuid = foo_uuid2);
  check "A second create must not insert another Foo page"
    (count_entities_titled (db_of conn) "Foo" = 1)

(* (deftest create-pages-with-same-title-and-different-tags ...) *)
let test_create_pages_with_same_title_and_different_tags () =
  let conn =
    create_conn_with_blocks
      ~classes:[ "Kestrel", default_class; "Lantern", default_class ]
      ()
  in
  let db = db_of conn in
  let kestrel = Option.get (find_page_by_title db "Kestrel") in
  let lantern = Option.get (find_page_by_title db "Lantern") in
  let _, kestrel_uuid =
    create_page conn "Juniper" ~tags:[ Wire.Uuid (uuid_of kestrel) ] ()
  in
  let _, lantern_uuid =
    create_page conn "Juniper" ~tags:[ Wire.Uuid (uuid_of lantern) ] ()
  in
  let _, lantern_uuid2 =
    create_page conn "Juniper" ~tags:[ Wire.Uuid (uuid_of lantern) ] ()
  in
  let tag_titles uuid =
    match entity_by_uuid conn (Option.get uuid) with
    | Some e -> sort_uniq (List.filter_map ent_title (Ldb.ref_ents e "block/tags"))
    | None -> []
  in
  check "Same title with a different tag creates a new page"
    (kestrel_uuid <> lantern_uuid);
  check "Both pages share the title"
    (count_entities_titled (db_of conn) "Juniper" = 2);
  check "kestrel page tags" (tag_titles kestrel_uuid = [ "Kestrel"; "Page" ]);
  check "lantern page tags" (tag_titles lantern_uuid = [ "Lantern"; "Page" ]);
  check "Same title and tag reuses the existing tagged page"
    (lantern_uuid = lantern_uuid2);
  let lantern_page =
    entity_by_uuid_exn conn (Option.get lantern_uuid)
  in
  check "Page title uniqueness allows the same title for different tags"
    (try
       Outliner_validate.validate_block_title (db_of conn) "Juniper"
         (Some lantern_page);
       true
     with _ -> false);
  check "Graph remains valid"
    ((Db_validate.validate_db (db_of conn)).errors = [])

(* (deftest create-page-with-page-tag-reuses-page-class ...) *)
let test_create_page_with_page_tag_reuses_page_class () =
  let conn = create_conn_with_blocks () in
  let _, page_uuid = create_page conn "Foo" ~tags:[ parsed_tag "Page" ] () in
  let foo = entity_by_uuid_exn conn (Option.get page_uuid) in
  let db = db_of conn in
  check "foo title" (ent_title foo = Some "Foo");
  check "#Page must reuse the built-in Page class"
    (count_entities_titled db "Page" = 1);
  check "foo has Page tag"
    (List.mem "logseq.class/Page" (tag_idents foo))

(* (deftest create-page-with-resolved-user-tag-titled-tag ...) *)
let test_create_page_with_resolved_user_tag_titled_tag () =
  let conn = create_conn_with_blocks () in
  let _, class_uuid = create_page conn "MyTag" ~class_:true () in
  let my_tag = entity_by_uuid_exn conn (Option.get class_uuid) in
  let my_tag_ident = Option.get (Ldb.ident_of my_tag) in
  let _, foo_uuid =
    create_page conn "Foo"
      ~tags:
        [ Wire.Map
            [ Wire.Keyword "db/ident", Wire.Keyword my_tag_ident
            ; Wire.Keyword "block/title", Wire.String "Tag"
            ; Wire.Keyword "block/uuid", Wire.Uuid (gen_uuid ()) ] ]
      ()
  in
  let foo = entity_by_uuid_exn conn (Option.get foo_uuid) in
  check "An explicit user-class ident is reused even when the title is Tag"
    (List.mem my_tag_ident (tag_idents foo));
  check "Must not resolve a titled-Tag user class to the built-in Tag class"
    (count_entities_titled (db_of conn) "Tag" = 1)

(* (deftest delete-page ...) *)
let test_delete_page () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "D1" };
            blocks = [ { default_block with b_title = Some "b1" } ] } ]
      ()
  in
  let db = db_of conn in
  let d1 = Option.get (Ldb.get_page db (String "D1")) in
  let b1 = Option.get (find_block_by_content db "b1") in
  transact_maps conn
    [ [ "db/id", Int b1.id
      ; "block/title", Str ("b1 [[" ^ uuid_of d1 ^ "]]")
      ; "block/refs", Set_ [ Int d1.id ] ] ];
  let db = db_of conn in
  let b1' = ent_of_ref_exn db (Entity_id b1.id) in
  check "b1 refs d1" (List.mem d1.id (Ldb.ref_ids b1' "block/refs"));
  ignore
    (Outliner_page.delete_conn conn (uuid_of d1) (Wire.Map []));
  let db = db_of conn in
  let d1' = ent_of_ref_exn db (Entity_id d1.id) in
  let b1' = ent_of_ref_exn db (Entity_id b1.id) in
  let recycle = Option.get (Ldb.get_built_in_page db "Recycle") in
  check "d1 still exists" true;
  check "b1 still exists" true;
  check "d1 parented under Recycle"
    ((match Ldb.ref_ent d1' "block/parent" with
      | Some p -> uuid_of p = uuid_of recycle
      | None -> false));
  check "deleted-at is an int"
    (match Ldb.value d1' "logseq.property/deleted-at" with
     | Some (Int _) -> true
     | _ -> false);
  (* f6fc6f78ac: assert the stored :block/title datom keeps the internal
     page ref; :block/raw-title is a derived lookup with no stored datoms *)
  check "b1 title keeps original page ref"
    (Ldb.string_value b1' "block/title"
     = Some ("b1 " ^ Db_content.page_ref (uuid_of d1)));
  check "b1 stores no raw-title datom"
    (Ldb.value b1' "block/raw-title" = None);
  check "b1 still refs d1" (List.mem d1.id (Ldb.ref_ids b1' "block/refs"));
  check "b1 page is d1"
    ((match Ldb.ref_ent b1' "block/page" with
      | Some p -> uuid_of p = uuid_of d1'
      | None -> false))

(* (deftest delete-page-succeeds-when-recycle-missing ...) *)
let test_delete_page_succeeds_when_recycle_missing () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "D-missing" };
            blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let page = Option.get (Ldb.get_page db (String "D-missing")) in
  let recycle = Option.get (Ldb.get_built_in_page db "Recycle") in
  ignore
    (Datascript.transact_conn conn
       [ RetractEntity (Entity_id recycle.id) ]);
  check "recycle is gone"
    (Ldb.get_built_in_page (db_of conn) "Recycle" = None);
  let r =
    Outliner_page.delete_conn conn (uuid_of page) (Wire.Map [])
  in
  check "delete! returned true" (r = Wire.Bool true);
  let db = db_of conn in
  let page' = ent_of_ref_exn db (Entity_id page.id) in
  let recycle' = Option.get (Ldb.get_built_in_page db "Recycle") in
  check "recreated recycle is a page" (Ldb.is_page recycle');
  check "recreated recycle tagged Page"
    (List.mem "logseq.class/Page" (tag_idents recycle'));
  check "page is recycled" (Ldb.recycled page');
  check "page parented under recycle"
    ((match Ldb.ref_ent page' "block/parent" with
      | Some p -> p.id = recycle'.id
      | None -> false))

(* (deftest delete-page-succeeds-when-recycle-untagged ...) *)
let test_delete_page_succeeds_when_recycle_untagged () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "D-untagged" };
            blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let page = Option.get (Ldb.get_page db (String "D-untagged")) in
  let recycle = Option.get (Ldb.get_built_in_page db "Recycle") in
  let page_class = ident_ent_exn db "logseq.class/Page" in
  ignore
    (Datascript.transact_conn conn
       [ Retract (Entity_id recycle.id, "block/tags",
          Some (Ref page_class.id)) ]);
  check "recycle no longer a page"
    (not (Ldb.is_page (ent_of_ref_exn (db_of conn) (Entity_id recycle.id))));
  let r =
    Outliner_page.delete_conn conn (uuid_of page) (Wire.Map [])
  in
  check "delete! returned true" (r = Wire.Bool true);
  let db = db_of conn in
  let page' = ent_of_ref_exn db (Entity_id page.id) in
  let recycle' = ent_of_ref_exn db (Entity_id recycle.id) in
  check "recycle is a page again" (Ldb.is_page recycle');
  check "recycle tagged Page again"
    (List.mem "logseq.class/Page" (tag_idents recycle'));
  check "page is recycled" (Ldb.recycled page');
  check "page parented under recycle"
    ((match Ldb.ref_ent page' "block/parent" with
      | Some p -> p.id = recycle'.id
      | None -> false))

(* (deftest delete-class-page-hard-retracts-page-tree ...) *)
let test_delete_class_page_hard_retracts_page_tree () =
  let conn =
    create_conn_with_blocks ~classes:[ "Movie", default_class ] ()
  in
  let db = db_of conn in
  let class_page = Option.get (Ldb.get_page db (String "Movie")) in
  let child_uuid = gen_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :block/title \"class child\" \
            :block/page %d :block/parent %d :block/order \"%s\"}]"
          child_uuid class_page.id class_page.id
          (Db_order.gen_key_from_max ())));
  ignore (Outliner_page.delete_conn conn (uuid_of class_page) (Wire.Map []));
  let db = db_of conn in
  check "class page is gone"
    (entity_at_uuid db (uuid_of class_page) = None);
  check "child is gone" (entity_at_uuid db child_uuid = None)

(* (deftest delete-property-page-hard-retracts-page-tree ...) *)
let test_delete_property_page_hard_retracts_page_tree () =
  let conn =
    create_conn_with_blocks
      ~properties:[ "rating", { default_property with p_type = "number" } ]
      ()
  in
  let db = db_of conn in
  let property_page = ident_ent_exn db "user.property/rating" in
  let child_uuid = gen_uuid () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :block/title \"property child\" \
            :block/page %d :block/parent %d :block/order \"%s\"}]"
          child_uuid property_page.id property_page.id
          (Db_order.gen_key_from_max ())));
  ignore
    (Outliner_page.delete_conn conn (uuid_of property_page) (Wire.Map []));
  let db = db_of conn in
  check "property page is gone"
    (Datascript.entity db (Ident "user.property/rating") = None);
  check "child is gone" (entity_at_uuid db child_uuid = None)

(* (deftest create-journal ...) *)
let test_create_journal () =
  let conn = create_conn_with_blocks () in
  let _, page_uuid = create_page conn "Dec 16th, 2024" () in
  let page = entity_by_uuid_exn conn (Option.get page_uuid) in
  check "Journal created correctly" (ent_title page = Some "Dec 16th, 2024");
  check "New journal only has Journal tag"
    (tag_idents page = [ "logseq.class/Journal" ])

(* (deftest create-journal-keeps-default-block-name-with-custom-title-format ...) *)
let test_create_journal_keeps_default_block_name () =
  let conn = create_conn_with_blocks () in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add :logseq.class/Journal :logseq.property.journal/title-format \"yyyy-MM-dd EEEE\"]]");
  let _, page_uuid = create_page conn "Dec 16th, 2024" () in
  let page = entity_by_uuid_exn conn (Option.get page_uuid) in
  check "Journal title follows configured formatter"
    (ent_title page = Some "2024-12-16 Monday");
  check
    "Journal block/name remains the default formatter, independent of \
     title format"
    (Ldb.string_value page "block/name" = Some "dec 16th, 2024")

(* (deftest create-slash-formatted-journal-does-not-create-namespace-pages ...) *)
let test_create_slash_formatted_journal_no_namespace () =
  let conn = create_conn_with_blocks () in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add :logseq.class/Journal :logseq.property.journal/title-format \"yyyy/MM/dd\"]]");
  let _, page_uuid =
    create_page conn "May 18th, 2026" ~split_namespace:true ~journal:true ()
  in
  let page = entity_by_uuid_exn conn (Option.get page_uuid) in
  let db = db_of conn in
  check "Journal title follows slash title format"
    (ent_title page = Some "2026/05/18");
  check "Journal page has the standard journal uuid"
    (uuid_of page = Common_uuid.gen_journal_page_uuid 20260518);
  check "Journal title is not split into a year namespace page"
    (Ldb.get_page db (String "2026") = None);
  check "Journal title is not split into a month namespace page"
    (Ldb.get_page db (String "05") = None);
  check "Journal title is not split into a day namespace page"
    (Ldb.get_page db (String "18") = None)

(* page_test.cljs *)
let page_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "create-class" `Quick test_create_class;
    Alcotest.test_case "create-namespace-pages" `Quick test_create_namespace_pages;
    Alcotest.test_case "create-page" `Quick test_create_page;
    Alcotest.test_case "create-page-with-tag-named-tag" `Quick test_create_page_with_tag_named_tag;
    Alcotest.test_case "create-page-with-existing-public-and-new-tags" `Quick test_create_page_with_existing_public_and_new_tags;
    Alcotest.test_case "create-page-with-public-tag-reuses-existing-page" `Quick test_create_page_with_public_tag_reuses_existing_page;
    Alcotest.test_case "create-pages-with-same-title-and-different-tags" `Quick test_create_pages_with_same_title_and_different_tags;
    Alcotest.test_case "create-page-with-page-tag-reuses-page-class" `Quick test_create_page_with_page_tag_reuses_page_class;
    Alcotest.test_case "create-page-with-resolved-user-tag-titled-tag" `Quick test_create_page_with_resolved_user_tag_titled_tag;
    Alcotest.test_case "delete-page" `Quick test_delete_page;
    Alcotest.test_case "delete-page-succeeds-when-recycle-missing" `Quick test_delete_page_succeeds_when_recycle_missing;
    Alcotest.test_case "delete-page-succeeds-when-recycle-untagged" `Quick test_delete_page_succeeds_when_recycle_untagged;
    Alcotest.test_case "delete-class-page-hard-retracts-page-tree" `Quick test_delete_class_page_hard_retracts_page_tree;
    Alcotest.test_case "delete-property-page-hard-retracts-page-tree" `Quick test_delete_property_page_hard_retracts_page_tree;
    Alcotest.test_case "create-journal" `Quick test_create_journal;
    Alcotest.test_case "create-journal-keeps-default-block-name-with-custom-title-format" `Quick test_create_journal_keeps_default_block_name;
    Alcotest.test_case "create-slash-formatted-journal-does-not-create-namespace-pages" `Quick test_create_slash_formatted_journal_no_namespace ]

let cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "validate-block-title-unique-for-properties" `Quick test_validate_block_title_unique_for_properties;
    Alcotest.test_case "validate-block-title-unique-for-tags" `Quick test_validate_block_title_unique_for_tags;
    Alcotest.test_case "validate-block-title-unique-for-namespaced-pages" `Quick test_validate_block_title_unique_for_namespaced_pages;
    Alcotest.test_case "validate-block-title-unique-for-pages" `Quick test_validate_block_title_unique_for_pages;
    Alcotest.test_case "recycle-page-creates-page-tagged-recycle-when-missing" `Quick test_recycle_page_creates_page_tagged_recycle_when_missing;
    Alcotest.test_case "recycle-page-repairs-untagged-recycle" `Quick test_recycle_page_repairs_untagged_recycle;
    Alcotest.test_case "restore-recycled-page-removes-recycle-parent" `Quick test_restore_recycled_page_removes_recycle_parent;
    Alcotest.test_case "permanently-delete-recycled-page-removes-page-and-descendants" `Quick test_permanently_delete_recycled_page_removes_page_and_descendants;
    Alcotest.test_case "permanently-delete-recycled-page-removes-blocks-parented-by-page" `Quick test_permanently_delete_recycled_page_removes_blocks_parented_by_page;
    Alcotest.test_case "permanently-delete-recycled-converted-page-removes-property-value-blocks" `Quick test_permanently_delete_recycled_converted_page_removes_property_value_blocks;
    Alcotest.test_case "gc-recycled-converted-page-removes-property-value-blocks" `Quick test_gc_recycled_converted_page_removes_property_value_blocks;
    Alcotest.test_case "recycle-stores-full-deleted-at-ms" `Quick test_recycle_stores_full_deleted_at_ms;
    Alcotest.test_case "insert-blocks-stores-numeric-timestamps" `Quick test_insert_blocks_stores_numeric_timestamps;
    Alcotest.test_case "gc-keeps-unexpired-recycled-page" `Quick test_gc_keeps_unexpired_recycled_page;
    Alcotest.test_case "permanently-delete-recycled-block-removes-subtree-only" `Quick test_permanently_delete_recycled_block_removes_subtree_only;
    Alcotest.test_case "permanently-delete-recycled-block-removes-corresponding-view-history" `Quick test_permanently_delete_recycled_block_removes_corresponding_view_history;
    Alcotest.test_case "apply-ops-restore-recycled-page-removes-recycle-parent" `Quick test_apply_ops_restore_recycled_page_removes_recycle_parent;
    Alcotest.test_case "apply-ops-permanently-delete-recycled-page-removes-page-and-descendants" `Quick test_apply_ops_permanently_delete_recycled_page;
    Alcotest.test_case "apply-ops-permanently-delete-recycled-block-removes-subtree-only" `Quick test_apply_ops_permanently_delete_recycled_block;
    Alcotest.test_case "new-graph-should-be-valid" `Quick test_new_graph_should_be_valid ]

(* f6fc6f78ac (deftest insert-blocks-preserves-existing-reference-ids):
   an inserted block whose title refs a page and whose :block/refs already
   names that entity must keep the caller-supplied reference id, not a
   re-allocated one *)
let test_insert_blocks_preserves_existing_reference_ids () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Test" }
          ; blocks =
              [ { default_block with b_title = Some "Target" }
              ; { default_block with b_title = Some "Referenced" } ] } ]
      ()
  in
  let db = db_of conn in
  let target = Option.get (find_block_by_content db "Target") in
  let referenced = Option.get (find_block_by_content db "Referenced") in
  let referenced_uuid = uuid_of referenced in
  let new_uuid = gen_uuid () in
  let opts =
    { Outliner_core.default_insert_opts with
      sibling = true; keep_uuid = true }
  in
  ignore
    (Outliner_core.insert_blocks_conn conn
       [ [ "block/uuid", Uuid new_uuid
         ; "block/title", String (Db_content.page_ref referenced_uuid)
         ; "block/refs", List [ Ref referenced.id ] ] ]
       (Block_map.of_entity target) opts []);
  let inserted = entity_by_uuid_exn conn new_uuid in
  check "insert keeps explicit reference ids"
    (List.map uuid_of (Ldb.ref_ents inserted "block/refs")
     = [ referenced_uuid ])

(* op_test.cljs *)
let op_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "insert-blocks-preserves-existing-reference-ids" `Quick test_insert_blocks_preserves_existing_reference_ids;
    Alcotest.test_case "toggle-reaction-op" `Quick test_toggle_reaction_op;
    Alcotest.test_case "collapse-expand-blocks-op" `Quick test_collapse_expand_blocks_op;
    Alcotest.test_case "resolve-indent-outdent-parent-original-test" `Quick test_resolve_indent_outdent_parent_original;
    Alcotest.test_case "apply-ops-plugin-property-sequence-test" `Quick test_apply_ops_plugin_property_sequence;
    Alcotest.test_case "remove-block-property-op-rejects-lookup-ref-block-id-test" `Quick test_remove_block_property_op_rejects_lookup_ref_block_id;
    Alcotest.test_case "direct-plugin-many-page-property-appends-values-test" `Quick test_direct_plugin_many_page_property_appends_values;
    Alcotest.test_case "apply-template-op-resolves-dynamic-variables-test" `Quick test_apply_template_op_resolves_dynamic_variables;
    Alcotest.test_case "apply-ops-requires-uuid-block-ids-and-keyword-property-ids-test" `Quick test_apply_ops_requires_uuid_block_ids_and_keyword_property_ids ]

(* pipeline_test.cljs *)
let pipeline_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "block-content-refs" `Quick test_block_content_refs;
    Alcotest.test_case "db-rebuild-block-refs-for-query-block" `Quick test_db_rebuild_block_refs_for_query_block;
    Alcotest.test_case "db-rebuild-block-refs-removes-recursive-self-ref" `Quick test_db_rebuild_block_refs_removes_recursive_self_ref;
    Alcotest.test_case "bulk-block-refs-preserve-datetime-and-content-rules" `Quick test_bulk_block_refs_preserve_datetime_and_content_rules ]

(* tree_test.cljs *)
let tree_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "blocks->vec-tree-data-preserves-caller-field-policy" `Quick test_blocks_vec_tree_data_preserves_caller_field_policy ]

(* property_test.cljs remainder (the first 20 deftests are in
   test_db_native.ml's endpoint group) *)
let property_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "property-with-other-position-default-bottom-rules" `Quick test_property_with_other_position_default_bottom_rules;
    Alcotest.test_case "get-block-positioned-properties-filters-non-public" `Quick test_get_block_positioned_properties_filters_non_public;
    Alcotest.test_case "get-block-positioned-properties-keeps-empty-inherited-tag-properties" `Quick test_get_block_positioned_properties_keeps_empty_inherited_tag_properties;
    Alcotest.test_case "extends-cycle" `Quick test_extends_cycle;
    Alcotest.test_case "extends-redundant-direct-parent-cleanup" `Quick test_extends_redundant_direct_parent_cleanup;
    Alcotest.test_case "extends-redundant-cleanup-with-lookup-ref-parent" `Quick test_extends_redundant_cleanup_with_lookup_ref_parent;
    Alcotest.test_case "extends-redundant-cleanup-with-keyword-vector-parents" `Quick test_extends_redundant_cleanup_with_keyword_vector_parents;
    Alcotest.test_case "extends-redundant-direct-parent-cleanup-for-root-reset" `Quick test_extends_redundant_direct_parent_cleanup_for_root_reset;
    Alcotest.test_case "delete-property-value!" `Quick test_delete_property_value ]

(* core_test uses value ctors heavily; re-open so they win over
   Db_test_util.edn's same-named ctors. *)
open Datascript

(* ---------- core_test.cljs ----------
   All 16 deftests ported.
   Notes:
   - cljs passes :end-order-state [:known stale-order] in
     insert-blocks-does-not-trust-stale-right-order — the key is dead in
     cljs (never destructured); both impls consult the live right
     sibling, so the OCaml port needs no such field.
   - cljs delete-blocks! takes {:deleted-by-uuid u}; OCaml
     delete_blocks has no per-op deleted-by arg — the opt is dropped
     (the asserted hard retractions don't depend on it).
   - cljs throws ex-info/js/Error; OCaml raises
     Outliner_validate.Notification — asserts are on the message text.
   Known lib/engine bugs red-lining cases here (reported, no workarounds):
   - 'Lookup ref attribute should be marked as :db/unique:
     [:logseq.class/Page :logseq.class/Page]' — lib emits a duplicated
     block/tags ref pair that datascript-ocaml reads as a lookup-ref
     (engine; insert-blocks-reuses-page-* cases).
   - Negative db/id tempids: lib maps 'Int n' to 'Entity_id n' in
     block_map.ml/db_transact.ml/outliner_core.ml regardless of sign, so
     {:db/id -1} in tx data fails 'entity id must not be negative' inside
     apply_tx (insert-blocks-resolves-journal-class-tagged-refs).
   - Block_map.of_entity writes db/id as 'Ref e.id' while
     mget_int/int_attr only matches 'Int' — filter_top_level_blocks and
     save_block's db/id read miss it (test-delete-page-with-outliner-core).
   - OCaml get_target_block does not re-resolve target-block through
     d/entity like cljs core.cljs get-target-block does, so an entity
     captured before a tag tx reads stale block/tags
     (move-blocks-protects-comment-blocks last two asserts).
   - Db_validate.validate_db is stricter than cljs on entities written
     by faithful tx data (range-comments Comments area kept after a
     partial delete fails validation; same family as the 183-error seed
     divergence). *)

(* cljs outliner-core/insert-blocks! *)
let insert_blocks_bang conn (blocks : Block_map.t list)
    (target_bm : Block_map.t) ?(opts = Outliner_core.default_insert_opts)
    () : unit =
  ignore (Outliner_core.insert_blocks_conn conn blocks target_bm opts [])

(* cljs outliner-core/delete-blocks! *)
let delete_blocks_bang conn (blocks : entity list) () : unit =
  ignore
    (Outliner_core.delete_blocks_conn conn
       (List.map Block_map.of_entity blocks)
       [])

(* cljs outliner-core/move-blocks! *)
let move_blocks_bang conn (blocks : entity list) (target : entity)
    ?(opts = Outliner_core.default_insert_opts) () : unit =
  Outliner_core.move_blocks_conn conn blocks target opts []

(* cljs outliner-core/save-block! *)
let save_block_bang conn (block : Block_map.t) () : unit =
  ignore
    (Outliner_core.save_block_conn conn block
       Outliner_core.default_save_opts [])

let bm_string (m : Block_map.t) (a : attr) : string option =
  match List.assoc_opt a m with Some (String s) -> Some s | _ -> None

let bm_uuid (m : Block_map.t) (a : attr) : string option =
  match List.assoc_opt a m with Some (Uuid u) -> Some u | _ -> None

(* (into {} [:block/uuid ...])-style nested map as a value *)
let bm_as_value (m : Block_map.t) : value =
  Datascript.Map (List.map (fun (a, v) -> Datascript.Keyword a, v) m)

(* (:block/uuid (first (:block/refs bm))) *)
let first_ref_uuid (m : Block_map.t) (a : attr) : string option =
  match (List.assoc_opt a m : value option) with
  | Some (Datascript.List (Datascript.Map kvs :: _))
  | Some (Datascript.Vector (Datascript.Map kvs :: _)) ->
      List.find_map
        (fun (k, v) ->
          match k, v with
          | (Datascript.Keyword "block/uuid" | Datascript.String "block/uuid")
          , Datascript.Uuid u ->
              Some u
          | _ -> None)
        kvs
  | _ -> None

(* cljs test's page-uuids-named *)
let page_uuids_named (db : db) (title : string) : string list =
  Datascript.q_string db
    ~inputs:
      [ Arg_scalar (Result_value (String (Ldb.page_name_sanity_lc title))) ]
    "[:find [?uuid ...] :in $ ?name :where [?e :block/name ?name] \
      [?e :block/uuid ?uuid] [?e :block/tags :logseq.class/Page]]"
  |> List.filter_map (function
       | [ Result_value (Uuid u) ] -> Some u
       | [ Result_value (String u) ] -> Some u
       | _ -> None)

(* (deftest insert-blocks-does-not-trust-stale-right-order ...)
   cljs passes :end-order-state [:known stale-order]; that key is dead in
   cljs too (insert-blocks never destructures it) — both impls always
   consult the live right sibling, which is what this test proves. *)
let test_insert_blocks_does_not_trust_stale_right_order () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with b_title = Some "target" };
                { default_block with b_title = Some "original right" } ] } ]
      ()
  in
  let opts =
    { Outliner_core.default_insert_opts with
      sibling = true; keep_uuid = true }
  in
  insert_blocks_bang conn
    [ [ "block/uuid", Uuid (gen_uuid ())
      ; "block/title", String "concurrent right" ] ]
    (Block_map.of_entity
       (Option.get (find_block_by_content (db_of conn) "target")))
    ~opts ();
  let db = db_of conn in
  let target = Option.get (find_block_by_content db "target") in
  let current_right = Option.get (Ldb.get_right_sibling target) in
  let _r, blocks =
    Outliner_core.insert_blocks db
      [ [ "block/uuid", Uuid (gen_uuid ())
        ; "block/title", String "inserted" ] ]
      (Block_map.of_entity target) opts
  in
  let inserted_order =
    match bm_string (List.hd blocks) "block/order" with
    | Some s -> s
    | None -> ""
  in
  let right_order =
    match Ldb.string_value current_right "block/order" with
    | Some s -> s
    | None -> ""
  in
  check "insert stale-right current-right"
    (Ldb.string_value current_right "block/title" = Some "concurrent right");
  check "insert stale-right order before current right"
    (String.compare inserted_order right_order < 0)

(* (deftest insert-blocks-finds-right-order-on-1k-sibling-page ...) *)
let test_insert_blocks_finds_right_order_on_1k_sibling_page () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              List.init 1000 (fun i ->
                  { default_block with
                    b_title = Some (Printf.sprintf "block %d" i) }) } ]
      ()
  in
  let db = db_of conn in
  let target = Option.get (find_block_by_content db "block 0") in
  let target_bm = Block_map.of_entity target in
  let insert () =
    Outliner_core.insert_blocks db
      [ [ "block/uuid", Uuid (gen_uuid ())
        ; "block/title", String "inserted" ] ]
      target_bm
      { Outliner_core.default_insert_opts with
        sibling = true; keep_uuid = true }
  in
  ignore (insert ());
  let started = Unix.gettimeofday () in
  let _r, blocks = insert () in
  let elapsed_ms = (Unix.gettimeofday () -. started) *. 1000. in
  let right = Option.get (Ldb.get_right_sibling target) in
  let inserted_order =
    match bm_string (List.hd blocks) "block/order" with
    | Some s -> s
    | None -> ""
  in
  let right_order =
    match Ldb.string_value right "block/order" with
    | Some s -> s
    | None -> ""
  in
  check "inserted before right sibling"
    (String.compare inserted_order right_order < 0);
  check "1k sibling insertion order lookup under 100ms" (elapsed_ms < 100.)

(* (deftest blocks-with-level-handles-10k-deep-tree ...) *)
let test_blocks_with_level_handles_10k_deep_tree () =
  let blocks : Block_map.t list =
    List.init 10000 (fun i ->
        let id = i + 1 in
        [ "db/id", Int id
        ; "block/uuid", Uuid (string_of_int id)
        ; "block/parent"
        , Datascript.Map [ Datascript.Keyword "db/id", Int (id - 1) ] ])
  in
  let started = Unix.gettimeofday () in
  let result = Outliner_core.blocks_with_level blocks in
  let elapsed_ms = (Unix.gettimeofday () -. started) *. 1000. in
  check "first block level is 1"
    (Block_map.attr_value (List.hd result) "block/level" = Some (Int 1));
  check "last block level is 10000"
    (Block_map.attr_value
       (List.nth result 9999) "block/level"
     = Some (Int 10000));
  check "10k level calculation under 250ms" (elapsed_ms < 250.)

(* (deftest existing-inline-class-uses-its-canonical-uuid ...) *)
let test_existing_inline_class_uses_its_canonical_uuid () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [] } ]
      ()
  in
  let class_uuid = gen_uuid () in
  let parsed_uuid = gen_uuid () in
  let ref_map =
    Datascript.Map
      [ Datascript.Keyword "block/type", String "page"
      ; Datascript.Keyword "block/name", String "existing"
      ; Datascript.Keyword "block/title", String "Existing"
      ; Datascript.Keyword "block/uuid", Uuid parsed_uuid ]
  in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/ident :user.class/existing :block/name \"existing\" \
            :block/title \"Existing\" :block/uuid #uuid \"%s\" \
            :block/tags :logseq.class/Tag}]"
          class_uuid));
  let block, page_txs =
    Outliner_core.resolve_page_refs (db_of conn)
      [ "block/title", String ("#[[" ^ parsed_uuid ^ "]]")
      ; "block/refs", Datascript.List [ ref_map ]
      ; "block/tags", Datascript.List [ ref_map ] ]
  in
  check "no page txs" (page_txs = []);
  check "title rewritten to canonical uuid"
    (bm_string block "block/title"
     = Some ("#[[" ^ class_uuid ^ "]]"));
  check "ref uuid is the canonical class uuid"
    (first_ref_uuid block "block/refs" = Some class_uuid);
  check "tag uuid is the canonical class uuid"
    (first_ref_uuid block "block/tags" = Some class_uuid)

(* (deftest insert-blocks-reuses-page-created-after-reference-parsing ...)
   cljs gp-block/page-name->map -> Outliner_page.page_name_to_map. *)
let test_insert_blocks_reuses_page_created_after_reference_parsing () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "host" } ] } ]
      ()
  in
  let parsed_ref =
    Outliner_page.page_name_to_map "Esc Dup" (db_of conn) true
      (Some "MMM do, yyyy") ()
  in
  let parsed_uuid =
    match Wire.get "block/uuid" parsed_ref with
    | Some (Wire.Uuid u) -> u
    | _ -> ""
  in
  let _page_uuid, existing_uuid_opt = create_page conn "Esc Dup" () in
  let existing_uuid = Option.get existing_uuid_opt in
  let host = Option.get (find_block_by_content (db_of conn) "host") in
  let result, blocks =
    Outliner_core.insert_blocks (db_of conn)
      [ [ "block/uuid", Uuid (gen_uuid ())
        ; "block/title", String ("[[" ^ parsed_uuid ^ "]]")
        ; "block/raw-title", String ("[[" ^ parsed_uuid ^ "]]")
        ; "block/refs"
        , Datascript.List [ bm_as_value (Block_map.of_transit parsed_ref) ] ] ]
      (Block_map.of_entity host)
      { Outliner_core.default_insert_opts with
        sibling = true; keep_uuid = true }
  in
  ignore (Datascript.transact_conn conn result.tx_data);
  check "one Esc Dup page exists"
    (page_uuids_named (db_of conn) "Esc Dup" = [ existing_uuid ]);
  let first = List.hd blocks in
  check "title rewritten to existing uuid"
    (bm_string first "block/title"
     = Some ("[[" ^ existing_uuid ^ "]]"));
  check "raw-title rewritten to existing uuid"
    (bm_string first "block/raw-title"
     = Some ("[[" ^ existing_uuid ^ "]]"));
  check "ref uuid is the existing page uuid"
    (first_ref_uuid first "block/refs" = Some existing_uuid)

(* (deftest insert-blocks-reuses-page-when-ref-tags-are-a-scalar-keyword ...) *)
let test_insert_blocks_reuses_page_when_ref_tags_are_a_scalar_keyword () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "host" } ] } ]
      ()
  in
  let _page_uuid, existing_uuid_opt = create_page conn "Esc Dup" () in
  let existing_uuid = Option.get existing_uuid_opt in
  let parsed_uuid = gen_uuid () in
  let host = Option.get (find_block_by_content (db_of conn) "host") in
  let result, blocks =
    Outliner_core.insert_blocks (db_of conn)
      [ [ "block/uuid", Uuid (gen_uuid ())
        ; "block/title", String ("[[" ^ parsed_uuid ^ "]]")
        ; "block/raw-title", String ("[[" ^ parsed_uuid ^ "]]")
        ; "block/refs"
        , Datascript.List
            [ Datascript.Map
                [ Datascript.Keyword "block/uuid", Uuid parsed_uuid
                ; Datascript.Keyword "block/title", String "Esc Dup"
                ; Datascript.Keyword "block/name", String "esc dup"
                ; Datascript.Keyword "block/tags"
                , Datascript.Keyword "logseq.class/Page" ] ] ] ]
      (Block_map.of_entity host)
      { Outliner_core.default_insert_opts with
        sibling = true; keep_uuid = true }
  in
  ignore (Datascript.transact_conn conn result.tx_data);
  check "one Esc Dup page exists"
    (page_uuids_named (db_of conn) "Esc Dup" = [ existing_uuid ]);
  check "ref uuid is the existing page uuid"
    (first_ref_uuid (List.hd blocks) "block/refs" = Some existing_uuid)

(* (deftest insert-blocks-resolves-journal-class-tagged-refs ...) *)
let test_insert_blocks_resolves_journal_class_tagged_refs () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "host" } ] } ]
      ()
  in
  let journal_title = "Dec 16th, 2024" in
  let journal_day = 20241216 in
  let canonical_uuid = Common_uuid.gen_journal_page_uuid journal_day in
  let journal_ref page_uuid =
    Datascript.Map
      [ Datascript.Keyword "block/uuid", Uuid page_uuid
      ; Datascript.Keyword "block/title", String journal_title
      ; Datascript.Keyword "block/name"
      , String (Ldb.page_name_sanity_lc journal_title)
      ; Datascript.Keyword "block/journal-day", Int journal_day
      ; Datascript.Keyword "block/tags"
      , Datascript.List [ Datascript.Keyword "logseq.class/Journal" ] ]
  in
  let host = Option.get (find_block_by_content (db_of conn) "host") in
  let journal_datoms db =
    List.length
      (List.of_seq
         (Datascript.datoms db Avet ~a:"block/journal-day"
            ~v:(Int journal_day) ()))
  in
  let insert_ref page_uuid =
    let result, blocks =
      Outliner_core.insert_blocks (db_of conn)
        [ [ "block/uuid", Uuid (gen_uuid ())
          ; "block/title", String ("[[" ^ page_uuid ^ "]]")
          ; "block/raw-title", String ("[[" ^ page_uuid ^ "]]")
          ; "block/refs", Datascript.List [ journal_ref page_uuid ] ] ]
        (Block_map.of_entity host)
        { Outliner_core.default_insert_opts with
          sibling = true; keep_uuid = true }
    in
    ignore (Datascript.transact_conn conn result.tx_data);
    blocks
  in
  let parsed_uuid = gen_uuid () in
  let blocks = insert_ref parsed_uuid in
  let journal =
    Option.get (Ldb.get_journal_page_by_day (db_of conn) journal_day)
  in
  check "parsed uuid differs from canonical" (parsed_uuid <> canonical_uuid);
  check "journal gets canonical uuid"
    (Option.map uuid_of (Some journal) = Some canonical_uuid);
  check "one journal-day datom" (journal_datoms (db_of conn) = 1);
  check "journal tagged Journal class"
    (List.filter_map Ldb.ident_of (Ldb.ref_ents journal "block/tags")
     = [ "logseq.class/Journal" ]);
  check "ref uuid is canonical"
    (first_ref_uuid (List.hd blocks) "block/refs" = Some canonical_uuid);
  let parsed_uuid2 = gen_uuid () in
  let blocks2 = insert_ref parsed_uuid2 in
  let journal2 =
    Option.get (Ldb.get_journal_page_by_day (db_of conn) journal_day)
  in
  check "existing journal reused" (uuid_of journal2 = canonical_uuid);
  check "still one journal-day datom" (journal_datoms (db_of conn) = 1);
  check "second ref uuid is canonical"
    (first_ref_uuid (List.hd blocks2) "block/refs" = Some canonical_uuid)

(* (deftest test-delete-block-with-default-property ...) *)
let test_delete_block_with_default_property () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with
                  b_title = Some "b1"
                ; b_properties = [ "default", Str "test block" ] } ] } ]
      ()
  in
  let block =
    Option.get (find_block_by_content (db_of conn) "b1")
  in
  delete_blocks_bang conn [ block ] ();
  check "block with default property hard retracts"
    (find_block_by_content (db_of conn) "b1" = None)

(* (deftest test-delete-page-with-outliner-core ...) *)
let test_delete_page_with_outliner_core () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "b1" } ] };
          { page = { default_page with pg_title = Some "page2" };
            blocks =
              [ { default_block with b_title = Some "b3" }
              ; { default_block with b_title = Some "b4" } ] } ]
      ()
  in
  let page2 = Option.get (Ldb.get_page (db_of conn) (String "page2")) in
  let page1 = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id %d :block/order \"a1\" :block/parent %d}]" page2.id
          page1.id));
  let b3 = Option.get (find_block_by_content (db_of conn) "b3") in
  let b4 = Option.get (find_block_by_content (db_of conn) "b4") in
  delete_blocks_bang conn [ b3; b4; page2 ] ();
  check "b3 kept" (find_block_by_content (db_of conn) "b3" <> None);
  check "b4 kept" (find_block_by_content (db_of conn) "b4" <> None);
  let page2' = Option.get (Ldb.get_page (db_of conn) (String "page2")) in
  check "page2 title intact" (ent_title page2' = Some "page2");
  check "page2 parent detached"
    (Ldb.ref_ent page2' "block/parent" = None);
  check "page2 order detached"
    (Ldb.value page2' "block/order" = None)

(* (deftest delete-blocks-hard-retracts-subtree ...) *)
let test_delete_blocks_hard_retracts_subtree () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with
                  b_title = Some "parent"
                ; b_children =
                    [ { default_block with b_title = Some "child" } ] } ] } ]
      ()
  in
  let parent = Option.get (find_block_by_content (db_of conn) "parent") in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf "[{:block/uuid #uuid \"%s\" :block/title \"Alice\"}]"
          (gen_uuid ())));
  delete_blocks_bang conn [ parent ] ();
  check "parent retracted"
    (find_block_by_content (db_of conn) "parent" = None);
  check "child retracted"
    (find_block_by_content (db_of conn) "child" = None)

(* the two range-comments deftests share the same graph setup *)
let range_comments_conn () =
  let comments_uuid = gen_uuid () in
  let comment_uuid = gen_uuid () in
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with b_title = Some "target 1" }
              ; { default_block with b_title = Some "target 2" } ] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let target_1 = Option.get (find_block_by_content (db_of conn) "target 1") in
  let target_2 = Option.get (find_block_by_content (db_of conn) "target 2") in
  let now_ms = int_of_float (now ()) in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/ident :logseq.class/Comments
            :block/uuid #uuid \"%s\" :block/title \"Comments\"}
           {:db/id -1
            :block/uuid #uuid \"%s\"
            :block/title \"Comments\"
            :block/page %d
            :block/parent %d
            :block/order \"a3\"
            :block/created-at %d
            :block/updated-at %d
            :block/tags #{:logseq.class/Comments}
            :logseq.property.comments/blocks #{%d %d}}
           {:block/uuid #uuid \"%s\"
            :block/title \"comment\"
            :block/page %d
            :block/parent -1
            :block/order \"a0\"
            :block/created-at %d
            :block/updated-at %d}]"
          (gen_uuid ()) comments_uuid page.id page.id now_ms now_ms
          target_1.id target_2.id comment_uuid page.id now_ms now_ms));
  conn, comments_uuid, comment_uuid, target_1, target_2

(* (deftest delete-blocks-removes-range-comments-when-all-targets-are-deleted ...) *)
let test_delete_blocks_removes_range_comments_when_all_targets_are_deleted () =
  let conn, comments_uuid, comment_uuid, target_1, target_2 =
    range_comments_conn ()
  in
  delete_blocks_bang conn [ target_1; target_2 ] ();
  check "comments area removed"
    (entity_by_uuid conn comments_uuid = None);
  check "comment removed"
    (entity_by_uuid conn comment_uuid = None)

(* (deftest delete-blocks-keeps-range-comments-when-some-targets-remain ...) *)
let test_delete_blocks_keeps_range_comments_when_some_targets_remain () =
  let conn, comments_uuid, comment_uuid, target_1, target_2 =
    range_comments_conn ()
  in
  delete_blocks_bang conn [ target_1 ] ();
  check "comments area kept"
    (entity_by_uuid conn comments_uuid <> None);
  check "comment kept"
    (entity_by_uuid conn comment_uuid <> None);
  check "target 2 kept"
    (Option.is_some (Ldb.ent_of_id (db_of conn) target_2.id))

(* (deftest delete-blocks-rejects-built-in-entities ...) *)
let test_delete_blocks_rejects_built_in_entities () =
  let conn = Db_test_util.create_conn () in
  let db = db_of conn in
  let recycle_page = Option.get (Ldb.get_page db (String "recycle")) in
  check "recycle page is built-in" (Ldb.built_in recycle_page);
  throws_with "built-in page is rejected" "Built-in nodes can't be deleted"
    (fun () -> delete_blocks_bang conn [ recycle_page ] ());
  let placeholder =
    Option.get
      (Datascript.entity db (Ident "logseq.property/empty-placeholder"))
  in
  check "placeholder has uuid" (uuid_of placeholder <> "");
  throws_with "built-in ident is rejected" "Built-in nodes can't be deleted"
    (fun () -> delete_blocks_bang conn [ placeholder ] ());
  let file =
    Option.get
      (Option.bind
         (Seq.uncons (Datascript.datoms db Avet ~a:"file/path" ()))
         (fun (d, _) -> Ldb.ent_of_id db d.e))
  in
  check "file entity has file/path"
    (Ldb.value file "file/path" <> None);
  throws_with "file entity is rejected" "Built-in nodes can't be deleted"
    (fun () -> delete_blocks_bang conn [ file ] ());
  let kv =
    Option.get (Datascript.entity db (Ident "logseq.kv/db-type"))
  in
  check "kv entity has db/id" (kv.id > 0);
  throws_with "KV entity is rejected" "Built-in nodes can't be deleted"
    (fun () -> delete_blocks_bang conn [ kv ] ())

(* (deftest save-block-rejects-built-in-entity ...) *)
let test_save_block_rejects_built_in_entity () =
  let conn = Db_test_util.create_conn () in
  let placeholder =
    Option.get
      (Datascript.entity (db_of conn) (Ident "logseq.property/description"))
  in
  throws_with "built-in entity can't be saved" "can't be modified"
    (fun () ->
      save_block_bang conn
        [ "db/id", Int placeholder.id
        ; "block/title", String "hacked" ]
        ())

(* (deftest move-blocks-rejects-built-in-entity ...) *)
let test_move_blocks_rejects_built_in_entity () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "target" } ] } ]
      ()
  in
  let placeholder =
    Option.get
      (Datascript.entity (db_of conn) (Ident "logseq.property/description"))
  in
  let target = Option.get (find_block_by_content (db_of conn) "target") in
  throws_with "built-in entity can't be moved" "can't be modified"
    (fun () ->
      move_blocks_bang conn [ placeholder ] target
        ~opts:{ Outliner_core.default_insert_opts with sibling = true }
        ())

(* (deftest move-blocks-protects-comment-blocks ...) *)
let test_move_blocks_protects_comment_blocks () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks =
              [ { default_block with b_title = Some "target" }
              ; { default_block with b_title = Some "tagged comment" }
              ; { default_block with
                  b_title = Some "normal parent"
                ; b_children =
                    [ { default_block with b_title = Some "ordinary" } ] }
              ; { default_block with b_title = Some "Comments" } ] } ]
      ()
  in
  let page = Option.get (Ldb.get_page (db_of conn) (String "page1")) in
  let target = Option.get (find_block_by_content (db_of conn) "target") in
  let tagged_comment =
    Option.get (find_block_by_content (db_of conn) "tagged comment")
  in
  let ordinary = Option.get (find_block_by_content (db_of conn) "ordinary") in
  let comments_area =
    Option.get (find_block_by_content (db_of conn) "Comments")
  in
  let original_comment_parent_id =
    (Option.get (Ldb.ref_ent tagged_comment "block/parent")).id
  in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :db/ident :logseq.class/Tag
            :block/uuid #uuid \"%s\" :block/title \"Tag\"
            :block/tags #{-1}}
           {:db/ident :logseq.class/Comments
            :block/uuid #uuid \"%s\" :block/title \"Comments\"
            :block/tags #{-1}}
           {:db/ident :logseq.class/Comment
            :block/uuid #uuid \"%s\" :block/title \"Comment\"
            :block/tags #{-1}}
           [:db/add %d :block/tags :logseq.class/Comments]
           [:db/add %d :block/tags :logseq.class/Comment]]"
          (gen_uuid ()) (gen_uuid ()) (gen_uuid ()) comments_area.id
          tagged_comment.id));
  let parent_id_of (e : entity) =
    Option.map (fun (p : entity) -> p.id)
      (Ldb.ref_ent e "block/parent")
  in
  move_blocks_bang conn [ tagged_comment ] target ();
  check "#Comment blocks cannot be moved after creation"
    (parent_id_of
       (Option.get (Ldb.ent_of_id (db_of conn) tagged_comment.id))
     = Some original_comment_parent_id);
  move_blocks_bang conn [ comments_area ] target ();
  check "#Comments blocks cannot be moved as children"
    (parent_id_of
       (Option.get (Ldb.ent_of_id (db_of conn) comments_area.id))
     = Some page.id);
  move_blocks_bang conn [ comments_area ] target
    ~opts:{ Outliner_core.default_insert_opts with sibling = true } ();
  let page' = Option.get (Ldb.ent_of_id (db_of conn) page.id) in
  let children =
    List.filter_map ent_title
      (Ldb.sort_by_order (Ldb.ref_ents page' "block/_parent"))
  in
  check "#Comments blocks can be moved as siblings"
    (children = [ "target"; "Comments"; "tagged comment"; "normal parent" ]);
  move_blocks_bang conn [ ordinary ] comments_area
    ~opts:{ Outliner_core.default_insert_opts with sibling = true } ();
  check "ordinary blocks can be moved as siblings of #Comments"
    (parent_id_of (Option.get (Ldb.ent_of_id (db_of conn) ordinary.id))
     = Some page.id);
  move_blocks_bang conn [ ordinary ] comments_area ();
  check "ordinary blocks cannot be moved as children of #Comments"
    (parent_id_of (Option.get (Ldb.ent_of_id (db_of conn) ordinary.id))
     = Some page.id);
  move_blocks_bang conn [ ordinary ] tagged_comment ();
  check "ordinary blocks cannot be moved to #Comment blocks"
    (parent_id_of (Option.get (Ldb.ent_of_id (db_of conn) ordinary.id))
     = Some page.id)

(* core_test.cljs — the ported deftests *)
let core_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "insert-blocks-does-not-trust-stale-right-order" `Quick test_insert_blocks_does_not_trust_stale_right_order;
    Alcotest.test_case "insert-blocks-finds-right-order-on-1k-sibling-page" `Quick test_insert_blocks_finds_right_order_on_1k_sibling_page;
    Alcotest.test_case "blocks-with-level-handles-10k-deep-tree" `Quick test_blocks_with_level_handles_10k_deep_tree;
    Alcotest.test_case "existing-inline-class-uses-its-canonical-uuid" `Quick test_existing_inline_class_uses_its_canonical_uuid;
    Alcotest.test_case "insert-blocks-reuses-page-created-after-reference-parsing" `Quick test_insert_blocks_reuses_page_created_after_reference_parsing;
    Alcotest.test_case "insert-blocks-reuses-page-when-ref-tags-are-a-scalar-keyword" `Quick test_insert_blocks_reuses_page_when_ref_tags_are_a_scalar_keyword;
    Alcotest.test_case "insert-blocks-resolves-journal-class-tagged-refs" `Quick test_insert_blocks_resolves_journal_class_tagged_refs;
    Alcotest.test_case "test-delete-block-with-default-property" `Quick test_delete_block_with_default_property;
    Alcotest.test_case "test-delete-page-with-outliner-core" `Quick test_delete_page_with_outliner_core;
    Alcotest.test_case "delete-blocks-hard-retracts-subtree" `Quick test_delete_blocks_hard_retracts_subtree;
    Alcotest.test_case "delete-blocks-removes-range-comments-when-all-targets-are-deleted" `Quick test_delete_blocks_removes_range_comments_when_all_targets_are_deleted;
    Alcotest.test_case "delete-blocks-keeps-range-comments-when-some-targets-remain" `Quick test_delete_blocks_keeps_range_comments_when_some_targets_remain;
    Alcotest.test_case "delete-blocks-rejects-built-in-entities" `Quick test_delete_blocks_rejects_built_in_entities;
    Alcotest.test_case "save-block-rejects-built-in-entity" `Quick test_save_block_rejects_built_in_entity;
    Alcotest.test_case "move-blocks-rejects-built-in-entity" `Quick test_move_blocks_rejects_built_in_entity;
    Alcotest.test_case "move-blocks-protects-comment-blocks" `Quick test_move_blocks_protects_comment_blocks ]

(* ========== deps/outliner/test/logseq/outliner/copy_paste_nested_test.cljs ==========
   1:1 translations of all 6 deftests — they exercise insert-blocks! /
   delete-blocks! / move-blocks! plus cljs clipboard-block serialization
   (entity refs -> [:block/uuid u] lookup-refs), so no op-construct
   dependency.

   ========== deps/outliner/test/logseq/outliner/cut_paste_property_test.cljs ==========
   All 8 deftests ported — undo-delete-restores-all-property-types and
   delete-inverse-includes-property-value-children live in the
   op_construct section below (they need derive-history-outliner-ops)
   and are registered in cut_paste_undo_cases.
   op_construct_test.cljs (17) and move_property_value_undo_test.cljs (3)
   are fully ported in the sections at the end of this file.

   Reported lib divergence (not worked around): Ldb.property_value_content
   returns [string option] while cljs db-property/property-value-content
   returns the RAW value (number/bool/datetime/journal-day). The
   property-contents port below reads :block/title / :logseq.property/value
   directly, matching cljs.

   CURRENT STATUS: all 11 tests in these two groups are red on the
   negative-tempid lib/engine bug already reported for outliner-core —
   assign_temp_id writes ("db/id", Int -(idx+1)) (outliner_core.ml:1531)
   and save-block path mget_int->"db/id"->Entity_id (:967); both reach
   max_explicit_tx_entity which rejects negative Entity_id
   ("entity id must not be negative: -1"). No workaround added — same fix
   (negative Int db/id -> Temp_id, not Entity_id) covers all cases. *)

(* cljs ->lookup-ref *)
let uuid_lookup_ref (u : string) : value =
  Datascript.Vector [ Datascript.Keyword "block/uuid"; Datascript.Uuid u ]

let uuid_of_te (db : db) (te : tx_entity) : string option =
  match te.db_id with
  | Some (Entity_id id) -> (
      match Ldb.ent_of_id db id with
      | Some e -> Ldb.uuid_value e "block/uuid"
      | None -> None)
  | _ -> None

(* cljs clipboard-block — serialize a block the way editor copy/cut does:
   entity values become [:block/uuid u] lookup-refs. *)
let clipboard_block (db : db) (block : entity) : Block_map.t =
  let attrs =
    List.filter_map
      (fun (a, tv) ->
        (* cljs (into {} entity) yields forward attrs only *)
        if
          String.length a > 1
          && String.contains a '/'
          && a.[String.index a '/' + 1] = '_'
        then None
        else
        match tv with
        | One_value (Ref id) ->
            (* raw ref eids also serialize as [:block/uuid] lookups —
               cljs entity values become lookup-refs; raw eids would
               silently assert dangling refs on paste *)
            Option.map
              (fun u -> a, uuid_lookup_ref u)
              (Option.bind (Ldb.ent_of_id db id)
                 (fun e -> Ldb.uuid_value e "block/uuid"))
        | One_value v -> Some (a, v)
        | Many_values vs
          when vs <> []
               && List.for_all (function Ref _ -> true | _ -> false) vs ->
            Some
              ( a
              , Datascript.Set
                  (List.filter_map
                     (fun v ->
                       match v with
                       | Ref id ->
                           Option.map uuid_lookup_ref
                             (Option.bind (Ldb.ent_of_id db id)
                                (fun e -> Ldb.uuid_value e "block/uuid"))
                       | _ -> None)
                     vs))
        | Many_values vs -> Some (a, Datascript.List vs)
        | One_entity te ->
            Option.map (fun u -> a, uuid_lookup_ref u) (uuid_of_te db te)
        | Many_entities tes ->
            Some
              ( a
              , Datascript.Set
                  (List.map uuid_lookup_ref
                     (List.filter_map (uuid_of_te db) tes)) ))
      (Datascript.entity_attrs block)
  in
  ("db/id", Int block.id) :: ("block/uuid", Uuid (uuid_of block)) :: attrs

(* cljs copied-blocks-for *)
let copied_blocks_for (db : db) (block : entity)
    (include_property_block : bool) : Block_map.t list =
  List.map (clipboard_block db)
    (Ldb.get_block_and_children db
       ~include_property_block:include_property_block
       (uuid_of block))

(* cljs passes the target entity to insert-blocks!; insert_blocks resolves
   it via "db/id". Prepend the Int eid cljs would have supplied — of_entity
   emits ("db/id", Ref id), which mget_int misses (known lib bug). *)
let target_bm (e : entity) : Block_map.t =
  ("db/id", Int e.id)
  :: List.remove_assoc "db/id" (Block_map.of_entity e)

(* cljs outline-child-titles — children sorted by order, property-value
   children removed, block/title projected. *)
let outline_child_titles (block : entity) : string list =
  Ldb.sort_by_order (Ldb.ref_ents block "block/_parent")
  |> List.filter (fun b -> Ldb.value b "logseq.property/created-from-property" = None)
  |> List.filter_map ent_title

(* cljs outline-sibling-titles *)
let outline_sibling_titles (block : entity) : string list =
  match Ldb.ref_ent block "block/parent" with
  | Some parent -> outline_child_titles parent
  | None -> []

(* cljs nested-copy-conn *)
let nested_copy_conn () : conn =
  Db_test_util.create_conn_with_blocks
    ~pages_and_blocks:
      [ { page = { default_page with pg_title = Some "source" }
        ; blocks =
            [ { default_block with b_title = Some "parent-1"
              ; b_children =
                  [ { default_block with b_title = Some "child-1a" }
                  ; { default_block with b_title = Some "child-1b" } ] }
            ; { default_block with b_title = Some "parent-2"
              ; b_children =
                  [ { default_block with b_title = Some "child-2a" } ] } ] }
      ; { page = { default_page with pg_title = Some "dest" }
        ; blocks =
            [ { default_block with b_title = Some "" }
            ; { default_block with b_title = Some "dest-anchor" } ] } ]
    ()

let source_parent db = find_block_by_content db "parent-1"

(* cljs paste-copied-tree! — {:sibling? true :outliner-op :paste} merged
   with per-test opts *)
let paste_copied_tree_bang conn (copied : Block_map.t list)
    (target : entity) (opts : Outliner_core.insert_opts) : unit =
  insert_blocks_bang conn copied (target_bm target)
    ~opts:{ opts with sibling = true; outliner_op = Some "paste" } ()

(* (deftest copy-paste-keeps-original-children-when-uuids-still-exist) *)
let test_copy_paste_keeps_original_children_when_uuids_still_exist () =
  let conn = nested_copy_conn () in
  let db = db_of conn in
  let parent = Option.get (source_parent db) in
  let parent_uuid = uuid_of parent in
  let child_uuids =
    List.sort compare
      (List.map uuid_of
         (Ldb.sort_by_order (Ldb.ref_ents parent "block/_parent")))
  in
  let copied = copied_blocks_for db parent true in
  let empty_target = Option.get (find_block_by_content db "") in
  check "precondition children"
    (outline_child_titles parent = [ "child-1a"; "child-1b" ]);
  paste_copied_tree_bang conn copied empty_target
    { Outliner_core.default_insert_opts with
      keep_uuid = true; replace_empty_target = true };
  let db = db_of conn in
  let original = Option.get (entity_by_uuid conn parent_uuid) in
  let original_children =
    Ldb.sort_by_order (Ldb.ref_ents original "block/_parent")
  in
  let dest_page = Option.get (Ldb.get_page db (String "dest")) in
  let dest_top = Ldb.sort_by_order (Ldb.ref_ents dest_page "block/_parent") in
  let dest_child_titles = List.concat_map outline_child_titles dest_top in
  check "original parent remains" (uuid_of original = parent_uuid);
  check "original children stay under source parent"
    (outline_child_titles original = [ "child-1a"; "child-1b" ]);
  check "original child identities unchanged"
    (List.sort compare (List.map uuid_of original_children) = child_uuids);
  check "paste duplicates children onto destination"
    (List.mem "child-1a" dest_child_titles);
  let dest_grandchild_uuids =
    List.concat_map
      (fun b -> List.map uuid_of (Ldb.sort_by_order (Ldb.ref_ents b "block/_parent")))
      dest_top
  in
  check "destination copies use new child identities"
    (not (List.exists (fun u -> List.mem u child_uuids) dest_grandchild_uuids))

(* (deftest copy-paste-keeps-original-children-when-pasting-beside-existing-block) *)
let test_copy_paste_keeps_original_children_when_pasting_beside_existing_block
    () =
  let conn = nested_copy_conn () in
  let db = db_of conn in
  let parent = Option.get (source_parent db) in
  let parent_uuid = uuid_of parent in
  let copied = copied_blocks_for db parent true in
  let target = Option.get (find_block_by_content db "dest-anchor") in
  paste_copied_tree_bang conn copied target
    { Outliner_core.default_insert_opts with keep_uuid = true };
  let original = Option.get (entity_by_uuid conn parent_uuid) in
  check "original children stay"
    (outline_child_titles original = [ "child-1a"; "child-1b" ]);
  let page_title =
    Option.bind (Ldb.ref_ent original "block/page") (fun p ->
        Ldb.string_value p "block/title")
  in
  check "original stays on source page" (page_title = Some "source")

(* (deftest copy-paste-with-keep-uuid-false-duplicates-nested-tree) *)
let test_copy_paste_with_keep_uuid_false_duplicates_nested_tree () =
  let conn = nested_copy_conn () in
  let db = db_of conn in
  let parent = Option.get (source_parent db) in
  let parent_uuid = uuid_of parent in
  let copied = copied_blocks_for db parent true in
  let target = Option.get (find_block_by_content db "dest-anchor") in
  paste_copied_tree_bang conn copied target
    { Outliner_core.default_insert_opts with keep_uuid = false };
  let db = db_of conn in
  let original = Option.get (entity_by_uuid conn parent_uuid) in
  let dest_page = Option.get (Ldb.get_page db (String "dest")) in
  let dest_parents =
    List.filter
      (fun b -> ent_title b = Some "parent-1")
      (Ldb.sort_by_order (Ldb.ref_ents dest_page "block/_parent"))
  in
  check "original children stay"
    (outline_child_titles original = [ "child-1a"; "child-1b" ]);
  check "one dest parent" (List.length dest_parents = 1);
  (match dest_parents with
   | [ p ] ->
       check "dest parent gets fresh uuid" (uuid_of p <> parent_uuid);
       check "dest parent children duplicated"
         (outline_child_titles p = [ "child-1a"; "child-1b" ])
   | _ -> ())

(* (deftest cut-paste-moves-nested-tree) *)
let test_cut_paste_moves_nested_tree () =
  let conn = nested_copy_conn () in
  let db = db_of conn in
  let parent = Option.get (source_parent db) in
  let parent_uuid = uuid_of parent in
  let copied = copied_blocks_for db parent true in
  let target = Option.get (find_block_by_content db "dest-anchor") in
  delete_blocks_bang conn [ parent ] ();
  paste_copied_tree_bang conn copied target
    { Outliner_core.default_insert_opts with keep_uuid = true };
  let moved = entity_by_uuid conn parent_uuid in
  check "cut paste restores original uuid" (moved <> None);
  (match moved with
   | Some m ->
       check "children moved with parent"
         (outline_child_titles m = [ "child-1a"; "child-1b" ]);
       let page_title =
         Option.bind (Ldb.ref_ent m "block/page") (fun p ->
             Ldb.string_value p "block/title")
       in
       check "moved under dest page" (page_title = Some "dest")
   | None -> ())

(* (deftest non-paste-keep-uuid-reuses-live-child-identities) *)
let test_non_paste_keep_uuid_reuses_live_child_identities () =
  let conn = nested_copy_conn () in
  let db = db_of conn in
  let parent = Option.get (source_parent db) in
  let parent_uuid = uuid_of parent in
  let child_uuids =
    List.sort compare
      (List.map uuid_of
         (Ldb.sort_by_order (Ldb.ref_ents parent "block/_parent")))
  in
  let copied = copied_blocks_for db parent true in
  let target = Option.get (find_block_by_content db "dest-anchor") in
  insert_blocks_bang conn copied (target_bm target)
    ~opts:
      { Outliner_core.default_insert_opts with
        sibling = true; keep_uuid = true; keep_block_order = true }
    ();
  let db = db_of conn in
  let moved = Option.get (entity_by_uuid conn parent_uuid) in
  let dest_page = Option.get (Ldb.get_page db (String "dest")) in
  let dest_parents =
    List.filter
      (fun b -> ent_title b = Some "parent-1")
      (Ldb.sort_by_order (Ldb.ref_ents dest_page "block/_parent"))
  in
  check "one dest parent" (List.length dest_parents = 1);
  (match dest_parents with
   | [ p ] ->
       check "dest parent reuses uuid" (uuid_of p = parent_uuid);
       check "children stay under parent"
         (outline_child_titles moved = [ "child-1a"; "child-1b" ]);
       let moved_child_uuids =
         List.sort compare
           (List.map uuid_of
              (Ldb.sort_by_order (Ldb.ref_ents moved "block/_parent")))
       in
       check "live child identities reused" (moved_child_uuids = child_uuids);
       let dest_child_uuids =
         List.sort compare
           (List.concat_map
              (fun b ->
                List.map uuid_of
                  (Ldb.sort_by_order (Ldb.ref_ents b "block/_parent")))
              dest_parents)
       in
       check "dest child identities match source" (dest_child_uuids = child_uuids);
       let page_title =
         Option.bind (Ldb.ref_ent moved "block/page") (fun p ->
             Ldb.string_value p "block/title")
       in
       check "moved to dest page" (page_title = Some "dest")
   | _ -> ())

(* (deftest undo-restore-keeps-live-child-uuid) *)
let test_undo_restore_keeps_live_child_uuid () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks =
              [ { default_block with b_title = Some "b" }
              ; { default_block with b_title = Some "c"
                ; b_children =
                    [ { default_block with b_title = Some "d" } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let b = Option.get (find_block_by_content db "b") in
  let c = Option.get (find_block_by_content db "c") in
  let d = Option.get (find_block_by_content db "d") in
  let c_uuid = uuid_of c and d_uuid = uuid_of d in
  let restore_payload = copied_blocks_for db c true in
  move_blocks_bang conn [ d ] b
    ~opts:{ Outliner_core.default_insert_opts with sibling = false } ();
  delete_blocks_bang conn [ c ] ();
  insert_blocks_bang conn restore_payload (target_bm b)
    ~opts:
      { Outliner_core.default_insert_opts with
        sibling = true; keep_uuid = true; keep_block_order = true }
    ();
  let restored = entity_by_uuid conn c_uuid in
  check "parent restored" (restored <> None);
  (match restored with
   | Some r ->
       let children =
         Ldb.sort_by_order (Ldb.ref_ents r "block/_parent")
         |> List.filter (fun x ->
                Ldb.value x "logseq.property/created-from-property" = None)
       in
       check "restored children" (List.filter_map ent_title children = [ "d" ]);
       check "live child keeps uuid on undo restore"
         (List.map uuid_of children = [ d_uuid ])
   | None -> ())

(* (deftest paste-page-entity-links-to-existing-page) — cljs 4608885d40:
   pasting a copied page entity links to the existing page instead of
   creating a duplicate page with the same name. *)
let test_paste_page_entity_links_to_existing_page () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "PageA" }
          ; blocks = [ { default_block with b_title = Some "a-child" } ] }
        ; { page = { default_page with pg_title = Some "PageB" }
          ; blocks = [ { default_block with b_title = Some "target" } ] } ]
      ()
  in
  let db = db_of conn in
  let page_a = Option.get (Ldb.get_page db (String "pagea")) in
  let copied = [ clipboard_block db page_a ] in
  let target = Option.get (find_block_by_content db "target") in
  insert_blocks_bang conn copied (target_bm target)
    ~opts:
      { Outliner_core.default_insert_opts with
        sibling = true; outliner_op = Some "paste" }
    ();
  let db = db_of conn in
  let pagea_ids =
    Datascript.q_string db
      "[:find [?e ...] :where [?e :block/name \"pagea\"]]"
    |> List.filter_map (function
         | [ Result_entity i ] | [ Result_value (Int i) ] -> Some i
         | _ -> None)
  in
  check "paste must not create a second page entity"
    (List.sort compare pagea_ids = [ page_a.id ]);
  let target' = Option.get (Ldb.ent_of_id db target.id) in
  let siblings =
    match Ldb.ref_ent target' "block/parent" with
    | Some p -> Ldb.sort_by_order (Ldb.ref_ents p "block/_parent")
    | None -> []
  in
  let pasted =
    List.find_opt (fun b -> Ldb.value b "block/link" <> None) siblings
  in
  check "pasted node should be a link node" (pasted <> None);
  (match pasted with
   | Some p -> (
       match Ldb.ref_ent p "block/link" with
       | Some l -> check "link points to existing page" (l.id = page_a.id)
       | None -> ())
   | None -> ())

let copy_paste_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "copy-paste-keeps-original-children-when-uuids-still-exist" `Quick test_copy_paste_keeps_original_children_when_uuids_still_exist;
    Alcotest.test_case "copy-paste-keeps-original-children-when-pasting-beside-existing-block" `Quick test_copy_paste_keeps_original_children_when_pasting_beside_existing_block;
    Alcotest.test_case "copy-paste-with-keep-uuid-false-duplicates-nested-tree" `Quick test_copy_paste_with_keep_uuid_false_duplicates_nested_tree;
    Alcotest.test_case "cut-paste-moves-nested-tree" `Quick test_cut_paste_moves_nested_tree;
    Alcotest.test_case "non-paste-keep-uuid-reuses-live-child-identities" `Quick test_non_paste_keep_uuid_reuses_live_child_identities;
    Alcotest.test_case "undo-restore-keeps-live-child-uuid" `Quick test_undo_restore_keeps_live_child_uuid;
    Alcotest.test_case "paste-page-entity-links-to-existing-page" `Quick test_paste_page_entity_links_to_existing_page ]

(* ---------- cut_paste_property_test.cljs ---------- *)

(* cljs property-contents — entity -> :db/ident | :block/journal-day |
   property-value-content | :block/uuid; coll -> set of contents; scalar
   passthrough. *)
let rec value_contents (db : db) (tv : tx_value) : value option =
  match tv with
  | One_value (Ref id) ->
      entity_contents db
        { db_id = Some (Entity_id id); attrs = [] }
  | One_value v -> Some v
  | Many_values vs when List.for_all (function Ref _ -> true | _ -> false) vs ->
      Some
        (Datascript.Set
           (List.filter_map
              (fun v ->
                match v with
                | Ref id ->
                    entity_contents db
                      { db_id = Some (Entity_id id); attrs = [] }
                | _ -> None)
              vs))
  | Many_values vs -> Some (Datascript.Set vs)
  | One_entity te -> entity_contents db te
  | Many_entities tes ->
      Some (Datascript.Set (List.filter_map (entity_contents db) tes))
and entity_contents (db : db) (te : tx_entity) : value option =
  match te.db_id with
  | Some (Entity_id id) -> (
      match Ldb.ent_of_id db id with
      | Some e -> (
          match Ldb.ident_of e with
          | Some i -> Some (Datascript.Keyword i)
          | None ->
              List.find_map
                (fun f -> f ())
                [ (fun () -> Ldb.value e "block/journal-day")
                ; (fun () -> Ldb.value e "block/title")
                ; (fun () -> Ldb.value e "logseq.property/value")
                ; (fun () ->
                      Option.map
                        (fun u -> Datascript.Uuid u)
                        (Ldb.uuid_value e "block/uuid")) ] )
      | None -> None)
  | _ -> None

let property_contents (db : db) (block : entity) (a : attr) : value option =
  match List.assoc_opt a (Datascript.entity_attrs block) with
  | Some tv -> value_contents db tv
  | None -> None

(* cljs set equality is order-insensitive *)
let rec value_eq (x : value) (y : value) : bool =
  match x, y with
  | Datascript.Set xs, Datascript.Set ys ->
      List.length xs = List.length ys
      && List.for_all (fun v -> List.exists (value_eq v) ys) xs
  | Datascript.List xs, Datascript.List ys
  | Datascript.Vector xs, Datascript.Vector ys ->
      List.length xs = List.length ys && List.for_all2 value_eq xs ys
  | _, _ -> x = y

let contents_eq (db : db) (block : entity) (a : attr) (want : value) : bool =
  match property_contents db block a with
  | Some got -> value_eq got want
  | None -> false

(* cljs assert-properties *)
let assert_properties (db : db) (block : entity)
    (expected : (attr * value) list) : unit =
  List.iter
    (fun (ident, want) -> check ident (contents_eq db block ident want))
    expected

type paste_case =
  { pc_title : string
  ; pc_properties : (string * property_decl) list
  ; pc_extra_pages : page_blocks list
  ; pc_block_title : string
  ; pc_block_tags : string list
  ; pc_block_props : (string * prop_value) list
  ; pc_expected : (string * value) list }

let closed_choice_uuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

(* cljs property-cases — block_props are :build/properties values (edn),
   expected are cljs property-contents results. Int/Uuid/Bool in
   pc_block_props are Db_test_util edn ctors (shadowed by open Datascript
   above); in pc_expected they are Datascript value ctors. *)
let cut_property_cases : paste_case list =
  [ { pc_title = "default cardinality-one text"
    ; pc_properties =
        [ "p1", { default_property with p_type = "default" } ]
    ; pc_extra_pages = []
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props = [ "p1", Str "value" ]
    ; pc_expected = [ "user.property/p1", String "value" ] }
  ; { pc_title = "default cardinality-many text"
    ; pc_properties =
        [ "p-many"
        , { default_property with p_type = "default"
          ; p_cardinality_many = true } ]
    ; pc_extra_pages = []
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props = [ "p-many", Set_ [ Str "alpha"; Str "beta" ] ]
    ; pc_expected =
        [ "user.property/p-many"
        , Set [ String "alpha"; String "beta" ] ] }
  ; { pc_title = "number cardinality-one"
    ; pc_properties =
        [ "num", { default_property with p_type = "number" } ]
    ; pc_extra_pages = []
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props = [ "num", Db_test_util.Int 2 ]
    ; pc_expected = [ "user.property/num", Int 2 ] }
  ; { pc_title = "number cardinality-many"
    ; pc_properties =
        [ "num-many"
        , { default_property with p_type = "number"
          ; p_cardinality_many = true } ]
    ; pc_extra_pages = []
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props =
        [ "num-many", Set_ [ Db_test_util.Int 3; Db_test_util.Int 4 ] ]
    ; pc_expected =
        [ "user.property/num-many", Set [ Int 3; Int 4 ] ] }
  ; { pc_title = "url cardinality-one"
    ; pc_properties =
        [ "link", { default_property with p_type = "url" } ]
    ; pc_extra_pages = []
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props = [ "link", Str "https://logseq.com" ]
    ; pc_expected =
        [ "user.property/link", String "https://logseq.com" ] }
  ; { pc_title = "url cardinality-many"
    ; pc_properties =
        [ "link-many"
        , { default_property with p_type = "url"
          ; p_cardinality_many = true } ]
    ; pc_extra_pages = []
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props =
        [ "link-many"
        , Set_ [ Str "https://logseq.com"; Str "https://example.com" ] ]
    ; pc_expected =
        [ "user.property/link-many"
        , Set [ String "https://logseq.com"; String "https://example.com" ] ] }
  ; { pc_title = "checkbox"
    ; pc_properties =
        [ "done", { default_property with p_type = "checkbox" } ]
    ; pc_extra_pages = []
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props = [ "done", Db_test_util.Bool true ]
    ; pc_expected = [ "user.property/done", Bool true ] }
  ; { pc_title = "datetime"
    ; pc_properties =
        [ "when", { default_property with p_type = "datetime" } ]
    ; pc_extra_pages = []
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props = [ "when", Db_test_util.Int 1700000000000 ]
    ; pc_expected = [ "user.property/when", Int 1700000000000 ] }
  ; { pc_title = "date cardinality-one"
    ; pc_properties =
        [ "due", { default_property with p_type = "date" } ]
    ; pc_extra_pages =
        [ { page = { default_page with pg_journal = Some 20250203 }
          ; blocks = [] } ]
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props = [ "due", build_page_ref ~journal:20250203 () ]
    ; pc_expected = [ "user.property/due", Int 20250203 ] }
  ; { pc_title = "date cardinality-many"
    ; pc_properties =
        [ "due-many"
        , { default_property with p_type = "date"
          ; p_cardinality_many = true } ]
    ; pc_extra_pages =
        [ { page = { default_page with pg_journal = Some 20250203 }
          ; blocks = [] }
        ; { page = { default_page with pg_journal = Some 20250204 }
          ; blocks = [] } ]
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props =
        [ "due-many"
        , Set_
            [ build_page_ref ~journal:20250203 ()
            ; build_page_ref ~journal:20250204 () ] ]
    ; pc_expected =
        [ "user.property/due-many", Set [ Int 20250203; Int 20250204 ] ] }
  ; { pc_title = "node page ref"
    ; pc_properties =
        [ "page", { default_property with p_type = "node" } ]
    ; pc_extra_pages =
        [ { page = { default_page with pg_title = Some "Linked Page" }
          ; blocks = [] } ]
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props =
        [ "page", build_page_ref ~title:"Linked Page" () ]
    ; pc_expected = [ "user.property/page", String "Linked Page" ] }
  ; { pc_title = "node cardinality-many"
    ; pc_properties =
        [ "pages"
        , { default_property with p_type = "node"
          ; p_cardinality_many = true } ]
    ; pc_extra_pages =
        [ { page = { default_page with pg_title = Some "Page A" }
          ; blocks = [] }
        ; { page = { default_page with pg_title = Some "Page B" }
          ; blocks = [] } ]
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props =
        [ "pages"
        , Set_
            [ build_page_ref ~title:"Page A" ()
            ; build_page_ref ~title:"Page B" () ] ]
    ; pc_expected =
        [ "user.property/pages"
        , Set [ String "Page A"; String "Page B" ] ] }
  ; { pc_title = "asset ref"
    ; pc_properties =
        [ "cover", { default_property with p_type = "asset" } ]
    ; pc_extra_pages =
        [ { page =
              { default_page with pg_title = Some "poster"
              ; pg_tags = [ "logseq.class/Asset" ] }
          ; blocks = [] } ]
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props =
        [ "cover", build_page_ref ~title:"poster" () ]
    ; pc_expected = [ "user.property/cover", String "poster" ] }
  ; { pc_title = "closed-value status"
    ; pc_properties = []
    ; pc_extra_pages = []
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props =
        [ "logseq.property/status", Kw "logseq.property/status.doing" ]
    ; pc_expected =
        [ "logseq.property/status"
        , Keyword "logseq.property/status.doing" ] }
  ; { pc_title = "closed-value default choice"
    ; pc_properties =
        [ "choice"
        , { default_property with p_type = "default"
          ; p_closed_values =
              [ { cv_value = "red"; cv_uuid = Some closed_choice_uuid
                ; cv_ident = None; cv_icon = None; cv_properties = [] } ] } ]
    ; pc_extra_pages = []
    ; pc_block_title = "b1"
    ; pc_block_tags = []
    ; pc_block_props =
        [ "choice", Vec [ Kw "block/uuid"; Uuid closed_choice_uuid ] ]
    ; pc_expected = [ "user.property/choice", String "red" ] }
  ; { pc_title = "query property value"
    ; pc_properties = []
    ; pc_extra_pages = []
    ; pc_block_title = "query-b1"
    ; pc_block_tags = [ "logseq.class/Query" ]
    ; pc_block_props =
        [ "logseq.property/query", Str "(priority High)" ]
    ; pc_expected =
        [ "logseq.property/query", String "(priority High)" ] } ]

(* cljs create-case-conn *)
let create_case_conn (c : paste_case) : conn =
  Db_test_util.create_conn_with_blocks ~properties:c.pc_properties
    ~pages_and_blocks:
      ({ page = { default_page with pg_title = Some "page1" }
       ; blocks =
           [ { default_block with b_title = Some c.pc_block_title
             ; b_properties = c.pc_block_props
             ; b_tags = c.pc_block_tags }
           ; { default_block with b_title = Some "target" } ] }
       :: c.pc_extra_pages)
    ()

(* cljs find-source-block *)
let find_source_block (db : db) (c : paste_case) : entity =
  Option.get (find_block_by_content db c.pc_block_title)

(* cljs cut-paste! *)
let cut_paste_bang conn (block : entity) (target : entity)
    (include_property_block : bool) : Block_map.t list =
  let copied = copied_blocks_for (db_of conn) block include_property_block in
  delete_blocks_bang conn [ block ] ();
  paste_copied_tree_bang conn copied target
    { Outliner_core.default_insert_opts with keep_uuid = true };
  copied

(* (deftest omitting-property-value-children-throws-missing-entity) *)
let test_omitting_property_value_children_throws_missing_entity () =
  let c = List.hd cut_property_cases in
  let conn = create_case_conn c in
  let db = db_of conn in
  let block = find_source_block db c in
  let target = Option.get (find_block_by_content db "target") in
  let copied = copied_blocks_for db block false in
  let value_uuid =
    Option.bind (Ldb.ref_ent block "user.property/p1") (fun e ->
        Ldb.uuid_value e "block/uuid")
  in
  check "default copy omits the property-value child"
    (List.length copied = 1);
  check "value child is uuid" (value_uuid <> None);
  delete_blocks_bang conn [ block ] ();
  (match value_uuid with
   | Some u ->
       check "cut hard-retracts the property-value child"
         (Datascript.entity (db_of conn)
            (Lookup_ref ("block/uuid", Uuid u)) = None)
   | None -> ());
  throws_with "paste without value child throws"
    "Nothing found for entity id" (fun () ->
      insert_blocks_bang conn copied (target_bm target)
        ~opts:
          { Outliner_core.default_insert_opts with
            sibling = true; keep_uuid = true; outliner_op = Some "paste" }
        ())

(* (deftest cut-paste-restores-all-property-types) *)
let test_cut_paste_restores_all_property_types () =
  List.iter
    (fun (c : paste_case) ->
      let conn = create_case_conn c in
      let db = db_of conn in
      let block = find_source_block db c in
      let target = Option.get (find_block_by_content db "target") in
      let block_uuid = uuid_of block in
      check (c.pc_title ^ " source block exists") (block.id > 0);
      ignore (cut_paste_bang conn block target true);
      let db = db_of conn in
      let pasted =
        Datascript.entity db (Lookup_ref ("block/uuid", Uuid block_uuid))
      in
      check (c.pc_title ^ " pasted") (pasted <> None);
      (match pasted with
       | Some p -> assert_properties db p c.pc_expected
       | None -> ()))
    cut_property_cases

(* (deftest copy-paste-duplicates-text-property-values) *)
let test_copy_paste_duplicates_text_property_values () =
  let c = List.hd cut_property_cases in
  let conn = create_case_conn c in
  let db = db_of conn in
  let block = find_source_block db c in
  let target = Option.get (find_block_by_content db "target") in
  let original_uuid = uuid_of block in
  let original_value_uuid =
    Option.bind (Ldb.ref_ent block "user.property/p1") (fun e ->
        Ldb.uuid_value e "block/uuid")
  in
  let copied = copied_blocks_for db block true in
  insert_blocks_bang conn copied (target_bm target)
    ~opts:
      { Outliner_core.default_insert_opts with
        sibling = true; keep_uuid = false; outliner_op = Some "paste" }
    ();
  let db = db_of conn in
  let original = Option.get (entity_by_uuid conn original_uuid) in
  let pasted =
      (List.concat
         (Datascript.q_string db
            "[:find [?b ...] :where [?b :block/title \"b1\"] \
             [?b :block/parent]]")
      |> List.filter_map
           (function
             | Result_entity id -> Some id
             | Result_value (Int id) -> Some id
             | _ -> None))
    |> List.filter_map (Ldb.ent_of_id db)
    |> List.find_opt (fun e -> e.id <> original.id)
  in
  check "original block remains" (original.id > 0);
  check "pasted duplicate exists" (pasted <> None);
  check "original value"
    (contents_eq db original "user.property/p1" (String "value"));
  (match pasted with
   | Some p ->
       check "pasted value"
         (contents_eq db p "user.property/p1" (String "value"));
       let pasted_value_uuid =
         Option.bind (Ldb.ref_ent p "user.property/p1") (fun e ->
             Ldb.uuid_value e "block/uuid")
       in
       check "copy duplicates the text property value"
         (pasted_value_uuid <> None && pasted_value_uuid <> original_value_uuid)
   | None -> ())

(* (deftest copy-paste-text-property-value-as-regular-block) *)
let test_copy_paste_text_property_value_as_regular_block () =
  let c = List.hd cut_property_cases in
  let conn = create_case_conn c in
  let db = db_of conn in
  let block = find_source_block db c in
  let target = Option.get (find_block_by_content db "target") in
  let block_uuid = uuid_of block and target_uuid = uuid_of target in
  let value = Option.get (Ldb.ref_ent block "user.property/p1") in
  let original_value_uuid = uuid_of value in
  let copied = copied_blocks_for db value true in
  insert_blocks_bang conn copied (target_bm target)
    ~opts:
      { Outliner_core.default_insert_opts with
        sibling = true; keep_uuid = false; outliner_op = Some "paste" }
    ();
  let db = db_of conn in
  let original = Option.get (Ldb.ent_of_id db block.id) in
  let target' = Option.get (Ldb.ent_of_id db target.id) in
  let siblings =
    match Ldb.ref_ent target' "block/parent" with
    | Some p ->
        Ldb.sort_by_order (Ldb.ref_ents p "block/_parent")
        |> List.filter (fun b ->
               Ldb.value b "logseq.property/created-from-property" = None)
    | None -> []
  in
  let pasted =
    List.find_opt
      (fun b -> not (List.mem (uuid_of b) [ block_uuid; target_uuid ]))
      siblings
  in
  check "original keeps its text property value"
    (contents_eq db original "user.property/p1" (String "value"));
  check "original value uuid kept"
    (Option.bind (Ldb.ref_ent original "user.property/p1") (fun e ->
         Ldb.uuid_value e "block/uuid") = Some original_value_uuid);
  check "pasted as visible outline block" (pasted <> None);
  (match pasted with
   | Some p ->
       check "pasted title" (ent_title p = Some "value");
       check "pasted is a regular block"
         (Ldb.value p "logseq.property/created-from-property" = None);
       check "pasted gets new uuid" (uuid_of p <> original_value_uuid);
       check "outline sibling titles include value"
         (List.mem "value" (outline_sibling_titles target'))
   | None -> ())

(* (deftest cut-paste-text-property-value-as-regular-block) *)
let test_cut_paste_text_property_value_as_regular_block () =
  let c = List.hd cut_property_cases in
  let conn = create_case_conn c in
  let db = db_of conn in
  let block = find_source_block db c in
  let target = Option.get (find_block_by_content db "target") in
  let value = Option.get (Ldb.ref_ent block "user.property/p1") in
  let value_uuid = uuid_of value in
  let copied = copied_blocks_for db value true in
  delete_blocks_bang conn [ value ] ();
  insert_blocks_bang conn copied (target_bm target)
    ~opts:
      { Outliner_core.default_insert_opts with
        sibling = true; keep_uuid = true; outliner_op = Some "paste" }
    ();
  let db = db_of conn in
  let host = Option.get (Ldb.ent_of_id db block.id) in
  let target' = Option.get (Ldb.ent_of_id db target.id) in
  let pasted =
    Datascript.entity db (Lookup_ref ("block/uuid", Uuid value_uuid))
  in
  check "cut removes text property value from host"
    (property_contents db host "user.property/p1" = None);
  check "cut text property value pastes as a block" (pasted <> None);
  (match pasted with
   | Some p ->
       check "pasted title" (ent_title p = Some "value");
       check "cut+paste converts value to regular block"
         (Ldb.value p "logseq.property/created-from-property" = None);
       check "outline sibling titles include value"
         (List.mem "value" (outline_sibling_titles target'))
   | None -> ())

let cut_paste_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "omitting-property-value-children-throws-missing-entity" `Quick test_omitting_property_value_children_throws_missing_entity;
    Alcotest.test_case "cut-paste-restores-all-property-types" `Quick test_cut_paste_restores_all_property_types;
    Alcotest.test_case "copy-paste-duplicates-text-property-values" `Quick test_copy_paste_duplicates_text_property_values;
    Alcotest.test_case "copy-paste-text-property-value-as-regular-block" `Quick test_copy_paste_text_property_value_as_regular_block;
    Alcotest.test_case "cut-paste-text-property-value-as-regular-block" `Quick test_cut_paste_text_property_value_as_regular_block ]

(* ---------- deps/outliner/test/logseq/outliner/op_construct_test.cljs ----------

   17 of 17 deftests ported.
   Notes:
   - cljs derive-history-outliner-ops returns {:forward-outliner-ops
     :inverse-outliner-ops}; the OCaml port returns the pair
     (forward, inverse) as Wire.Arrays — derive_ops unwraps to entry lists.
   - cljs tx-meta is a plain map; the OCaml port takes a (kw, wire) list —
     tx_meta builds it literally. cljs literal tx-data {:e :a :v :added}
     maps -> Wire.Map items; real tx-report datoms go through
     Db_normalize.wire_of_datoms.
   - cljs = on persistent data is unordered for maps/sets and sequential
     across list/vector — wire_equal mirrors that.
   - cljs derive-history-outliner-ops-delete-blocks-inverse-avoids-self-
     target stubs ldb/get-left-sibling via with-redefs to return the
     deleted root itself (simulating a stale renderer lookup); OCaml has
     no rebinding seam. The fixture's child block is already its parent's
     only child, so the equivalent real-path case is exercised: with no
     left sibling the inverse falls back to the parent target with
     :sibling? false — the same branch the stale case lands on. The
     target-id == root-id guard inside delete-root->restore-plan is the
     cljs-with-redefs-only path and is noted rather than exercised.

   ---------- deps/outliner/test/logseq/outliner/move_property_value_undo_test.cljs ----------

   3 of 3 deftests ported (the two doseq bodies cover 4 property cases
   total).

   Two extra cut_paste_property_test.cljs deftests (undo-delete-restores-
   all-property-types, delete-inverse-includes-property-value-children)
   live in the cut-paste section above and are registered in
   cut_paste_cases. *)

let wkw s = Wire.Keyword s
let wmap kvs = Wire.Map kvs
let warr xs = Wire.Array xs
let wop name args = Wire.Array [ Wire.Keyword name; Wire.Array args ]

let wmeta (k : string) (v : Wire.t) : Wire.t * Wire.t = (wkw k, v)

(* cljs {:outliner-op op :outliner-ops ops} tx-meta *)
let tx_meta (op : string) (ops : Wire.t list) : (Wire.t * Wire.t) list =
  [ wmeta "outliner-op" (wkw op); wmeta "outliner-ops" (Wire.Array ops) ]

(* cljs literal tx-data item {:e :a :v :added} *)
let tx_datom e a v added : Wire.t =
  wmap
    [ wkw "e", Wire.Int e
    ; wkw "a", wkw a
    ; wkw "v", v
    ; wkw "added", Wire.Bool added ]

(* cljs (op-construct/derive-history-outliner-ops db-before db-after
   tx-data tx-meta) -> {:forward-outliner-ops _ :inverse-outliner-ops _};
   the OCaml port returns (forward-wire, inverse-wire) — unwrapped to
   op-entry lists here. *)
let derive_ops db_before db_after tx_data (meta : (Wire.t * Wire.t) list)
    : Wire.t list * Wire.t list =
  let f, i =
    Outliner_op_construct.derive_history_outliner_ops db_before db_after
      tx_data meta
  in
  (Wire.as_seq f, Wire.as_seq i)

(* op entry = [op-name [args]] *)
let op_name (entry : Wire.t) : string =
  match Wire.as_seq entry with
  | Wire.Keyword n :: _ -> n
  | _ -> ""

(* nth arg of an [op [args]] entry; cljs (get-in entry [1 n]) *)
let op_arg (entry : Wire.t) (n : int) : Wire.t =
  match Wire.as_seq entry with
  | [ _; args ] ->
      (match List.nth_opt (Wire.as_seq args) n with
       | Some v -> v
       | None -> Wire.Nil)
  | _ -> Wire.Nil

let wget (k : string) (w : Wire.t) : Wire.t =
  match Wire.get k w with Some v -> v | None -> Wire.Nil

(* cljs = for wire data: maps and sets compare unordered; sequential
   collections compare across vector/list. *)
let rec wire_equal (a : Wire.t) (b : Wire.t) : bool =
  match a, b with
  | Wire.Map xs, Wire.Map ys ->
      List.length xs = List.length ys
      && List.for_all
           (fun (k, v) ->
             match List.find_opt (fun (k2, _) -> wire_equal k k2) ys with
             | Some (_, v2) -> wire_equal v v2
             | None -> false)
           xs
  | (Wire.Array xs | Wire.List xs), (Wire.Array ys | Wire.List ys) ->
      List.length xs = List.length ys && List.for_all2 wire_equal xs ys
  | Wire.Set xs, Wire.Set ys ->
      List.length xs = List.length ys
      && List.for_all (fun x -> List.exists (fun y -> wire_equal x y) ys) xs
  | _ -> a = b

let wire_list_equal (xs : Wire.t list) (ys : Wire.t list) : bool =
  List.length xs = List.length ys && List.for_all2 wire_equal xs ys

(* cljs (into {} entity) -> wire map; keeps the Ref/db-id refs as the
   transit values op-construct canonicalizes against tx-data. *)
let wire_of_block_map (m : Block_map.t) : Wire.t =
  Wire.Map
    (List.map (fun (a, v) -> wkw a, Ds_wire.transit_of_value v) m)

(* cljs (d/transact! conn [{:db/id -1 ...}]) — tag entity tx used by the
   retracted-ref tests *)
let transact_tag conn (tag_uuid : string) : unit =
  ignore
    (Datascript.transact_conn conn
       [ Entity
           { db_id = Some (Entity_id (-1))
           ; attrs =
               [ "block/uuid", One_value (Uuid tag_uuid)
               ; "block/title", One_value (String "Tag")
               ; "block/name", One_value (String "tag")
               ; "block/tags", One_value (Keyword "logseq.class/Tag") ] } ])

(* (deftest derive-history-outliner-ops-canonicalizes-create-page-and-builds-delete-inverse-test) *)
let test_derive_create_page_canonicalizes_and_builds_delete_inverse () =
  let conn = create_conn_with_blocks () in
  let page_uuid = gen_uuid () in
  let tx_data =
    [ tx_datom 1 "block/title" (Wire.String "Created Page") true
    ; tx_datom 1 "block/uuid" (Wire.Uuid page_uuid) true ]
  in
  let meta =
    tx_meta "create-page"
      [ wop "create-page"
          [ Wire.String "Created Page"
          ; wmap
              [ wkw "redirect?", Wire.Bool false
              ; wkw "split-namespace?", Wire.Bool true
              ; wkw "tags", Wire.List [] ] ] ]
  in
  let db = db_of conn in
  let forward, inverse = derive_ops db db tx_data meta in
  check "forward op is create-page"
    (forward <> [] && op_name (List.hd forward) = "create-page");
  check "create-page forward keeps created uuid"
    (wget "uuid" (op_arg (List.hd forward) 1) = Wire.Uuid page_uuid);
  check "inverse deletes created page"
    (wire_list_equal inverse
       [ wop "delete-page" [ Wire.Uuid page_uuid; wmap [] ] ])

(* (deftest derive-history-outliner-ops-handles-replace-empty-target-insert-inverse-test) *)
let test_derive_replace_empty_target_insert_inverse () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks = [ { default_block with b_title = Some "" } ] } ]
      ()
  in
  let db = db_of conn in
  let empty_target = Option.get (find_block_by_content db "") in
  let parent_uuid = gen_uuid () in
  let child_uuid = gen_uuid () in
  let meta =
    tx_meta "insert-blocks"
      [ wop "insert-blocks"
          [ warr
              [ wmap
                  [ wkw "block/uuid", Wire.Uuid parent_uuid
                  ; wkw "block/title", Wire.String "paste parent" ]
              ; wmap
                  [ wkw "block/uuid", Wire.Uuid child_uuid
                  ; wkw "block/title", Wire.String "paste child"
                  ; ( wkw "block/parent"
                    , warr [ wkw "block/uuid"; Wire.Uuid parent_uuid ] ) ] ]
          ; Wire.Int empty_target.id
          ; wmap
              [ wkw "sibling?", Wire.Bool true
              ; wkw "replace-empty-target?", Wire.Bool true
              ; wkw "outliner-op", wkw "paste" ] ] ]
  in
  let forward, inverse = derive_ops db db [] meta in
  check "forward parent block keeps uuid"
    (match forward with
     | entry :: _ ->
         (match Wire.as_seq (op_arg entry 0) with
          | first_block :: _ ->
              wget "block/uuid" first_block = Wire.Uuid parent_uuid
          | [] -> false)
     | [] -> false);
  check "forward keep-uuid? true"
    (match forward with
     | entry :: _ -> wget "keep-uuid?" (op_arg entry 2) = Wire.Bool true
     | [] -> false);
  let inverse' = List.filter (fun w -> w <> Wire.Nil) inverse in
  check "inverse deletes empty target"
    (List.exists
       (fun e ->
         op_name e = "delete-blocks"
         && (match Wire.as_seq (op_arg e 0) with
            | [ Wire.Uuid u ] -> u = uuid_of empty_target
            | _ -> false))
       inverse');
  check "inverse has no save-block"
    (not (List.exists (fun e -> op_name e = "save-block") inverse'))

(* (deftest derive-history-outliner-ops-builds-upsert-property-inverse-delete-page-test) *)
let test_derive_upsert_property_inverse_delete_page () =
  let conn = create_conn_with_blocks () in
  let property_id = "user.property/custom-prop" in
  let meta =
    tx_meta "upsert-property"
      [ wop "upsert-property"
          [ wkw property_id
          ; wmap [ wkw "logseq.property/type", wkw "default" ]
          ; wmap [ wkw "property-name", Wire.String "custom-prop" ] ] ]
  in
  let db = db_of conn in
  let _forward, inverse = derive_ops db db [] meta in
  let expected_uuid =
    Common_uuid.gen_uuid "db-ident-block-uuid" property_id
  in
  check "upsert-property inverse deletes the new property page"
    (wire_list_equal inverse
       [ wop "delete-page" [ Wire.Uuid expected_uuid; wmap [] ] ])

(* (deftest derive-history-outliner-ops-upsert-property-update-builds-schema-restore-inverse-test) *)
let test_derive_upsert_property_update_schema_restore_inverse () =
  let conn =
    create_conn_with_blocks
      ~properties:
        [ "p-many", { default_property with p_type = "default" } ]
      ()
  in
  let property_id = "user.property/p-many" in
  ignore
    (Datascript.transact_conn conn
       [ Add
           ( Ident property_id
           , "logseq.property/classes"
           , Keyword "logseq.class/Root" ) ]);
  let db = db_of conn in
  let before_property =
    Option.get (Datascript.entity db (Ident property_id))
  in
  (* cljs (-> (db-property/get-property-schema (into {} before-property))
       (update :logseq.property/classes (partial map class->ref) set)) *)
  let expected_schema =
    Db_property.get_property_schema (Block_map.of_entity before_property)
    |> List.map (fun (a, v) ->
        if a = "logseq.property/classes" then
          let vs = match v with List vs -> vs | v -> [ v ] in
          ( wkw a
          , Wire.Set
              (List.map
                 (fun c ->
                   let r =
                     match c with
                     | Ref_to r -> Some r
                     | Ref id -> Some (Entity_id id)
                     | _ -> None
                   in
                   match r with
                   | Some r ->
                       (match Datascript.entity db r with
                        | Some e ->
                            (match Ldb.value e "block/uuid" with
                             | Some (Uuid u) ->
                                 warr [ wkw "block/uuid"; Wire.Uuid u ]
                             | _ ->
                                 (match Ldb.ident_of e with
                                  | Some i -> wkw i
                                  | None -> Wire.Nil))
                        | None -> Wire.Nil)
                   | None -> Ds_wire.transit_of_value c)
                 vs) )
        else (wkw a, Ds_wire.transit_of_value v))
  in
  let meta =
    tx_meta "upsert-property"
      [ wop "upsert-property"
          [ wkw property_id
          ; wmap
              [ wkw "logseq.property/type", wkw "node"
              ; wkw "db/cardinality", wkw "many" ]
          ; wmap [] ] ]
  in
  let _forward, inverse = derive_ops db db [] meta in
  check "upsert-property update inverse restores schema"
    (wire_list_equal inverse
       [ wop "upsert-property"
           [ wkw property_id
           ; Wire.Map expected_schema
           ; wmap [ wkw "property-name", Wire.String "p-many" ] ] ]);
  (match inverse with
   | entry :: _ ->
       let classes =
         Wire.as_seq (wget "logseq.property/classes" (op_arg entry 1))
       in
       check "class refs are keywords or uuid lookup-refs"
         (List.for_all
            (fun c ->
              match c with
              | Wire.Keyword _ -> true
              | Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid _ ] -> true
              | _ -> false)
            classes)
   | [] -> check "inverse nonempty" false)

(* (deftest derive-history-outliner-ops-delete-blocks-inverse-avoids-self-target-test)
   Equivalent real-path coverage: cljs stubs ldb/get-left-sibling to return
   the deleted root; here the child is genuinely the parent's only child,
   so the inverse lands on the same parent-target fallback. *)
let test_derive_delete_blocks_inverse_avoids_self_target () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks =
              [ { default_block with b_title = Some "parent"
                ; b_children =
                    [ { default_block with b_title = Some "child" } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let child = Option.get (find_block_by_content db "child") in
  let child_uuid = uuid_of child in
  let parent_uuid =
    match Ldb.ref_ent child "block/parent" with
    | Some p -> uuid_of p
    | None -> ""
  in
  let meta =
    tx_meta "delete-blocks"
      [ wop "delete-blocks" [ warr [ Wire.Int child.id ]; wmap [] ] ]
  in
  let _forward, inverse = derive_ops db db [] meta in
  match inverse with
  | insert_op :: _ ->
      check "inverse is insert-blocks"
        (op_name insert_op = "insert-blocks");
      check "restore target is the parent"
        (op_arg insert_op 1 = Wire.Uuid parent_uuid);
      check "restore is not sibling-positioned"
        (wget "sibling?" (op_arg insert_op 2) = Wire.Bool false);
      check "restore target is not the deleted child"
        (op_arg insert_op 1 <> Wire.Uuid child_uuid)
  | [] -> check "inverse nonempty" false

(* (deftest compound-history-inverses-run-in-reverse-dependency-order-test) *)
let test_compound_history_inverses_reverse_dependency_order () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks =
              [ { default_block with b_title = Some "target" }
              ; { default_block with b_title = Some "source"
                ; b_children =
                    [ { default_block with b_title = Some "nested" } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let target = Option.get (find_block_by_content db "target") in
  let source = Option.get (find_block_by_content db "source") in
  let nested = Option.get (find_block_by_content db "nested") in
  (* cljs (assoc (into {} target) :block/title "combined") *)
  let target_map =
    ("block/title", String "combined")
    :: List.remove_assoc "block/title" (Block_map.of_entity target)
  in
  let meta =
    tx_meta "delete-blocks"
      [ wop "move-blocks"
          [ warr [ Wire.Int nested.id ]
          ; Wire.Int target.id
          ; wmap [ wkw "sibling?", Wire.Bool false ] ]
      ; wop "delete-blocks" [ warr [ Wire.Int source.id ]; wmap [] ]
      ; wop "save-block" [ wire_of_block_map target_map; Wire.Nil ] ]
  in
  let _forward, inverse = derive_ops db db [] meta in
  check "inverses run in reverse dependency order"
    (List.map op_name inverse
     = [ "save-block"; "insert-blocks"; "move-blocks" ])

(* (deftest derive-history-outliner-ops-delete-blocks-with-stale-id-keeps-id-test) *)
let test_derive_delete_blocks_stale_id_keeps_id () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks =
              [ { default_block with b_title = Some "parent"
                ; b_children =
                    [ { default_block with b_title = Some "child" } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let child = Option.get (find_block_by_content db "child") in
  let stale_id = 99999999 in
  let meta =
    tx_meta "delete-blocks"
      [ wop "delete-blocks"
          [ warr [ Wire.Int child.id; Wire.Int stale_id ]; wmap [] ] ]
  in
  let forward, _inverse = derive_ops db db [] meta in
  check "unresolved numeric id kept in forward ops"
    (wire_list_equal forward
       [ wop "delete-blocks"
           [ warr [ Wire.Uuid (uuid_of child); Wire.Int stale_id ]
           ; wmap [] ] ])

(* (deftest derive-history-outliner-ops-delete-blocks-prefers-retracted-tx-data-ids-test) *)
let test_derive_delete_blocks_prefers_retracted_tx_data_ids () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks =
              [ { default_block with b_title = Some "parent"
                ; b_children =
                    [ { default_block with b_title = Some "child" } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let child = Option.get (find_block_by_content db "child") in
  let stale_id = 99999999 in
  let tx_report =
    Datascript.with_tx db [ RetractEntity (Entity_id child.id) ]
  in
  let meta =
    tx_meta "delete-blocks"
      [ wop "delete-blocks"
          [ warr [ Wire.Int child.id; Wire.Int stale_id ]; wmap [] ] ]
  in
  let forward, _inverse =
    derive_ops db tx_report.db_after
      (Db_normalize.wire_of_datoms tx_report.tx_data)
      meta
  in
  check "forward prefers retracted tx-data ids"
    (wire_list_equal forward
       [ wop "delete-blocks"
           [ warr [ Wire.Uuid (uuid_of child) ]; wmap [] ] ])

(* (deftest derive-history-outliner-ops-move-blocks-resolves-target-id-from-tx-data-test) *)
let test_derive_move_blocks_resolves_target_id_from_tx_data () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks = [ { default_block with b_title = Some "child" } ] } ]
      ()
  in
  let db = db_of conn in
  let child = Option.get (find_block_by_content db "child") in
  let stale_target_id = 9999999 in
  let target_uuid = gen_uuid () in
  let tx_data =
    [ tx_datom stale_target_id "block/uuid" (Wire.Uuid target_uuid) false ]
  in
  let meta =
    tx_meta "move-blocks"
      [ wop "move-blocks"
          [ warr [ Wire.Int child.id ]
          ; Wire.Int stale_target_id
          ; wmap [ wkw "sibling?", Wire.Bool true ] ] ]
  in
  let forward, _inverse = derive_ops db db tx_data meta in
  check "stale numeric target id resolves via tx-data uuid"
    (match forward with
     | entry :: _ -> op_arg entry 1 = Wire.Uuid target_uuid
     | [] -> false)

(* (deftest derive-history-outliner-ops-save-block-resolves-retracted-ref-id-from-db-before-test) *)
let test_derive_save_block_resolves_retracted_ref_from_db_before () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks = [ { default_block with b_title = Some "child" } ] } ]
      ()
  in
  let db = db_of conn in
  let child = Option.get (find_block_by_content db "child") in
  let child_uuid = uuid_of child in
  let tag_uuid = gen_uuid () in
  transact_tag conn tag_uuid;
  let db = db_of conn in
  let tag =
    Option.get
      (Datascript.entity db (Lookup_ref ("block/uuid", Uuid tag_uuid)))
  in
  let tx_report =
    Datascript.with_tx db [ RetractEntity (Entity_id tag.id) ]
  in
  let meta =
    tx_meta "save-block"
      [ wop "save-block"
          [ wmap
              [ wkw "block/uuid", Wire.Uuid child_uuid
              ; wkw "block/tags", Wire.Set [ Wire.Int tag.id ] ]
          ; wmap [] ] ]
  in
  let forward, _inverse =
    derive_ops db tx_report.db_after
      (Db_normalize.wire_of_datoms tx_report.tx_data)
      meta
  in
  check "save-block ref canonicalized via db-before"
    (match forward with
     | entry :: _ ->
         wire_equal
           (wget "block/tags" (op_arg entry 0))
           (Wire.Set [ warr [ wkw "block/uuid"; Wire.Uuid tag_uuid ] ])
     | [] -> false)

(* (deftest derive-history-outliner-ops-insert-blocks-resolves-retracted-ref-id-from-tx-data-test) *)
let test_derive_insert_blocks_resolves_retracted_ref_from_tx_data () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks = [ { default_block with b_title = Some "target" } ] } ]
      ()
  in
  let db = db_of conn in
  let target = Option.get (find_block_by_content db "target") in
  let tag_uuid = gen_uuid () in
  transact_tag conn tag_uuid;
  let db = db_of conn in
  let tag =
    Option.get
      (Datascript.entity db (Lookup_ref ("block/uuid", Uuid tag_uuid)))
  in
  let tx_report =
    Datascript.with_tx db [ RetractEntity (Entity_id tag.id) ]
  in
  let meta =
    tx_meta "insert-blocks"
      [ wop "insert-blocks"
          [ warr
              [ wmap
                  [ wkw "block/uuid", Wire.Uuid (gen_uuid ())
                  ; wkw "block/title", Wire.String "new child"
                  ; wkw "block/tags", Wire.Set [ Wire.Int tag.id ] ] ]
          ; Wire.Int target.id
          ; wmap [ wkw "sibling?", Wire.Bool true ] ] ]
  in
  let forward, _inverse =
    derive_ops db tx_report.db_after
      (Db_normalize.wire_of_datoms tx_report.tx_data)
      meta
  in
  check "insert-blocks ref canonicalized via tx-data"
    (match forward with
     | entry :: _ ->
         (match Wire.as_seq (op_arg entry 0) with
          | first_block :: _ ->
              wire_equal
                (wget "block/tags" first_block)
                (Wire.Set [ warr [ wkw "block/uuid"; Wire.Uuid tag_uuid ] ])
          | [] -> false)
     | [] -> false)

(* (deftest derive-history-outliner-ops-apply-template-undo-canonicalizes-template-block-refs-test) *)
let test_derive_apply_template_undo_canonicalizes_template_block_refs () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks =
              [ { default_block with b_title = Some "template" }
              ; { default_block with b_title = Some "target" } ] } ]
      ()
  in
  let db = db_of conn in
  let template = Option.get (find_block_by_content db "template") in
  let target = Option.get (find_block_by_content db "target") in
  let template_uuid = uuid_of template in
  let target_uuid = uuid_of target in
  let inserted_uuid = gen_uuid () in
  let tag_uuid = gen_uuid () in
  transact_tag conn tag_uuid;
  let db = db_of conn in
  let tag =
    Option.get
      (Datascript.entity db (Lookup_ref ("block/uuid", Uuid tag_uuid)))
  in
  let tx_report =
    Datascript.with_tx db [ RetractEntity (Entity_id tag.id) ]
  in
  let meta =
    [ wmeta "outliner-op" (wkw "apply-template")
    ; wmeta "undo?" (Wire.Bool true)
    ; ( wmeta "db-sync/inverse-outliner-ops"
          (warr
             [ wop "apply-template"
                 [ Wire.Uuid template_uuid
                 ; Wire.Uuid target_uuid
                 ; wmap
                     [ ( wkw "template-blocks"
                       , warr
                           [ wmap
                               [ wkw "block/uuid", Wire.Uuid inserted_uuid
                               ; wkw "block/title", Wire.String "inserted"
                               ; wkw "block/tags"
                               , Wire.Set [ Wire.Int tag.id ] ] ] )
                     ; wkw "sibling?", Wire.Bool true ] ] ]) ) ]
  in
  let _forward, inverse =
    derive_ops db tx_report.db_after
      (Db_normalize.wire_of_datoms tx_report.tx_data)
      meta
  in
  check "apply-template undo canonicalizes nested template-block refs"
    (match inverse with
     | entry :: _ ->
         (match Wire.as_seq (wget "template-blocks" (op_arg entry 2)) with
          | tb :: _ ->
              wire_equal
                (wget "block/tags" tb)
                (Wire.Set [ warr [ wkw "block/uuid"; Wire.Uuid tag_uuid ] ])
          | [] -> false)
     | [] -> false)

(* (deftest derive-history-outliner-ops-apply-template-captures-template-blocks-when-missing-in-op-test) *)
let test_derive_apply_template_captures_template_blocks () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks =
              [ { default_block with b_title = Some "template"
                ; b_children =
                    [ { default_block with b_title = Some "template child 1" }
                    ; { default_block with b_title = Some "template child 2" } ] }
              ; { default_block with b_title = Some "target" } ] } ]
      ()
  in
  let db = db_of conn in
  let template = Option.get (find_block_by_content db "template") in
  let template_child_1 =
    Option.get (find_block_by_content db "template child 1")
  in
  let template_child_2 =
    Option.get (find_block_by_content db "template child 2")
  in
  let target = Option.get (find_block_by_content db "target") in
  let inserted_child_1_uuid = gen_uuid () in
  let inserted_child_2_uuid = gen_uuid () in
  let target_parent_id =
    match Ldb.ref_ent target "block/parent" with
    | Some p -> p.id
    | None -> failwith "target parent"
  in
  let tx_data =
    [ tx_datom 900001 "block/uuid" (Wire.Uuid inserted_child_1_uuid) true
    ; tx_datom 900001 "block/parent" (Wire.Int target_parent_id) true
    ; tx_datom 900002 "block/uuid" (Wire.Uuid inserted_child_2_uuid) true
    ; tx_datom 900002 "block/parent" (Wire.Int target_parent_id) true ]
  in
  ignore
    (Datascript.transact_conn conn
       [ Add
           ( Entity_id template_child_1.id
           , "block/refs"
           , Ref template_child_2.id ) ]);
  let db = db_of conn in
  let meta =
    tx_meta "apply-template"
      [ wop "apply-template"
          [ Wire.Int template.id
          ; Wire.Int target.id
          ; wmap [ wkw "sibling?", Wire.Bool true ] ] ]
  in
  let forward, _inverse = derive_ops db db tx_data meta in
  check "forward op is apply-template"
    (forward <> [] && op_name (List.hd forward) = "apply-template");
  check "apply-template keep-uuid? true"
    (wget "keep-uuid?" (op_arg (List.hd forward) 2) = Wire.Bool true);
  (match
     Wire.as_seq (wget "template-blocks" (op_arg (List.hd forward) 2))
   with
   | tbs ->
       check "template-blocks captured in order"
         (List.map (fun b -> wget "block/uuid" b) tbs
          = [ Wire.Uuid inserted_child_1_uuid
            ; Wire.Uuid inserted_child_2_uuid ]);
       (match tbs with
        | tb0 :: _ ->
            check "first template-block refs captured"
              (wire_equal
                 (wget "block/refs" tb0)
                 (Wire.Set
                    [ warr
                        [ wkw "block/uuid"
                        ; Wire.Uuid inserted_child_2_uuid ] ]))
        | [] -> check "template-blocks nonempty" false))

(* (deftest derive-history-outliner-ops-builds-delete-page-inverse-for-class-property-and-today-page-test) *)
let test_derive_delete_page_inverse_for_class_property_today () =
  let today =
    Date_time_util.ms_to_journal_day (Int64.of_float (Clock.now_ms ()))
  in
  let conn =
    create_conn_with_blocks
      ~classes:[ "Movie", default_class ]
      ~properties:
        [ "rating", { default_property with p_type = "number" } ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_journal = Some today }
          ; blocks =
              [ { default_block with b_title = Some "today child" } ] } ]
      ()
  in
  let db = db_of conn in
  let class_page =
    Option.get (Ldb.get_page db (String "Movie"))
  in
  let property_page =
    Option.get (Datascript.entity db (Ident "user.property/rating"))
  in
  let today_page =
    Option.get (find_journal_by_journal_day db today)
  in
  let today_child =
    Option.get (find_block_by_content db "today child")
  in
  let delete_page_inverse (e : entity) : Wire.t list =
    let _f, inverse =
      derive_ops db db []
        (tx_meta "delete-page"
           [ wop "delete-page" [ Wire.Uuid (uuid_of e); wmap [] ] ])
    in
    inverse
  in
  let class_inverse = delete_page_inverse class_page in
  let property_inverse = delete_page_inverse property_page in
  let today_inverse = delete_page_inverse today_page in
  check "class inverse has create-page"
    (List.exists (fun e -> op_name e = "create-page") class_inverse);
  check "class inverse has save-block"
    (List.exists (fun e -> op_name e = "save-block") class_inverse);
  (match
     List.find_opt (fun e -> op_name e = "save-block") class_inverse
   with
   | Some save ->
       check "class save-block keeps db/ident"
         (wget "db/ident" (op_arg save 0)
          = wkw (Option.get (Ldb.ident_of class_page)))
   | None -> ());
  check "property inverse has upsert-property"
    (List.exists (fun e -> op_name e = "upsert-property") property_inverse);
  check "property inverse has save-block"
    (List.exists (fun e -> op_name e = "save-block") property_inverse);
  (match
     List.find_opt (fun e -> op_name e = "save-block") property_inverse
   with
   | Some save ->
       check "property save-block keeps db/ident"
         (wget "db/ident" (op_arg save 0)
          = wkw (Option.get (Ldb.ident_of property_page)))
   | None -> ());
  check "today inverse has no restore-recycled"
    (not
       (List.exists (fun e -> op_name e = "restore-recycled") today_inverse));
  (match
     List.find_opt (fun e -> op_name e = "insert-blocks") today_inverse
   with
   | Some insert_op ->
       check "today inverse insert target is journal page"
         (op_arg insert_op 1 = Wire.Uuid (uuid_of today_page));
       (match Wire.as_seq (op_arg insert_op 0) with
        | first_block :: _ ->
            check "today inverse restores journal child"
              (wget "block/uuid" first_block
               = Wire.Uuid (uuid_of today_child))
        | [] -> check "insert blocks nonempty" false)
   | None -> check "today inverse has insert-blocks" false)

(* (deftest derive-history-outliner-ops-builds-inverse-for-all-supported-ops-test) *)
let test_derive_builds_inverse_for_all_supported_ops () =
  let conn =
    create_conn_with_blocks
      ~classes:
        [ "c1", { default_class with c_class_properties = [ "p1" ] } ]
      ~properties:
        [ "p1", { default_property with p_type = "default" } ]
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks =
              [ { default_block with b_title = Some "parent"
                ; b_children =
                    [ { default_block with b_title = Some "child-a" }
                    ; { default_block with b_title = Some "child-b" } ] }
              ; { default_block with b_title = Some "prop-block-1"
                ; b_properties = [ "p1", Str "before-1" ] }
              ; { default_block with b_title = Some "prop-block-2" } ] } ]
      ()
  in
  let db = db_of conn in
  let page = Option.get (find_page_by_title db "page") in
  let parent = Option.get (find_block_by_content db "parent") in
  let child_a = Option.get (find_block_by_content db "child-a") in
  let child_b = Option.get (find_block_by_content db "child-b") in
  (* ":save-block" *)
  let _f, inverse =
    derive_ops db db []
      (tx_meta "save-block"
         [ wop "save-block"
             [ wmap
                 [ wkw "block/uuid", Wire.Uuid (uuid_of child_a)
                 ; wkw "block/title", Wire.String "changed" ]
             ; wmap [] ] ])
  in
  check "save-block inverse op"
    (inverse <> [] && op_name (List.hd inverse) = "save-block");
  check "save-block inverse keeps uuid"
    (wget "block/uuid" (op_arg (List.hd inverse) 0)
     = Wire.Uuid (uuid_of child_a));
  (* ":insert-blocks" *)
  let inserted_uuid = gen_uuid () in
  let tx_data =
    [ tx_datom 999999 "block/uuid" (Wire.Uuid inserted_uuid) true ]
  in
  let _f, inverse =
    derive_ops db db tx_data
      (tx_meta "insert-blocks"
         [ wop "insert-blocks"
             [ warr
                 [ wmap
                     [ wkw "block/uuid", Wire.Uuid inserted_uuid
                     ; wkw "block/title", Wire.String "new" ] ]
             ; Wire.Int parent.id
             ; wmap [ wkw "sibling?", Wire.Bool false ] ] ])
  in
  check "insert-blocks inverse op"
    (inverse <> [] && op_name (List.hd inverse) = "delete-blocks");
  check "insert-blocks inverse deletes inserted uuid"
    (Wire.as_seq (op_arg (List.hd inverse) 0) = [ Wire.Uuid inserted_uuid ]);
  (* ":move-blocks" *)
  let _f, inverse =
    derive_ops db db []
      (tx_meta "move-blocks"
         [ wop "move-blocks"
             [ warr [ Wire.Int child_b.id ]
             ; Wire.Int parent.id
             ; wmap [ wkw "sibling?", Wire.Bool false ] ] ])
  in
  check "move-blocks inverse op"
    (inverse <> [] && op_name (List.hd inverse) = "move-blocks");
  check "move-blocks inverse moves child-b"
    (Wire.as_seq (op_arg (List.hd inverse) 0)
     = [ Wire.Uuid (uuid_of child_b) ]);
  (* ":delete-blocks" *)
  let _f, inverse =
    derive_ops db db []
      (tx_meta "delete-blocks"
         [ wop "delete-blocks" [ warr [ Wire.Int child_b.id ]; wmap [] ] ])
  in
  check "delete-blocks inverse op"
    (inverse <> [] && op_name (List.hd inverse) = "insert-blocks");
  check "delete-blocks inverse restores child-b"
    (match Wire.as_seq (op_arg (List.hd inverse) 0) with
     | first_block :: _ ->
         wget "block/uuid" first_block = Wire.Uuid (uuid_of child_b)
     | [] -> false);
  (* ":create-page" *)
  let page_uuid = gen_uuid () in
  let tx_data =
    [ tx_datom 1 "block/title" (Wire.String "P2") true
    ; tx_datom 1 "block/uuid" (Wire.Uuid page_uuid) true ]
  in
  let _f, inverse =
    derive_ops db db tx_data
      (tx_meta "create-page"
         [ wop "create-page"
             [ Wire.String "P2"; wmap [ wkw "redirect?", Wire.Bool false ] ] ])
  in
  check "create-page inverse deletes page"
    (wire_list_equal inverse
       [ wop "delete-page" [ Wire.Uuid page_uuid; wmap [] ] ]);
  (* ":delete-page" *)
  let _f, inverse =
    derive_ops db db []
      (tx_meta "delete-page"
         [ wop "delete-page" [ Wire.Uuid (uuid_of page); wmap [] ] ])
  in
  check "delete-page inverse restores recycled page"
    (wire_list_equal inverse
       [ wop "restore-recycled" [ Wire.Uuid (uuid_of page) ] ]);
  (* ":upsert-property" *)
  let property_ident = "user.property/test-inverse" in
  let expected_page_uuid =
    Common_uuid.gen_uuid "db-ident-block-uuid" property_ident
  in
  let _f, inverse =
    derive_ops db db []
      (tx_meta "upsert-property"
         [ wop "upsert-property"
             [ wkw property_ident
             ; wmap [ wkw "logseq.property/type", wkw "default" ]
             ; wmap [ wkw "property-name", Wire.String "test-inverse" ] ] ])
  in
  check "upsert-property inverse deletes property page"
    (wire_list_equal inverse
       [ wop "delete-page" [ Wire.Uuid expected_page_uuid; wmap [] ] ])

(* cljs run-direct-outdent — (#'outliner-core/indent-outdent-blocks conn
   [block] false :parent-original nil :logical-outdenting? nil) then
   (d/with @conn tx-data {}); returns (tx-data wire datoms, db-after) *)
(* cljs run-direct-outdent: the non-bang indent-outdent-blocks performs
   its moves via transact-move-blocks! (committed on conn) and returns nil;
   the test then does (d/with @conn nil {}) → tx-data [], db-after @conn. *)
let run_direct_outdent conn (block : entity) : Wire.t list * db =
  ignore (Outliner_core.indent_outdent_blocks conn [ block ] false ());
  let report = Datascript.with_tx (db_of conn) [] in
  (Db_normalize.wire_of_datoms report.tx_data, report.db_after)

(* (deftest build-history-action-metadata-direct-outdent-builds-indent-outdent-forward-and-inverse-test) *)
let test_direct_outdent_builds_indent_outdent_forward_and_inverse () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks =
              [ { default_block with b_title = Some "parent"
                ; b_children =
                    [ { default_block with b_title = Some "child-1" }
                    ; { default_block with b_title = Some "child-2" }
                    ; { default_block with b_title = Some "child-3" } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let child_3 = Option.get (find_block_by_content db "child-3") in
  let tx_data, db_after = run_direct_outdent conn child_3 in
  let io_opts =
    wmap [ wkw "parent-original", Wire.Nil; wkw "logical-outdenting?", Wire.Nil ]
  in
  let meta =
    tx_meta "move-blocks"
      [ wop "indent-outdent-blocks"
          [ warr [ Wire.Int child_3.id ]; Wire.Bool false; io_opts ] ]
  in
  let forward, inverse = derive_ops (db_of conn) db_after tx_data meta in
  check "direct outdent forward op"
    (wire_list_equal forward
       [ wop "indent-outdent-blocks"
           [ warr [ Wire.Uuid (uuid_of child_3) ]; Wire.Bool false; io_opts ] ]);
  check "direct outdent inverse op"
    (wire_list_equal inverse
       [ wop "indent-outdent-blocks"
           [ warr [ Wire.Uuid (uuid_of child_3) ]; Wire.Bool true; io_opts ] ])

(* (deftest derive-history-outliner-ops-direct-outdent-with-extra-moved-blocks-keeps-semantic-ops-test) *)
let test_direct_outdent_with_extra_moved_blocks_keeps_semantic_ops () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page" }
          ; blocks =
              [ { default_block with b_title = Some "parent"
                ; b_children =
                    [ { default_block with b_title = Some "child-1" }
                    ; { default_block with b_title = Some "child-2" }
                    ; { default_block with b_title = Some "child-3" } ] } ] } ]
      ()
  in
  let db = db_of conn in
  let child_2 = Option.get (find_block_by_content db "child-2") in
  let tx_data, db_after = run_direct_outdent conn child_2 in
  let io_opts =
    wmap [ wkw "parent-original", Wire.Nil; wkw "logical-outdenting?", Wire.Nil ]
  in
  let meta =
    tx_meta "move-blocks"
      [ wop "indent-outdent-blocks"
          [ warr [ Wire.Int child_2.id ]; Wire.Bool false; io_opts ] ]
  in
  let forward, inverse = derive_ops (db_of conn) db_after tx_data meta in
  check "outdent with extra moved blocks forward op"
    (wire_list_equal forward
       [ wop "indent-outdent-blocks"
           [ warr [ Wire.Uuid (uuid_of child_2) ]; Wire.Bool false; io_opts ] ]);
  check "outdent with extra moved blocks inverse op"
    (wire_list_equal inverse
       [ wop "indent-outdent-blocks"
           [ warr [ Wire.Uuid (uuid_of child_2) ]; Wire.Bool true; io_opts ] ])

let op_construct_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "derive-history-outliner-ops-canonicalizes-create-page-and-builds-delete-inverse" `Quick test_derive_create_page_canonicalizes_and_builds_delete_inverse;
    Alcotest.test_case "derive-history-outliner-ops-handles-replace-empty-target-insert-inverse" `Quick test_derive_replace_empty_target_insert_inverse;
    Alcotest.test_case "derive-history-outliner-ops-builds-upsert-property-inverse-delete-page" `Quick test_derive_upsert_property_inverse_delete_page;
    Alcotest.test_case "derive-history-outliner-ops-upsert-property-update-builds-schema-restore-inverse" `Quick test_derive_upsert_property_update_schema_restore_inverse;
    Alcotest.test_case "derive-history-outliner-ops-delete-blocks-inverse-avoids-self-target" `Quick test_derive_delete_blocks_inverse_avoids_self_target;
    Alcotest.test_case "compound-history-inverses-run-in-reverse-dependency-order" `Quick test_compound_history_inverses_reverse_dependency_order;
    Alcotest.test_case "derive-history-outliner-ops-delete-blocks-with-stale-id-keeps-id" `Quick test_derive_delete_blocks_stale_id_keeps_id;
    Alcotest.test_case "derive-history-outliner-ops-delete-blocks-prefers-retracted-tx-data-ids" `Quick test_derive_delete_blocks_prefers_retracted_tx_data_ids;
    Alcotest.test_case "derive-history-outliner-ops-move-blocks-resolves-target-id-from-tx-data" `Quick test_derive_move_blocks_resolves_target_id_from_tx_data;
    Alcotest.test_case "derive-history-outliner-ops-save-block-resolves-retracted-ref-id-from-db-before" `Quick test_derive_save_block_resolves_retracted_ref_from_db_before;
    Alcotest.test_case "derive-history-outliner-ops-insert-blocks-resolves-retracted-ref-id-from-tx-data" `Quick test_derive_insert_blocks_resolves_retracted_ref_from_tx_data;
    Alcotest.test_case "derive-history-outliner-ops-apply-template-undo-canonicalizes-template-block-refs" `Quick test_derive_apply_template_undo_canonicalizes_template_block_refs;
    Alcotest.test_case "derive-history-outliner-ops-apply-template-captures-template-blocks-when-missing-in-op" `Quick test_derive_apply_template_captures_template_blocks;
    Alcotest.test_case "derive-history-outliner-ops-builds-delete-page-inverse-for-class-property-and-today-page" `Quick test_derive_delete_page_inverse_for_class_property_today;
    Alcotest.test_case "derive-history-outliner-ops-builds-inverse-for-all-supported-ops" `Quick test_derive_builds_inverse_for_all_supported_ops;
    Alcotest.test_case "build-history-action-metadata-direct-outdent-builds-indent-outdent-forward-and-inverse" `Quick test_direct_outdent_builds_indent_outdent_forward_and_inverse;
    Alcotest.test_case "derive-history-outliner-ops-direct-outdent-with-extra-moved-blocks-keeps-semantic-ops" `Quick test_direct_outdent_with_extra_moved_blocks_keeps_semantic_ops ]

(* ---------- deps/outliner/test/logseq/outliner/move_property_value_undo_test.cljs ---------- *)

(* cljs child-titles is outline_child_titles (defined in the
   cut-paste section above). *)

(* cljs undo-op! — run the forward op, derive the inverse from
   (db-before, @conn, [], tx-meta), apply it. *)
let undo_op_bang conn (meta : (Wire.t * Wire.t) list)
    (forward : unit -> unit) : Wire.t list =
  let db_before = db_of conn in
  forward ();
  let _f, inverse = derive_ops db_before (db_of conn) [] meta in
  check "forward op has an inverse op" (inverse <> []);
  apply_ops conn inverse;
  inverse

(* cljs undo-move! *)
let undo_move_bang conn (value : entity) (dest : entity) : Wire.t list =
  let meta =
    tx_meta "move-blocks"
      [ wop "move-blocks"
          [ warr [ Wire.Uuid (uuid_of value) ]
          ; Wire.Uuid (uuid_of dest)
          ; wmap [ wkw "sibling?", Wire.Bool false ] ] ]
  in
  undo_op_bang conn meta (fun () ->
      move_blocks_bang conn [ value ] dest
        ~opts:{ Outliner_core.default_insert_opts with sibling = false }
        ())

(* cljs undo-delete! (move_property_value_undo variant — bang delete) *)
let undo_move_delete_bang conn (value : entity) : Wire.t list =
  let meta =
    tx_meta "delete-blocks"
      [ wop "delete-blocks" [ warr [ Wire.Uuid (uuid_of value) ]; wmap [] ] ]
  in
  undo_op_bang conn meta (fun () -> delete_blocks_bang conn [ value ] ())

let created_from_property_ident (db : db) (e : entity) : string option =
  match Ldb.ref_ent e "logseq.property/created-from-property" with
  | Some p -> Ldb.ident_of p
  | None -> None

(* (deftest undo-move-restores-text-and-url-property-values) *)
let test_undo_move_restores_text_and_url_property_values () =
  List.iter
    (fun (property_type, property_key, value_title) ->
      let conn =
        create_conn_with_blocks
          ~properties:
            [ property_key
            , { default_property with p_type = property_type } ]
          ~pages_and_blocks:
            [ { page = { default_page with pg_title = Some "page" }
              ; blocks =
                  [ { default_block with b_title = Some "node"
                    ; b_properties = [ property_key, Str value_title ]
                    ; b_children =
                        [ { default_block with b_title = Some "child" } ] }
                  ; { default_block with b_title = Some "dest" } ] } ]
          ()
      in
      let property_ident = "user.property/" ^ property_key in
      let db = db_of conn in
      let node = Option.get (find_block_by_content db "node") in
      let dest = Option.get (find_block_by_content db "dest") in
      let value = Option.get (Ldb.ref_ent node property_ident) in
      let value_uuid = uuid_of value in
      check (property_type ^ " value has db/id") (value.id > 0);
      check (property_type ^ " created-from-property ident")
        (created_from_property_ident db value = Some property_ident);
      check (property_type ^ " node children")
        (outline_child_titles node = [ "child" ]);
      let inverse = undo_move_bang conn value dest in
      let db = db_of conn in
      let restored =
        Option.get
          (Datascript.entity db
             (Lookup_ref ("block/uuid", Uuid value_uuid)))
      in
      let node' = Option.get (Datascript.entity db (Entity_id node.id)) in
      let dest' = Option.get (Datascript.entity db (Entity_id dest.id)) in
      check (property_type ^ " inverse is move-blocks")
        (inverse <> [] && op_name (List.hd inverse) = "move-blocks");
      check (property_type ^ " inverse reattaches property identity")
        (wget "created-from-property" (op_arg (List.hd inverse) 2)
         = Wire.Keyword property_ident);
      check (property_type ^ " restored is a property value")
        (created_from_property_ident db restored = Some property_ident);
      check (property_type ^ " node still owns the property value")
        (match Ldb.ref_ent node' property_ident with
         | Some v -> v.id = restored.id
         | None -> false);
      check (property_type ^ " restored parent is node")
        (match Ldb.ref_ent restored "block/parent" with
         | Some p -> p.id = node'.id
         | None -> false);
      check (property_type ^ " restored value not a normal child")
        (outline_child_titles node' = [ "child" ]);
      check (property_type ^ " restored parent is not dest")
        (match Ldb.ref_ent restored "block/parent" with
         | Some p -> p.id <> dest'.id
         | None -> false))
    [ "default", "p-text", "text property value"
    ; "url", "p-url", "https://logseq.com" ]

(* (deftest undo-delete-restores-text-and-url-property-values) *)
let test_undo_delete_restores_text_and_url_property_values () =
  List.iter
    (fun (property_type, property_key, value_title) ->
      let conn =
        create_conn_with_blocks
          ~properties:
            [ property_key
            , { default_property with p_type = property_type } ]
          ~pages_and_blocks:
            [ { page = { default_page with pg_title = Some "page" }
              ; blocks =
                  [ { default_block with b_title = Some "node"
                    ; b_properties = [ property_key, Str value_title ]
                    ; b_children =
                        [ { default_block with b_title = Some "child" } ] } ] } ]
          ()
      in
      let property_ident = "user.property/" ^ property_key in
      let db = db_of conn in
      let node = Option.get (find_block_by_content db "node") in
      let value = Option.get (Ldb.ref_ent node property_ident) in
      let value_uuid = uuid_of value in
      check (property_type ^ " value has db/id") (value.id > 0);
      check (property_type ^ " created-from-property ident")
        (created_from_property_ident db value = Some property_ident);
      check (property_type ^ " node children")
        (outline_child_titles node = [ "child" ]);
      let inverse = undo_move_delete_bang conn value in
      let db = db_of conn in
      let restored =
        Option.get
          (Datascript.entity db
             (Lookup_ref ("block/uuid", Uuid value_uuid)))
      in
      let node' = Option.get (Datascript.entity db (Entity_id node.id)) in
      check (property_type ^ " inverse is insert-blocks")
        (inverse <> [] && op_name (List.hd inverse) = "insert-blocks");
      check (property_type ^ " inverse reattaches property identity")
        (wget "created-from-property" (op_arg (List.hd inverse) 2)
         = Wire.Keyword property_ident);
      check (property_type ^ " restored is a property value")
        (created_from_property_ident db restored = Some property_ident);
      check (property_type ^ " node still owns the property value")
        (match Ldb.ref_ent node' property_ident with
         | Some v -> v.id = restored.id
         | None -> false);
      check (property_type ^ " restored parent is node")
        (match Ldb.ref_ent restored "block/parent" with
         | Some p -> p.id = node'.id
         | None -> false);
      check (property_type ^ " restored value not a normal child")
        (outline_child_titles node' = [ "child" ]))
    [ "default", "p-text", "text property value"
    ; "url", "p-url", "https://logseq.com" ]

(* (deftest undo-delete-restores-many-text-property-values) *)
let test_undo_delete_restores_many_text_property_values () =
  List.iter
    (fun value_title ->
      let conn =
        create_conn_with_blocks
          ~properties:
            [ "p-many"
            , { default_property with p_type = "default"
              ; p_cardinality_many = true } ]
          ~pages_and_blocks:
            [ { page = { default_page with pg_title = Some "page" }
              ; blocks =
                  [ { default_block with b_title = Some "node"
                    ; b_properties =
                        [ "p-many", Set_ [ Str "alpha"; Str "beta" ] ]
                    ; b_children =
                        [ { default_block with b_title = Some "child" } ] } ] } ]
          ()
      in
      let db = db_of conn in
      let node = Option.get (find_block_by_content db "node") in
      let values = Ldb.ref_ents node "user.property/p-many" in
      let value =
        match
          List.find_opt
            (fun v -> ent_title v = Some value_title)
            values
        with
        | Some v -> v
        | None -> failwith "value not found"
      in
      let value_uuid = uuid_of value in
      check (value_title ^ " value has db/id") (value.id > 0);
      let inverse = undo_move_delete_bang conn value in
      let db = db_of conn in
      let restored =
        Option.get
          (Datascript.entity db
             (Lookup_ref ("block/uuid", Uuid value_uuid)))
      in
      let node' = Option.get (Datascript.entity db (Entity_id node.id)) in
      check (value_title ^ " inverse is insert-blocks")
        (inverse <> [] && op_name (List.hd inverse) = "insert-blocks");
      check (value_title ^ " inverse reattaches p-many")
        (wget "created-from-property" (op_arg (List.hd inverse) 2)
         = Wire.Keyword "user.property/p-many");
      check (value_title ^ " restored is a property value")
        (created_from_property_ident db restored
         = Some "user.property/p-many");
      check (value_title ^ " node owns restored value")
        (List.exists
           (fun v ->
             v.id = restored.id && ent_title v = Some value_title)
           (Ldb.ref_ents node' "user.property/p-many"));
      check (value_title ^ " node keeps both values")
        (List.length (Ldb.ref_ents node' "user.property/p-many") = 2);
      check (value_title ^ " restored value not a normal child")
        (outline_child_titles node' = [ "child" ]))
    [ "alpha"; "beta" ]

let move_undo_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "undo-move-restores-text-and-url-property-values" `Quick test_undo_move_restores_text_and_url_property_values;
    Alcotest.test_case "undo-delete-restores-text-and-url-property-values" `Quick test_undo_delete_restores_text_and_url_property_values;
    Alcotest.test_case "undo-delete-restores-many-text-property-values" `Quick test_undo_delete_restores_many_text_property_values ]

(* ---------- cut_paste_property_test.cljs remaining deftests ---------- *)

(* cljs undo-delete! (cut_paste_property variant — pure delete-blocks +
   d/with + reset!, then derive + apply inverse ops) *)
let undo_delete_blocks_bang conn (block : entity) : Wire.t list =
  let db_before = db_of conn in
  let block_uuid = uuid_of block in
  let r = Outliner_core.delete_blocks db_before [ Block_map.of_entity block ] in
  let report = Datascript.with_tx db_before r.tx_data in
  let meta =
    tx_meta "delete-blocks"
      [ wop "delete-blocks" [ warr [ Wire.Uuid block_uuid ]; wmap [] ] ]
  in
  let _f, inverse =
    derive_ops db_before report.db_after
      (Db_normalize.wire_of_datoms report.tx_data)
      meta
  in
  ignore (Datascript.apply_report conn report);
  check "delete has an inverse op" (inverse <> []);
  apply_ops conn inverse;
  inverse

(* (deftest undo-delete-restores-all-property-types) *)
let test_undo_delete_restores_all_property_types () =
  List.iter
    (fun (c : paste_case) ->
      let conn = create_case_conn c in
      let db = db_of conn in
      let block = find_source_block db c in
      let block_uuid = uuid_of block in
      check (c.pc_title ^ " source block exists") (block.id > 0);
      ignore (undo_delete_blocks_bang conn block);
      let restored =
        Datascript.entity (db_of conn)
          (Lookup_ref ("block/uuid", Uuid block_uuid))
      in
      check (c.pc_title ^ " restored") (restored <> None);
      (match restored with
       | Some p -> assert_properties (db_of conn) p c.pc_expected
       | None -> ()))
    cut_property_cases

(* (deftest delete-inverse-includes-property-value-children) *)
let test_delete_inverse_includes_property_value_children () =
  let c = List.hd cut_property_cases in
  let conn = create_case_conn c in
  let db = db_of conn in
  let block = find_source_block db c in
  let value_uuid =
    match Ldb.ref_ent block "user.property/p1" with
    | Some v -> uuid_of v
    | None -> ""
  in
  let inverse = undo_delete_blocks_bang conn block in
  check "inverse is insert-blocks"
    (inverse <> [] && op_name (List.hd inverse) = "insert-blocks");
  let insert_uuids =
    match inverse with
    | insert_op :: _ ->
        List.filter_map
          (fun b ->
            match wget "block/uuid" b with
            | Wire.Uuid u -> Some u
            | _ -> None)
          (Wire.as_seq (op_arg insert_op 0))
    | [] -> []
  in
  check "restore payload includes the block"
    (List.mem (uuid_of block) insert_uuids);
  check "restore payload includes the property-value child"
    (List.mem value_uuid insert_uuids)

let cut_paste_undo_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "undo-delete-restores-all-property-types" `Quick test_undo_delete_restores_all_property_types;
    Alcotest.test_case "delete-inverse-includes-property-value-children" `Quick test_delete_inverse_includes_property_value_children ]

(* ========== src/test/logseq/outliner/page_updated_at_test.cljs ==========
   (same deftests also appear in core_test.cljs; ported once) *)

(* cljs test-helper page-updated-at *)
let page_updated_at conn (page : entity) : int =
  match Datascript.entity (db_of conn) (Entity_id page.id) with
  | Some e -> (match Ldb.int_value e "block/updated-at" with
      | Some v -> v
      | None -> 0)
  | None -> 0

(* cljs test-helper reset-page-updated-at! *)
let reset_page_updated_at conn (page : entity) : int =
  transact_maps conn
    [ [ "db/id", Int page.id; "block/updated-at", Inst 1L ] ];
  page_updated_at conn page

(* (deftest page-updated-at-bumps-on-child-insert-reorder-and-move ...) *)
let test_page_updated_at_child_insert_reorder_and_move () =
  (* (testing "inserting a child block bumps the page updated-at") *)
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "parent" } ] } ]
      ()
  in
  let page = Option.get (find_page conn "page1") in
  let parent = find_block conn "parent" in
  let before = reset_page_updated_at conn page in
  insert_blocks_bang conn
    [ [ "block/uuid", Uuid (gen_uuid ())
      ; "block/title", String "inserted-child" ] ]
    (Block_map.of_entity parent)
    ~opts:{ Outliner_core.default_insert_opts with
            sibling = false; keep_uuid = true }
    ();
  check "inserted-child created"
    (find_block_by_content (db_of conn) "inserted-child" <> None);
  check "Adding a child block must bump the page :block/updated-at"
    (page_updated_at conn page > before);
  (* (testing "reordering sibling blocks bumps the page updated-at") *)
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "first" }
                     ; { default_block with b_title = Some "second" } ] } ]
      ()
  in
  let page = Option.get (find_page conn "page1") in
  let second_block = find_block conn "second" in
  let before = reset_page_updated_at conn page in
  Outliner_core.move_blocks_up_down_conn conn [ second_block ] true;
  let first_child =
    List.hd
      (Ldb.sort_by_order
         (Ldb.ref_ents
            (Option.get (Datascript.entity (db_of conn) (Entity_id page.id)))
            "block/_parent"))
  in
  check "second is first child" (ent_title first_child = Some "second");
  check "Changing block order must bump the page :block/updated-at"
    (page_updated_at conn page > before);
  (* (testing "move-blocks bumps source and destination page updated-at") *)
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "moved" } ] }
        ; { page = { default_page with pg_title = Some "page2" };
            blocks = [ { default_block with b_title = Some "dest" } ] } ]
      ()
  in
  let page1 = Option.get (find_page conn "page1") in
  let page2 = Option.get (find_page conn "page2") in
  let moved = find_block conn "moved" in
  let dest = find_block conn "dest" in
  let before_src = reset_page_updated_at conn page1 in
  let before_dest = reset_page_updated_at conn page2 in
  move_blocks_bang conn [ moved ] dest ();
  check "moved reparented under dest"
    (match Ldb.ref_ent (find_block conn "moved") "block/parent" with
     | Some p -> p.id = dest.id
     | None -> false);
  check "Removing a block must bump the source page :block/updated-at"
    (page_updated_at conn page1 > before_src);
  check "Adding a block must bump the destination page :block/updated-at"
    (page_updated_at conn page2 > before_dest);
  (* (testing "apply-ops move-blocks bumps page updated-at") *)
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "first" }
                     ; { default_block with b_title = Some "second" } ] } ]
      ()
  in
  let page = Option.get (find_page conn "page1") in
  let first_block = find_block conn "first" in
  let second_block = find_block conn "second" in
  let before = reset_page_updated_at conn page in
  apply_ops conn
    [ Wire.List
        [ Wire.Keyword "move-blocks"
        ; Wire.List
            [ Wire.List [ Wire.Uuid (uuid_of second_block) ]
            ; Wire.Uuid (uuid_of first_block)
            ; Wire.Map [ Wire.Keyword "sibling?", Wire.Bool false ] ] ] ];
  check "second reparented under first"
    (match Ldb.ref_ent (find_block conn "second") "block/parent" with
     | Some p -> p.id = first_block.id
     | None -> false);
  check "move-blocks via apply-ops must bump the page :block/updated-at"
    (page_updated_at conn page > before);
  (* (testing "moving a page between parent pages bumps both parents") *)
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "Projects" };
            blocks = [] }
        ; { page = { default_page with pg_title = Some "Alpha" };
            blocks = [] }
        ; { page = { default_page with pg_title = Some "Archive" };
            blocks = [] } ]
      ()
  in
  let projects = Option.get (find_page conn "Projects") in
  let alpha = Option.get (find_page conn "Alpha") in
  let archive = Option.get (find_page conn "Archive") in
  let alpha' () =
    Option.get (Datascript.entity (db_of conn) (Entity_id alpha.id))
  in
  move_blocks_bang conn [ alpha ] projects ();
  check "alpha under projects"
    (match Ldb.ref_ent (alpha' ()) "block/parent" with
     | Some p -> p.id = projects.id
     | None -> false);
  let before_src = reset_page_updated_at conn projects in
  let before_dest = reset_page_updated_at conn archive in
  let before_moved = reset_page_updated_at conn alpha in
  move_blocks_bang conn [ alpha ] archive ();
  check "alpha under archive"
    (match Ldb.ref_ent (alpha' ()) "block/parent" with
     | Some p -> p.id = archive.id
     | None -> false);
  check "Removing a nested page must bump the former parent page :block/updated-at"
    (page_updated_at conn projects > before_src);
  check "Adding a nested page must bump the destination page :block/updated-at"
    (page_updated_at conn archive > before_dest);
  check "Relocating a page does not rewrite that page's own :block/updated-at"
    (page_updated_at conn alpha = before_moved)

(* (deftest page-updated-at-bumps-source-page-on-keep-uuid-reparent ...) *)
let test_page_updated_at_source_page_on_keep_uuid_reparent () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "source" };
            blocks = [ { default_block with b_title = Some "moved" } ] }
        ; { page = { default_page with pg_title = Some "dest" };
            blocks = [ { default_block with b_title = Some "anchor" } ] } ]
      ()
  in
  let source = Option.get (find_page conn "source") in
  let dest = Option.get (find_page conn "dest") in
  let moved = find_block conn "moved" in
  let dest_anchor = find_block conn "anchor" in
  let before_src = reset_page_updated_at conn source in
  let before_dest = reset_page_updated_at conn dest in
  insert_blocks_bang conn
    [ Block_map.of_entity moved ]
    (Block_map.of_entity dest_anchor)
    ~opts:{ Outliner_core.default_insert_opts with
            sibling = true; keep_uuid = true }
    ();
  check "moved under dest page"
    (match Ldb.ref_ent
             (Option.get (Datascript.entity (db_of conn) (Entity_id moved.id)))
             "block/page" with
     | Some p -> p.id = dest.id
     | None -> false);
  check "Reparenting a live block must bump the source page :block/updated-at"
    (page_updated_at conn source > before_src);
  check "Reparenting a live block must bump the destination page :block/updated-at"
    (page_updated_at conn dest > before_dest)

(* (deftest page-updated-at-bumps-on-child-delete ...) *)
let test_page_updated_at_bumps_on_child_delete () =
  let conn =
    create_conn_with_blocks
      ~pages_and_blocks:
        [ { page = { default_page with pg_title = Some "page1" };
            blocks = [ { default_block with b_title = Some "doomed" } ] } ]
      ()
  in
  let page = Option.get (find_page conn "page1") in
  let doomed = find_block conn "doomed" in
  let before = reset_page_updated_at conn page in
  delete_blocks_bang conn [ doomed ] ();
  check "doomed deleted"
    (find_block_by_content (db_of conn) "doomed" = None);
  check "Deleting a child block must bump the page :block/updated-at"
    (page_updated_at conn page > before)

let page_updated_at_cases : unit Alcotest.test_case list =
  [ Alcotest.test_case "page-updated-at-bumps-on-child-insert-reorder-and-move" `Quick test_page_updated_at_child_insert_reorder_and_move;
    Alcotest.test_case "page-updated-at-bumps-source-page-on-keep-uuid-reparent" `Quick test_page_updated_at_source_page_on_keep_uuid_reparent;
    Alcotest.test_case "page-updated-at-bumps-on-child-delete" `Quick test_page_updated_at_bumps_on_child_delete ]
