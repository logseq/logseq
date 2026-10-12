(* 1:1 port of deps/graph-parser/test/logseq/graph_parser/block_test.cljs
   into native OCaml. The cljs file contains 6 deftests; all 6 are ported
   here with the cljs deftest names kept as OCaml test names.

   Sources:
   - deps/graph-parser/test/logseq/graph_parser/block_test.cljs
     (gp-block/with-parent-and-order, gp-block/fix-duplicate-id,
      gp-block/block-keywordize, gp-block/extract-properties,
      gp-block/page-name->map, gp-block/get-page-reference,
      gp-mldoc/get-references, gp-mldoc/->edn, gp-mldoc/default-config,
      common-uuid/gen-uuid, db-test/create-conn-with-blocks,
      db-test/find-journal-by-journal-day, ldb/transact!)

   Skipped cljs cases: none.

   Notes/divergences:
   - cljs `=` on maps is order-insensitive; [map_eq] compares assoc-list
     maps key-by-key with [v_eq] on values.
   - cljs `select-keys` yields a map; the port selects the same attrs from
     the block map and compares them directly.
   - cljs page-name->map's `conn` arg is nil in these tests; the OCaml
     signature needs a db, so a bare file-graph conn stands in for it
     (db-based-graph? is false there, matching nil).
   - `block/order` is generated non-deterministically by
     with-parent-and-order; the cljs test select-keys it away, and so does
     the port. *)

open Datascript
open Test_shared

let md_config = Gp_mldoc.default_config "markdown"

(* cljs = : order-insensitive for maps and sets, sequential across
   vector/list *)
let rec v_eq (a : value) (b : value) : bool =
  match a, b with
  | Map ka, Map kb ->
      List.length ka = List.length kb
      && List.for_all
           (fun (k, v) ->
             match List.find_opt (fun (k', _) -> v_eq k' k) kb with
             | Some (_, v') -> v_eq v v'
             | None -> false)
           ka
  | Set sa, Set sb ->
      List.length sa = List.length sb
      && List.for_all (fun x -> List.exists (fun y -> v_eq x y) sb) sa
      && List.for_all (fun y -> List.exists (fun x -> v_eq x y) sa) sb
  | Vector va, Vector vb
  | List va, List vb
  | Vector va, List vb
  | List va, Vector vb ->
      List.length va = List.length vb && List.for_all2 v_eq va vb
  | _ -> Util.value_equal a b

(* cljs map `=` over block maps ((attr * value) lists): same key set and
   v_eq values. *)
let map_eq (a : (attr * value) list) (b : (attr * value) list) : bool =
  List.length a = List.length b
  && List.for_all
       (fun (k, v) ->
         match List.assoc_opt k b with
         | Some v' -> v_eq v v'
         | None -> false)
       a

let coll_items' (v : value) : value list =
  match v with Vector vs | List vs | Set vs -> vs | _ -> []

(* cljs select-keys over a block map *)
let select_keys (b : Block_map.t) (ks : string list) : (attr * value) list =
  List.filter_map (fun k -> Option.map (fun v -> (k, v)) (Block_map.attr_value b k)) ks

(* cljs deftest bodies *)

let test_with_parent_and_order_normalizes_irregular_outdent () =
  let mk id level =
    [ ("block/uuid", Keyword id); ("block/level", Int64 (Int64.of_int level)) ]
  in
  let blocks =
    [ mk "a" 1; mk "b" 3; mk "c" 5; mk "d" 2; mk "e" 3 ]
  in
  let result = Gp_block.with_parent_and_order (Keyword "page") blocks in
  let expected =
    [ [ ("block/uuid", Keyword "a")
      ; ("block/parent", Keyword "page")
      ; ("block/level", Int64 1L) ]
    ; [ ("block/uuid", Keyword "b")
      ; ("block/parent", Vector [ Keyword "block/uuid"; Keyword "a" ])
      ; ("block/level", Int64 2L) ]
    ; [ ("block/uuid", Keyword "c")
      ; ("block/parent", Vector [ Keyword "block/uuid"; Keyword "b" ])
      ; ("block/level", Int64 3L) ]
    ; [ ("block/uuid", Keyword "d")
      ; ("block/parent", Vector [ Keyword "block/uuid"; Keyword "a" ])
      ; ("block/level", Int64 2L) ]
    ; [ ("block/uuid", Keyword "e")
      ; ("block/parent", Vector [ Keyword "block/uuid"; Keyword "a" ])
      ; ("block/level", Int64 2L) ] ]
  in
  check "with-parent-and-order result"
    (List.length result = List.length expected
     && List.for_all2
          (fun b e -> map_eq (select_keys b [ "block/uuid"; "block/parent"; "block/level" ]) e)
          result expected)

let test_fix_duplicate_id () =
  let uuid_s = "63f199bc-c737-459f-983d-84acfcda14fe" in
  let case_ (x : Block_map.t) (y : Block_map.t) : bool =
    let result = Gp_block.fix_duplicate_id (Gp_block.block_keywordize x) in
    let x_uuid = Option.value (List.assoc_opt "uuid" x) ~default:Nil in
    let r_uuid = Block_map.attr_value result "block/uuid" in
    Option.is_some r_uuid
    && r_uuid <> Some x_uuid
    && map_eq
         (select_keys result
            [ "block/properties"; "block/title"; "block/properties-text-values"
            ; "block/properties-order" ])
         (Gp_block.block_keywordize y)
  in
  let y title =
    [ ("properties", Map [])
    ; ("title", String title)
    ; ("properties-text-values", Map [])
    ; ("properties-order", Vector []) ]
  in
  check "markdown case"
    (case_
       [ ("properties", Map [ Keyword "id", String uuid_s ])
       ; ("tags", Vector [])
       ; ("format", String "markdown")
       ; ("meta", Map [ Keyword "start_pos", Int64 51L; Keyword "end_pos", Int64 101L ])
       ; ("macros", Vector [])
       ; ("title", String ("bar\nid:: " ^ uuid_s))
       ; ("properties-text-values", Map [ Keyword "id", String uuid_s ])
       ; ("level", Int64 1L)
       ; ("uuid", Uuid uuid_s)
       ; ("properties-order", Vector [ Keyword "id" ]) ]
       (y "bar"));
  check "org case"
    (case_
       [ ("properties", Map [ Keyword "id", String uuid_s ])
       ; ("tags", Vector [])
       ; ("format", String "org")
       ; ("meta", Map [ Keyword "start_pos", Int64 51L; Keyword "end_pos", Int64 101L ])
       ; ("macros", Vector [])
       ; ("title", String ("bar\n:id: " ^ uuid_s))
       ; ("properties-text-values", Map [ Keyword "id", String uuid_s ])
       ; ("level", Int64 1L)
       ; ("uuid", Uuid uuid_s)
       ; ("properties-order", Vector [ Keyword "id" ]) ]
       (y "bar"));
  check "markdown with body"
    (case_
       [ ("properties", Map [ Keyword "id", String uuid_s ])
       ; ("tags", Vector [])
       ; ("format", String "markdown")
       ; ("meta", Map [ Keyword "start_pos", Int64 51L; Keyword "end_pos", Int64 101L ])
       ; ("macros", Vector [])
       ; ("title", String ("bar\n  \n  id:: " ^ uuid_s ^ "\nblock body"))
       ; ("properties-text-values", Map [ Keyword "id", String uuid_s ])
       ; ("level", Int64 1L)
       ; ("uuid", Uuid uuid_s)
       ; ("properties-order", Vector [ Keyword "id" ]) ]
       (y "bar\nblock body"))

(* cljs extract-properties helper: builds [k v mldoc-ast] triples from
   [[k v] ...] pairs. *)
let extract_properties (properties : (string * string) list)
    (user_config : (attr * value) list) : Gp_block.extract_properties_result =
  let triples =
    List.map
      (fun (k, v) ->
        let mldoc_ast = Gp_mldoc.get_references ~text:v ~config:md_config in
        Vector [ String k; String v; mldoc_ast ])
      properties
  in
  match Gp_block.extract_properties triples user_config with
  | Some r -> r
  | None -> Gp_block.empty_properties_result

let test_extract_properties () =
  List.iteri
    (fun i (props_in, expected) ->
      let r = extract_properties props_in [] in
      check (Printf.sprintf "properties case %d" i) (map_eq r.properties expected))
    [ [ "background-color", "#000000" ], [ "background-color", String "#000000" ]
    ; [ "alias", "[[name/with space]]" ], [ "alias", Set [ String "name/with space" ] ]
    ; [ "tags", "[[foo]], [[bar]]" ], [ "tags", Set [ String "foo"; String "bar" ] ]
    ; [ "tags", "[[foo]] [[bar]]" ], [ "tags", Set [ String "foo"; String "bar" ] ]
    ; [ "tags", "bar" ], [ "tags", Set [ String "bar" ] ]
    ; [ "file-path", "file:///home/x, y.pdf" ]
      , [ "file-path", String "file:///home/x, y.pdf" ]
    ; [ "year", "1000" ], [ "year", Int64 1000L ]
    ; [ "year", "\"1000\"" ], [ "year", String "\"1000\"" ]
    ; [ "year", "1000"; "alias", "[[name/with space]]" ]
      , [ "year", Int64 1000L; "alias", Set [ String "name/with space" ] ]
    ; [ "year", "1000"; "tags", "[[name/with space]]" ]
      , [ "year", Int64 1000L; "tags", Set [ String "name/with space" ] ]
    ; [ "year", "1000"; "tags", "[[name/with space]], [[another]]" ]
      , [ "year", Int64 1000L
        ; "tags", Set [ String "name/with space"; String "another" ] ]
    ; [ "year", "1000"; "alias", "[[name/with space]], [[another]]" ]
      , [ "year", Int64 1000L
        ; "alias", Set [ String "name/with space"; String "another" ] ]
    ; [ "year", "1000"; "alias", "[[name/with space]], [[another [[nested]]]]" ]
      , [ "year", Int64 1000L
        ; "alias", Set [ String "name/with space"; String "another [[nested]]" ] ]
    ; [ "year", "1000"; "alias", "[[name/with space]], [[[[nested]] another]]" ]
      , [ "year", Int64 1000L
        ; "alias", Set [ String "name/with space"; String "[[nested]] another" ] ]
    ; [ "foo", "bar" ], [ "foo", String "bar" ]
    ; [ "foo", "[[bar]], [[baz]]" ], [ "foo", Set [ String "bar"; String "baz" ] ]
    ; [ "foo", "[[bar]], [[baz]]" ], [ "foo", Set [ String "bar"; String "baz" ] ]
    ; [ "foo", "[[bar]], [[baz]]" ], [ "foo", Set [ String "bar"; String "baz" ] ]
    ; [ "foo", "[[bar]], [[nested [[baz]]]]" ]
      , [ "foo", Set [ String "bar"; String "nested [[baz]]" ] ]
    ; [ "foo", "[[bar]], [[nested [[baz]]]]" ]
      , [ "foo", Set [ String "bar"; String "nested [[baz]]" ] ]
    ; [ "foo", "[[bar]], [[baz, test]]" ]
      , [ "foo", Set [ String "bar"; String "baz, test" ] ]
    ; [ "foo", "[[bar]], [[baz, test, [[nested]]]]" ]
      , [ "foo", Set [ String "bar"; String "baz, test, [[nested]]" ] ] ];
  List.iteri
    (fun i (props_in, expected) ->
      let r =
        extract_properties props_in [ "property-pages/enabled?", Bool true ]
      in
      check (Printf.sprintf "page-refs enabled case %d" i)
        (r.page_refs = expected))
    [ [ "year", "1000" ], [ "year" ]
    ; [ "year", "\"1000\"" ], [ "year" ]
    ; [ "year", "1000"; "month", "12" ], [ "year"; "month" ]
    ; [ "foo", "[[bar]] test" ], [ "bar"; "foo" ]
    ; [ "foo", "[[bar]] test [[baz]]" ], [ "bar"; "baz"; "foo" ]
    ; [ "foo", "[[bar]] test [[baz]] [[nested [[baz]]]]" ]
      , [ "bar"; "baz"; "nested [[baz]]"; "foo" ]
    ; [ "foo", "#bar, #baz" ], [ "bar"; "baz"; "foo" ]
    ; [ "foo", "[[nested [[page]]]], test" ], [ "nested [[page]]"; "foo" ] ];
  List.iteri
    (fun i (props_in, expected) ->
      let r =
        extract_properties props_in [ "property-pages/enabled?", Bool false ]
      in
      check (Printf.sprintf "page-refs disabled case %d" i)
        (r.page_refs = expected))
    [ [ "year", "1000" ], []
    ; [ "year", "1000"; "month", "12" ], []
    ; [ "foo", "[[bar]] test" ], [ "bar" ] ];
  check "property-pages/excludelist"
    ((extract_properties
        [ "year", "1000"; "month", "12" ]
        [ "property-pages/enabled?", Bool true
        ; "property-pages/excludelist"
          , Set [ Keyword "month"; Keyword "day" ] ])
       .page_refs
     = [ "year" ]);
  check "default property-pages enabled"
    ((extract_properties [ "year", "1000" ] []).page_refs = [ "year" ]);
  check "linkable built-ins only"
    ((extract_properties
        [ "tags", "[[foo]], [[bar]]"; "background-color", "#008000" ]
        [ "property-pages/enabled?", Bool true ])
       .page_refs
     = [ "foo"; "bar"; "tags" ])

let test_page_name_map_namespace_for_slash_journals () =
  (* cljs passes nil conn — file-graph (non db-based) semantics *)
  let conn = Db_test_util.create_conn_bare () in
  (* cljs nil conn → file-graph (non db-based) semantics *)
  let db = db_of conn in
  (match Gp_block.page_name_to_map "2026/05/18" db false (Some "yyyy/MM/dd") () with
   | Some journal ->
       check "journal-day"
         (Block_map.attr_value journal "block/journal-day" = Some (Int64 20260518L));
       check "title"
         (Block_map.attr_value journal "block/title" = Some (String "2026/05/18"));
       check "name"
         (Block_map.attr_value journal "block/name" = Some (String "may 18th, 2026"));
       check "uuid"
         (Block_map.attr_value journal "block/uuid"
          = Some (Uuid (Common_uuid.gen_uuid "journal-page-uuid" "20260518")));
       check "namespace"
         (Block_map.attr_value journal "block/namespace" = None)
   | None -> Alcotest.fail "page-name->map returned none for slash journal");
  match Gp_block.page_name_to_map "project/child" db false (Some "yyyy/MM/dd") () with
  | Some page ->
      check "namespace kept"
        (v_eq
           (Option.value ~default:Nil (Block_map.attr_value page "block/namespace"))
           (Map [ String "block/name", String "project" ]))
  | None -> Alcotest.fail "page-name->map returned none for project/child"

let test_existing_journal_reference_reuses_stored_identity () =
  let setup () =
    let conn =
      Db_test_util.create_conn_with_blocks
        ~pages_and_blocks:
          [ { Db_test_util.page =
                { Db_test_util.default_page with
                  Db_test_util.pg_journal = Some 20260727 }
            ; Db_test_util.blocks = [] } ]
        ()
    in
    let db = db_of conn in
    let journal =
      Option.get (Db_test_util.find_journal_by_journal_day db 20260727)
    in
    ignore
      (Datascript.transact_conn_string conn
         (Printf.sprintf
            "[[:db/add :logseq.class/Journal \
             :logseq.property.journal/title-format \"yyyy-MM-dd\"] \
             {:db/id %d :block/title \"2026-07-27\" :block/name \"2026-07-27\"}]"
            journal.id));
    (conn, uuid_of journal)
  in
  (* testing "a legacy journal name is not rewritten while parsing a
     reference" *)
  (let conn, journal_uuid = setup () in
   match
     Gp_block.page_name_to_map "2026-07-27" (db_of conn) false
       (Some "yyyy-MM-dd") ()
   with
   | Some reference ->
       check "reference identity"
         (map_eq
            (select_keys reference
               [ "block/uuid"; "block/title"; "block/name"; "block/journal-day" ])
            [ "block/uuid", Uuid journal_uuid
            ; "block/title", String "2026-07-27"
            ; "block/name", String "2026-07-27"
            ; "block/journal-day", Int64 20260727L ])
   | None -> Alcotest.fail "page-name->map returned none for 2026-07-27");
  (* testing "an existing journal is found by day after the configured
     format changes" *)
  let conn, journal_uuid = setup () in
  ignore
    (Datascript.transact_conn_string conn
       "[[:db/add :logseq.class/Journal \
         :logseq.property.journal/title-format \"dd/MM/yyyy\"]]");
  match
    Gp_block.page_name_to_map "27/07/2026" (db_of conn) false
      (Some "dd/MM/yyyy") ()
  with
  | Some reference ->
      check "reference identity after format change"
        (map_eq
           (select_keys reference
              [ "block/uuid"; "block/title"; "block/name"; "block/journal-day" ])
           [ "block/uuid", Uuid journal_uuid
           ; "block/title", String "2026-07-27"
           ; "block/name", String "2026-07-27"
           ; "block/journal-day", Int64 20260727L ])
  | None -> Alcotest.fail "page-name->map returned none for 27/07/2026"

(* cljs (->> (->edn content (default-config :markdown)) ffirst second :title
   first). `->edn` wraps its blocks in a top-level collection, so ffirst is
   first-of-first: the first heading node. *)
let first (xs : 'a list) : 'a option = List.nth_opt xs 0
let second (xs : 'a list) : 'a option = List.nth_opt xs 1

let first_heading_link (content : string) : value =
  let edn =
    Clj_value.coll_items
      (Gp_mldoc.to_edn ~content:(String content) ~config:md_config)
  in
  match first edn with
  | Some e -> (
      match first (coll_items' e) with
      | Some node -> (
          match second (coll_items' node) with
          | Some m -> (
              match coll_items' (Clj_value.map_get m "title") with
              | l :: _ -> l
              | [] -> Nil)
          | None -> Nil)
      | None -> Nil)
  | None -> Nil

let test_get_page_reference_file_link_formatted_labels () =
  List.iter
    (fun (content, expected) ->
      check (Printf.sprintf "page-ref %s" content)
        (Gp_block.get_page_reference (first_heading_link content) "markdown"
         = Some (String expected)))
    [ "- [k](a.md)", "k"
    ; "- [~~k~~](a.md)", "k"
    ; "- [**k**](a.md)", "k"
    ; "- [*k*](a.md)", "k" ]

let cases =
  [ Alcotest.test_case "with-parent-and-order-normalizes-irregular-outdent" `Quick
      test_with_parent_and_order_normalizes_irregular_outdent
  ; Alcotest.test_case "test-fix-duplicate-id" `Quick test_fix_duplicate_id
  ; Alcotest.test_case "test-extract-properties" `Quick test_extract_properties
  ; Alcotest.test_case "test-page-name-map-namespace-for-slash-journals" `Quick
      test_page_name_map_namespace_for_slash_journals
  ; Alcotest.test_case "existing-journal-reference-reuses-stored-identity-test" `Quick
      test_existing_journal_reference_reuses_stored_identity
  ; Alcotest.test_case "get-page-reference-file-link-formatted-labels" `Quick
      test_get_page_reference_file_link_formatted_labels ]
