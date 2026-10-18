(* 1:1 OCaml translation of deps/publishing/test/logseq/publishing/db_test.cljs —
   covers Publishing_db.clean_export / filter_only_public_pages_and_blocks /
   add_missing_built_in_block_timestamps.

   cljs deftest names are kept as OCaml test names.

   Not ported: deps/publishing/test/logseq/publishing/export_test.cljs covers
   logseq.publishing.export (fs-based whole-graph EDN export), which is not
   ported. The cljs tests' commented-out asset assertions (#_ ...) are not
   ported either — they are disabled in cljs too. *)

open Datascript
open Test_shared

let views_page_name = "$$$views"

let kw s = Keyword s

(* cljs {:page page-map :blocks [block-map ...]} as a value *)
let pab (page : value) (blocks : value list) : value =
  Map [ kw "page", page; kw "blocks", Vector blocks ]

let block ?(properties : (value * value) list = []) (title : string) : value =
  Map
    ([ kw "block/title", String title ]
     @ if properties = [] then []
       else [ kw "build/properties", Map properties ])

let page ?(properties : (value * value) list = []) (title : string) : value =
  Map
    ([ kw "block/title", String title ]
     @ if properties = [] then []
       else [ kw "build/properties", Map properties ])

(* cljs (db-test/create-conn-with-blocks [...]) *)
let conn_with_blocks (pabs : value list) : conn =
  let conn = Sqlite_export.create_conn () in
  Sqlite_build.create_blocks conn (Vector pabs);
  conn

let result_strings rows =
  List.concat_map
    (List.filter_map (function Result_value (String s) -> Some s | _ -> None))
    rows

let sorted_unique xs = List.sort_uniq compare xs

let page_names (db : db) : string list =
  sorted_unique
    (result_strings
       (Datascript.q_string db
          "[:find [?n ...] :where [?b :block/name ?n]]"))

let block_page_names (db : db) : string list =
  sorted_unique
    (result_strings
       (Datascript.q_string db
          "[:find [?n ...] :where\n\
          \      [?b :block/title]\n\
          \      [?b :block/page ?p]\n\
          \      [(missing? $ ?p :logseq.property/built-in?)]\n\
          \      [?p :block/name ?n]]"))

let subset xs ys = List.for_all (fun x -> List.mem x ys) xs

(* (deftest clean-export! ...) *)
let test_clean_export () =
  let conn =
    conn_with_blocks
      [ pab
          (page "page1"
             ~properties:
               [ kw "logseq.property/publishing-public?", Bool false ])
          [ block "b11"
          ; block "b12"
          ; block "![awesome.png](../assets/awesome_1648822509908_0.png" ]
      ; pab (page "page2")
          [ block "b21"
          ; block "![thumb-on-fire.PNG](../assets/thumb-on-fire_1648822523866_0.PNG)" ]
      ; pab (page "page3") [ block "b31" ] ]
  in
  let filtered_db, _assets = Publishing_db.clean_export (db_of conn) in
  let exported_pages = page_names filtered_db in
  let exported_blocks = block_page_names filtered_db in
  check "Contains all pages that haven't been marked private"
    (subset [ "page2"; "page3" ] exported_pages);
  check "Doesn't contain private page" (not (List.mem "page1" exported_pages));
  Alcotest.(check (list string))
    "Only exports blocks from public pages" [ "page2"; "page3" ]
    exported_blocks

(* (deftest filter-only-public-pages-and-blocks-adds-missing-built-in-page-timestamps
      ...) *)
let test_adds_missing_built_in_page_timestamps () =
  let conn =
    conn_with_blocks
      [ pab
          (page "page1"
             ~properties:
               [ kw "logseq.property/publishing-public?", Bool true ])
          [ block "b1" ]
      ; pab
          (page views_page_name
             ~properties:
               [ kw "logseq.property/built-in?", Bool true
               ; kw "logseq.property/hide?", Bool true ])
          [] ]
  in
  let views_page =
    match block_by_title (db_of conn) views_page_name with
    | Some e -> e
    | None -> failwith "views page missing"
  in
  (* cljs (d/transact! conn [[:db/retract id :block/created-at v] ...]) *)
  let tx_ops =
    List.filter_map
      (fun attr ->
        match Ldb.value views_page attr with
        | Some v -> Some (Retract (Entity_id views_page.id, attr, Some v))
        | None -> None)
      [ "block/created-at"; "block/updated-at" ]
  in
  ignore (Db_tx.transact conn tx_ops);
  let filtered_db, _assets =
    Publishing_db.filter_only_public_pages_and_blocks (db_of conn)
  in
  let exported_views_page =
    match block_by_title filtered_db views_page_name with
    | Some e -> e
    | None -> failwith "exported views page missing"
  in
  check "Missing created-at is added to exported built-in pages"
    (Option.is_some (Ldb.int_value exported_views_page "block/created-at"));
  check "Missing updated-at is added to exported built-in pages"
    (Option.is_some (Ldb.int_value exported_views_page "block/updated-at"));
  let r = Db_validate.validate_db filtered_db in
  check "Publishing DB remains valid after keeping hidden built-in pages"
    (r.errors = [])

(* (deftest filter-only-public-pages-and-blocks ...) *)
let test_filter_only_public_pages_and_blocks () =
  let conn =
    conn_with_blocks
      [ pab
          (page "page1"
             ~properties:
               [ kw "logseq.property/publishing-public?", Bool false ])
          [ block "b11"
          ; block "b12"
          ; block "![awesome.png](../assets/awesome_1648822509908_0.png" ]
      ; pab
          (page "page2"
             ~properties:
               [ kw "logseq.property/publishing-public?", Bool true
               ; ( kw "block/alias"
                 , Set [ Vector [ kw "build/page"
                                ; Map [ kw "block/title"
                                      , String "page2-alias" ] ] ] ) ])
          [ block "b21"
          ; block "![thumb-on-fire.PNG](../assets/thumb-on-fire_1648822523866_0.PNG)" ]
      ; pab
          (page "page3"
             ~properties:
               [ kw "logseq.property/publishing-public?", Bool true ])
          [ block "b31" ] ]
  in
  let filtered_db, _assets =
    Publishing_db.filter_only_public_pages_and_blocks (db_of conn)
  in
  let exported_pages = page_names filtered_db in
  let exported_block_pages = block_page_names filtered_db in
  let page2 =
    match block_by_title filtered_db "page2" with
    | Some e -> e
    | None -> failwith "page2 missing"
  in
  let exported_page2_children =
    sorted_unique
      (List.filter_map
         (fun c -> Ldb.string_value c "block/title")
         (Ldb.get_children page2))
  in
  check "Contains all pages that have been marked public"
    (subset [ "page2"; "page3" ] exported_pages);
  check "Doesn't contain private page" (not (List.mem "page1" exported_pages));
  check "Alias of public page is exported"
    (Option.is_some (block_by_title filtered_db "page2-alias"));
  Alcotest.(check (list string))
    "Only exports blocks from public pages" [ "page2"; "page3" ]
    exported_block_pages;
  check "Public page children are still available through block parent refs"
    (List.mem "b21" exported_page2_children)

let () =
  Alcotest.run "publishing"
    [ ( "publishing"
      , [ Alcotest.test_case "clean-export!" `Quick test_clean_export
        ; Alcotest.test_case
            "filter-only-public-pages-and-blocks-adds-missing-built-in-page-timestamps"
            `Quick test_adds_missing_built_in_page_timestamps
        ; Alcotest.test_case "filter-only-public-pages-and-blocks" `Quick
            test_filter_only_public_pages_and_blocks ] ) ]
