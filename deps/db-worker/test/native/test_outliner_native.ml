(* 1:1 OCaml translation of the cljs tests that exercise the ported
   outliner modules:

   - deps/outliner/test/logseq/outliner/validate_test.cljs — the four
     validate-unique-by-name-and-tags deftests (apply-ops-driven deftests
     are skipped: outliner.op/outliner.core are not ported).
   - deps/outliner/test/logseq/outliner/recycle_test.cljs — ten deftests
     (the three apply-ops cases are skipped for the same reason).

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
(* The three apply-ops deftests are skipped: outliner.op/apply-ops! is not
   ported. *)

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
    Alcotest.test_case "gc-keeps-unexpired-recycled-page" `Quick test_gc_keeps_unexpired_recycled_page;
    Alcotest.test_case "permanently-delete-recycled-block-removes-subtree-only" `Quick test_permanently_delete_recycled_block_removes_subtree_only;
    Alcotest.test_case "permanently-delete-recycled-block-removes-corresponding-view-history" `Quick test_permanently_delete_recycled_block_removes_corresponding_view_history ]
