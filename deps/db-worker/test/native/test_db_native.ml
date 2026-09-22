(* 1:1 translations of cljs unit tests exercising ported db-worker code.

   Sources:
   - deps/db/test/logseq/db_test.cljs — get-case-page,
     get-journal-page-by-day, ordinary-sibling-*, page-exists,
     test-transact-with-multiple-tx-datoms, get-bidirectional-properties
     (+ ignores-recycled-entities)
   - src/test/frontend/worker/db_core_test.cljs —
     get-block-parents-returns-parents,
     get-block-refs-returns-linked-references,
     get-latest-journals-returns-worker-maps, q-executes-datascript-query,
     q-returns-nil-for-missing-conn, datoms-returns-formatted-datoms,
     pull-returns-entity-data

   cljs deftest names are kept as OCaml test names.

   Skipped cljs cases (unported dependency):
   - get-class-extends: ldb/get-class-extends not ported
   - sort-page-random-blocks (2 cases): ldb/sort-page-random-blocks not
     ported
   - test-batch-transact! / batch-transact-with-temp-conn-* /
     batch-transact-without-pages-date-* / validated-transact-* /
     fix-db-transact-* / transact-new-graph-refs-* /
     test-batch-transact-clears-stale-tx-tail-*: the ldb transact
     pipeline (batch-transact-with-temp-conn!, batch-transact!,
     register-transact-pipeline-fn!, storage tx tail internals) is not
     ported
   - get-bidirectional-properties-performance-* and
     get-latest-journals-bounded-scan: ^:long tests that count d/entity /
     d/datoms calls via with-redefs — no OCaml equivalent
   - plural tests: none exist under deps/common/test
   - id-ref->title-ref / content-id-ref->page tests: none exist in
     deps/db test dirs

   Known cljs-vs-OCaml divergences surfaced by these tests (asserted
   where observable, not papered over):
   - cljs page-exists? returns a seq of matching page eids;
     Ldb.page_exists returns bool. Boolean equivalents asserted.
   - cljs entity->plain-map :block/title goes through
     entity-plus/get-block-title (journal pages get the formatted
     journal title); OCaml page_summary emits the stored literal under
     :block/title and the computed title under :block/raw-title. The
     get-latest-journals test asserts :block/raw-title; the :block/title
     mismatch is reported, not asserted.
   - cljs thread-api/get-block-refs accepts an entity ref
     ([:block/uuid u]); the OCaml endpoint takes the resolved eid int.

   Lib bugs found by these tests (reported, not fixed here):
   - Ldb.values (lib/ldb.ml) drops One_entity/Many_entities produced by
     entity_attr's ref materialization, so every ref-attr accessor
     (ref_ids/ref_ent/has_tag/is_page/...) returned empty. Requires
     unwrapping te.db_id back to Ref. Verified: all assertions below pass
     with that fix.
   - lib/db_tx.ml (ceed505197) called undefined transact_report and
     commit_tx_report; transact ~tx_meta db tx_ops and reset_conn
     ~tx_meta conn report.db_after compile and keep these tests green. *)

open Datascript

let failures = ref 0

let check (name : string) (ok : bool) =
  if ok then ()
  else begin
    incr failures;
    Printf.eprintf "FAIL: %s\n" name
  end

let await (t : Wire.t Db_worker_effect.t) : Wire.t =
  let result = ref Wire.nil in
  Db_worker_effect.on_any t (fun v -> result := v) (fun e -> raise e);
  !result

let test_repo = "test-repo"

let register_conn conn = Worker_state.set_datascript_conn test_repo conn

let db_of = Datascript.db
let ent_title (e : entity) = Ldb.string_value e "block/title"

(* Endpoint modules self-register via top-level Dispatcher.register
   effects; force module init before invoking by name. *)
let () = Worker_core.init ()

let block_by_title db t = Db_test_util.find_page_by_title db t

(* wire helpers for endpoint result assertions *)
let wire_maps (w : Wire.t) : (Wire.t * Wire.t) list list =
  match w with
  | Wire.Array items | Wire.List items ->
      List.filter_map (function Wire.Map kvs -> Some kvs | _ -> None) items
  | _ -> []

let wire_get (k : string) (m : (Wire.t * Wire.t) list) : Wire.t option =
  List.find_map (function Wire.Keyword k', v when k' = k -> Some v | _ -> None) m

let wire_string_field (k : string) (m : (Wire.t * Wire.t) list) : string option =
  match wire_get k m with
  | Some (Wire.String s) | Some (Wire.Uuid s) -> Some s
  | _ -> None

(* ---------- deps/db/test/logseq/db_test.cljs ---------- *)

(* (deftest get-case-page ...) *)
let () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "foo", Db_test_util.{ default_property with p_type = "default" };
          "Foo", Db_test_util.{ default_property with p_type = "default" } ]
      ~classes:
        [ "movie", Db_test_util.default_class;
          "Movie", Db_test_util.default_class ]
      ()
  in
  let db = db_of conn in
  let title_of name =
    match Ldb.get_case_page db (String name) with
    | Some e -> ent_title e
    | None -> None
  in
  check "get-case-page foo" (title_of "foo" = Some "foo");
  check "get-case-page Foo" (title_of "Foo" = Some "Foo");
  check "get-case-page movie" (title_of "movie" = Some "movie");
  check "get-case-page Movie" (title_of "Movie" = Some "Movie")

(* (deftest get-journal-page-by-day ...) *)
let () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_journal = Some 20260410 };
              blocks = [] };
          Db_test_util.
            { page = { default_page with pg_journal = Some 20260411 };
              blocks = [] } ]
      ()
  in
  let db = db_of conn in
  let title_of day =
    match Ldb.get_journal_page_by_day db day with
    | Some e -> ent_title e
    | None -> None
  in
  check "get-journal-page-by-day 20260410"
    (title_of 20260410 = Some "Apr 10th, 2026");
  check "get-journal-page-by-day 20260411"
    (title_of 20260411 = Some "Apr 11th, 2026")

(* (deftest ordinary-sibling-skips-created-from-property-children ...)
   (deftest ordinary-sibling-skips-closed-value-property-children ...)
   cljs create-sibling-conn transacts the same raw tx maps. *)
let create_sibling_conn extra_attrs =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id -1 :block/title \"page\" :block/name \"page\"}
            {:db/id -2 :db/ident :user.property/p}
            {:db/id -3 :block/title \"ordinary before\" :block/parent -1 :block/order \"a0\"}
            {:db/id -4 :block/title \"property value\" :block/parent -1 :block/order \"a1\" %s}
            {:db/id -5 :block/title \"ordinary after\" :block/parent -1 :block/order \"a2\"}]"
          extra_attrs));
  conn

let check_ordinary_sibling name conn =
  let db = db_of conn in
  let before' = Option.get (block_by_title db "ordinary before") in
  let after' = Option.get (block_by_title db "ordinary after") in
  check
    (name ^ " left of after")
    (match Ldb.get_left_sibling after' with
     | Some e -> e.id = before'.id
     | None -> false);
  check
    (name ^ " right of before")
    (match Ldb.get_right_sibling before' with
     | Some e -> e.id = after'.id
     | None -> false)

let () =
  check_ordinary_sibling "ordinary-sibling-skips-created-from-property-children"
    (create_sibling_conn ":logseq.property/created-from-property -2");
  check_ordinary_sibling "ordinary-sibling-skips-closed-value-property-children"
    (create_sibling_conn ":block/closed-value-property -2")

(* (deftest page-exists ...)
   cljs page-exists? returns a seq of page eids (e.g. ["foo" page]);
   Ldb.page_exists returns bool — boolean equivalents asserted. *)
let () =
  let conn =
    Db_test_util.create_conn_with_blocks
      ~properties:
        [ "foo", Db_test_util.{ default_property with p_type = "default" } ]
      ~classes: [ "movie", Db_test_util.default_class ]
      ()
  in
  let db = db_of conn in
  check "page-exists foo Property"
    (Ldb.page_exists db "foo" [ "logseq.class/Property" ]);
  check "page-exists foo Tag"
    (not (Ldb.page_exists db "foo" [ "logseq.class/Tag" ]));
  check "page-exists movie Tag"
    (Ldb.page_exists db "movie" [ "logseq.class/Tag" ]);
  check "page-exists movie Property"
    (not (Ldb.page_exists db "movie" [ "logseq.class/Property" ]))

(* (deftest test-transact-with-multiple-tx-datoms ...) *)
let () =
  (* cljs (d/create-conn) — no schema *)
  let conn = Datascript.create_conn () in
  ignore (Datascript.transact_conn_string conn "[[:db/add -1 :property :v1]]");
  let tx = (Datascript.db conn).max_tx in
  let property_of_e1 () =
    match Datascript.entity (Datascript.db conn) (Entity_id 1) with
    | Some e -> Ldb.value e "property"
    | None -> None
  in
  ignore
    (Datascript.transact_conn conn
       [ Raw_datom { e = 1; a = "property"; v = Keyword "v1"; tx = tx + 1; added = false };
         Raw_datom { e = 1; a = "property"; v = Keyword "v1"; tx = tx + 1; added = true } ]);
  check "test-transact-with-multiple-tx-datoms retract+add same tx"
    (property_of_e1 () = Some (Keyword "v1"));
  ignore
    (Datascript.transact_conn conn
       [ Raw_datom { e = 1; a = "property"; v = Keyword "v1"; tx = tx + 2; added = false };
         Raw_datom { e = 1; a = "property"; v = Keyword "v1"; tx = tx + 2; added = true } ]);
  check "test-transact-with-multiple-tx-datoms tx+2"
    (property_of_e1 () = Some (Keyword "v1"))

(* (deftest get-bidirectional-properties ...) — both testing branches *)
let create_bidirectional_conn ~enabled =
  let open Db_test_util in
  create_conn_with_blocks
    ~properties:
      [ "friend",
        { default_property with
          p_type = "node";
          p_property_classes = [ "Person" ] } ]
    ~classes:
      [ "Person",
        { default_class with
          c_properties =
            (if enabled
             then [ "logseq.property.class/enable-bidirectional?", Bool true ]
             else []) };
        "Project", default_class ]
    ~pages_and_blocks:
      [ { page =
            { default_page with
              pg_title = Some "Alice";
              pg_tags = [ "Person" ];
              pg_properties = [ "friend", build_page_ref ~title:"Bob" () ] };
          blocks = [] };
        { page = { default_page with pg_title = Some "Bob" }; blocks = [] };
        { page =
            { default_page with
              pg_title = Some "Charlie";
              pg_tags = [ "Project" ];
              pg_properties = [ "friend", build_page_ref ~title:"Bob" () ] };
          blocks = [] } ]
    ()

let () =
  let db = db_of (create_bidirectional_conn ~enabled:false) in
  let target = Option.get (block_by_title db "Bob") in
  check "get-bidirectional-properties disabled"
    (Ldb.get_bidirectional_properties db target.id = [])

let () =
  let conn = create_bidirectional_conn ~enabled:true in
  let db = db_of conn in
  let target = Option.get (block_by_title db "Bob") in
  let result = Ldb.get_bidirectional_properties db target.id in
  check "get-bidirectional-properties group count" (List.length result = 1);
  (match result with
   | [ g ] ->
       check "get-bidirectional-properties group title" (g.title = "People");
       check "get-bidirectional-properties group entities"
         (List.map ent_title g.entities = [ Some "Alice" ])
   | _ -> ());

  (* (deftest get-bidirectional-properties-ignores-recycled-entities ...) *)
  let alice = Option.get (block_by_title db "Alice") in
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:db/id %d :logseq.property/deleted-at 1}]" alice.id));
  (* fresh db value: datascript dbs are immutable, the captured db
     predates the deleted-at tx *)
  check "get-bidirectional-properties-ignores-recycled-entities"
    (Ldb.get_bidirectional_properties (db_of conn) target.id = [])

(* ---------- src/test/frontend/worker/db_core_test.cljs ---------- *)

(* (deftest get-block-parents-returns-parents ...) *)
let () =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/uuid #uuid \"00000000-0000-4000-8000-00000000aa01\" :block/title \"grandparent\"}
         {:block/uuid #uuid \"00000000-0000-4000-8000-00000000bb02\" :block/title \"parent\"
          :block/parent [:block/uuid #uuid \"00000000-0000-4000-8000-00000000aa01\"]}
         {:block/uuid #uuid \"00000000-0000-4000-8000-00000000cc03\" :block/title \"child\"
          :block/parent [:block/uuid #uuid \"00000000-0000-4000-8000-00000000bb02\"]}]");
  register_conn conn;
  let res =
    await
      (Dispatcher.invoke "thread-api/get-block-parents"
         [ Wire.String test_repo;
           Wire.Array
             [ Wire.Keyword "block/uuid";
               Wire.Uuid "00000000-0000-4000-8000-00000000cc03" ];
           Wire.Int 3 ])
  in
  let titles =
    List.filter_map (fun m -> wire_string_field "block/title" m) (wire_maps res)
  in
  check "get-block-parents-returns-parents seq" (titles <> []);
  check "get-block-parents-returns-parents contains parent"
    (List.mem "parent" titles)

(* (deftest get-block-refs-returns-linked-references ...)
   cljs passes [:block/uuid ref-uuid]; the OCaml endpoint takes the
   resolved eid — resolved via entity lookup, same endpoint. *)
let () =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/uuid #uuid \"00000000-0000-4000-8000-00000000dd04\" :block/title \"reference target\"}
         {:block/uuid #uuid \"00000000-0000-4000-8000-00000000ee05\" :block/title \"block with ref\"
          :block/refs [:block/uuid #uuid \"00000000-0000-4000-8000-00000000dd04\"]}]");
  register_conn conn;
  let eid =
    match Datascript.entity (db_of conn)
            (Lookup_ref ("block/uuid", Uuid "00000000-0000-4000-8000-00000000dd04"))
    with
    | Some e -> e.id
    | None -> failwith "ref entity not found"
  in
  let res =
    await
      (Dispatcher.invoke "thread-api/get-block-refs"
         [ Wire.String test_repo; Wire.Int eid ])
  in
  check "get-block-refs-returns-linked-references seq"
    (wire_maps res <> [])

(* (deftest get-latest-journals-returns-worker-maps ...)
   cljs transacts build-db-initial-data first; the Journal entity's
   title-format prop is absent here so the default "MMM do, yyyy"
   format is used — same output for these days. The cljs test asserts
   :block/title = formatted journal title because cljs entity lookup
   maps :block/title through get-block-title; the OCaml endpoint emits
   the stored literal under :block/title and the formatted title under
   :block/raw-title, so raw-title is asserted here (see header note). *)
let () =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"
          :block/title \"2024-01-01\" :block/name \"2024-01-01\"
          :block/journal-day 20240101 :block/tags :logseq.class/Journal}
         {:block/uuid #uuid \"22222222-2222-2222-2222-222222222222\"
          :block/title \"2024-01-02\" :block/name \"2024-01-02\"
          :block/journal-day 20240102 :block/tags :logseq.class/Journal}]");
  register_conn conn;
  let res =
    await
      (Dispatcher.invoke "thread-api/get-latest-journals"
         [ Wire.String test_repo; Wire.Int 1 ])
  in
  let maps = wire_maps res in
  check "get-latest-journals-returns-worker-maps uuids"
    (List.map (fun m -> wire_string_field "block/uuid" m) maps
     = [ Some "22222222-2222-2222-2222-222222222222" ]);
  check "get-latest-journals-returns-worker-maps raw-titles"
    (List.map (fun m -> wire_string_field "block/raw-title" m) maps
     = [ Some "Jan 2nd, 2024" ])

(* (deftest q-executes-datascript-query ...) *)
let () =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/title \"page a\"} {:block/title \"page b\"}]");
  register_conn conn;
  let res =
    await
      (Dispatcher.invoke "thread-api/q"
         [ Wire.String test_repo;
           Wire.Array
             [ Wire.String "[:find ?t :where [_ :block/title ?t]]" ] ])
  in
  let rows = match res with Wire.Array r | Wire.List r -> r | _ -> [] in
  check "q-executes-datascript-query" (List.length rows = 2)

(* (deftest q-returns-nil-for-missing-conn ...) *)
let () =
  let res =
    await
      (Dispatcher.invoke "thread-api/q"
         [ Wire.String "nonexistent-repo";
           Wire.Array [ Wire.String "[:find ?e :where [?e _ _]]" ] ])
  in
  check "q-returns-nil-for-missing-conn" (res = Wire.nil)

(* (deftest datoms-returns-formatted-datoms ...) *)
let () =
  let conn = Db_test_util.create_conn () in
  ignore (Datascript.transact_conn_string conn "[{:block/title \"test\"}]");
  register_conn conn;
  let res =
    await
      (Dispatcher.invoke "thread-api/datoms"
         [ Wire.String test_repo; Wire.Keyword "eavt" ])
  in
  let rows = match res with Wire.Array r | Wire.List r -> r | _ -> [] in
  check "datoms-returns-formatted-datoms seq" (rows <> []);
  check "datoms-returns-formatted-datoms tuple length"
    (match rows with
     | Wire.Array items :: _ -> List.length items = 5
     | Wire.List items :: _ -> List.length items = 5
     | _ -> false)

(* (deftest pull-returns-entity-data ...) *)
let () =
  let conn = Db_test_util.create_conn () in
  ignore
    (Datascript.transact_conn_string conn
       "[{:block/title \"test page\" :block/name \"test-page\"
          :block/uuid #uuid \"11111111-1111-1111-1111-111111111111\"}]");
  register_conn conn;
  let res =
    await
      (Dispatcher.invoke "thread-api/pull"
         [ Wire.String test_repo;
           Wire.String "[*]";
           Wire.Array
             [ Wire.Keyword "block/uuid";
               Wire.Uuid "11111111-1111-1111-1111-111111111111" ] ])
  in
  check "pull-returns-entity-data is map"
    (match res with Wire.Map _ -> true | _ -> false);
  (match res with
   | Wire.Map kvs ->
       check "pull-returns-entity-data title"
         (wire_string_field "block/title" kvs = Some "test page")
   | _ -> ())

let () =
  if !failures > 0 then begin
    Printf.eprintf "%d translated cljs test assertion(s) failed\n" !failures;
    exit 1
  end
  else Printf.printf "test_db_native: all assertions passed\n"
