(* OCaml port of src/test/frontend/worker/handler/view_test.cljs
   (frontend.worker.handler.view-test) — the single deftest in the file
   (it holds two independent let-blocks, not two deftests):

   - view-filter-data-prepares-operators-and-normalized-values

   cljs with-redefs / plumbing:
   - db-view/get-property-values: stubbed through
     Db_view.get_property_values_fn (the fn-ref seam added in
     lib/db_view.ml for this with-redefs, sync_crypt convention).
   - worker-view/view-filter-data is called directly on @conn, matching
     Endpoint_view.view_filter_data db option — the thread-api wrapper
     (conn resolution) is exercised elsewhere.

   Skipped cases: none — the whole file is ported. *)

open Datascript
open Test_shared

let kw s = Wire.Keyword s

(* cljs (d/create-conn db-schema/schema) +
   (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}")) *)
let create_conn () : conn =
  let conn = Datascript.create_conn ~schema:(Db_schema.schema ()) () in
  ignore
    (Datascript.transact_conn conn
       (Sqlite_create_graph.initial_tx_data ~db:(Datascript.db conn)
          ~config_content:"{}" ()));
  conn

let kvs_of (w : Wire.t) : (Wire.t * Wire.t) list =
  match w with Wire.Map kvs -> kvs | _ -> []

let test_view_filter_data () =
  (* first let-block: :node property, :is operator, stubbed
     get-property-values *)
  (let conn = create_conn () in
   let db = Datascript.db conn in
   let page_uuid = "22222222-2222-2222-2222-222222222222" in
   let saved = !Db_view.get_property_values_fn in
   Db_view.get_property_values_fn :=
     (fun _db property_ident ~view_id:_ ~query_entity_ids:_ ->
        check "get-property-values called with :user.property/topic"
          (property_ident = "user.property/topic");
        [ Wire.Map
            [ kw "label", Wire.String "Page B"
            ; ( kw "value"
              , Wire.Map
                  [ kw "block/uuid", Wire.Uuid page_uuid
                  ; kw "block/title", Wire.String "Page B" ] ) ] ]);
   Fun.protect
     ~finally:(fun () -> Db_view.get_property_values_fn := saved)
     (fun () ->
       let option =
         Wire.Map
           [ ( kw "property"
             , Wire.Map
                 [ kw "db/ident", kw "user.property/topic"
                 ; kw "block/title", Wire.String "Topic"
                 ; kw "logseq.property/type", kw "node" ] )
           ; kw "property-ident", kw "user.property/topic"
           ; kw "operator", kw "is"
           ; kw "value", Wire.String "stale" ]
       in
       let data = Endpoint_view.view_filter_data db option in
       let kvs = kvs_of data in
       check "operators"
         (wire_get "operators" kvs
          = Some
              (Wire.Array
                 [ kw "is"; kw "is-not"; kw "text-contains"
                 ; kw "text-not-contains" ]));
       check "value-source"
         (wire_get "value-source" kvs = Some (kw "property-values"));
       check "many?" (wire_get "many?" kvs = Some (Wire.Bool true));
       check "values normalized to uuids"
         (wire_get "values" kvs
          = Some
              (Wire.Array
                 [ Wire.Map
                     [ kw "label", Wire.String "Page B"
                     ; kw "value", Wire.Uuid page_uuid ] ]));
       check "value-after-operator-change"
         (wire_get "value-after-operator-change" kvs = Some Wire.Nil)));
  (* second let-block: :datetime property, :before operator *)
  let conn = create_conn () in
  let db = Datascript.db conn in
  let option =
    Wire.Map
      [ ( kw "property"
        , Wire.Map
            [ kw "db/ident", kw "block/created-at"
            ; kw "logseq.property/type", kw "datetime" ] )
      ; kw "property-ident", kw "block/created-at"
      ; kw "operator", kw "before"
      ; kw "value", Wire.Int 123 ]
  in
  let data = Endpoint_view.view_filter_data db option in
  let kvs = kvs_of data in
  check "operators"
    (wire_get "operators" kvs
     = Some (Wire.Array [ kw "before"; kw "after" ]));
  check "value-source" (wire_get "value-source" kvs = Some (kw "timestamp"));
  check "many?" (wire_get "many?" kvs = Some (Wire.Bool false));
  check "values" (wire_get "values" kvs = Some Wire.Nil);
  check "value-after-operator-change"
    (wire_get "value-after-operator-change" kvs = Some (Wire.Int 123));
  (* bug 39: switching to :before/:after while holding a picked date must
     keep the instant — dropping it writes a matchless clause that
     crashes view-resource context validation. *)
  let option =
    Wire.Map
      [ ( kw "property"
        , Wire.Map
            [ kw "db/ident", kw "block/created-at"
            ; kw "logseq.property/type", kw "datetime" ] )
      ; kw "property-ident", kw "block/created-at"
      ; kw "operator", kw "before"
      ; kw "value", Wire.Date_ms 123L ]
  in
  let data = Endpoint_view.view_filter_data db option in
  let kvs = kvs_of data in
  check "value-after-operator-change keeps instant"
    (wire_get "value-after-operator-change" kvs = Some (Wire.Date_ms 123L))

let () =
  Alcotest.run "view-test"
    [ ( "view_test",
        [ Alcotest.test_case
            "view-filter-data-prepares-operators-and-normalized-values"
            `Quick test_view_filter_data ] ) ]
